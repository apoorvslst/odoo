const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { analyticAccounts } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { ANALYTIC_TYPES } = require("../utils/constants");

const list = asyncHandler(async (req, res) => {
  const rows = await db.select().from(analyticAccounts).orderBy(analyticAccounts.id);
  res.json(rows);
});

const create = asyncHandler(async (req, res) => {
  const { name, type } = req.body || {};
  if (!name || !type) throw new ApiError(400, "name and type are required");
  if (!ANALYTIC_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${ANALYTIC_TYPES.join(", ")}`);
  }
  const [row] = await db.insert(analyticAccounts).values({ name, type }).returning();
  res.status(201).json(row);
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(analyticAccounts).where(eq(analyticAccounts.id, id));
  if (!row) throw new ApiError(404, "Analytic account not found");
  const { name, type } = req.body || {};
  if (type && !ANALYTIC_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${ANALYTIC_TYPES.join(", ")}`);
  }
  const [updated] = await db
    .update(analyticAccounts)
    .set({ name: name ?? row.name, type: type ?? row.type })
    .where(eq(analyticAccounts.id, id))
    .returning();
  res.json(updated);
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(analyticAccounts).where(eq(analyticAccounts.id, id));
  if (!row) throw new ApiError(404, "Analytic account not found");
  await db.delete(analyticAccounts).where(eq(analyticAccounts.id, id));
  res.status(204).end();
});

module.exports = { list, create, update, remove };
