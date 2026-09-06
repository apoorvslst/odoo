/**
 * scripts/seedProducts.js
 *
 * Reads products_seed_data.json and inserts every entry into the `products`
 * table — skipping any product whose name already exists (idempotent run).
 *
 * Run: node backend/scripts/seedProducts.js
 * (from project root, with backend/.env loaded)
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const path = require("path");
const { eq } = require("drizzle-orm");
const { db, pool } = require("../db/index");
const { products } = require("../db/schema");

// Load the 100-product JSON we wrote next to this file.
const PRODUCTS = require(path.join(__dirname, "products_seed_data.json"));

async function seedProducts() {
  let inserted = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    // Check by name — cheap guard so re-running never duplicates.
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.name, p.name));

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(products).values({
      name:           p.name,
      type:           p.type,
      salesPrice:     p.salesPrice,
      purchaseCost:   p.purchaseCost,
      category:       p.category,
      quantityOnHand: p.quantityOnHand,
      isArchived:     false,
    });

    console.log(`+ [${p.type}] ${p.name}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}  |  Skipped (already exist): ${skipped}`);
}

seedProducts()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
