const express = require('express');
const bcrypt = require('bcryptjs');
const { getConn } = require('../db');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ['employee', 'manager', 'admin']
 *               assigned_manager_id:
 *                 type: number
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Invalid input (missing fields or duplicate credentials)
 *       500:
 *         description: Database error
 */
router.post('/register', (req, res) => {
  const { username, email, password, role = "employee", assigned_manager_id } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?",
    binds: [username, email],
    complete: function(err, stmt, rows) {
      if (err) {
        console.error("DB error during user existence check:", err);
        return res.status(500).json({ error: "Database error during user check" });
      }
      if (!rows || rows.length === 0) {
        return res.status(500).json({ error: "Unexpected database response" });
      }
      const countValue = rows[0].COUNT !== undefined ? rows[0].COUNT : rows[0].count;
      if (countValue > 0) {
        return res.status(400).json({ error: "Username or Email already exists" });
      }
      const hashed = bcrypt.hashSync(password, 10);
      conn.execute({
        sqlText: "INSERT INTO users (username, email, password, role, assigned_manager_id) VALUES (?, ?, ?, ?, ?)",
        binds: [username, email, hashed, role, assigned_manager_id || null],
        complete: function(err) {
          if (err) {
            console.error("DB error during user creation:", err);
            return res.status(500).json({ error: "Failed to create user" });
          }
          res.status(201).json({ user: { username, email, role } });
        }
      });
    }
  });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login (session-based authentication)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     assigned_manager_id:
 *                       type: number
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT * FROM users WHERE username = ?",
    binds: [username],
    complete: function(err, stmt, rows) {
      if (!rows || rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });
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

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Logout error
 */
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

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get current logged-in user info
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Unauthorized (no active session)
 */
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ['employee', 'manager', 'admin']
 *               assigned_manager_id:
 *                 type: number
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Invalid input (missing fields or duplicate credentials)
 *       500:
 *         description: Database error
 */
router.post('/register', (req, res) => {
  const { username, email, password, assigned_manager_id } = req.body;
  // Public registration is always for 'employee' role for security
  const role = "employee"; 
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?",
    binds: [username, email],
    complete: function(err, stmt, rows) {
      if (err) {
        console.error("DB error during user existence check:", err);
        return res.status(500).json({ error: "Database error during user check" });
      }
      if (!rows || rows.length === 0) {
        return res.status(500).json({ error: "Unexpected database response" });
      }
      const countValue = rows[0].COUNT !== undefined ? rows[0].COUNT : rows[0].count;
      if (countValue > 0) {
        return res.status(400).json({ error: "Username or Email already exists" });
      }
      const hashed = bcrypt.hashSync(password, 10);
      conn.execute({
        sqlText: "INSERT INTO users (username, email, password, role, assigned_manager_id) VALUES (?, ?, ?, ?, ?)",
        binds: [username, email, hashed, role, assigned_manager_id || null],
        complete: function(err) {
          if (err) {
            console.error("DB error during user creation:", err);
            return res.status(500).json({ error: "Failed to create user" });
          }
          res.status(201).json({ user: { username, email, role } });
        }
      });
    }
  });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login (session-based authentication)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     assigned_manager_id:
 *                       type: number
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT * FROM users WHERE username = ?",
    binds: [username],
    complete: function(err, stmt, rows) {
      if (!rows || rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });
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

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Logout error
 */
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

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get current logged-in user info
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Unauthorized (no active session)
 */
router.get('/user', isAuthenticated, (req, res) => {
  const { username, email, role } = req.session.user;
  res.json({ username, email, role });
});

/**
 * @swagger
 * /create-user:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, role]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: ['employee', 'manager', 'admin']
 *               assigned_manager_id:
 *                 type: number
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Database error
 */
router.post('/create-user', isAuthenticated, authorizeRoles('admin'), (req, res) => {
  const { username, email, password, role, assigned_manager_id } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const conn = getConn();
  conn.execute({
    sqlText: "SELECT COUNT(*) AS count FROM users WHERE username = ? OR email = ?",
    binds: [username, email],
    complete: function(err, stmt, rows) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (rows[0].COUNT > 0) {
        return res.status(400).json({ error: "Username or Email already exists" });
      }

      const hashed = bcrypt.hashSync(password, 10);
      conn.execute({
        sqlText: "INSERT INTO users (username, email, password, role, assigned_manager_id) VALUES (?, ?, ?, ?, ?)",
        binds: [username, email, hashed, role, assigned_manager_id || null],
        complete: function(err) {
          if (err) {
            return res.status(500).json({ error: "Failed to create user" });
          }
          res.status(201).json({ message: "User created successfully" });
        }
      });
    }
  });
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       403:
 *         description: Forbidden
 */
router.get('/users', isAuthenticated, authorizeRoles('admin'), (req, res) => {
  const conn = getConn();
  conn.execute({
    sqlText: "SELECT id, username, email, role, assigned_manager_id FROM users",
    complete: function(err, stmt, rows) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      const result = rows.map(row => ({
        id: row.ID,
        username: row.USERNAME,
        email: row.EMAIL,
        role: row.ROLE,
        assigned_manager_id: row.ASSIGNED_MANAGER_ID
      }));
      res.json(result);
    }
  });
});
module.exports = router;
