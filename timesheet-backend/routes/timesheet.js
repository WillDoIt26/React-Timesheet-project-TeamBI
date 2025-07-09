// routes/timesheet.js
const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getConn } = require('../db');
const router = express.Router();

// --- DATA FETCHING & STATS (Most specific routes, so they go first) ---
router.get('/stats/dashboard', isAuthenticated, (req, res) => {
    const user = req.session.user;
    const myStatsQuery = new Promise((resolve, reject) => {
        getConn().execute({
            sqlText: `SELECT STATUS as status, COUNT(*) as count FROM TIMESHEETS WHERE EMPLOYEE_ID = ? GROUP BY STATUS;`,
            binds: [user.id],
            complete: (err, stmt, rows) => {
                if (err) return reject(err);
                const stats = { approved: 0, submitted: 0, draft: 0, rejected: 0 };
                if (rows) rows.forEach(row => {
                    if (row.status) stats[row.status.toLowerCase()] = row.count;
                });
                resolve({ myStats: stats });
            }
        });
    });
    Promise.all([myStatsQuery])
      .then(results => res.json(results.reduce((acc, current) => ({ ...acc, ...current }), {})))
      .catch(error => res.status(500).json({ error: 'Failed to fetch dashboard stats' }));
});

router.get('/history', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const query = `
    SELECT t.timesheet_id, t.week_start, t.status, t.manager_comment,
           (SELECT SUM(e.hours) FROM time_entries e WHERE e.timesheet_id = t.timesheet_id) as total_hours
    FROM timesheets t WHERE t.employee_id = ? ORDER BY t.week_start DESC LIMIT 50;
  `;
  getConn().execute({
    sqlText: query,
    binds: [user.id],
    complete: (err, stmt, rows) => err ? res.status(500).json({ error: "DB error" }) : res.json(rows.map(row => ({
        timesheet_id: row.TIMESHEET_ID, week_start: row.WEEK_START, status: row.STATUS,
        total_hours: row.TOTAL_HOURS || 0, manager_comment: row.MANAGER_COMMENT
    })))
  });
});

router.get('/pending', isAuthenticated, authorizeRoles('manager'), (req, res) => {
  const managerId = req.session.user.id;
  getConn().execute({
    sqlText: `
      SELECT t.timesheet_id, t.week_start, u.username,
             (SELECT SUM(e.hours) FROM time_entries e WHERE e.timesheet_id = t.timesheet_id) as total_hours
      FROM timesheets t JOIN users u ON t.employee_id = u.id
      WHERE u.assigned_manager_id = ? AND t.status = 'submitted'
      ORDER BY t.week_start DESC
    `,
    binds: [managerId],
    complete: (err, stmt, rows) => err ? res.status(500).json({ error: "DB error" }) : res.json(rows.map(row => ({
        timesheet_id: row.TIMESHEET_ID, week_start: row.WEEK_START,
        employee_name: row.USERNAME, total_hours: row.TOTAL_HOURS || 0
    })))
  });
});

// --- CORE TIMESHEET CRUD (More generic routes go last) ---
router.post('/', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const { week_start, status = "draft", projects } = req.body;
  if (!week_start || !projects) return res.status(400).json({ error: "Missing data" });
  
  const conn = getConn();
  conn.execute({
    sqlText: "INSERT INTO timesheets (week_start, employee_id, status) VALUES (?, ?, ?)",
    binds: [week_start, user.id, status],
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error" });
      conn.execute({
        sqlText: "SELECT MAX(timesheet_id) AS id FROM timesheets WHERE employee_id = ? AND week_start = ?",
        binds: [user.id, week_start],
        complete: function(err, stmt, rows) {
          if (err || !rows[0]?.ID) return res.status(500).json({ error: "Could not get new timesheet ID" });
          const timesheet_id = rows[0].ID;
          if (projects.length > 0) {
              projects.forEach(proj => {
                const { project_id, daily_hours, dates, notes = "" } = proj;
                for (let i = 0; i < daily_hours.length; i++) {
                    if(daily_hours[i] > 0) conn.execute({
                        sqlText: "INSERT INTO time_entries (timesheet_id, date, hours, project_id, notes) VALUES (?, ?, ?, ?, ?)",
                        binds: [timesheet_id, dates[i], daily_hours[i], project_id, notes]
                    });
                }
              });
          }
          res.status(201).json({ status: "success", timesheet_id });
        }
      });
    }
  });
});

router.get('/:timesheet_id', isAuthenticated, (req, res) => {
    const { timesheet_id } = req.params;
    const user = req.session.user;
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

    getConn().execute({
      sqlText, binds,
      complete: function(err, stmt, rows) {
        if (err) return res.status(500).json({ error: "DB error" });
        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        
        const result = {
          week_start: rows[0].WEEK_START, status: rows[0].STATUS, projects: {}
        };
        if (rows[0].PROJECT_ID !== null) {
            rows.forEach(row => {
              if (!result.projects[row.PROJECT_ID]) {
                result.projects[row.PROJECT_ID] = {
                  project_id: row.PROJECT_ID, name: row.NAME,
                  notes: row.NOTES || "", entries: []
                };
              }
              result.projects[row.PROJECT_ID].entries.push({ date: row.DATE, hours: row.HOURS });
            });
            result.projects = Object.values(result.projects);
        } else {
            result.projects = [];
        }
        res.json(result);
      }
    });
});

router.put('/:timesheet_id', isAuthenticated, (req, res) => {
  const { timesheet_id } = req.params;
  const user = req.session.user;
  const { status, projects } = req.body;
  if (!status) return res.status(400).json({ error: "Missing status" });

  const conn = getConn();
  conn.execute({
    sqlText: `UPDATE TIMESHEETS SET STATUS = ? WHERE TIMESHEET_ID = ? AND EMPLOYEE_ID = ?`,
    binds: [status, timesheet_id, user.id],
    complete: function(err, stmt) {
        if(err || stmt.getNumUpdatedRows() === 0) return res.status(404).json({error: "Not found or no permission"});
        if(projects) {
            conn.execute({
                sqlText: `DELETE FROM TIME_ENTRIES WHERE TIMESHEET_ID = ?`,
                binds: [timesheet_id],
                complete: function(err) {
                    if (err) return;
                    projects.forEach(proj => {
                        const { project_id, daily_hours, dates, notes = "" } = proj;
                        for (let i = 0; i < daily_hours.length; i++) {
                            if (daily_hours[i] > 0) conn.execute({
                                sqlText: "INSERT INTO TIME_ENTRIES (timesheet_id, date, hours, project_id, notes) VALUES (?, ?, ?, ?, ?)",
                                binds: [timesheet_id, dates[i], daily_hours[i], project_id, notes]
                            });
                        }
                    });
                }
            });
        }
        res.json({ status: "success", message: `Timesheet updated.` });
    }
  });
});

// --- ACTIONS ---
router.post('/action/:timesheet_id', isAuthenticated, authorizeRoles('manager'), (req, res) => {
  const managerId = req.session.user.id;
  const { action, manager_comment = "" } = req.body;
  const { timesheet_id } = req.params;
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });
  
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const timestampColumn = action === 'approve' ? 'approved_at' : 'rejected_at';
  getConn().execute({
    sqlText: `
      UPDATE timesheets SET status = ?, ${timestampColumn} = CURRENT_TIMESTAMP(), manager_comment = ?
      WHERE timesheet_id = ? AND employee_id IN (SELECT id FROM users WHERE assigned_manager_id = ?)
    `,
    binds: [newStatus, manager_comment, timesheet_id, managerId],
    complete: (err, stmt) => (err || stmt.getNumUpdatedRows() === 0) ? res.status(403).json({ error: "Forbidden" }) : res.json({ status: "success" })
  });
});


module.exports = router;
