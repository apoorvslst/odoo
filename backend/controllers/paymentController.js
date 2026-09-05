const { eq, desc } = require("drizzle-orm");
const { db } = require("../db");
const { payments, invoices, contacts, journals } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordPayment } = require("../services/paymentService");

const createForInvoice = asyncHandler(async (req, res) => {
  const { amount, method, date } = req.body || {};
  const payment = await recordPayment({
    invoiceId: Number(req.params.id),
    amount,
    method,
    date,
    userId: req.user.id,
  });
  res.status(201).json(payment);
});

const listAll = asyncHandler(async (req, res) => {
  const rows = await db
    .select({
      id: payments.id,
      invoiceId: payments.invoiceId,
      invoiceKind: invoices.kind,
      transactionId: payments.transactionId,
      journalId: payments.journalId,
      journalName: journals.name,
      date: payments.date,
      amount: payments.amount,
      method: payments.method,
      contactId: invoices.contactId,
      contactName: contacts.name,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(contacts, eq(contacts.id, invoices.contactId))
    .innerJoin(journals, eq(journals.id, payments.journalId))
    .orderBy(desc(payments.id));
  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
});

const listForInvoice = asyncHandler(async (req, res) => {
  const invoiceId = Number(req.params.id);
  const [invoice] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) throw new ApiError(404, "Document not found");

  const rows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(payments.id);
  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
});

module.exports = { createForInvoice, listAll, listForInvoice };
