const { pgTable, serial, varchar, text, boolean, integer, numeric, date, timestamp } = require("drizzle-orm/pg-core");

// ---------------- Master data ----------------

const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // customer | vendor | both
  email: varchar("email", { length: 255 }),
  mobile: varchar("mobile", { length: 30 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  pincode: varchar("pincode", { length: 20 }),
  profileImage: varchar("profile_image", { length: 500 }),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("accountant"), // admin | accountant | contact
  // Portal link: a user with role 'contact' sees only this contact's documents.
  contactId: integer("contact_id").references(() => contacts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // goods | service | combo
  salesPrice: numeric("sales_price", { precision: 15, scale: 2 }).notNull().default("0.00"),
  purchaseCost: numeric("purchase_cost", { precision: 15, scale: 2 }).notNull().default("0.00"),
  category: varchar("category", { length: 100 }),
  quantityOnHand: numeric("quantity_on_hand", { precision: 15, scale: 2 }).notNull().default("0.00"),
  isArchived: boolean("is_archived").notNull().default(false),
});

const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  accountCode: varchar("account_code", { length: 50 }).notNull().unique(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // Asset | Liability | Income | Expense | Capital
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  isArchived: boolean("is_archived").notNull().default(false),
});

const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // sale | purchase | bank | cash
  defaultAccountId: integer("default_account_id")
    .notNull()
    .references(() => accounts.id),
});

const analyticAccounts = pgTable("analytic_accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // income | expense
});

// ---------------- Ledger ----------------

const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  journalId: integer("journal_id")
    .notNull()
    .references(() => journals.id),
  date: date("date").notNull(),
  description: text("description"),
  reference: varchar("reference", { length: 255 }),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
});

const transactionLines = pgTable("transaction_lines", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  debit: numeric("debit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  credit: numeric("credit", { precision: 15, scale: 2 }).notNull().default("0.00"),
});

// ---------------- Documents (order -> invoice/bill -> payment) ----------------

const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 10 }).notNull(), // purchase | sale
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id),
  date: date("date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | confirmed | converted
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const orderLines = pgTable("order_lines", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  analyticAccountId: integer("analytic_account_id").references(() => analyticAccounts.id),
  description: text("description"),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull().default("1.00"),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
});

const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 10 }).notNull(), // invoice (customer) | bill (vendor)
  orderId: integer("order_id").references(() => orders.id), // source document, if converted
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id),
  transactionId: integer("transaction_id").references(() => transactions.id), // the posting; null while draft
  date: date("date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0.00"),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | posted | partial | paid
});

const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id), // income account (sale) / expense account (bill)
  analyticAccountId: integer("analytic_account_id").references(() => analyticAccounts.id), // budget actuals link
  description: text("description"),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull().default("1.00"),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
});

const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id),
  journalId: integer("journal_id")
    .notNull()
    .references(() => journals.id), // cash or bank journal used
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  method: varchar("method", { length: 20 }).notNull(), // cash | bank
});

// ---------------- Budgets ----------------

const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  responsibleId: integer("responsible_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const budgetLines = pgTable("budget_lines", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id")
    .notNull()
    .references(() => budgets.id, { onDelete: "cascade" }),
  analyticAccountId: integer("analytic_account_id")
    .notNull()
    .references(() => analyticAccounts.id),
  plannedAmount: numeric("planned_amount", { precision: 15, scale: 2 }).notNull(),
});

module.exports = {
  contacts,
  users,
  products,
  accounts,
  journals,
  analyticAccounts,
  transactions,
  transactionLines,
  orders,
  orderLines,
  invoices,
  invoiceLines,
  payments,
  budgets,
  budgetLines,
};
