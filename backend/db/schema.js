const { pgTable, serial, varchar, text, timestamp, numeric, date, integer } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  accountCode: varchar("account_code", { length: 50 }).notNull().unique(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  balance: numeric("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
});

const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
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
    .references(() => transactions.id),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  debit: numeric("debit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  credit: numeric("credit", { precision: 15, scale: 2 }).notNull().default("0.00"),
});

const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
});

const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id),
  date: date("date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
});

module.exports = {
  users,
  accounts,
  transactions,
  transactionLines,
  contacts,
  invoices,
};
