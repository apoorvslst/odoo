// middlewares/auth.js - JWT authentication & role-check middlewares
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'accountant-plus-plus-secret';

// Checks if the request has a valid JWT token.
// Gets the token from the 'Authorization: Bearer <token>' header,
// verifies it using JWT_SECRET, and attaches user info to req.user.
// If token is missing or invalid, blocks the request with 401 or 403.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, login_id, role }
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Blocks access if the logged-in user is not an admin.
// Must be used AFTER authenticateToken so req.user is already set.
// If role is not 'admin', returns 403. Otherwise lets the request through.
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, adminOnly, JWT_SECRET };
