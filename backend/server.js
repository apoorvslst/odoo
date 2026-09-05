require("dotenv").config();
const express = require("express");
const { sql } = require("drizzle-orm");
const { db } = require("./db");

const app = express();
app.use(express.json());

async function testDb() {
  try {
    await db.execute(sql`select 1`);
    console.log("Successfully connected to PostgreSQL Database!");
  } catch (err) {
    console.error("Error connecting to database", err);
  }
}

testDb();

// A simple test route
app.get('/', (req, res) => {
  res.send('AccountanT++ API is running');
});

// Start your Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
