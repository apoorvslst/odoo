const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const { invoices, payments, contacts, invoiceLines, products, contactMessages } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordPayment } = require("../services/paymentService");
const { createDraft, postInvoice } = require("../services/invoiceService");
const { sendInvoiceEmail } = require("../services/emailService");
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

const checkoutStore = asyncHandler(async (req, res) => {
  const { cartItems, paymentAmount, paymentMethod = "bank" } = req.body || {};
  
  // 1. Verify user is a customer
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, req.user.contactId));
  if (!contact) throw new ApiError(404, "Linked contact not found");
  if (contact.type !== "customer" && contact.type !== "both") {
    throw new ApiError(403, "Only customers can use the storefront checkout");
  }
  
  if (!cartItems || !cartItems.length) throw new ApiError(400, "Cart is empty");
  
  const today = new Date().toISOString().split("T")[0];
  const invoicePayload = {
    kind: "invoice",
    contactId: req.user.contactId,
    date: today,
    dueDate: today,
    lines: cartItems,
  };

  // 2. Create Draft Invoice (DO NOT POST)
  const draft = await createDraft(invoicePayload);
  
  // 3. Send Email Notification (async, don't wait for it to finish)
  sendInvoiceEmail(draft.id, false).catch(err => console.error("Email failed:", err));
  
  // Return the draft invoice (pending admin approval)
  res.status(201).json({ invoice: draft, payment: null });
});

const listMyLines = asyncHandler(async (req, res) => {
  const rows = await db
    .select({
      id: invoiceLines.id,
      date: invoices.date,
      invoiceId: invoices.id,
      productName: products.name,
      description: invoiceLines.description,
      quantity: invoiceLines.quantity,
      unitPrice: invoiceLines.unitPrice,
      total: sql`(${invoiceLines.quantity} * ${invoiceLines.unitPrice})`
    })
    .from(invoiceLines)
    .innerJoin(invoices, eq(invoices.id, invoiceLines.invoiceId))
    .leftJoin(products, eq(products.id, invoiceLines.productId))
    .where(eq(invoices.contactId, req.user.contactId))
    .orderBy(desc(invoices.date));
    
  res.json(rows.map(r => ({
    ...r,
    quantity: Number(r.quantity),
    unitPrice: round2(Number(r.unitPrice)),
    total: round2(Number(r.total))
  })));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { subject, message } = req.body || {};
  if (!subject || !message) throw new ApiError(400, "Subject and message are required");
  
  const [msg] = await db.insert(contactMessages).values({
    contactId: req.user.contactId,
    subject,
    message
  }).returning();
  
  res.status(201).json(msg);
});

const approveDocument = asyncHandler(async (req, res) => {
  const [doc] = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
  if (!doc) throw new ApiError(404, "Document not found");
  if (doc.contactId !== req.user.contactId) throw new ApiError(403, "Access denied");
  if (doc.status !== "draft") throw new ApiError(400, "Only draft documents can be approved");
  
  await postInvoice(doc.id);
  res.json({ success: true, message: "Document approved successfully" });
});

module.exports = { listMyDocuments, getMyDocument, payMyDocument, checkoutStore, listMyLines, sendMessage, approveDocument };
