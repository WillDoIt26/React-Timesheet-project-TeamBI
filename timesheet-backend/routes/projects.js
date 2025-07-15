// routes/projects.js
// routes/projects.js
const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { execute } = require('../db'); // <-- THIS LINE WAS MISSING
const router = express.Router();

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await execute("SELECT project_id, name, billable, project_owner FROM PROJECTS ORDER BY name");
    res.json(rows.map(row => ({
      project_id: row.PROJECT_ID, name: row.NAME,
      billable: row.BILLABLE, project_owner: row.PROJECT_OWNER
    })));
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});
router.post('/', isAuthenticated, authorizeRoles('manager', 'admin'), async (req, res) => {
  const { name, billable = true, project_owner } = req.body;
  if (!name || !project_owner) return res.status(400).json({ error: "Project name and owner are required" });
  
  try {
    await execute("INSERT INTO projects (name, billable, project_owner) VALUES (?, ?, ?)", [name, billable, project_owner]);
    res.status(201).json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

router.put('/:project_id', isAuthenticated, authorizeRoles('manager', 'admin'), async (req, res) => {
  const { project_id } = req.params;
  const { name, billable, project_owner } = req.body;
  if (!name || billable === undefined || !project_owner) return res.status(400).json({ error: "All fields required" });

  try {
    const { stmt } = await execute("UPDATE projects SET name=?, billable=?, project_owner=? WHERE project_id=?", [name, billable, project_owner, project_id]);
    if (stmt.getNumUpdatedRows() === 0) {
      return res.status(404).json({ error: "Update failed or not found" });
    }
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

router.delete('/:project_id', isAuthenticated, authorizeRoles('manager', 'admin'), async (req, res) => {
  const { project_id } = req.params;
  
  try {
    const { stmt } = await execute("DELETE FROM projects WHERE project_id = ?", [project_id]);
    if (stmt.getNumUpdatedRows() === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: "Deletion failed" });
  }
});

module.exports = router;