require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sql } = require("drizzle-orm");
const { db } = require("./db");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// --- Routes ---
app.use("/api", authRoutes);

// --- Database connection check ---
async function testDb() {
  try {
    await db.execute(sql`select 1`);
    console.log("Successfully connected to PostgreSQL Database!");
  } catch (err) {
    console.error("Error connecting to database", err);
  }
}

testDb();

// --- Health check ---
app.get("/", (req, res) => {
  res.send("AccountanT++ API is running");
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
