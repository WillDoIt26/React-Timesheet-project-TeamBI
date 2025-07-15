// middleware/auth.js

const isAuthenticated = (req, res, next) => {
  // The most reliable check is for the existence of the user object in the session.
  if (req.session && req.session.user) {
    // If the user object exists, the user is authenticated.
    return next();
  } else {
    // If it does not exist, they are not authorized.
    return res.status(401).json({ error: 'Unauthorized: No active session or session expired.' });
  }
};

module.exports = { isAuthenticated };