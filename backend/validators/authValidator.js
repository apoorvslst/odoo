// validators/authValidator.js - Simple Zod schemas
const { z } = require('zod');

// Validates signup input.
// login_id must be 6-12 chars, email must be valid, password min 8 chars.
const signupSchema = z.object({
  login_id: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string().min(8),
});

// Validates signin input.
// Just checks that login_id and password are not empty.
const signinSchema = z.object({
  login_id: z.string().min(1),
  password: z.string().min(1),
});

// Validates create user input (admin only).
// Same rules as signup + requires a name and a valid role.
const createUserSchema = z.object({
  name: z.string().min(1),
  login_id: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'accountant', 'user']),
});

module.exports = { signupSchema, signinSchema, createUserSchema };
