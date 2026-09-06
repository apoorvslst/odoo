const { db } = require("../db");
const { products } = require("../db/schema");

const CATEGORIES = ["Chairs", "Desks", "Tables", "Storage", "Lighting", "Decor", "Services", "Combo Sets"];

const CHAIR_ADJECTIVES = ["Ergonomic", "Executive", "Mesh Back", "Velvet Accent", "Leather Recliner", "Nordic Minimalist", "Swivel Task", "Gaming Pro", "Foldable Dining", "Padded Lounge"];
const TABLE_ADJECTIVES = ["Solid Oak", "Tempered Glass", "Adjustable Standing", "Walnut Veneer", "Marble Top", "Compact Corner", "Conference Oval", "Industrial Steel", "Nested Coffee", "Console"];
const STORAGE_ADJECTIVES = ["4-Drawer File", "Modular Shelf", "Credenza", "Lockable Pedestal", "Glass Display", "Bookshelf Tower", "Sideboard", "Wardrobe Unit"];
const LIGHTING_ADJECTIVES = ["LED Desk", "Pendant Ambient", "Floor Arc", "Minimalist Tube", "Architect Swing-Arm", "Smart Touch"];

const IMAGES = [
  "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500&q=80",
  "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=500&q=80",
  "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&q=80",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500&q=80",
  "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
];

function generate200Products() {
  const items = [];
  
  for (let i = 1; i <= 200; i++) {
    const catIndex = (i - 1) % CATEGORIES.length;
    const category = CATEGORIES[catIndex];
    
    let name = "";
    let type = "goods";
    let img = IMAGES[i % IMAGES.length];

    if (category === "Chairs") {
      const adj = CHAIR_ADJECTIVES[i % CHAIR_ADJECTIVES.length];
      name = `${adj} Chair V${i}`;
      type = "goods";
    } else if (category === "Desks" || category === "Tables") {
      const adj = TABLE_ADJECTIVES[i % TABLE_ADJECTIVES.length];
      name = `${adj} ${category.slice(0, -1)} Model-${100 + i}`;
      type = "goods";
    } else if (category === "Storage") {
      const adj = STORAGE_ADJECTIVES[i % STORAGE_ADJECTIVES.length];
      name = `${adj} ${1000 + i}`;
      type = "goods";
    } else if (category === "Lighting") {
      const adj = LIGHTING_ADJECTIVES[i % LIGHTING_ADJECTIVES.length];
      name = `${adj} Fixture L-${i}`;
      type = "goods";
    } else if (category === "Decor") {
      name = `Decorative Ceramic & Art Piece #${i}`;
      type = "goods";
    } else if (category === "Services") {
      name = `Custom Interior Assembly & Setup Service Tier ${((i % 5) + 1)}`;
      type = "service";
      img = null;
    } else {
      name = `Complete Executive Workstation Combo Pack #${i}`;
      type = "combo";
    }

    const salesPrice = type === "service" 
      ? (1500 + (i * 250)).toFixed(2)
      : (2500 + (i * 380)).toFixed(2);
    
    const purchaseCost = (parseFloat(salesPrice) * 0.65).toFixed(2);
    const quantityOnHand = type === "service" ? "0.00" : (10 + (i % 45)).toFixed(2);

    items.push({
      name,
      type,
      category,
      salesPrice,
      purchaseCost,
      quantityOnHand,
      imageUrl: img,
      isArchived: false
    });
  }

  return items;
}

async function seed() {
  console.log("Generating 200 dummy product records...");
  const dummyProducts = generate200Products();

  console.log("Inserting into database in batches...");
  const batchSize = 50;
  for (let i = 0; i < dummyProducts.length; i += batchSize) {
    const chunk = dummyProducts.slice(i, i + batchSize);
    await db.insert(products).values(chunk);
    console.log(`Inserted ${i + chunk.length} / 200 products`);
  }

  console.log("Successfully inserted 200 product records into the database!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed 200 products:", err);
  process.exit(1);
});
