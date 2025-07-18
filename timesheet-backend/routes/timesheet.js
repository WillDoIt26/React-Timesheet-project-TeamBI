// routes/timesheet.js
const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
// The ONLY db import you need for this entire file
const { execute } = require('../db');
const router = express.Router();


// --- DATA FETCHING & STATS (These were already correct) ---

router.get('/stats/dashboard', isAuthenticated, async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Unauthorized: No user session found." });
    }
    try {
        const sql = `SELECT STATUS, COUNT(*) as COUNT FROM TIMESHEETS WHERE EMPLOYEE_ID = ? GROUP BY STATUS;`;
        const { rows } = await execute(sql, [req.session.user.id]);
        const stats = { approved: 0, submitted: 0, draft: 0, rejected: 0 };
        if (rows) {
            rows.forEach(row => {
                if (row.STATUS) {
                    stats[row.STATUS.toLowerCase()] = row.COUNT;
                }
            });
        }
        res.json({ myStats: stats });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

router.get('/history', isAuthenticated, async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Unauthorized: No user session found." });
    }
    const query = `
        SELECT T.TIMESHEET_ID, T.WEEK_START, T.STATUS, T.MANAGER_COMMENT, SUM(COALESCE(E.HOURS, 0)) as TOTAL_HOURS
        FROM TIMESHEETS T LEFT JOIN TIME_ENTRIES E ON T.TIMESHEET_ID = E.TIMESHEET_ID
        WHERE T.EMPLOYEE_ID = ?
        GROUP BY T.TIMESHEET_ID, T.WEEK_START, T.STATUS, T.MANAGER_COMMENT
        ORDER BY T.WEEK_START DESC LIMIT 50;
    `;
    try {
        const { rows } = await execute(query, [req.session.user.id]);
        res.json(rows.map(row => ({
            timesheet_id: row.TIMESHEET_ID, 
            week_start: row.WEEK_START, 
            status: row.STATUS,
            total_hours: row.TOTAL_HOURS || 0, 
            manager_comment: row.MANAGER_COMMENT
        })));
    } catch (err) {
        console.error("Error fetching timesheet history:", err);
        res.status(500).json({ error: "DB error" });
    }
});

router.get('/pending', isAuthenticated, authorizeRoles('manager'), async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Unauthorized: No user session found." });
    }
    const managerId = req.session.user.id;
    const sqlText = `
        SELECT T.TIMESHEET_ID, T.WEEK_START, U.USERNAME, SUM(COALESCE(E.HOURS, 0)) as TOTAL_HOURS
        FROM TIMESHEETS T JOIN USERS U ON T.EMPLOYEE_ID = U.ID
        LEFT JOIN TIME_ENTRIES E ON T.TIMESHEET_ID = E.TIMESHEET_ID
        WHERE U.ASSIGNED_MANAGER_ID = ? AND T.STATUS = 'submitted'
        GROUP BY T.TIMESHEET_ID, T.WEEK_START, U.USERNAME
        ORDER BY T.WEEK_START DESC
    `;
    try {
        const { rows } = await execute(sqlText, [managerId]);
        res.json(rows.map(row => ({
            timesheet_id: row.TIMESHEET_ID, 
            week_start: row.WEEK_START,
            employee_name: row.USERNAME, 
            total_hours: row.TOTAL_HOURS || 0
        })));
    } catch (err) {
        console.error("Error fetching pending timesheets:", err);
        res.status(500).json({ error: "DB error" });
    }
});

router.get('/:timesheet_id', isAuthenticated, async (req, res) => {
    const { timesheet_id } = req.params;
    const { user } = req.session;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let sqlText = `
        SELECT T.WEEK_START, T.STATUS, E.PROJECT_ID, P.NAME, P.PROJECT_OWNER, E.DATE, E.HOURS, E.NOTES
        FROM TIMESHEETS T LEFT JOIN TIME_ENTRIES E ON T.TIMESHEET_ID = E.TIMESHEET_ID
        LEFT JOIN PROJECTS P ON E.PROJECT_ID = P.PROJECT_ID
        WHERE T.TIMESHEET_ID = ?
    `;
    const binds = [timesheet_id];
    if (user.role === 'employee') {
        sqlText += ' AND T.EMPLOYEE_ID = ?';
        binds.push(user.id);
    } else if (user.role === 'manager') {
        sqlText += ' AND T.EMPLOYEE_ID IN (SELECT ID FROM USERS WHERE ASSIGNED_MANAGER_ID = ?)';
        binds.push(user.id);
    }

    try {
        const { rows } = await execute(sqlText, binds);
        if (rows.length === 0) return res.status(404).json({ error: "Not found or permission denied" });
        
        const result = { week_start: rows[0].WEEK_START, status: rows[0].STATUS, projects: {} };
        if (rows[0].PROJECT_ID !== null) {
            rows.forEach(row => {
              if (!result.projects[row.PROJECT_ID]) {
                result.projects[row.PROJECT_ID] = { project_id: row.PROJECT_ID, name: row.NAME, notes: row.NOTES || "", entries: [] };
              }
              result.projects[row.PROJECT_ID].entries.push({ date: row.DATE, hours: row.HOURS });
            });
            result.projects = Object.values(result.projects);
        } else {
            result.projects = [];
        }
        res.json(result);
    } catch(err) {
        console.error("Error fetching timesheet details:", err);
        res.status(500).json({ error: "DB error" });
    }
});


// --- CORE TIMESHEET CRUD (DEFINITIVE FIX) ---

router.post('/', isAuthenticated, async (req, res) => {
    const { id: userId } = req.session.user;
    const { week_start, status = "draft", projects } = req.body;

    if (!week_start) {
        return res.status(400).json({ error: "Missing week_start" });
    }

    try {
        // Step 1: Insert timesheet without RETURNING
        await execute(
            `INSERT INTO TIMESHEETS (WEEK_START, EMPLOYEE_ID, STATUS) VALUES (?, ?, ?)`,
            [week_start, userId, status]
        );

        // Step 2: Retrieve the inserted timesheet ID using known values
        const { rows: idRows } = await execute(
            `SELECT TIMESHEET_ID FROM TIMESHEETS WHERE WEEK_START = ? AND EMPLOYEE_ID = ? ORDER BY CREATED_AT DESC LIMIT 1`,
            [week_start, userId]
        );

        const timesheet_id = idRows?.[0]?.TIMESHEET_ID;

        if (!timesheet_id) {
            throw new Error("Failed to retrieve new timesheet ID after insert.");
        }

        // Step 3: Prepare and insert time entries
        if (projects && projects.length > 0) {
            const entryBinds = [];
            let valuePlaceholders = [];

            projects.forEach(proj => {
                proj.daily_hours.forEach((hours, i) => {
                    if (hours > 0) {
                        valuePlaceholders.push("(?, ?, ?, ?, ?)");
                        entryBinds.push(
                            timesheet_id,
                            proj.dates[i],
                            hours,
                            proj.project_id,
                            proj.notes || ""
                        );
                    }
                });
            });

            if (valuePlaceholders.length > 0) {
                const sql = `
                    INSERT INTO TIME_ENTRIES
                    (TIMESHEET_ID, DATE, HOURS, PROJECT_ID, NOTES)
                    VALUES ${valuePlaceholders.join(', ')};
                `;
                await execute(sql, entryBinds);
            }
        }

        res.status(201).json({ status: "success", timesheet_id });
    } catch (err) {
        console.error("Timesheet creation error:", err);
        res.status(500).json({
            error: "Failed to save timesheet. A database error occurred.",
            debug: err.message
        });
    }
});

router.put('/:timesheet_id', isAuthenticated, async (req, res) => {
    const { timesheet_id } = req.params;
    const { id: userId } = req.session.user;
    const { status, projects } = req.body;
    if (!status) return res.status(400).json({ error: "Missing status" });

    try {
        // Step 1: Update the parent record.
        const { stmt } = await execute(
            `UPDATE TIMESHEETS SET STATUS = ? WHERE TIMESHEET_ID = ? AND EMPLOYEE_ID = ?`, 
            [status, timesheet_id, userId]
        );
        if (stmt.getNumUpdatedRows() === 0) {
          throw new Error("Timesheet not found or permission denied.");
        }

        // Step 2: If project data is included, wipe and re-insert all child records.
        if (projects && Array.isArray(projects)) {
            await execute(`DELETE FROM TIME_ENTRIES WHERE TIMESHEET_ID = ?`, [timesheet_id]);

            if (projects.length > 0) {
              const entryBinds = [];
              let valuePlaceholders = [];
              projects.forEach(proj => {
                  proj.daily_hours.forEach((hours, i) => {
                      if (hours > 0) {
                          valuePlaceholders.push("(?, ?, ?, ?, ?)");
                          entryBinds.push(timesheet_id, proj.dates[i], hours, proj.project_id, proj.notes || "");
                      }
                  });
              });
              if (valuePlaceholders.length > 0) {
                  const sql = "INSERT INTO TIME_ENTRIES (TIMESHEET_ID, DATE, HOURS, PROJECT_ID, NOTES) VALUES " + valuePlaceholders.join(', ');
                  await execute(sql, entryBinds);
              }
            }
        }
        
        res.json({ status: "success", message: `Timesheet updated.` });
    } catch (err) {
        console.error("Timesheet update error:", err);
        res.status(500).json({ error: err.message || "Failed to update timesheet." });
    }
});


// --- ACTIONS ---
router.post('/action/:timesheet_id', isAuthenticated, authorizeRoles('manager'), async (req, res) => {
    const { id: managerId } = req.session.user;
    const { action, manager_comment = "" } = req.body;
    const { timesheet_id } = req.params;
    if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });
  
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const timestampColumn = action === 'approve' ? 'APPROVED_AT' : 'REJECTED_AT';
    const sqlText = `
      UPDATE TIMESHEETS SET STATUS = ?, ${timestampColumn} = CURRENT_TIMESTAMP(), MANAGER_COMMENT = ?
      WHERE TIMESHEET_ID = ? AND EMPLOYEE_ID IN (SELECT ID FROM USERS WHERE ASSIGNED_MANAGER_ID = ?)
    `;

    try {
        const { stmt } = await execute(sqlText, [newStatus, manager_comment, timesheet_id, managerId]);
        if(stmt.getNumUpdatedRows() === 0) return res.status(403).json({ error: "Forbidden or timesheet not found" });
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "DB Error during action" });
    }
});

module.exports = router;