const { eq, and, gte, lte, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const { accounts, transactions, transactionLines, invoices, payments, journals } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { DEBIT_NORMAL_TYPES, SYSTEM_ACCOUNTS } = require("../utils/constants");
const { round2 } = require("../utils/money");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function dateRange(query) {
  const { from, to } = query;
  if (from && !ISO_DATE.test(from)) throw new ApiError(400, "from must be YYYY-MM-DD");
  if (to && !ISO_DATE.test(to)) throw new ApiError(400, "to must be YYYY-MM-DD");
  return { from, to };
}

// Single source for all financial reports: debit/credit sums per account over
// transaction_lines (joined to transactions for the date filter). The reports
// recompute from the ledger; accounts.balance is only a cache.
async function aggregateByAccount({ from, to } = {}) {
  const conditions = [];
  if (from) conditions.push(gte(transactions.date, from));
  if (to) conditions.push(lte(transactions.date, to));
  const rows = await db
    .select({
      accountId: transactionLines.accountId,
      debit: sql`COALESCE(SUM(${transactionLines.debit}), 0)`,
      credit: sql`COALESCE(SUM(${transactionLines.credit}), 0)`,
    })
    .from(transactionLines)
    .innerJoin(transactions, eq(transactions.id, transactionLines.transactionId))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(transactionLines.accountId);
  return new Map(rows.map((r) => [r.accountId, { debit: Number(r.debit), credit: Number(r.credit) }]));
}

const normalBalance = (type, { debit, credit }) =>
  DEBIT_NORMAL_TYPES.includes(type) ? debit - credit : credit - debit;

const trialBalance = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const [all, agg] = await Promise.all([
    db.select().from(accounts).orderBy(accounts.accountCode),
    aggregateByAccount(range),
  ]);

  let totalDebit = 0;
  let totalCredit = 0;
  const rows = all.map((a) => {
    const sums = agg.get(a.id) || { debit: 0, credit: 0 };
    totalDebit = round2(totalDebit + sums.debit);
    totalCredit = round2(totalCredit + sums.credit);
    return {
      id: a.id,
      accountCode: a.accountCode,
      accountName: a.accountName,
      type: a.type,
      debit: round2(sums.debit),
      credit: round2(sums.credit),
      balance: round2(normalBalance(a.type, sums)),
    };
  });

  res.json({ ...range, rows, totals: { debit: totalDebit, credit: totalCredit, balanced: totalDebit === totalCredit } });
});

// P&L: Income (sales) minus Expenses (purchases + others) = net profit.
const profitLoss = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const [all, agg] = await Promise.all([
    db.select().from(accounts).orderBy(accounts.accountCode),
    aggregateByAccount(range),
  ]);

  const build = (type) =>
    all
      .filter((a) => a.type === type)
      .map((a) => ({
        id: a.id,
        accountCode: a.accountCode,
        accountName: a.accountName,
        amount: round2(normalBalance(a.type, agg.get(a.id) || { debit: 0, credit: 0 })),
      }));

  const income = build("Income");
  const expenses = build("Expense");
  const totalIncome = round2(income.reduce((s, r) => s + r.amount, 0));
  const totalExpenses = round2(expenses.reduce((s, r) => s + r.amount, 0));

  res.json({
    ...range,
    income: { accounts: income, total: totalIncome },
    expenses: { accounts: expenses, total: totalExpenses },
    netProfit: round2(totalIncome - totalExpenses),
  });
});

// Balance Sheet: Assets = Liabilities + Capital (incl. current net profit).
const balanceSheet = asyncHandler(async (req, res) => {
  const { asof } = req.query;
  if (asof && !ISO_DATE.test(asof)) throw new ApiError(400, "asof must be YYYY-MM-DD");
  const range = asof ? { to: asof } : {};

  const [all, agg] = await Promise.all([
    db.select().from(accounts).orderBy(accounts.accountCode),
    aggregateByAccount(range),
  ]);

  const section = (type) => {
    const list = all
      .filter((a) => a.type === type)
      .map((a) => ({
        id: a.id,
        accountCode: a.accountCode,
        accountName: a.accountName,
        balance: round2(normalBalance(a.type, agg.get(a.id) || { debit: 0, credit: 0 })),
      }));
    return { accounts: list, total: round2(list.reduce((s, r) => s + r.balance, 0)) };
  };

  const assets = section("Asset");
  const liabilities = section("Liability");
  const capital = section("Capital");

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const a of all) {
    const bal = normalBalance(a.type, agg.get(a.id) || { debit: 0, credit: 0 });
    if (a.type === "Income") totalIncome = round2(totalIncome + bal);
    if (a.type === "Expense") totalExpenses = round2(totalExpenses + bal);
  }
  const netProfit = round2(totalIncome - totalExpenses);
  const capitalWithEarnings = round2(capital.total + netProfit);

  res.json({
    asof: asof || null,
    assets,
    liabilities,
    capital: { ...capital, netProfit, totalWithEarnings: capitalWithEarnings },
    check: {
      equation: "Assets = Liabilities + Capital (incl. net profit)",
      holds: assets.total === round2(liabilities.total + capitalWithEarnings),
    },
  });
});

const ledger = asyncHandler(async (req, res) => {
  const accountId = Number(req.params.accountId);
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account) throw new ApiError(404, "Account not found");

  const range = dateRange(req.query);
  const conditions = [eq(transactionLines.accountId, accountId)];
  if (range.from) conditions.push(gte(transactions.date, range.from));
  if (range.to) conditions.push(lte(transactions.date, range.to));

  const rows = await db
    .select({
      lineId: transactionLines.id,
      transactionId: transactions.id,
      journalName: journals.name,
      date: transactions.date,
      description: transactions.description,
      reference: transactions.reference,
      debit: transactionLines.debit,
      credit: transactionLines.credit,
    })
    .from(transactionLines)
    .innerJoin(transactions, eq(transactions.id, transactionLines.transactionId))
    .innerJoin(journals, eq(journals.id, transactions.journalId))
    .where(and(...conditions))
    .orderBy(transactions.date, transactions.id, transactionLines.id);

  let running = 0;
  const entries = rows.map((r) => {
    const delta = normalBalance(account.type, { debit: Number(r.debit), credit: Number(r.credit) });
    running = round2(running + delta);
    return { ...r, debit: Number(r.debit), credit: Number(r.credit), runningBalance: running };
  });

  res.json({ account: { ...account, balance: Number(account.balance) }, entries, closingBalance: running });
});

const dashboard = asyncHandler(async (req, res) => {
  const [all, agg] = await Promise.all([db.select().from(accounts), aggregateByAccount()]);

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const a of all) {
    const bal = normalBalance(a.type, agg.get(a.id) || { debit: 0, credit: 0 });
    if (a.type === "Income") totalIncome = round2(totalIncome + bal);
    if (a.type === "Expense") totalExpenses = round2(totalExpenses + bal);
  }

  const balOf = (code) => {
    const acc = all.find((a) => a.accountCode === code);
    return acc ? Number(acc.balance) : 0;
  };

  const docRows = await db
    .select({
      id: invoices.id,
      kind: invoices.kind,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .groupBy(invoices.id);

  const byStatus = {};
  let receivable = 0;
  let payable = 0;
  for (const doc of docRows) {
    byStatus[`${doc.kind}:${doc.status}`] = (byStatus[`${doc.kind}:${doc.status}`] || 0) + 1;
    const due = round2(Number(doc.totalAmount) - Number(doc.paid));
    if (doc.status === "posted" || doc.status === "partial") {
      if (doc.kind === "invoice") receivable = round2(receivable + due);
      else payable = round2(payable + due);
    }
  }

  const recentTransactions = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      reference: transactions.reference,
      journalName: journals.name,
    })
    .from(transactions)
    .innerJoin(journals, eq(journals.id, transactions.journalId))
    .orderBy(desc(transactions.id))
    .limit(5);

  res.json({
    income: totalIncome,
    expenses: totalExpenses,
    netProfit: round2(totalIncome - totalExpenses),
    cashBalance: balOf(SYSTEM_ACCOUNTS.CASH),
    bankBalance: balOf(SYSTEM_ACCOUNTS.BANK),
    debtorsBalance: balOf(SYSTEM_ACCOUNTS.DEBTORS),
    creditorsBalance: balOf(SYSTEM_ACCOUNTS.CREDITORS),
    outstanding: { receivable, payable },
    documents: { byStatus },
    recentTransactions,
  });
});

module.exports = { trialBalance, profitLoss, balanceSheet, ledger, dashboard };
