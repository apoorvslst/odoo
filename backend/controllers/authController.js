const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET } = require('../middlewares/auth');

const signup = async (req, res) => {
  try {
    const login_id = req.body.login_id || req.body.loginId;
    const email = req.body.email;
    const password = req.body.password;

    const alreadylogin = await pool.query('SELECT id FROM users WHERE login_id = $1', [login_id]);
    if (alreadylogin.rows.length > 0) {
      return res.status(409).json({ error: 'Login Id already exists' });
    }

    const alreadyemail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (alreadyemail.rows.length > 0) {
      return res.status(409).json({ error: 'Email Id is already registered' });
    }

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

const signin = async (req, res) => {
  try {
    const login_id = req.body.login_id || req.body.loginId;
    const password = req.body.password;

    const result = await pool.query('SELECT * FROM users WHERE login_id = $1', [login_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    const token = jwt.sign(
      { id: user.id, login_id: user.login_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
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

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const login_id = req.body.login_id || req.body.loginId;

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE login_id = $1 OR email = $2',
      [login_id, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Login Id or Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (login_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, login_id, email, role',
      [login_id, email, password_hash, role]
    );

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { signup, signin, createUser };
