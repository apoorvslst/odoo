const bcrypt = require("bcryptjs");
const { eq, and, sql } = require("drizzle-orm");
const { db } = require("../db");
const { contacts, users, invoices } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { CONTACT_TYPES, CONTACT_STATUSES } = require("../utils/constants");

const FIELDS = ["name", "type", "email", "mobile", "city", "state", "pincode", "profileImage"];

const list = asyncHandler(async (req, res) => {
  const { type, status, archived, page, limit } = req.query;
  if (type && !CONTACT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${CONTACT_TYPES.join(", ")}`);
  }
  if (status && !CONTACT_STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${CONTACT_STATUSES.join(", ")}`);
  }
  const conditions = [];
  if (type) conditions.push(eq(contacts.type, type));
  if (status) conditions.push(eq(contacts.status, status));
  // Archived master data is hidden by default, not deleted.
  if (archived !== "true") conditions.push(eq(contacts.isArchived, false));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const [{ count }] = whereClause
      ? await db.select({ count: sql`count(*)` }).from(contacts).where(whereClause)
      : await db.select({ count: sql`count(*)` }).from(contacts);

    const total = Number(count);
    const query = db.select().from(contacts);
    if (whereClause) query.where(whereClause);
    const rows = await query.orderBy(contacts.id).limit(limitNum).offset(offset);

    return res.json({
      data: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  const rows = whereClause
    ? await db.select().from(contacts).where(whereClause).orderBy(contacts.id)
    : await db.select().from(contacts).orderBy(contacts.id);
  res.json(rows);
});

const create = asyncHandler(async (req, res) => {
  const { name, type } = req.body || {};
  if (!name || !type) throw new ApiError(400, "name and type are required");
  if (!CONTACT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${CONTACT_TYPES.join(", ")}`);
  }
  const values = {};
  for (const f of FIELDS) if (req.body[f] !== undefined) values[f] = req.body[f];
  const [contact] = await db.insert(contacts).values(values).returning();
  res.status(201).json(contact);
});

const getById = asyncHandler(async (req, res) => {
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, Number(req.params.id)));
  if (!contact) throw new ApiError(404, "Contact not found");
  res.json(contact);
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) throw new ApiError(404, "Contact not found");

  if (req.body.type && !CONTACT_TYPES.includes(req.body.type)) {
    throw new ApiError(400, `type must be one of: ${CONTACT_TYPES.join(", ")}`);
  }
  const values = {};
  for (const f of FIELDS) if (req.body[f] !== undefined) values[f] = req.body[f];
  const [updated] = await db.update(contacts).set(values).where(eq(contacts.id, id)).returning();
  res.json(updated);
});

const archive = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) throw new ApiError(404, "Contact not found");
  const [updated] = await db
    .update(contacts)
    .set({ isArchived: !contact.isArchived })
    .where(eq(contacts.id, id))
    .returning();
  res.json(updated);
});

// Delete is only allowed for master data with no activity; otherwise archive.
const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) throw new ApiError(404, "Contact not found");

  const [invoice] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.contactId, id)).limit(1);
  if (invoice) throw new ApiError(409, "Contact has documents - archive it instead of deleting");

  await db.delete(contacts).where(eq(contacts.id, id));
  res.status(204).end();
});

// Two-step onboarding: Customer/Vendor self-registration through public portal
const registerPortal = asyncHandler(async (req, res) => {
  const { name, type = "customer", email, mobile, city, state, pincode, password } = req.body || {};
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }
  if (type && !["customer", "vendor"].includes(type)) {
    throw new ApiError(400, "type must be 'customer' or 'vendor'");
  }
  if (String(password).length < 6) {
    throw new ApiError(400, "password must be at least 6 characters");
  }

  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existingUser) throw new ApiError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.transaction(async (tx) => {
    const [contact] = await tx
      .insert(contacts)
      .values({
        name,
        type,
        email,
        mobile: mobile || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        status: "pending_approval",
      })
      .returning();

    const [user] = await tx
      .insert(users)
      .values({
        username: name,
        email,
        passwordHash,
        role: "contact",
        contactId: contact.id,
      })
      .returning();

    return { contact, user };
  });

  res.status(201).json({
    message: "Registration submitted successfully. Your account is pending accountant approval.",
    contactId: result.contact.id,
    status: result.contact.status,
  });
});

// Accountant vetting: approve a pending contact
const approve = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) throw new ApiError(404, "Contact not found");

  const [updated] = await db
    .update(contacts)
    .set({ status: "active" })
    .where(eq(contacts.id, id))
    .returning();

  res.json(updated);
});

// Accountant vetting: reject a contact
const reject = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) throw new ApiError(404, "Contact not found");

  const [updated] = await db
    .update(contacts)
    .set({ status: "rejected" })
    .where(eq(contacts.id, id))
    .returning();

  res.json(updated);
});

module.exports = { list, create, getById, update, archive, remove, registerPortal, approve, reject };
