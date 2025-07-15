// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { execute } = require('../db');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const role = "employee";
  if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const { rows } = await execute("SELECT COUNT(*) AS COUNT FROM USERS WHERE USERNAME = ? OR EMAIL = ?", [username, email]);
    if (rows[0].COUNT > 0) return res.status(400).json({ error: "Username or Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await execute("INSERT INTO USERS (USERNAME, EMAIL, PASSWORD, ROLE) VALUES (?, ?, ?, ?)", [username, email, hashed, role]);
    res.status(201).json({ user: { username, email, role } });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ error: "DB error during registration" });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { rows } = await execute("SELECT * FROM USERS WHERE USERNAME = ?", [username]);
    if (rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    
    const userPayload = { 
        id: user.ID, 
        username: user.USERNAME, 
        email: user.EMAIL, 
        role: user.ROLE, 
        assigned_manager_id: user.ASSIGNED_MANAGER_ID 
    };

    // THE DEFINITIVE FIX: Use req.session.regenerate for a clean login session.
    req.session.regenerate(function (err) {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      // After regenerating, attach the user to the new session
      req.session.user = userPayload;

      // Now save the newly created session
      req.session.save(function (err) {
        if (err) {
          console.error('Session save error after regenerate:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        res.json({ message: "Logged in", user: req.session.user });
      });
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(400).json({ error: "Unable to log out" });
      }
      res.clearCookie('connect.sid').json({ message: "Logout successful" });
    });
  } else {
    res.json({ message: "No session to log out" });
  }
});

router.get('/user', isAuthenticated, (req, res) => {
    // Because of the middleware, we can be 100% sure req.session.user exists here.
    res.json(req.session.user);
});

router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const { rows } = await execute("SELECT * FROM USER_PROFILES WHERE user_id = ?", [req.session.user.id]);
        if (rows.length === 0) {
            return res.json({ full_name: '', age: '', designation: '', address: '', phone_number: '' });
        }
        
        const profile = rows[0];
        res.json({
            full_name: profile.FULL_NAME || '',
            age: profile.AGE || '',
            designation: profile.DESIGNATION || '',
            address: profile.ADDRESS || '',
            phone_number: profile.PHONE_NUMBER || '',
        });
    } catch (err) {
        console.error("Error in GET /profile:", err);
        res.status(500).json({ error: "DB Error fetching profile" });
    }
});

router.post('/profile', isAuthenticated, async (req, res) => {
    const { full_name, age, designation, address, phone_number } = req.body;
    const userId = req.session.user.id;
    
    const sqlText = `
        MERGE INTO USER_PROFILES p
        USING (SELECT ? AS user_id, ? AS fn, ? AS a, ? AS d, ? AS ad, ? AS pn) AS source
        ON p.user_id = source.user_id
        WHEN MATCHED THEN UPDATE SET full_name = source.fn, age = source.a, designation = source.d, address = source.ad, phone_number = source.pn
        WHEN NOT MATCHED THEN INSERT (user_id, full_name, age, designation, address, phone_number) VALUES (source.user_id, source.fn, source.a, source.d, source.ad, source.pn);`;
    
    const binds = [userId, full_name || null, age || null, designation || null, address || null, phone_number || null];

    try {
        await execute(sqlText, binds);
        res.json({ status: 'success' });
    } catch (err) {
        console.error("Profile update error in POST /profile:", err);
        res.status(500).json({ error: "DB Error updating profile" });
    }
});

module.exports = router;