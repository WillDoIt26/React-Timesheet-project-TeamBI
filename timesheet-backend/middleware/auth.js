// middleware/auth.js
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: "Login required" });
  }
}

module.exports = { isAuthenticated };
