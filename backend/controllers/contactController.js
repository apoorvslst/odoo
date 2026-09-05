const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { contacts, invoices } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { CONTACT_TYPES } = require("../utils/constants");

const FIELDS = ["name", "type", "email", "mobile", "city", "state", "pincode", "profileImage"];

const list = asyncHandler(async (req, res) => {
  const { type, archived } = req.query;
  if (type && !CONTACT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${CONTACT_TYPES.join(", ")}`);
  }
  const conditions = [];
  if (type) conditions.push(eq(contacts.type, type));
  // Archived master data is hidden by default, not deleted.
  if (archived !== "true") conditions.push(eq(contacts.isArchived, false));
  const rows = conditions.length
    ? await db.select().from(contacts).where(and(...conditions)).orderBy(contacts.id)
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

module.exports = { list, create, getById, update, archive, remove };
