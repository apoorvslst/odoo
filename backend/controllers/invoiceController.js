const { eq, and, desc, sql } = require("drizzle-orm");
const { db } = require("../db");
const { invoices, invoiceLines, contacts, accounts, products, payments } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { createDraft, postInvoice } = require("../services/invoiceService");
const { INVOICE_KINDS } = require("../utils/constants");
const { round2 } = require("../utils/money");

const list = asyncHandler(async (req, res) => {
  const { kind, status } = req.query;
  if (kind && !INVOICE_KINDS.includes(kind)) {
    throw new ApiError(400, `kind must be one of: ${INVOICE_KINDS.join(", ")}`);
  }
  const conditions = [];
  if (kind) conditions.push(eq(invoices.kind, kind));
  if (status) conditions.push(eq(invoices.status, status));

  // Portal privacy: Contact users see only their own documents (Customer invoices or Vendor bills)
  if (req.user && req.user.role === "contact") {
    if (!req.user.contactId) throw new ApiError(403, "Portal user has no linked contact profile");
    conditions.push(eq(invoices.contactId, req.user.contactId));
  }

  const base = db
    .select({
      id: invoices.id,
      kind: invoices.kind,
      orderId: invoices.orderId,
      contactId: invoices.contactId,
      contactName: contacts.name,
      transactionId: invoices.transactionId,
      date: invoices.date,
      dueDate: invoices.dueDate,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .leftJoin(contacts, eq(contacts.id, invoices.contactId))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .groupBy(invoices.id, contacts.name)
    .orderBy(desc(invoices.id));

  const rows = conditions.length ? await base.where(and(...conditions)) : await base;
  res.json(
    rows.map((r) => ({
      ...r,
      subtotal: Number(r.subtotal),
      taxAmount: Number(r.taxAmount),
      totalAmount: Number(r.totalAmount),
      paid: round2(Number(r.paid)),
      balanceDue: round2(Number(r.totalAmount) - Number(r.paid)),
    }))
  );
});

const create = asyncHandler(async (req, res) => {
  let { kind = "invoice", contactId, date, dueDate, lines } = req.body || {};

  // Portal security: Vendor submitting a bill
  if (req.user && req.user.role === "contact") {
    if (!req.user.contactId) throw new ApiError(403, "Portal user has no linked contact profile");
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, req.user.contactId));
    if (!contact) throw new ApiError(404, "Linked contact not found");
    if (!(contact.type === "vendor" || contact.type === "both")) {
      throw new ApiError(403, "Only vendor contacts can submit bills");
    }
    kind = "bill";
    contactId = req.user.contactId;
  }

  const document = await createDraft({ kind, contactId, date, dueDate, lines });
  res.status(201).json(document);
});

const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [invoice] = await db
    .select({
      id: invoices.id,
      kind: invoices.kind,
      orderId: invoices.orderId,
      contactId: invoices.contactId,
      contactName: contacts.name,
      transactionId: invoices.transactionId,
      date: invoices.date,
      dueDate: invoices.dueDate,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
    })
    .from(invoices)
    .leftJoin(contacts, eq(contacts.id, invoices.contactId))
    .where(eq(invoices.id, id));
  if (!invoice) throw new ApiError(404, "Document not found");

  if (req.user && req.user.role === "contact" && invoice.contactId !== req.user.contactId) {
    throw new ApiError(403, "Access denied to other contacts' documents");
  }

  const lines = await db
    .select({
      id: invoiceLines.id,
      productId: invoiceLines.productId,
      productName: products.name,
      accountId: invoiceLines.accountId,
      accountCode: accounts.accountCode,
      accountName: accounts.accountName,
      analyticAccountId: invoiceLines.analyticAccountId,
      description: invoiceLines.description,
      quantity: invoiceLines.quantity,
      unitPrice: invoiceLines.unitPrice,
      taxRate: invoiceLines.taxRate,
    })
    .from(invoiceLines)
    .innerJoin(accounts, eq(accounts.id, invoiceLines.accountId))
    .leftJoin(products, eq(products.id, invoiceLines.productId))
    .where(eq(invoiceLines.invoiceId, id));

  const docPayments = await db.select().from(payments).where(eq(payments.invoiceId, id)).orderBy(payments.id);
  const paid = round2(docPayments.reduce((s, p) => s + Number(p.amount), 0));

  res.json({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxAmount: Number(invoice.taxAmount),
    totalAmount: Number(invoice.totalAmount),
    lines: lines.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      taxRate: Number(l.taxRate),
      lineSubtotal: round2(Number(l.quantity) * Number(l.unitPrice)),
      lineTax: round2((Number(l.quantity) * Number(l.unitPrice) * Number(l.taxRate)) / 100),
    })),
    payments: docPayments.map((p) => ({ ...p, amount: Number(p.amount) })),
    paid,
    balanceDue: round2(Number(invoice.totalAmount) - paid),
  });
});

// Posting the document is the exact moment it enters the books.
const post = asyncHandler(async (req, res) => {
  const result = await postInvoice({ invoiceId: Number(req.params.id), userId: req.user.id });
  res.json(result);
});

module.exports = { list, create, getById, post };
