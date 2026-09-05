// routes/authRoutes.js - Auth route definitions
const express = require('express');
const router = express.Router();
const { signup, signin, createUser } = require('../controllers/authController');
const { authenticateToken, adminOnly } = require('../middlewares/auth');
const { signupSchema, signinSchema, createUserSchema } = require('../validators/authValidator');

// Middleware: validates request body using a Zod schema
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Return the first error message
      const firstError = result.error.errors[0].message;
      return res.status(400).json({ error: firstError });
    }
    next();
  };
}

// POST /api/signup   → Public registration (creates "accountant" role)
router.post('/signup', validate(signupSchema), signup);

// POST /api/signin   → Login
router.post('/signin', validate(signinSchema), signin);

// POST /api/users    → Admin creates a new user (protected)
router.post('/users', authenticateToken, adminOnly, validate(createUserSchema), createUser);

module.exports = router;
