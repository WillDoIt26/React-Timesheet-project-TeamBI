const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getConn } = require('../db');
const router = express.Router();
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Submit Timesheet
router.post('/', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const { week_start, status = "draft", projects } = req.body;
  if (!week_start || !projects || !Array.isArray(projects)) return res.status(400).json({ error: "Missing or invalid data" });
  const conn = getConn();
  conn.execute({
    sqlText: "INSERT INTO timesheets (week_start, employee_id, status, submitted_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP())",
    binds: [week_start, user.id, status],
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error" });
      conn.execute({
        sqlText: "SELECT MAX(timesheet_id) AS id FROM timesheets WHERE employee_id = ? AND week_start = ?",
        binds: [user.id, week_start],
        complete: function(err, stmt, rows) {
          const timesheet_id = rows[0].ID;
          projects.forEach(proj => {
            const { project_id, daily_hours, dates, notes = "" } = proj;
            if (!project_id || !daily_hours || !dates || daily_hours.length !== dates.length) return;
            for (let i = 0; i < daily_hours.length; i++) {
              conn.execute({
                sqlText: "INSERT INTO time_entries (timesheet_id, date, hours, project_id, notes) VALUES (?, ?, ?, ?, ?)",
                binds: [timesheet_id, dates[i], daily_hours[i], project_id, notes]
              });
            }
          });
          // Email notification to manager if submitted (dummy)
          if (status === "submitted" && user.assigned_manager_id) {
            conn.execute({
              sqlText: "SELECT email FROM users WHERE id = ?",
              binds: [user.assigned_manager_id],
              complete: function(err, stmt, rows) {
                if (rows && rows[0].EMAIL) {
                  console.log(`Email to ${rows[0].EMAIL}: Timesheet submitted by ${user.username} for week ${week_start}`);
                }
              }
            });
          }
          res.json({ status: "success" });
        }
      });
    }
  });
});

// Timesheet History (only own)
router.get('/history', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const { start, end } = req.query;
  let query = `
    SELECT t.timesheet_id, t.week_start, t.status, SUM(e.hours) as total_hours
    FROM timesheets t
    JOIN time_entries e ON t.timesheet_id = e.timesheet_id
    WHERE t.employee_id = ?
  `;
  let params = [user.id];
  if (start && end) {
    query += " AND t.week_start BETWEEN ? AND ?";
    params.push(start, end);
  }
  query += " GROUP BY t.timesheet_id, t.week_start, t.status ORDER BY t.week_start DESC LIMIT 20";
  const conn = getConn();
  conn.execute({
    sqlText: query,
    binds: params,
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      const result = rows.map(row => ({
        timesheet_id: row.TIMESHEET_ID,
        week_start: row.WEEK_START,
        status: row.STATUS,
        total_hours: row.TOTAL_HOURS
      }));
      res.json(result);
    }
  });
});

// Pending Timesheets (manager/admin only)
router.get('/pending', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const user = req.session.user;
  const conn = getConn();
  conn.execute({
    sqlText: `
      SELECT t.timesheet_id, t.week_start, u.username, t.status, SUM(e.hours) as total_hours
      FROM timesheets t
      JOIN users u ON t.employee_id = u.id
      JOIN time_entries e ON t.timesheet_id = e.timesheet_id
      WHERE u.assigned_manager_id = ? AND t.status = 'submitted'
      GROUP BY t.timesheet_id, t.week_start, u.username, t.status
      ORDER BY t.week_start DESC
    `,
    binds: [user.id],
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      const result = rows.map(row => ({
        timesheet_id: row.TIMESHEET_ID,
        week_start: row.WEEK_START,
        employee_name: row.USERNAME,
        status: row.STATUS,
        total_hours: row.TOTAL_HOURS
      }));
      res.json(result);
    }
  });
});

// Approve/Reject Timesheet (manager/admin only)
router.post('/action/:timesheet_id', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const user = req.session.user;
  const { action, manager_comment = "" } = req.body;
  const { timesheet_id } = req.params;
  if (!["approve", "reject"].includes(action)) return res.status(400).json({ error: "Invalid action" });
  const conn = getConn();
  let sql, params;
  if (action === "approve") {
    sql = "UPDATE timesheets SET status='approved', approved_at=CURRENT_TIMESTAMP(), manager_comment=? WHERE timesheet_id=?";
    params = [manager_comment, timesheet_id];
  } else {
    sql = "UPDATE timesheets SET status='rejected', rejected_at=CURRENT_TIMESTAMP(), manager_comment=? WHERE timesheet_id=?";
    params = [manager_comment, timesheet_id];
  }
  conn.execute({
    sqlText: sql,
    binds: params,
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error" });
      // Notify employee (dummy)
      conn.execute({
        sqlText: "SELECT employee_id FROM timesheets WHERE timesheet_id=?",
        binds: [timesheet_id],
        complete: function(err, stmt, rows) {
          if (rows && rows[0].EMPLOYEE_ID) {
            const employee_id = rows[0].EMPLOYEE_ID;
            conn.execute({
              sqlText: "SELECT email FROM users WHERE id=?",
              binds: [employee_id],
              complete: function(err, stmt, rows) {
                if (rows && rows[0].EMAIL) {
                  console.log(`Email to ${rows[0].EMAIL}: Your timesheet for week has been ${action}. Manager comment: ${manager_comment}`);
                }
              }
            });
          }
          res.json({ status: "success" });
        }
      });
    }
  });
});

// CSV Export (only own)
router.get('/export-csv', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const conn = getConn();
  conn.execute({
    sqlText: `
      SELECT t.timesheet_id, t.week_start, t.status, e.date, e.hours, p.name, p.billable, e.notes
      FROM timesheets t
      JOIN time_entries e ON t.timesheet_id = e.timesheet_id
      JOIN projects p ON e.project_id = p.project_id
      WHERE t.employee_id = ?
      ORDER BY t.week_start DESC, e.date
    `,
    binds: [user.id],
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="timesheets.csv"');
      res.write('Timesheet ID,Week Start,Status,Date,Hours,Project,Billable,Notes\n');
      rows.forEach(row => {
        res.write([
          row.TIMESHEET_ID,
          row.WEEK_START,
          row.STATUS,
          row.DATE,
          row.HOURS,
          row.NAME,
          row.BILLABLE,
          row.NOTES
        ].join(',') + '\n');
      });
      res.end();
    }
  });
});
router.get('/:timesheet_id', isAuthenticated, (req, res) => {
  const { timesheet_id } = req.params;
  const user_id = req.session.user.id;

  const conn = getConn();
  conn.execute({
    // Ensure the user owns this timesheet
    sqlText: `
        SELECT T.WEEK_START, T.STATUS, E.PROJECT_ID, P.NAME, E.DATE, E.HOURS, E.NOTES
        FROM TIMESHEETS T
        JOIN TIME_ENTRIES E ON T.TIMESHEET_ID = E.TIMESHEET_ID
        JOIN PROJECTS P ON E.PROJECT_ID = P.PROJECT_ID
        WHERE T.TIMESHEET_ID = ? AND T.EMPLOYEE_ID = ?;
    `,
    binds: [timesheet_id, user_id],
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error getting timesheet details" });
      if (rows.length === 0) return res.status(404).json({ error: "Timesheet not found or you don't have access." });
      
      // Group entries by project
      const result = {
        week_start: rows[0].WEEK_START,
        status: rows[0].STATUS,
        projects: {}
      };

      rows.forEach(row => {
        if (!result.projects[row.PROJECT_ID]) {
          result.projects[row.PROJECT_ID] = {
            project_id: row.PROJECT_ID,
            name: row.NAME,
            notes: row.NOTES || "", // Assume notes are the same for all entries in a project for now
            entries: []
          };
        }
        result.projects[row.PROJECT_ID].entries.push({
          date: row.DATE,
          hours: row.HOURS
        });
      });

      // Convert projects object to array
      result.projects = Object.values(result.projects);
      res.json(result);
    }
  });
});

// NEW ROUTE 2: Update an existing timesheet (for saving drafts or submitting)
router.put('/:timesheet_id', isAuthenticated, (req, res) => {
  const { timesheet_id } = req.params;
  const user = req.session.user;
  const { week_start, status = "draft", projects } = req.body;
  
  if (!status || !projects || !Array.isArray(projects)) return res.status(400).json({ error: "Missing or invalid data" });

  const conn = getConn();
  
  // Use a transaction-like approach: delete old entries, then insert new ones.
  // In a real production app, you would use proper transactions.
  conn.execute({
    sqlText: `DELETE FROM TIME_ENTRIES WHERE TIMESHEET_ID = ?`,
    binds: [timesheet_id],
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error clearing old entries" });

      // Update the main timesheet status
      conn.execute({
        sqlText: `UPDATE TIMESHEETS SET STATUS = ?, SUBMITTED_AT = CURRENT_TIMESTAMP() WHERE TIMESHEET_ID = ? AND EMPLOYEE_ID = ?`,
        binds: [status, timesheet_id, user.id],
      });

      // Insert the new/updated time entries
      projects.forEach(proj => {
        const { project_id, daily_hours, dates, notes = "" } = proj;
        if (!project_id || !daily_hours || !dates || daily_hours.length !== dates.length) return;
        for (let i = 0; i < daily_hours.length; i++) {
            if (daily_hours[i] > 0) { // Only insert entries with hours
                conn.execute({
                    sqlText: "INSERT INTO TIME_ENTRIES (timesheet_id, date, hours, project_id, notes) VALUES (?, ?, ?, ?, ?)",
                    binds: [timesheet_id, dates[i], daily_hours[i], project_id, notes]
                });
            }
        }
      });

      res.json({ status: "success", message: `Timesheet ${timesheet_id} updated.` });
    }
  });
});
// GET Dashboard Stats (FINAL, MOST ROBUST VERSION)
router.get('/stats/dashboard', isAuthenticated, (req, res) => {
  const user = req.session.user;
  const conn = getConn();
  
  const promises = [];

  // Query 1: Get personal stats
  const myStatsQuery = new Promise((resolve, reject) => {
    conn.execute({
      sqlText: `
        SELECT STATUS as status, COUNT(*) as count
        FROM TIMESHEETS
        WHERE EMPLOYEE_ID = ?
        GROUP BY STATUS;
      `,
      binds: [user.id],
      complete: (err, stmt, rows) => {
        if (err) return reject(err);
        const stats = { approved: 0, submitted: 0, draft: 0, rejected: 0 };
        // Check if rows were returned before trying to loop
        if (rows && rows.length > 0) {
          rows.forEach(row => {
            // THE CRITICAL FIX: Check if row.status is not null/undefined
            if (row.status) {
              const statusKey = row.status.toLowerCase();
              if (stats.hasOwnProperty(statusKey)) {
                stats[statusKey] = row.count;
              }
            }
          });
        }
        resolve({ myStats: stats });
      }
    });
  });
  promises.push(myStatsQuery);

  // Query 2: Get pending approvals for manager/admin
  if (user.role === 'manager' || user.role === 'admin') {
    const pendingApprovalsQuery = new Promise((resolve, reject) => {
      conn.execute({
        sqlText: `
          SELECT COUNT(T.TIMESHEET_ID) as pending_count
          FROM TIMESHEETS T
          WHERE T.STATUS = 'submitted'
            AND T.EMPLOYEE_ID IN (SELECT ID FROM USERS WHERE ASSIGNED_MANAGER_ID = ?);
        `,
        binds: [user.id],
        complete: (err, stmt, rows) => {
          if (err) return reject(err);
          resolve({ pendingApprovals: rows[0].pending_count });
        }
      });
    });
    promises.push(pendingApprovalsQuery);
  }

  // Promise execution remains the same
  Promise.all(promises)
    .then(results => {
      const responseData = results.reduce((acc, current) => ({ ...acc, ...current }), {});
      res.json(responseData);
    })
    .catch(error => {
      console.error("Dashboard stat query failed:", error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
    });
});
module.exports = router;
