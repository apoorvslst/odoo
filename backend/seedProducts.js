const { db } = require('./db');
const { products } = require('./db/schema');
const { eq } = require('drizzle-orm');

const items = [
  {
    name: 'Luxury Velvet Sofa',
    type: 'goods',
    salesPrice: '45000.00',
    purchaseCost: '25000.00',
    category: 'Living Room',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Solid Wood Dining Table',
    type: 'goods',
    salesPrice: '32000.00',
    purchaseCost: '18000.00',
    category: 'Dining Room',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1c0945594?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Ergonomic Office Chair',
    type: 'goods',
    salesPrice: '12500.00',
    purchaseCost: '7000.00',
    category: 'Office',
    imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'King Size Teak Bed',
    type: 'goods',
    salesPrice: '55000.00',
    purchaseCost: '30000.00',
    category: 'Bedroom',
    imageUrl: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Modern Bookshelf',
    type: 'goods',
    salesPrice: '18000.00',
    purchaseCost: '9500.00',
    category: 'Living Room',
    imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Leather Recliner',
    type: 'goods',
    salesPrice: '28000.00',
    purchaseCost: '15000.00',
    category: 'Living Room',
    imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=800'
  }
];

async function seed() {
  for (const item of items) {
    const existing = await db.select().from(products).where(eq(products.name, item.name));
    if (existing.length === 0) {
      await db.insert(products).values(item);
      console.log(`Inserted: ${item.name}`);
    } else {
      await db.update(products).set({ imageUrl: item.imageUrl }).where(eq(products.name, item.name));
      console.log(`Updated: ${item.name}`);
    }
  }
  console.log("Done seeding products!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
