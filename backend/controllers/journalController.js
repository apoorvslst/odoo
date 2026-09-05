const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { journals, accounts } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { JOURNAL_TYPES } = require("../utils/constants");

const list = asyncHandler(async (req, res) => {
  const rows = await db
    .select({
      id: journals.id,
      name: journals.name,
      type: journals.type,
      defaultAccountId: journals.defaultAccountId,
      defaultAccountName: accounts.accountName,
      defaultAccountCode: accounts.accountCode,
    })
    .from(journals)
    .innerJoin(accounts, eq(accounts.id, journals.defaultAccountId))
    .orderBy(journals.id);
  res.json(rows);
});

const create = asyncHandler(async (req, res) => {
  const { name, type, defaultAccountId } = req.body || {};
  if (!name || !type || !defaultAccountId) {
    throw new ApiError(400, "name, type and defaultAccountId are required");
  }
  if (!JOURNAL_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${JOURNAL_TYPES.join(", ")}`);
  }
  const [account] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, defaultAccountId));
  if (!account) throw new ApiError(404, "Default account not found");

  const [journal] = await db.insert(journals).values({ name, type, defaultAccountId }).returning();
  res.status(201).json(journal);
});

module.exports = { list, create };
