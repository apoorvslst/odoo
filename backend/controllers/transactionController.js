const { eq, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const { transactions, transactionLines, users, accounts, journals } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { postJournalEntry } = require("../services/journalService");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Manual journal entry - the raw write door into the ledger.
const create = asyncHandler(async (req, res) => {
  const { journalId, date, description, reference, lines } = req.body || {};
  if (!date || !ISO_DATE.test(date)) throw new ApiError(400, "date is required (YYYY-MM-DD)");

  const entry = await postJournalEntry({
    journalId,
    date,
    description,
    reference,
    createdBy: req.user.id,
    lines,
  });
  res.status(201).json(entry);
});

const list = asyncHandler(async (req, res) => {
  const rows = await db
    .select({
      id: transactions.id,
      journalId: transactions.journalId,
      journalName: journals.name,
      journalType: journals.type,
      date: transactions.date,
      description: transactions.description,
      reference: transactions.reference,
      createdBy: transactions.createdBy,
      createdByUsername: users.username,
      total: sql`COALESCE(SUM(${transactionLines.debit}), 0)`,
    })
    .from(transactions)
    .innerJoin(journals, eq(journals.id, transactions.journalId))
    .leftJoin(users, eq(users.id, transactions.createdBy))
    .leftJoin(transactionLines, eq(transactionLines.transactionId, transactions.id))
    .groupBy(transactions.id, journals.name, journals.type, users.username)
    .orderBy(desc(transactions.id));
  res.json(rows.map((r) => ({ ...r, total: Number(r.total) })));
});

const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [txn] = await db
    .select({
      id: transactions.id,
      journalId: transactions.journalId,
      journalName: journals.name,
      journalType: journals.type,
      date: transactions.date,
      description: transactions.description,
      reference: transactions.reference,
      createdBy: transactions.createdBy,
      createdByUsername: users.username,
    })
    .from(transactions)
    .innerJoin(journals, eq(journals.id, transactions.journalId))
    .leftJoin(users, eq(users.id, transactions.createdBy))
    .where(eq(transactions.id, id));
  if (!txn) throw new ApiError(404, "Transaction not found");

  const lines = await db
    .select({
      id: transactionLines.id,
      accountId: transactionLines.accountId,
      accountCode: accounts.accountCode,
      accountName: accounts.accountName,
      debit: transactionLines.debit,
      credit: transactionLines.credit,
    })
    .from(transactionLines)
    .innerJoin(accounts, eq(accounts.id, transactionLines.accountId))
    .where(eq(transactionLines.transactionId, id));

  res.json({
    ...txn,
    lines: lines.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
  });
});

module.exports = { create, list, getById };
