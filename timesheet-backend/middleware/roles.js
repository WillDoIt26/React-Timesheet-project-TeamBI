// middleware/roles.js

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (allowedRoles.includes(req.session.user.role)) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  };
}

module.exports = { authorizeRoles };
