const { eq, desc } = require("drizzle-orm");
const { db } = require("../db");
const { orders, orderLines, contacts, products, invoices } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { createDraft } = require("../services/invoiceService");
const { ORDER_KINDS } = require("../utils/constants");
const { round2, money, lineSubtotal, lineTax } = require("../utils/money");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const list = asyncHandler(async (req, res) => {
  const { kind } = req.query;
  if (kind && !ORDER_KINDS.includes(kind)) {
    throw new ApiError(400, `kind must be one of: ${ORDER_KINDS.join(", ")}`);
  }
  const base = db
    .select({
      id: orders.id,
      kind: orders.kind,
      contactId: orders.contactId,
      contactName: contacts.name,
      date: orders.date,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdBy: orders.createdBy,
    })
    .from(orders)
    .leftJoin(contacts, eq(contacts.id, orders.contactId))
    .orderBy(desc(orders.id));
  const rows = kind ? await base.where(eq(orders.kind, kind)) : await base;
  res.json(rows.map((r) => ({ ...r, totalAmount: Number(r.totalAmount) })));
});

// Orders are pure intent: they never touch the ledger. Only when converted and
// the resulting document is posted does accounting happen.
const create = asyncHandler(async (req, res) => {
  const { kind, contactId, date, lines } = req.body || {};
  if (!ORDER_KINDS.includes(kind)) throw new ApiError(400, `kind must be one of: ${ORDER_KINDS.join(", ")}`);
  if (!contactId || !date) throw new ApiError(400, "contactId and date are required");
  if (!ISO_DATE.test(date)) throw new ApiError(400, "date must be YYYY-MM-DD");
  if (!Array.isArray(lines) || lines.length === 0) throw new ApiError(400, "Order needs at least one line");

  const created = await db.transaction(async (tx) => {
    const [contact] = await tx.select().from(contacts).where(eq(contacts.id, contactId));
    if (!contact) throw new ApiError(404, "Contact not found");
    if (contact.isArchived) throw new ApiError(400, "Contact is archived");
    if (kind === "purchase" && !(contact.type === "vendor" || contact.type === "both")) {
      throw new ApiError(400, "Purchase orders need a vendor");
    }
    if (kind === "sale" && !(contact.type === "customer" || contact.type === "both")) {
      throw new ApiError(400, "Sales orders need a customer");
    }

    const productIds = lines.filter((l) => l.productId).map((l) => l.productId);
    const productById = new Map();
    for (const pid of productIds) {
      const [p] = await tx.select().from(products).where(eq(products.id, pid));
      if (!p) throw new ApiError(400, `Product ${pid} does not exist`);
      if (p.isArchived) throw new ApiError(400, `Product '${p.name}' is archived`);
      productById.set(pid, p);
    }

    const prepared = lines.map((l) => {
      const product = l.productId ? productById.get(l.productId) : null;
      const quantity = round2(l.quantity ?? 1);
      if (!(quantity > 0)) throw new ApiError(400, "quantity must be positive");
      const unitPrice =
        l.unitPrice !== undefined
          ? round2(l.unitPrice)
          : product
            ? round2(kind === "sale" ? product.salesPrice : product.purchaseCost)
            : NaN;
      if (!(unitPrice >= 0)) throw new ApiError(400, "unitPrice is required when the line has no product");
      const taxRate = round2(l.taxRate ?? 0);
      if (taxRate < 0 || taxRate > 100) throw new ApiError(400, "taxRate must be between 0 and 100");
      return {
        productId: l.productId ?? null,
        analyticAccountId: l.analyticAccountId ?? null,
        description: l.description ?? product?.name ?? null,
        quantity,
        unitPrice,
        taxRate,
      };
    });

    const total = round2(
      prepared.reduce((s, l) => s + lineSubtotal(l) + lineTax(l), 0)
    );

    const [order] = await tx
      .insert(orders)
      .values({ kind, contactId, date, status: "draft", totalAmount: money(total), createdBy: req.user.id })
      .returning();

    await tx.insert(orderLines).values(
      prepared.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        analyticAccountId: l.analyticAccountId,
        description: l.description,
        quantity: money(l.quantity),
        unitPrice: money(l.unitPrice),
        taxRate: money(l.taxRate),
      }))
    );

    return order;
  });

  res.status(201).json(created);
});

const getById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db
    .select({
      id: orders.id,
      kind: orders.kind,
      contactId: orders.contactId,
      contactName: contacts.name,
      date: orders.date,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdBy: orders.createdBy,
    })
    .from(orders)
    .leftJoin(contacts, eq(contacts.id, orders.contactId))
    .where(eq(orders.id, id));
  if (!order) throw new ApiError(404, "Order not found");

  const lines = await db
    .select({
      id: orderLines.id,
      productId: orderLines.productId,
      productName: products.name,
      analyticAccountId: orderLines.analyticAccountId,
      description: orderLines.description,
      quantity: orderLines.quantity,
      unitPrice: orderLines.unitPrice,
      taxRate: orderLines.taxRate,
    })
    .from(orderLines)
    .leftJoin(products, eq(products.id, orderLines.productId))
    .where(eq(orderLines.orderId, id));

  // The document this order was converted into, if any.
  const [document] = await db
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.orderId, id))
    .limit(1);

  res.json({
    ...order,
    totalAmount: Number(order.totalAmount),
    lines: lines.map((l) => ({
      ...l,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      taxRate: Number(l.taxRate),
      lineTotal: round2(Number(l.quantity) * Number(l.unitPrice)),
    })),
    document: document || null,
  });
});

const confirm = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "draft") throw new ApiError(400, `Cannot confirm an order in status '${order.status}'`);
  const [updated] = await db.update(orders).set({ status: "confirmed" }).where(eq(orders.id, id)).returning();
  res.json(updated);
});

// Conversion turns a confirmed order into a DRAFT invoice/bill. The ledger is
// still untouched - posting is a separate explicit step.
const convert = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { dueDate } = req.body || {};

  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "draft") throw new ApiError(400, "Confirm the order before converting it");
  if (order.status === "converted") throw new ApiError(400, "Order is already converted");

  const [existing] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.orderId, id)).limit(1);
  if (existing) throw new ApiError(409, "A document already exists for this order");

  const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, id));
  if (lines.length === 0) throw new ApiError(400, "Order has no lines");

  const result = await db.transaction(async (tx) => {
    const document = await createDraft(
      {
        kind: order.kind === "sale" ? "invoice" : "bill",
        contactId: order.contactId,
        date: order.date,
        dueDate: dueDate || order.date,
        orderId: order.id,
        lines: lines.map((l) => ({
          productId: l.productId,
          analyticAccountId: l.analyticAccountId,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
        })),
      },
      tx
    );
    await tx.update(orders).set({ status: "converted" }).where(eq(orders.id, id));
    return document;
  });

  res.status(201).json(result);
});

module.exports = { list, create, getById, confirm, convert };
