require("dotenv").config();
const bcrypt = require("bcryptjs");
const { eq } = require("drizzle-orm");
const { db, pool } = require("./index");
const { users, accounts, journals } = require("./schema");

// CoA uses the problem statement's own vocabulary: Debtors (AR), Creditors
// (AP), Sale Income, Purchase Expense, Capital. Codes are resolved by the
// posting logic via SYSTEM_ACCOUNTS.
const CHART_OF_ACCOUNTS = [
  { accountCode: "1000", accountName: "Cash", type: "Asset" },
  { accountCode: "1010", accountName: "Bank", type: "Asset" },
  { accountCode: "1100", accountName: "Debtors", type: "Asset" },
  { accountCode: "2000", accountName: "Creditors", type: "Liability" },
  { accountCode: "2100", accountName: "Tax Payable", type: "Liability" },
  { accountCode: "3000", accountName: "Owner's Capital", type: "Capital" },
  { accountCode: "4000", accountName: "Sale Income", type: "Income" },
  { accountCode: "5000", accountName: "Purchase Expense", type: "Expense" },
];

// Journals group entries by activity; their default accounts are what
// payments and documents hit. Bank Journal -> Bank, Cash Journal -> Cash.
const JOURNALS = [
  { name: "Sales Journal", type: "sale", accountCode: "4000" },
  { name: "Purchase Journal", type: "purchase", accountCode: "5000" },
  { name: "Bank Journal", type: "bank", accountCode: "1010" },
  { name: "Cash Journal", type: "cash", accountCode: "1000" },
];

async function seed() {
  for (const acc of CHART_OF_ACCOUNTS) {
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.accountCode, acc.accountCode));
    if (!existing) {
      await db.insert(accounts).values(acc);
      console.log(`+ account ${acc.accountCode} ${acc.accountName}`);
    }
  }

  for (const j of JOURNALS) {
    const [existing] = await db.select({ id: journals.id }).from(journals).where(eq(journals.type, j.type));
    if (!existing) {
      const [account] = await db.select().from(accounts).where(eq(accounts.accountCode, j.accountCode));
      await db.insert(journals).values({ name: j.name, type: j.type, defaultAccountId: account.id });
      console.log(`+ journal ${j.name} -> ${account.accountName}`);
    }
  }

  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@accountant.local"));
  if (!admin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      email: "admin@accountant.local",
      passwordHash,
      role: "admin",
    });
    console.log("+ admin user (admin@accountant.local / admin123)");
  }

  console.log("Seed complete");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
