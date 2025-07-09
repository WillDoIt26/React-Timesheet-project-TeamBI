// routes/projects.js
const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getConn } = require('../db');
const router = express.Router();

router.get('/', isAuthenticated, (req, res) => {
  getConn().execute({
    sqlText: "SELECT project_id, name, billable, project_owner FROM projects ORDER BY name",
    complete: (err, stmt, rows) => err ? res.status(500).json({ error: "DB error" }) : res.json(rows.map(row => ({
      project_id: row.PROJECT_ID, name: row.NAME,
      billable: row.BILLABLE, project_owner: row.PROJECT_OWNER
    })))
  });
});

router.post('/', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const { name, billable = true, project_owner } = req.body;
  if (!name || !project_owner) return res.status(400).json({ error: "Project name and owner are required" });
  getConn().execute({
    sqlText: "INSERT INTO projects (name, billable, project_owner) VALUES (?, ?, ?)",
    binds: [name, billable, project_owner],
    complete: (err) => err ? res.status(500).json({ error: "DB error" }) : res.status(201).json({ status: "success" })
  });
});

router.put('/:project_id', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const { project_id } = req.params;
  const { name, billable, project_owner } = req.body;
  if (!name || billable === undefined || !project_owner) return res.status(400).json({ error: "All fields required" });
  getConn().execute({
    sqlText: "UPDATE projects SET name=?, billable=?, project_owner=? WHERE project_id=?",
    binds: [name, billable, project_owner, project_id],
    complete: (err, stmt) => (err || stmt.getNumUpdatedRows() === 0) ? res.status(404).json({ error: "Update failed or not found" }) : res.json({ status: "success" })
  });
});

router.delete('/:project_id', isAuthenticated, authorizeRoles('manager', 'admin'), (req, res) => {
  const { project_id } = req.params;
  getConn().execute({
    sqlText: "DELETE FROM projects WHERE project_id = ?",
    binds: [project_id],
    complete: (err, stmt) => (err || stmt.getNumUpdatedRows() === 0) ? res.status(404).json({error: "Not found"}) : res.json({status: "success"})
  });
});

module.exports = router;