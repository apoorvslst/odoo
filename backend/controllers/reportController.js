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

  // Derive Section 43B(h) MSME risk summary for dashboard
  const today = new Date();
  const billRows = await db
    .select({
      id: invoices.id,
      date: invoices.date,
      totalAmount: invoices.totalAmount,
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(eq(invoices.kind, "bill"), sql`${invoices.transactionId} IS NOT NULL`))
    .groupBy(invoices.id);

  let msmeOverdueAmount = 0;
  let msmeOverdueCount = 0;
  for (const b of billRows) {
    const unpaid = round2(Number(b.totalAmount) - Number(b.paid));
    if (unpaid > 0) {
      const billDate = new Date(b.date);
      const ageDays = Math.floor((today.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays > 45) {
        msmeOverdueAmount = round2(msmeOverdueAmount + unpaid);
        msmeOverdueCount++;
      }
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
    msmeRisk: {
      overdueCount: msmeOverdueCount,
      overdueAmount: msmeOverdueAmount,
      potentialTaxHit: round2(msmeOverdueAmount * 0.30),
      hasRisk: msmeOverdueAmount > 0,
    },
  });
});

// Indian Furniture GST & Tax Analytics Report (Chapter 94 HSN 9401 & 9403)
// + Section 43B(h) MSME 45-Day Disallowance & 30% Tax Penalty Exposure
const taxReport = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  const conditions = [sql`${invoices.transactionId} IS NOT NULL`];
  if (range.from) conditions.push(gte(invoices.date, range.from));
  if (range.to) conditions.push(lte(invoices.date, range.to));

  const docRows = await db
    .select({
      id: invoices.id,
      kind: invoices.kind,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      date: invoices.date,
    })
    .from(invoices)
    .where(and(...conditions));

  let outputTax = 0; // Tax collected from customers on sales (Output GST)
  let inputTax = 0;  // Tax paid to vendors on material/wood purchases (Input Tax Credit - ITC)
  let taxableSales = 0;
  let taxablePurchases = 0;

  for (const doc of docRows) {
    const tax = Number(doc.taxAmount);
    const sub = Number(doc.subtotal);
    if (doc.kind === "invoice") {
      outputTax = round2(outputTax + tax);
      taxableSales = round2(taxableSales + sub);
    } else {
      inputTax = round2(inputTax + tax);
      taxablePurchases = round2(taxablePurchases + sub);
    }
  }

  // Under Indian GST: Net Tax = Output GST - Input Tax Credit (ITC)
  const netGstPayable = round2(Math.max(0, outputTax - inputTax));
  const excessItcCarriedForward = round2(Math.max(0, inputTax - outputTax));

  // --- Section 43B(h) MSME Overdue & 30% Tax Disallowance Exposure ---
  const { contacts } = require("../db/schema");
  const today = new Date();

  // Fetch all active vendor bills and their paid amounts
  const allBills = await db
    .select({
      id: invoices.id,
      contactId: invoices.contactId,
      vendorName: contacts.name,
      date: invoices.date,
      dueDate: invoices.dueDate,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .innerJoin(contacts, eq(contacts.id, invoices.contactId))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(eq(invoices.kind, "bill"), sql`${invoices.transactionId} IS NOT NULL`))
    .groupBy(invoices.id, contacts.name);

  let overdue45Amount = 0;
  let overdue45Count = 0;
  let approachingAmount = 0;
  let approachingCount = 0;
  let safeAmount = 0;
  let safeCount = 0;

  const billBreakdown = [];

  for (const bill of allBills) {
    const total = Number(bill.totalAmount);
    const paid = Number(bill.paid);
    const unpaid = round2(total - paid);

    if (unpaid > 0) {
      const billDate = new Date(bill.date);
      const ageDays = Math.max(0, Math.floor((today.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      let complianceStatus = "safe";
      if (ageDays > 45) {
        complianceStatus = "critical_overdue";
        overdue45Amount = round2(overdue45Amount + unpaid);
        overdue45Count++;
      } else if (ageDays > 15) {
        complianceStatus = "approaching_limit";
        approachingAmount = round2(approachingAmount + unpaid);
        approachingCount++;
      } else {
        safeAmount = round2(safeAmount + unpaid);
        safeCount++;
      }

      billBreakdown.push({
        id: bill.id,
        billNumber: `BILL-${String(bill.id).padStart(4, "0")}`,
        vendorName: bill.vendorName,
        date: bill.date,
        dueDate: bill.dueDate,
        totalAmount: total,
        paidAmount: paid,
        unpaidAmount: unpaid,
        ageDays,
        complianceStatus, // critical_overdue (>45d) | approaching_limit (16-45d) | safe (<=15d)
        taxPenaltyExposure: complianceStatus === "critical_overdue" ? round2(unpaid * 0.30) : 0,
      });
    }
  }

  // Sort bills: critical ones on top, then highest unpaid
  billBreakdown.sort((a, b) => b.ageDays - a.ageDays);

  const section43bRisk = {
    totalUnpaidVendorBills: round2(overdue45Amount + approachingAmount + safeAmount),
    overdue45DaysAmount: overdue45Amount,
    overdue45DaysCount: overdue45Count,
    potentialTaxPenalty: round2(overdue45Amount * 0.30), // 30% corporate/business tax disallowance hit
    approachingAmount,
    approachingCount,
    safeAmount,
    safeCount,
    statutoryLimitDays: 45,
    taxDisallowanceRate: 30, // 30%
    bills: billBreakdown,
  };

  res.json({
    period: range,
    summary: {
      taxableSales,
      outputGst: outputTax,
      outputCgst: round2(outputTax / 2),
      outputSgst: round2(outputTax / 2),
      taxablePurchases,
      inputGstCredit: inputTax,
      inputCgstCredit: round2(inputTax / 2),
      inputSgstCredit: round2(inputTax / 2),
      netGstPayable,
      excessItcCarriedForward,
    },
    furnitureHsnRates: [
      { hsn: "9403", description: "Wooden Furniture, Dining Tables, Beds, Desks", rate: 18, cgst: 9, sgst: 9 },
      { hsn: "9401", description: "Chairs, Office Ergonomic Seats, Sofas", rate: 18, cgst: 9, sgst: 9 },
      { hsn: "9403.80", description: "Bamboo / Cane / Handcrafted Furniture", rate: 12, cgst: 6, sgst: 6 },
      { hsn: "9404", description: "Mattresses, Bedding Articles", rate: 18, cgst: 9, sgst: 9 },
    ],
    section43bRisk,
  });
});

module.exports = { trialBalance, profitLoss, balanceSheet, ledger, dashboard, taxReport };
