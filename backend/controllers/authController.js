// controllers/authController.js - Business logic for auth routes
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middlewares/auth');

// Registers a new user publicly.
// Checks if login_id or email already exists in DB.
// If not, hashes the password with bcrypt and saves the user.
// New users get 'accountant' role by default.
const signup = async (req, res) => {
  try {
    const { login_id, email, password } = req.body;

    // Check if login_id already exists
    const existingLogin = await pool.query('SELECT id FROM users WHERE login_id = $1', [login_id]);
    if (existingLogin.rows.length > 0) {
      return res.status(409).json({ error: 'Login Id already exists' });
    }

    // Check if email already exists
    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email Id is already registered' });
    }

    // Hash password and save
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (login_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, login_id, email, role',
      [login_id, email, password_hash, 'accountant']
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Logs in an existing user.
// Looks up user by login_id in DB.
// Compares the given password with the stored hashed password using bcrypt.
// If they match, creates and returns a JWT token (valid 24h).
const signin = async (req, res) => {
  try {
    const { login_id, password } = req.body;

    // Find the user
    const result = await pool.query('SELECT * FROM users WHERE login_id = $1', [login_id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, login_id: user.login_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        login_id: user.login_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin creates a user with a specific role (admin/accountant/user).
// Same duplicate checks as signup.
// Hashes password, then inserts user with the chosen role.
const createUser = async (req, res) => {
  try {
    const { name, login_id, email, password, role } = req.body;

    // Check duplicates
    const existingLogin = await pool.query('SELECT id FROM users WHERE login_id = $1', [login_id]);
    if (existingLogin.rows.length > 0) {
      return res.status(409).json({ error: 'Login Id already exists' });
    }

    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email Id is already registered' });
    }

    // Hash and create
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, login_id, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, login_id, email, role, created_at',
      [name, login_id, email, password_hash, role]
    );

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, signin, createUser };
