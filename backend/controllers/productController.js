const { eq, and, sql } = require("drizzle-orm");
const { db } = require("../db");
const { products, orderLines } = require("../db/schema");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const { PRODUCT_TYPES } = require("../utils/constants");
const { round2 } = require("../utils/money");

const serialize = (p) => ({
  ...p,
  salesPrice: Number(p.salesPrice),
  purchaseCost: Number(p.purchaseCost),
  quantityOnHand: Number(p.quantityOnHand),
});

const list = asyncHandler(async (req, res) => {
  const { type, archived, page, limit } = req.query;
  if (type && !PRODUCT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${PRODUCT_TYPES.join(", ")}`);
  }
  const conditions = [];
  if (type) conditions.push(eq(products.type, type));
  if (archived !== "true") conditions.push(eq(products.isArchived, false));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offsetNum = (pageNum - 1) * limitNum;

    const countQuery = db.select({ count: sql`count(*)` }).from(products);
    if (whereClause) countQuery.where(whereClause);
    const [countResult] = await countQuery;
    const total = Number(countResult?.count || 0);

    const dataQuery = db.select().from(products);
    if (whereClause) dataQuery.where(whereClause);
    const rows = await dataQuery.orderBy(products.id).limit(limitNum).offset(offsetNum);

    const serializedRows = rows.map(serialize);
    return res.json({
      items: serializedRows,
      data: serializedRows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  const rows = whereClause
    ? await db.select().from(products).where(whereClause).orderBy(products.id)
    : await db.select().from(products).orderBy(products.id);
  res.json(rows.map(serialize));
});

const create = asyncHandler(async (req, res) => {
  const { name, type, salesPrice, purchaseCost, category } = req.body || {};
  if (!name || !type) throw new ApiError(400, "name and type are required");
  if (!PRODUCT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${PRODUCT_TYPES.join(", ")}`);
  }
  const [product] = await db
    .insert(products)
    .values({
      name,
      type,
      category,
      salesPrice: round2(salesPrice ?? 0).toFixed(2),
      purchaseCost: round2(purchaseCost ?? 0).toFixed(2),
    })
    .returning();
  res.status(201).json(serialize(product));
});

const getById = asyncHandler(async (req, res) => {
  const [product] = await db.select().from(products).where(eq(products.id, Number(req.params.id)));
  if (!product) throw new ApiError(404, "Product not found");
  res.json(serialize(product));
});

const update = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) throw new ApiError(404, "Product not found");

  const { name, type, salesPrice, purchaseCost, category } = req.body || {};
  if (type && !PRODUCT_TYPES.includes(type)) {
    throw new ApiError(400, `type must be one of: ${PRODUCT_TYPES.join(", ")}`);
  }
  const [updated] = await db
    .update(products)
    .set({
      name: name ?? product.name,
      type: type ?? product.type,
      category: category ?? product.category,
      salesPrice: salesPrice !== undefined ? round2(salesPrice).toFixed(2) : product.salesPrice,
      purchaseCost: purchaseCost !== undefined ? round2(purchaseCost).toFixed(2) : product.purchaseCost,
    })
    .where(eq(products.id, id))
    .returning();
  res.json(serialize(updated));
});

const archive = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) throw new ApiError(404, "Product not found");
  const [updated] = await db
    .update(products)
    .set({ isArchived: !product.isArchived })
    .where(eq(products.id, id))
    .returning();
  res.json(serialize(updated));
});

const remove = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) throw new ApiError(404, "Product not found");

  const [used] = await db.select({ id: orderLines.id }).from(orderLines).where(eq(orderLines.productId, id)).limit(1);
  if (used) throw new ApiError(409, "Product is used on orders - archive it instead of deleting");

  await db.delete(products).where(eq(products.id, id));
  res.status(204).end();
});

module.exports = { list, create, getById, update, archive, remove };
