// validators/authValidator.js - Simple Zod schemas
const { z } = require('zod');

// --- SIGNUP ---
const signupSchema = z.object({
  login_id: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string().min(8),
});

// --- SIGNIN ---
const signinSchema = z.object({
  login_id: z.string().min(1),
  password: z.string().min(1),
});

// --- CREATE USER (admin) ---
const createUserSchema = z.object({
  name: z.string().min(1),
  login_id: z.string().min(6).max(12),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'accountant', 'user']),
});

module.exports = { signupSchema, signinSchema, createUserSchema };
