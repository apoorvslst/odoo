// Account types exactly as named in the problem statement.
const ACCOUNT_TYPES = ["Asset", "Liability", "Income", "Expense", "Capital"];
// Asset & Expense grow with debits; Liability, Income & Capital grow with credits.
const DEBIT_NORMAL_TYPES = ["Asset", "Expense"];

const CONTACT_TYPES = ["customer", "vendor", "both"];
const PRODUCT_TYPES = ["goods", "service", "combo"];
const JOURNAL_TYPES = ["sale", "purchase", "bank", "cash"];
const ANALYTIC_TYPES = ["income", "expense"];
const ROLES = ["admin", "accountant", "contact"];
const ORDER_KINDS = ["purchase", "sale"];
const INVOICE_KINDS = ["invoice", "bill"];
const PAYMENT_METHODS = ["cash", "bank"];

// Seeded accounts resolved by code in posting logic.
const SYSTEM_ACCOUNTS = {
  CASH: "1000",
  BANK: "1010",
  DEBTORS: "1100",
  CREDITORS: "2000",
  TAX_PAYABLE: "2100",
  SALE_INCOME: "4000",
  PURCHASE_EXPENSE: "5000",
};

// Payment method -> which journal type (and thus which default account) it hits.
const METHOD_TO_JOURNAL_TYPE = { cash: "cash", bank: "bank" };
// Document kind -> which journal its posting goes to.
const KIND_TO_JOURNAL_TYPE = { invoice: "sale", bill: "purchase" };

module.exports = {
  ACCOUNT_TYPES,
  DEBIT_NORMAL_TYPES,
  CONTACT_TYPES,
  PRODUCT_TYPES,
  JOURNAL_TYPES,
  ANALYTIC_TYPES,
  ROLES,
  ORDER_KINDS,
  INVOICE_KINDS,
  PAYMENT_METHODS,
  SYSTEM_ACCOUNTS,
  METHOD_TO_JOURNAL_TYPE,
  KIND_TO_JOURNAL_TYPE,
};
