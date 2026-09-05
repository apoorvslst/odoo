// validators/authValidator.js  Simple Zod schemas

const { z } = require('zod');

const signupSchema = z.object({  // signup hote waqt chize aisi honi chahie
  login_id: z.string().min(6).max(12).optional(),
  loginId: z.string().min(6).max(12).optional(),
  email: z.string().email(),
  password: z.string().min(8),
}).refine(data => data.login_id || data.loginId, { message: 'Login Id is required' });

const signinSchema = z.object({
  login_id: z.string().min(1).optional(),
  loginId: z.string().min(1).optional(),
  password: z.string().min(1),   // not empty hai aisa check kr rha
}).refine(data => data.login_id || data.loginId, { message: 'Login Id is required' });

const createUserSchema = z.object({
  name: z.string().min(1),  // non empty name 
  login_id: z.string().min(6).max(12).optional(),
  loginId: z.string().min(6).max(12).optional(),
  email: z.string().email(),  // email hai na ye check 
  password: z.string().min(8),
  role: z.enum(['admin', 'accountant', 'user']),  // ya to ye hoga ya fir vo
}).refine(data => data.login_id || data.loginId, { message: 'Login Id is required' });

module.exports = { signupSchema, signinSchema, createUserSchema };
