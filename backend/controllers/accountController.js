const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { accounts, transactionLines, invoiceLines } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { ACCOUNT_TYPES } = require("../utils/constants");

async function hasActivity(accountId) {
  const [tl] = await db
    .select({ id: transactionLines.id })
    .from(transactionLines)
    .where(eq(transactionLines.accountId, accountId))
    .limit(1);
  if (tl) return true;
  const [il] = await db.select({ id: invoiceLines.id }).from(invoiceLines).where(eq(invoiceLines.accountId, accountId)).limit(1);
  return Boolean(il);
}

const list = asyncHandler(async (req, res) => {
  const { type, archived } = req.query;
  if (type && !ACCOUNT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${ACCOUNT_TYPES.join(", ")}`);
  }
  // type or archived ko query se le rhae hain
  const conditions = [];
  if (type)   conditions.push(eq(accounts.type, type));
  if (archived !== "true") conditions.push(eq(accounts.isArchived, false));
  // yahan pe hum conditions laga rhae hain 
  const rows = conditions.length
    ? await db.select().from(accounts).where(and(...conditions)).orderBy(accounts.accountCode)
    : await db.select().from(accounts).orderBy(accounts.accountCode);
    // yahan pe hum account code ko sort kr rhae hain 
  res.json(rows.map((a) => ({ ...a, balance: Number(a.balance) })));
});

const create = asyncHandler(async (req, res) => {
  const { accountCode, accountName, type } = req.body || {};
  if (!accountCode || !accountName || !type) {
    throw new ApiError(400, "accountCode, accountName and type are required");
  }
  if (!ACCOUNT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${ACCOUNT_TYPES.join(", ")}`);
  }
  const [dup] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.accountCode, accountCode));
  if (dup) throw new ApiError(409, `Account code ${accountCode} already exists`);

  const [account] = await db.insert(accounts).values({ accountCode, accountName, type }).returning();
  res.status(201).json(account);
});

const getById = asyncHandler(async (req, res) => {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, Number(req.params.id)));
  if (!account) throw new ApiError(404, "Account not found");
  res.json({ ...account, balance: Number(account.balance) });
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
  if (!account) throw new ApiError(404, "Account not found");

  const { accountName, type } = req.body || {};
  if (type && !ACCOUNT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${ACCOUNT_TYPES.join(", ")}`);
  }
  // Type decides which side grows the balance; flipping after activity corrupts history.
  if (type && type !== account.type && (await hasActivity(id))) {
    throw new ApiError(409, "Account type is locked once the account has activity");
  }
// agar type change hoga and account me koi transaction lines hain toh error ayegi kyuki pehle uske saare transactions update krne honge baad me type change kr skte
  const [updated] = await db
    .update(accounts)
    .set({ accountName: accountName ?? account.accountName, type: type ?? account.type })
    .where(eq(accounts.id, id))
    .returning();
  res.json(updated);
});
// updated naam ke array me store hoga
const archive = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
  if (!account) throw new ApiError(404, "Account not found");
  const [updated] = await db.update(accounts).set({ isArchived: !account.isArchived }).where(eq(accounts.id, id)).returning();
  res.json(updated);
});

// it can remove account
const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
  if (!account) throw new ApiError(404, "Account not found");

  if (await hasActivity(id)) {
    throw new ApiError(409, "Account has activity - archive it instead of deleting");
  }

  await db.delete(accounts).where(eq(accounts.id, id));
  res.status(204).end();
});

module.exports = { list, create, getById, update, archive, remove };
