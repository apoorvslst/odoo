// routes/authRoutes.js - Auth route definitions

const express = require('express');
const router = express.Router();
const { signup, signin, createUser } = require('../controllers/authController');
const { authenticateToken, adminOnly } = require('../middlewares/auth');
const { signupSchema, signinSchema, createUserSchema } = require('../validators/authValidator');

function validate(schema) {   // middleware for  authentication
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.errors[0].message;
      return res.status(400).json({ error: firstError });
    }
    next();  // sb theek toh aage
  };
}

// Public registration (creates "accountant" role)
router.post('/signup', validate(signupSchema), signup);

// Login
router.post('/signin', validate(signinSchema), signin);

//  Admin creates a new user (protected)
router.post('/users', authenticateToken, adminOnly, validate(createUserSchema), createUser);

module.exports = router;
