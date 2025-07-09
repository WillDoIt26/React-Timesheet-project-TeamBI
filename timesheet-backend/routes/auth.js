// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { getConn } = require('../db');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const role = "employee";
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?",
    binds: [username, email],
    complete: function(err, stmt, rows) {
      if (err || !rows?.[0]) return res.status(500).json({ error: "DB error" });
      if (rows[0].COUNT > 0) return res.status(400).json({ error: "Username or Email already exists" });
      const hashed = bcrypt.hashSync(password, 10);
      conn.execute({
        sqlText: "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        binds: [username, email, hashed, role],
        complete: (err) => err ? res.status(500).json({ error: "Failed to create user" }) : res.status(201).json({ user: { username, email, role } })
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
      if (err || !rows?.[0]) return res.status(400).json({ error: "Invalid credentials" });
      const user = rows[0];
      if (!bcrypt.compareSync(password, user.PASSWORD)) return res.status(400).json({ error: "Invalid credentials" });
      req.session.user = { id: user.ID, username: user.USERNAME, email: user.EMAIL, role: user.ROLE, assigned_manager_id: user.ASSIGNED_MANAGER_ID };
      res.json({ message: "Logged in", user: req.session.user });
    }
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(400).json({ error: "Unable to log out" });
    res.clearCookie('connect.sid').json({ message: "Logout successful" });
  });
});

router.get('/user', isAuthenticated, (req, res) => res.json(req.session.user));

router.get('/profile', isAuthenticated, (req, res) => {
    getConn().execute({
        sqlText: "SELECT * FROM user_profiles WHERE user_id = ?",
        binds: [req.session.user.id],
        complete: (err, stmt, rows) => {
            if (err) return res.status(500).json({ error: "DB Error" });
            if (rows.length === 0) return res.json({ full_name: '', age: '', designation: '', address: '', phone_number: '' });
            res.json({
                full_name: rows[0].FULL_NAME, age: rows[0].AGE, designation: rows[0].DESIGNATION,
                address: rows[0].ADDRESS, phone_number: rows[0].PHONE_NUMBER,
            });
        }
    });
});

router.post('/profile', isAuthenticated, (req, res) => {
    const { full_name, age, designation, address, phone_number } = req.body;
    getConn().execute({
        sqlText: `MERGE INTO user_profiles p USING (SELECT ? AS user_id) AS source ON p.user_id = source.user_id WHEN MATCHED THEN UPDATE SET full_name = ?, age = ?, designation = ?, address = ?, phone_number = ? WHEN NOT MATCHED THEN INSERT (user_id, full_name, age, designation, address, phone_number) VALUES (?, ?, ?, ?, ?, ?);`,
        binds: [ req.session.user.id, full_name, age, designation, address, phone_number, req.session.user.id, full_name, age, designation, address, phone_number ],
        complete: (err) => err ? res.status(500).json({ error: "DB Error" }) : res.json({ status: 'success' })
    });
});

module.exports = router;