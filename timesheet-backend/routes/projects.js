const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getConn } = require('../db');
const router = express.Router();

// Get all projects - NOW INCLUDES OWNER
router.get('/', isAuthenticated, (req, res) => {
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT project_id, name, billable, project_owner FROM projects", // ADDED project_owner
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      const result = rows.map(row => ({
        project_id: row.PROJECT_ID,
        name: row.NAME,
        billable: row.BILLABLE,
        project_owner: row.PROJECT_OWNER // ADDED
      }));
      res.json(result);
    }
  });
});

// Get project by ID - UNCHANGED, but good practice to include all fields
router.get('/:project_id', isAuthenticated, (req, res) => {
  const { project_id } = req.params;
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT project_id, name, billable, project_owner FROM projects WHERE project_id=?",
    binds: [project_id],
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!rows || rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ project_id: rows[0].PROJECT_ID, name: rows[0].NAME, billable: rows[0].BILLABLE, project_owner: rows[0].PROJECT_OWNER });
    }
  });
});

// Create Project (Manager or Admin) - UPDATED
router.post('/', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const { name, billable = true, project_owner } = req.body; // ADDED project_owner
  if (!name || !project_owner) return res.status(400).json({ error: "Project name and owner are required" });
  const conn = getConn();
  conn.execute({
    sqlText: "INSERT INTO projects (name, billable, project_owner) VALUES (?, ?, ?)", // UPDATED
    binds: [name, billable, project_owner],
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.status(201).json({ status: "success" });
    }
  });
});

// Update Project (Manager or Admin) - UPDATED
router.put('/:project_id', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const { project_id } = req.params;
  const { name, billable, project_owner } = req.body; // ADDED project_owner
  if (!name || billable === undefined || !project_owner) return res.status(400).json({ error: "Name, billable status, and owner are required" });
  const conn = getConn();
  conn.execute({
    sqlText: "UPDATE projects SET name=?, billable=?, project_owner=? WHERE project_id=?", // UPDATED
    binds: [name, billable, project_owner, project_id],
    complete: function(err) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ status: "success" });
    }
  });
});

// NEW: Delete Project (Manager or Admin)
router.delete('/:project_id', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const { project_id } = req.params;
  const conn = getConn();
  conn.execute({
    sqlText: "DELETE FROM projects WHERE project_id = ?",
    binds: [project_id],
    complete: function(err, stmt) {
        if(err) return res.status(500).json({error: "DB error"});
        if(stmt.getUpdatedRows() === 0) return res.status(404).json({error: "Project not found"});
        res.json({status: "success"});
    }
  })
})


module.exports = router;