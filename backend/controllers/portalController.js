const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const { invoices, payments } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordPayment } = require("../services/paymentService");
const { createDraft, postInvoice } = require("../services/invoiceService");
const { round2 } = require("../utils/money");
const { contacts } = require("../db/schema");

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

const checkoutStore = asyncHandler(async (req, res) => {
  const { cartItems, paymentAmount, paymentMethod = "bank" } = req.body || {};
  
  // 1. Verify user is a customer
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, req.user.contactId));
  if (!contact) throw new ApiError(404, "Linked contact not found");
  if (contact.type !== "customer" && contact.type !== "both") {
    throw new ApiError(403, "Only customers can use the storefront checkout");
  }
  
  if (!cartItems || !cartItems.length) throw new ApiError(400, "Cart is empty");
  
  // 2. Create the draft sales invoice
  const today = new Date().toISOString().split("T")[0];
  const draft = await createDraft({
    kind: "invoice",
    contactId: req.user.contactId,
    date: today,
    dueDate: today,
    lines: cartItems,
  });
  
  // 3. Auto-post the invoice (since it's a direct web sale)
  const posted = await postInvoice({ invoiceId: draft.id, userId: req.user.id });
  
  // 4. Record the payment if one was made
  let paymentRecord = null;
  if (paymentAmount > 0) {
    paymentRecord = await recordPayment({
      invoiceId: posted.invoice.id,
      amount: paymentAmount,
      method: paymentMethod,
      userId: req.user.id,
    });
  }
  
  res.status(201).json({ invoice: posted.invoice, payment: paymentRecord });
});

module.exports = { listMyDocuments, getMyDocument, payMyDocument, checkoutStore };
