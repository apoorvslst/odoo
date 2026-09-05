//  JWT authentication & role-check middlewares

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// gfg doc authenticate wali
function authenticateToken(req, res, next) {

  const authHeader = req.headers['authorization'];  // auth header se cheez aai
  const token = authHeader && authHeader.split(' ')[1]; //split kardo header ko aur token nikal lo 

  if (!token)   return res.status(401).json({ error: 'Access denied. No token provided.' });

  try { 
    const decoded = jwt.verify(token, JWT_SECRET); //jwt se verify krega
    req.user = decoded; // { id, login_id, role }   
    next(); 
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}


function adminOnly(req, res, next) {  // sirf admin wali permission ke liy
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, adminOnly, JWT_SECRET };
