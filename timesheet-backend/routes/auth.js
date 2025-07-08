// routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const { getConn } = require('../db');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const router = express.Router();

// ... (keep /register, /login, /logout as they are)
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const role = "employee"; // Public registration is always for 'employee'
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

  const conn = getConn();
  conn.execute({
    sqlText: "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?",
    binds: [username, email],
    complete: function(err, stmt, rows) {
      if (err || !rows || rows.length === 0) return res.status(500).json({ error: "Database error during user check" });
      if (rows[0].COUNT > 0) return res.status(400).json({ error: "Username or Email already exists" });
      
      const hashed = bcrypt.hashSync(password, 10);
      conn.execute({
        sqlText: "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        binds: [username, email, hashed, role],
        complete: function(err) {
          if (err) return res.status(500).json({ error: "Failed to create user" });
          res.status(201).json({ user: { username, email, role } });
        }
      });
    }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT * FROM users WHERE username = ?",
    binds: [username],
    complete: function(err, stmt, rows) {
      if (err || !rows || rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });
      
      const user = rows[0];
      if (!bcrypt.compareSync(password, user.PASSWORD)) return res.status(400).json({ error: "Invalid credentials" });
      
      req.session.user = {
        id: user.ID,
        username: user.USERNAME,
        email: user.EMAIL,
        role: user.ROLE,
        assigned_manager_id: user.ASSIGNED_MANAGER_ID
      };
      res.json({ message: "Logged in", user: req.session.user });
    }
  });
});

router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) return res.status(400).json({ error: "Unable to log out" });
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  } else {
    res.end();
  }
});


// GET /user (Get current logged-in user)
router.get('/user', isAuthenticated, (req, res) => {
  res.json(req.session.user);
});

// GET /users (Get all users for admin)
router.get('/users', isAuthenticated, authorizeRoles('admin'), (req, res) => {
    const conn = getConn();
    conn.execute({
        // Get manager's username along with user details
        sqlText: `
            SELECT u.id, u.username, u.email, u.role, u.assigned_manager_id, m.username as manager_name
            FROM USERS u
            LEFT JOIN USERS m ON u.assigned_manager_id = m.id
        `,
        complete: function(err, stmt, rows) {
            if (err) return res.status(500).json({ error: "Database error" });
            const result = rows.map(row => ({
                id: row.ID, username: row.USERNAME, email: row.EMAIL, role: row.ROLE,
                assigned_manager_id: row.ASSIGNED_MANAGER_ID, manager_name: row.MANAGER_NAME
            }));
            res.json(result);
        }
    });
});

// POST /create-user (Admin only)
router.post('/create-user', isAuthenticated, authorizeRoles('admin'), (req, res) => {
    const { username, email, password, role, assigned_manager_id } = req.body;
    if (!username || !email || !password || !role) return res.status(400).json({ error: "All fields are required" });

    const conn = getConn();
    const finalManagerId = role === 'employee' ? (assigned_manager_id || null) : null;
    const hashed = bcrypt.hashSync(password, 10);
    conn.execute({
        sqlText: "INSERT INTO users (username, email, password, role, assigned_manager_id) VALUES (?, ?, ?, ?, ?)",
        binds: [username, email, hashed, role, finalManagerId],
        complete: function(err) {
            if (err) return res.status(500).json({ error: "Failed to create user" });
            res.status(201).json({ message: "User created successfully" });
        }
    });
});

// GET /managers (for dropdowns)
router.get('/managers', isAuthenticated, authorizeRoles('admin'), (req, res) => {
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT ID, USERNAME FROM USERS WHERE ROLE = 'manager' ORDER BY USERNAME",
    complete: function(err, stmt, rows) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows.map(row => ({ id: row.ID, username: row.USERNAME })));
    }
  });
});

// PUT /users/:id (Admin updates a user)
router.put('/users/:id', isAuthenticated, authorizeRoles('admin'), (req, res) => {
    const { id } = req.params;
    const { role, assigned_manager_id } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required." });
    
    const finalManagerId = role === 'employee' ? (assigned_manager_id || null) : null;
    const conn = getConn();
    conn.execute({
        sqlText: "UPDATE USERS SET ROLE = ?, ASSIGNED_MANAGER_ID = ? WHERE ID = ?",
        binds: [role, finalManagerId, id],
        complete: function(err, stmt) {
            if (err || stmt.getUpdatedRows() === 0) return res.status(500).json({ error: "Failed to update user or user not found" });
            res.json({ message: "User updated successfully" });
        }
    });
});

// GET /profile
router.get('/profile', isAuthenticated, (req, res) => {
    const conn = getConn();
    conn.execute({
        sqlText: "SELECT * FROM user_profiles WHERE user_id = ?",
        binds: [req.session.user.id],
        complete: function(err, stmt, rows) {
            if (err) return res.status(500).json({ error: "DB Error" });
            if (rows.length === 0) return res.json({ full_name: '', age: '', designation: '', address: '', phone_number: '' });
            res.json({
                full_name: rows[0].FULL_NAME, age: rows[0].AGE, designation: rows[0].DESIGNATION,
                address: rows[0].ADDRESS, phone_number: rows[0].PHONE_NUMBER,
            });
        }
    });
});

// POST /profile
router.post('/profile', isAuthenticated, (req, res) => {
    const { full_name, age, designation, address, phone_number } = req.body;
    const conn = getConn();
    conn.execute({
        sqlText: `
            MERGE INTO user_profiles p USING (SELECT ? AS user_id) AS source ON p.user_id = source.user_id
            WHEN MATCHED THEN UPDATE SET full_name = ?, age = ?, designation = ?, address = ?, phone_number = ?
            WHEN NOT MATCHED THEN INSERT (user_id, full_name, age, designation, address, phone_number) VALUES (?, ?, ?, ?, ?, ?);
        `,
        binds: [
            req.session.user.id, full_name, age, designation, address, phone_number,
            req.session.user.id, full_name, age, designation, address, phone_number
        ],
        complete: function(err) {
            if (err) return res.status(500).json({ error: "DB Error updating profile" });
            res.json({ status: 'success' });
        }
    });
});

module.exports = router;