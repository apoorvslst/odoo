const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const { invoices, payments } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordPayment } = require("../services/paymentService");
const { round2 } = require("../utils/money");

// Portal = what a contact user sees. Everything is scoped to req.user.contactId
// (from the JWT), so a contact can never touch another contact's documents.

const listMyDocuments = asyncHandler(async (req, res) => {
  const { kind } = req.query;
  const conditions = [eq(invoices.contactId, req.user.contactId)];
  if (kind) conditions.push(eq(invoices.kind, kind));

  const rows = await db
    .select({
      id: invoices.id,
      kind: invoices.kind,
      date: invoices.date,
      dueDate: invoices.dueDate,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(...conditions))
    .groupBy(invoices.id)
    .orderBy(desc(invoices.id));

  res.json(
    rows.map((r) => ({
      ...r,
      totalAmount: Number(r.totalAmount),
      paid: round2(Number(r.paid)),
      balanceDue: round2(Number(r.totalAmount) - Number(r.paid)),
    }))
  );
});

const getMyDocument = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.contactId, req.user.contactId)));
  if (!invoice) throw new ApiError(404, "Document not found");

  const docPayments = await db.select().from(payments).where(eq(payments.invoiceId, id)).orderBy(payments.id);
  const paid = round2(docPayments.reduce((s, p) => s + Number(p.amount), 0));

  res.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    payments: docPayments.map((p) => ({ ...p, amount: Number(p.amount) })),
    paid,
    balanceDue: round2(Number(invoice.totalAmount) - paid),
  });
});

// A contact paying their own invoice goes through the exact same payment
// service as the back office - same journal entry, same status logic.
const payMyDocument = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [invoice] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.contactId, req.user.contactId)));
  if (!invoice) throw new ApiError(404, "Document not found");

  const { amount, method = "bank" } = req.body || {};
  const payment = await recordPayment({
    invoiceId: id,
    amount,
    method,
    userId: req.user.id,
  });
  res.status(201).json(payment);
});

module.exports = { listMyDocuments, getMyDocument, payMyDocument };
