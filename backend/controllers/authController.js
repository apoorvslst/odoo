const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { eq, or, sql } = require("drizzle-orm");
const { db } = require("../db");
const { users, contacts } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLES } = require("../utils/constants");

const publicUser = (u, contactType = null) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  role: u.role,
  contactId: u.contactId,
  contactType: contactType || u.contactType || null,
  createdAt: u.createdAt,
});

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    throw new ApiError(400, "username, email and password are required");
  }
  if (String(password).length < 6) {
    throw new ApiError(400, "password must be at least 6 characters");
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) throw new ApiError(409, "Email is already registered");

  const all = await db.select({ id: users.id }).from(users);
  // Bootstrap: first user is admin; later self-registration is accountant
  // (contact users are created by an admin from the contact master).
  const role = all.length === 0 ? "admin" : "accountant";

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(users).values({ username, email, passwordHash, role }).returning();
  res.status(201).json({ user: publicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, "username/email and password are required");

  const identifier = String(email).trim();
  // Support logging in via email OR username (case-insensitive)
  const [user] = await db
    .select()
    .from(users)
    .where(
      or(
        sql`LOWER(${users.email}) = LOWER(${identifier})`,
        sql`LOWER(${users.username}) = LOWER(${identifier})`
      )
    );
  if (!user) throw new ApiError(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  let contactType = null;
  if (user.contactId) {
    const [c] = await db.select({ type: contacts.type }).from(contacts).where(eq(contacts.id, user.contactId));
    if (c) contactType = c.type;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, contactId: user.contactId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
  res.json({ token, user: publicUser(user, contactType) });
});

const me = asyncHandler(async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
  if (!user) throw new ApiError(404, "User not found");

  let contactType = null;
  if (user.contactId) {
    const [c] = await db.select({ type: contacts.type }).from(contacts).where(eq(contacts.id, user.contactId));
    if (c) contactType = c.type;
  }
  res.json({ user: publicUser(user, contactType) });
});

// Admin-only user creation with an explicit role; contact users must be tied
// to a contact (that is what makes them portal users).
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role = "accountant", contactId } = req.body || {};
  if (!username || !email || !password) {
    throw new ApiError(400, "username, email and password are required");
  }
  if (!ROLES.includes(role)) throw new ApiError(400, `role must be one of: ${ROLES.join(", ")}`);
  if (role === "contact" && !contactId) {
    throw new ApiError(400, "contactId is required for contact (portal) users");
  }
  if (contactId) {
    const [contact] = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.id, contactId));
    if (!contact) throw new ApiError(404, "Contact not found");
  }
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) throw new ApiError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash, role, contactId: role === "contact" ? contactId : null })
    .returning();
  res.status(201).json({ user: publicUser(user) });
});

const listUsers = asyncHandler(async (req, res) => {
  const rows = await db.select().from(users);
  res.json(rows.map(publicUser));
});

module.exports = { register, login, me, createUser, listUsers };
