// routes/management.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { execute } = require('../db');// Correct import
const router = express.Router();

// --- Manager-Specific Route ---
router.get('/my-team', isAuthenticated, authorizeRoles('manager'), async (req, res) => {
    const managerId = req.session?.user?.id;
    if (!managerId) return res.status(400).json({ error: "Invalid session or user ID missing" });

    try {
        const { rows } = await execute("SELECT ID, USERNAME, EMAIL FROM USERS WHERE ASSIGNED_MANAGER_ID = ?", [managerId]);
        const team = rows.map(r => ({ id: r.ID, username: r.USERNAME, email: r.EMAIL }));
        res.json(team);
    } catch (err) {
        console.error("DB error in /my-team:", err);
        res.status(500).json({ error: "DB error" });
    }
});

// --- Admin-Specific Routes ---
router.get('/users', isAuthenticated, authorizeRoles('admin','manager'), async (req, res) => {
    const sqlText = `SELECT u.id, u.username, u.email, u.role, u.assigned_manager_id, m.username as manager_name
                     FROM USERS u LEFT JOIN USERS m ON u.assigned_manager_id = m.id
                     ORDER BY u.username`;
    try {
        const { rows } = await execute(sqlText);
        const users = rows.map(row => ({
            id: row.ID,
            username: row.USERNAME,
            email: row.EMAIL,
            role: row.ROLE,
            assigned_manager_id: row.ASSIGNED_MANAGER_ID,
            manager_name: row.MANAGER_NAME || 'None'
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "DB error" });
    }
});

router.get('/managers', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    try {
        const { rows } = await execute("SELECT ID, USERNAME FROM USERS WHERE ROLE = 'manager' ORDER BY USERNAME");
        res.json(rows.map(r => ({ id: r.ID, username: r.USERNAME })));
    } catch (err) {
        res.status(500).json({ error: "DB error" });
    }
});

router.put('/users/:id', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { role, assigned_manager_id } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required." });

    const finalManagerId = role === 'employee' ? (assigned_manager_id || null) : null;
    const sqlText = "UPDATE USERS SET ROLE = ?, ASSIGNED_MANAGER_ID = ? WHERE ID = ?";
    
    try {
        const { stmt } = await execute(sqlText, [role, finalManagerId, id]);
        if (stmt.getNumUpdatedRows() === 0) {
            return res.status(404).json({ error: "User not found or no changes made" });
        }
        res.json({ message: "User updated" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

router.post('/users', isAuthenticated, authorizeRoles('admin'), async (req, res) => {
    const { username, email, password, role, assigned_manager_id } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: "Username, email, password, and role are required." });
    }

    try {
        const { rows } = await execute("SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?", [username, email]);
        
        if (rows[0].COUNT > 0) {
            return res.status(400).json({ error: "Username or Email already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const finalManagerId = (role === 'employee' && assigned_manager_id) ? assigned_manager_id : null;

        await execute(
            "INSERT INTO users (username, email, password, role, assigned_manager_id) VALUES (?, ?, ?, ?, ?)", 
            [username, email, hashed, role, finalManagerId]
        );
        
        res.status(201).json({ status: 'success', message: 'User created successfully' });
    } catch (err) {
        console.error("Admin user creation error:", err);
        res.status(500).json({ error: "Failed to create user" });
    }
});

module.exports = router;