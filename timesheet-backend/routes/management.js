// routes/management.js

const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { getConn } = require('../db');
const router = express.Router();

// --- Manager-Specific Route ---
// GET /management/my-team
router.get('/my-team', isAuthenticated, authorizeRoles('manager'), (req, res) => {
    const managerId = req.session?.user?.id;

    if (!managerId) {
        return res.status(400).json({ error: "Invalid session or user ID missing" });
    }

    getConn().execute({
        sqlText: "SELECT ID, USERNAME, EMAIL FROM USERS WHERE ASSIGNED_MANAGER_ID = ?",
        binds: [managerId],
        complete: (err, stmt, rows) => {
            if (err) {
                console.error("DB error:", err);
                return res.status(500).json({ error: "DB error" });
            }

            if (!Array.isArray(rows)) {
                console.error("Unexpected DB response format:", rows);
                return res.status(500).json({ error: "Unexpected DB response format" });
            }

            const team = rows.map(r => ({
                id: r.ID,
                username: r.USERNAME,
                email: r.EMAIL
            }));

            res.json(team);
        }
    });
});

// --- Admin-Specific Routes ---
// GET /management/users
router.get('/users', isAuthenticated, authorizeRoles('admin'), (req, res) => {
    getConn().execute({
        sqlText: `
            SELECT u.id, u.username, u.email, u.role, u.assigned_manager_id, m.username as manager_name
            FROM USERS u
            LEFT JOIN USERS m ON u.assigned_manager_id = m.id
            ORDER BY u.username
        `,
        complete: (err, stmt, rows) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(rows.map(row => ({
                id: row.ID,
                username: row.USERNAME,
                email: row.EMAIL,
                role: row.ROLE,
                assigned_manager_id: row.ASSIGNED_MANAGER_ID,
                manager_name: row.MANAGER_NAME || 'None'
            })));
        }
    });
});

// GET /management/managers
router.get('/managers', isAuthenticated, authorizeRoles('admin'), (req, res) => {
    getConn().execute({
        sqlText: "SELECT ID, USERNAME FROM USERS WHERE ROLE = 'manager' ORDER BY USERNAME",
        complete: (err, stmt, rows) => {
            if (err) return res.status(500).json({ error: "DB error" });
            res.json(rows.map(r => ({ id: r.ID, username: r.USERNAME })));
        }
    });
});

// PUT /management/users/:id
router.put('/users/:id', isAuthenticated, authorizeRoles('admin'), (req, res) => {
    const { id } = req.params;
    const { role, assigned_manager_id } = req.body;

    if (!role) return res.status(400).json({ error: "Role is required." });

    const finalManagerId = role === 'employee' ? (assigned_manager_id || null) : null;

    getConn().execute({
        sqlText: "UPDATE USERS SET ROLE = ?, ASSIGNED_MANAGER_ID = ? WHERE ID = ?",
        binds: [role, finalManagerId, id],
        complete: (err, stmt) => {
            if (err || stmt.getNumUpdatedRows() === 0) {
                return res.status(500).json({ error: "Update failed" });
            }
            res.json({ message: "User updated" });
        }
    });
});

module.exports = router;
