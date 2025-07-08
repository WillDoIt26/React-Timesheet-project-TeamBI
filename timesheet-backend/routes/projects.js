const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getConn } = require('../db');
const router = express.Router();

// Get all projects
router.get('/', isAuthenticated, (req, res) => {
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT project_id, name, billable FROM projects",
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      const result = rows.map(row => ({
        project_id: row.PROJECT_ID,
        name: row.NAME,
        billable: row.BILLABLE
      }));
      res.json(result);
    }
  });
});

// Get project by ID
router.get('/:project_id', isAuthenticated, (req, res) => {
  const { project_id } = req.params;
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT project_id, name, billable FROM projects WHERE project_id=?",
    binds: [project_id],
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!rows || rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ project_id: rows[0].PROJECT_ID, name: rows[0].NAME, billable: rows[0].BILLABLE });
    }
  });
});

// Create Project (admin only)
router.post('/', isAuthenticated, authorizeRoles('admin'), (req, res) => {
  const { name, billable = true } = req.body;
  if (!name) return res.status(400).json({ error: "Project name required" });
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT COUNT(*) AS count FROM projects WHERE name = ?",
    binds: [name],
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      if (rows[0].COUNT > 0) return res.status(400).json({ error: "Project with this name already exists" });
      conn.execute({
        sqlText: "INSERT INTO projects (name, billable) VALUES (?, ?)",
        binds: [name, billable],
        complete: function(err) {
          if (err) return res.status(500).json({ error: "DB error" });
          res.json({ status: "success" });
        }
      });
    }
  });
});

// Update Project (admin only)
router.put('/:project_id', isAuthenticated, authorizeRoles('admin'), (req, res) => {
  const { project_id } = req.params;
  const { name, billable } = req.body;
  if (!name || billable === undefined) return res.status(400).json({ error: "Name and billable required" });
  const conn = getConn();
  conn.execute({
    sqlText: "UPDATE projects SET name=?, billable=? WHERE project_id=?",
    binds: [name, billable, project_id],
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ status: "success" });
    }
  });
});

module.exports = router;
