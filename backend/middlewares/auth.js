// middlewares/auth.js - JWT authentication & role-check middlewares
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'accountant-plus-plus-secret';

// Verify JWT token from "Authorization: Bearer <token>" header
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

// Only allow admin users
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, adminOnly, JWT_SECRET };
