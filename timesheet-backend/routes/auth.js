// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execute } = require('../db');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// --- MULTER CONFIG FOR AVATAR UPLOAD ---
const avatarUploadPath = './public/uploads/avatars/';
// Ensure the destination directory exists before the server starts
fs.mkdirSync(avatarUploadPath, { recursive: true });
const storage = multer.diskStorage({
  destination: avatarUploadPath,
  filename: function(req, file, cb) {
    const userId = req.session.user.id;
    // Creates a unique, predictable filename like 'avatar-1.png'
    cb(null, `avatar-${userId}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2000000 }, // 2MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: You can only upload image files (jpeg, jpg, png, gif).');
    }
  }
}).single('avatar'); // The key 'avatar' must match the field name in the frontend FormData


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
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { rows } = await execute("SELECT * FROM USERS WHERE EMAIL = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const { rows: profileRows } = await execute("SELECT PROFILE_COMPLETED FROM USER_PROFILES WHERE USER_ID = ?", [user.ID]);
    const profileCompleted = profileRows.length > 0 && profileRows[0].PROFILE_COMPLETED === true;

    const userPayload = { 
        id: user.ID, 
        username: user.USERNAME, 
        email: user.EMAIL, 
        role: user.ROLE, 
        assigned_manager_id: user.ASSIGNED_MANAGER_ID,
        profileCompleted: profileCompleted
    };

    req.session.regenerate(function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create session' });
      req.session.user = userPayload;
      req.session.save(function (err) {
        if (err) return res.status(500).json({ error: 'Failed to save session' });
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
        const { rows } = await execute("SELECT full_name, age, designation, address, phone_number, avatar_url, profile_completed FROM USER_PROFILES WHERE user_id = ?", [req.session.user.id]);
        if (rows.length === 0) {
            return res.json({ full_name: '', age: '', designation: '', address: '', phone_number: '', avatar_url: '', profile_completed: false });
        }
        
        const profile = rows[0];
        res.json({
            full_name: profile.FULL_NAME || '',
            age: profile.AGE || '',
            designation: profile.DESIGNATION || '',
            address: profile.ADDRESS || '',
            phone_number: profile.PHONE_NUMBER || '',
            avatar_url: profile.AVATAR_URL || '',
            profile_completed: profile.PROFILE_COMPLETED
        });
    } catch (err) {
        console.error("Error in GET /profile:", err);
        res.status(500).json({ error: "DB Error fetching profile" });
    }
});

router.post('/profile', isAuthenticated, async (req, res) => {
    const { full_name, age, designation, address, phone_number } = req.body;
    const userId = req.session.user.id;
    
    if (!full_name) {
        return res.status(400).json({ error: "Full Name is required to complete the profile." });
    }

    const sqlText = `
        MERGE INTO USER_PROFILES p
        USING (SELECT ? AS user_id, ? AS fn, ? AS a, ? AS d, ? AS ad, ? AS pn, TRUE AS completed) AS source
        ON p.user_id = source.user_id
        WHEN MATCHED THEN UPDATE SET full_name = source.fn, age = source.a, designation = source.d, address = source.ad, phone_number = source.pn, profile_completed = source.completed
        WHEN NOT MATCHED THEN INSERT (user_id, full_name, age, designation, address, phone_number, profile_completed) VALUES (source.user_id, source.fn, source.a, source.d, source.ad, source.pn, source.completed);`;
    
    const binds = [userId, full_name || null, age || null, designation || null, address || null, phone_number || null];

    try {
        await execute(sqlText, binds);
        if (req.session.user) {
            req.session.user.profileCompleted = true;
            req.session.save();
        }
        res.json({ status: 'success' });
    } catch (err) {
        console.error("Profile update error in POST /profile:", err);
        res.status(500).json({ error: "DB Error updating profile" });
    }
});

router.post('/profile/avatar', isAuthenticated, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err });
        }
        if (req.file === undefined) {
            return res.status(400).json({ error: 'No file was selected.' });
        }

        try {
            const userId = req.session.user.id;
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;
            
            const sqlText = `
              MERGE INTO USER_PROFILES p
              USING (SELECT ? AS user_id, ? AS url) AS source
              ON (p.user_id = source.user_id)
              WHEN MATCHED THEN UPDATE SET p.avatar_url = source.url
              WHEN NOT MATCHED THEN INSERT (user_id, avatar_url) VALUES (source.user_id, source.url);
            `;
            await execute(sqlText, [userId, avatarUrl]);

            res.json({ status: 'success', avatarUrl: avatarUrl });
        } catch(dbErr) {
            console.error("Avatar DB update error:", dbErr);
            res.status(500).json({ error: "Database error while saving avatar information." });
        }
    });
});

module.exports = router;