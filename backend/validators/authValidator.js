// validators/authValidator.js - Simple Zod schemas
const { z } = require('zod');

// --- SIGNUP ---
// Accepts both loginId (frontend) and login_id (backend)
const signupSchema = z.object({
  login_id: z.string().min(6).max(12).optional(),
  loginId: z.string().min(6).max(12).optional(),
  email: z.string().email(),
  password: z.string().min(8),
}).refine(data => data.login_id || data.loginId, { message: 'Login Id is required' });

// --- SIGNIN ---
const signinSchema = z.object({
  login_id: z.string().min(1).optional(),
  loginId: z.string().min(1).optional(),
  password: z.string().min(1),
}).refine(data => data.login_id || data.loginId, { message: 'Login Id is required' });

// --- CREATE USER (admin) ---
const createUserSchema = z.object({
  name: z.string().min(1),
  login_id: z.string().min(6).max(12).optional(),
  loginId: z.string().min(6).max(12).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'accountant', 'user']),
}).refine(data => data.login_id || data.loginId, { message: 'Login Id is required' });

module.exports = { signupSchema, signinSchema, createUserSchema };

