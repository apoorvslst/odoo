require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { db } = require("./db");
const authRoutes = require("./routes/authRoutes");
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", authRoutes);  // routes for auth

app.get("/", (req, res) => {
  res.send("Hello this is Accountant++ , Your API is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
