const { eq, inArray, sql } = require("drizzle-orm");
const { db } = require("../db");
const { transactions, transactionLines, accounts, journals } = require("../db/schema");
const ApiError = require("../utils/apiError");
const { DEBIT_NORMAL_TYPES } = require("../utils/constants");
const { round2, money } = require("../utils/money");

async function getAccountByCode(code, dbOrTx = db) {
  const [account] = await dbOrTx.select().from(accounts).where(eq(accounts.accountCode, code));
  if (!account) {
    throw new ApiError(500, `System account ${code} is missing - run: npm run db:seed`);
  }
  return account;
}

// Journals are resolved by type (sale/purchase/bank/cash); the first journal of
// that type wins. Its default account is what postings hit.
async function getJournalByType(type, dbOrTx = db) {
  const [journal] = await dbOrTx.select().from(journals).where(eq(journals.type, type));
  if (!journal) {
    throw new ApiError(500, `Journal of type '${type}' is missing - run: npm run db:seed`);
  }
  return journal;
}

// The single write door into the ledger: every movement of money is a balanced
// journal entry (SUM(debit) === SUM(credit)), posted atomically with account
// balance updates. Documents (invoices/bills), payments and manual entries all
// go through here - nothing else writes to transactions/transaction_lines.
async function postJournalEntry({ journalId, date, description, reference, createdBy, lines }, dbOrTx = db) {
  if (!journalId) throw new ApiError(400, "journalId is required");
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new ApiError(400, "A journal entry needs at least 2 lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    const debit = round2(line.debit || 0);
    const credit = round2(line.credit || 0);
    if (!line.accountId) throw new ApiError(400, "Every line needs an accountId");
    if (debit < 0 || credit < 0) throw new ApiError(400, "Amounts cannot be negative");
    if ((debit > 0) === (credit > 0)) {
      throw new ApiError(400, "Each line must be either a debit or a credit, not both/neither");
    }
    totalDebit = round2(totalDebit + debit);
    totalCredit = round2(totalCredit + credit);
  }
  if (totalDebit === 0 || totalDebit !== totalCredit) {
    throw new ApiError(400, `Entry is not balanced: debits ${money(totalDebit)} != credits ${money(totalCredit)}`);
  }

  const run = async (tx) => {
    const [journal] = await tx.select({ id: journals.id }).from(journals).where(eq(journals.id, journalId));
    if (!journal) throw new ApiError(400, "Journal does not exist");

    const accountIds = [...new Set(lines.map((l) => l.accountId))];
    const found = await tx.select().from(accounts).where(inArray(accounts.id, accountIds));
    if (found.length !== accountIds.length) {
      throw new ApiError(400, "One or more accounts do not exist");
    }
    const byId = new Map(found.map((a) => [a.id, a]));

    const [txn] = await tx
      .insert(transactions)
      .values({ journalId, date, description, reference, createdBy })
      .returning();

    await tx.insert(transactionLines).values(
      lines.map((l) => ({
        transactionId: txn.id,
        accountId: l.accountId,
        debit: money(l.debit || 0),
        credit: money(l.credit || 0),
      }))
    );

    // Normal balance: Asset/Expense grow by debit; Liability/Income/Capital by credit.
    for (const l of lines) {
      const account = byId.get(l.accountId);
      const signed = DEBIT_NORMAL_TYPES.includes(account.type)
        ? round2((l.debit || 0) - (l.credit || 0))
        : round2((l.credit || 0) - (l.debit || 0));
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${money(signed)}::numeric` })
        .where(eq(accounts.id, account.id));
    }

    return { ...txn, lines };
  };

  // Join the caller's transaction if inside one; otherwise open our own.
  return dbOrTx === db ? db.transaction(run) : run(dbOrTx);
}

module.exports = { postJournalEntry, getAccountByCode, getJournalByType };
