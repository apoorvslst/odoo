require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// --- Routes ---
app.use('/api', authRoutes);

// --- Health check ---
app.get('/', (req, res) => {
  res.send('AccountanT++ API is running');
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
