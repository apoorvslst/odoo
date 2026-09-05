// setup-db.js - Run this ONCE to create the users table
// Command: node setup-db.js

const pool = require('./db');

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100),
        login_id      VARCHAR(12) UNIQUE NOT NULL,
        email         VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20) NOT NULL DEFAULT 'accountant',
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Users table created successfully!');
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
  } finally {
    pool.end();
  }
}

setup();
