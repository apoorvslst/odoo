//this file has logic for authcontrollers

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET } = require('../middlewares/auth');

const signup = async (req, res) => {
  try {
    const { login_id, email, password } = req.body;  // le le
    const alreadylogin = await pool.query('SELECT id FROM users WHERE login_id = $1', [login_id]);
    if (alreadylogin.rows.length > 0) {
      return res.status(409).json({ error: 'u r already there' });
    }

    const alreadyemail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (alreadyemail.rows.length > 0) {
      return res.status(409).json({ error: 'Email Id is already registered' });
    }

    // Hashing kr rhe
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query('INSERT INTO users (login_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, login_id, email, role',
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
    const { login_id, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE login_id = $1', [login_id]);  // login id wla check krega

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    const user = result.rows[0];  // user ka data

    // Compare password  (sahi h kya ye pass)
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


const createUser = async (req, res) => {
  try {
    const { name, login_id, email, password, role } = req.body;

    const alreadyLogin = await pool.query('SELECT id FROM users WHERE login_id = $1', [login_id]);
    if (alreadyLogin.rows.length > 0) {
      return res.status(409).json({ error: 'Login Id already exists' });
    }

    const alreadyEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (alreadyEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email Id is already registered' });
    }

    // uska pass hash kardu 
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(  // name, login id, password, role daal kr insert kr
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
