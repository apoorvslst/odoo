const { eq, and, gte, lte, sql } = require("drizzle-orm");
const { db } = require("../db");
const { budgets, budgetLines, analyticAccounts, users, invoices, invoiceLines } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { round2, money } = require("../utils/money");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const list = asyncHandler(async (req, res) => {
  const rows = await db
    .select({
      id: budgets.id,
      name: budgets.name,
      startDate: budgets.startDate,
      endDate: budgets.endDate,
      responsibleId: budgets.responsibleId,
      responsibleName: users.username,
    })
    .from(budgets)
    .leftJoin(users, eq(users.id, budgets.responsibleId))
    .orderBy(budgets.id);
  res.json(rows);
});

const create = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, responsibleId, lines } = req.body || {};
  if (!name || !startDate || !endDate || !responsibleId) {
    throw new ApiError(400, "name, startDate, endDate and responsibleId are required");
  }
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) throw new ApiError(400, "dates must be YYYY-MM-DD");
  if (endDate < startDate) throw new ApiError(400, "endDate cannot be before startDate");
  if (!Array.isArray(lines) || lines.length === 0) throw new ApiError(400, "Budget needs at least one line");

  const [responsible] = await db.select({ id: users.id }).from(users).where(eq(users.id, responsibleId));
  if (!responsible) throw new ApiError(404, "Responsible user not found");

  const analyticIds = [...new Set(lines.map((l) => l.analyticAccountId))];
  for (const aid of analyticIds) {
    const [a] = await db.select({ id: analyticAccounts.id }).from(analyticAccounts).where(eq(analyticAccounts.id, aid));
    if (!a) throw new ApiError(400, `Analytic account ${aid} does not exist`);
  }

  const created = await db.transaction(async (tx) => {
    const [budget] = await tx.insert(budgets).values({ name, startDate, endDate, responsibleId }).returning();
    await tx.insert(budgetLines).values(
      lines.map((l) => {
        const planned = round2(l.plannedAmount);
        if (!(planned >= 0)) throw new ApiError(400, "plannedAmount must be zero or positive");
        return { budgetId: budget.id, analyticAccountId: l.analyticAccountId, plannedAmount: money(planned) };
      })
    );
    return budget;
  });

  res.status(201).json(created);
});

const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [budget] = await db
    .select({
      id: budgets.id,
      name: budgets.name,
      startDate: budgets.startDate,
      endDate: budgets.endDate,
      responsibleId: budgets.responsibleId,
      responsibleName: users.username,
    })
    .from(budgets)
    .leftJoin(users, eq(users.id, budgets.responsibleId))
    .where(eq(budgets.id, id));
  if (!budget) throw new ApiError(404, "Budget not found");

  const lines = await db
    .select({
      id: budgetLines.id,
      analyticAccountId: budgetLines.analyticAccountId,
      analyticName: analyticAccounts.name,
      analyticType: analyticAccounts.type,
      plannedAmount: budgetLines.plannedAmount,
    })
    .from(budgetLines)
    .innerJoin(analyticAccounts, eq(analyticAccounts.id, budgetLines.analyticAccountId))
    .where(eq(budgetLines.budgetId, id));

  res.json({ ...budget, lines: lines.map((l) => ({ ...l, plannedAmount: Number(l.plannedAmount) })) });
});

// Budget report: planned vs actual. Actuals come from POSTED document lines
// tagged with the analytic account, dated inside the budget period
// (income analytics <- customer invoices, expense analytics <- vendor bills).
const report = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
  if (!budget) throw new ApiError(404, "Budget not found");

  const lines = await db
    .select({
      id: budgetLines.id,
      analyticAccountId: budgetLines.analyticAccountId,
      analyticName: analyticAccounts.name,
      analyticType: analyticAccounts.type,
      plannedAmount: budgetLines.plannedAmount,
    })
    .from(budgetLines)
    .innerJoin(analyticAccounts, eq(analyticAccounts.id, budgetLines.analyticAccountId))
    .where(eq(budgetLines.budgetId, id));

  const rows = [];
  for (const line of lines) {
    const [{ actual }] = await db
      .select({
        actual: sql`COALESCE(SUM((${invoiceLines.quantity} * ${invoiceLines.unitPrice})::numeric), 0)`,
      })
      .from(invoiceLines)
      .innerJoin(invoices, eq(invoices.id, invoiceLines.invoiceId))
      .where(
        and(
          eq(invoiceLines.analyticAccountId, line.analyticAccountId),
          eq(invoices.kind, line.analyticType === "income" ? "invoice" : "bill"),
          gte(invoices.date, budget.startDate),
          lte(invoices.date, budget.endDate),
          sql`${invoices.transactionId} IS NOT NULL`
        )
      );

    const planned = round2(line.plannedAmount);
    const actualRounded = round2(actual);
    rows.push({
      analyticAccountId: line.analyticAccountId,
      analyticName: line.analyticName,
      analyticType: line.analyticType,
      planned,
      actual: actualRounded,
      // For income: over-achievement is good. For expense: underspend is good.
      variance: line.analyticType === "income" ? round2(actualRounded - planned) : round2(planned - actualRounded),
      achievementPct: planned > 0 ? round2((actualRounded / planned) * 100) : null,
    });
  }

  res.json({
    budget: { id: budget.id, name: budget.name, startDate: budget.startDate, endDate: budget.endDate },
    lines: rows,
    totals: {
      planned: round2(rows.reduce((s, r) => s + r.planned, 0)),
      actual: round2(rows.reduce((s, r) => s + r.actual, 0)),
    },
  });
});

module.exports = { list, create, getById, report };
