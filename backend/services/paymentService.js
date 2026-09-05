const { eq, sql } = require("drizzle-orm");
const { db } = require("../db");
const { payments, invoices } = require("../db/schema");
const ApiError = require("../utils/apiError");
const { postJournalEntry, getAccountByCode, getJournalByType } = require("./journalService");
const { SYSTEM_ACCOUNTS, METHOD_TO_JOURNAL_TYPE, PAYMENT_METHODS } = require("../utils/constants");
const { round2, money } = require("../utils/money");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Records a payment against an invoice/bill. The method (cash|bank) picks the
// journal, whose default account is what actually moves:
//   customer invoice: Dr Cash/Bank / Cr Debtors
//   vendor bill:      Dr Creditors / Cr Cash/Bank
// Partial payments are just multiple payment rows; status is derived.
async function recordPayment({ invoiceId, amount, method = "bank", date, userId }, dbOrTx = db) {
  if (!PAYMENT_METHODS.includes(method)) {
    throw new ApiError(400, `method must be one of: ${PAYMENT_METHODS.join(", ")}`);
  }
  const paymentAmount = round2(amount);
  if (!(paymentAmount > 0)) throw new ApiError(400, "amount must be a positive number");
  if (date && !ISO_DATE.test(date)) throw new ApiError(400, "date must be YYYY-MM-DD");

  const run = async (tx) => {
    const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) throw new ApiError(404, "Document not found");
    if (invoice.status === "draft") throw new ApiError(400, "Post the document before recording payments");
    if (invoice.status === "paid") throw new ApiError(400, "Document is already fully paid");

    const [{ paid }] = await tx
      .select({ paid: sql`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
    const balanceDue = round2(Number(invoice.totalAmount) - Number(paid));
    if (paymentAmount > balanceDue) {
      throw new ApiError(400, `Payment exceeds balance due (${money(balanceDue)})`);
    }

    const journal = await getJournalByType(METHOD_TO_JOURNAL_TYPE[method], tx);
    const paymentDate = date || new Date().toISOString().slice(0, 10);

    let entryLines;
    if (invoice.kind === "invoice") {
      const debtors = await getAccountByCode(SYSTEM_ACCOUNTS.DEBTORS, tx);
      entryLines = [
        { accountId: journal.defaultAccountId, debit: paymentAmount, credit: 0 },
        { accountId: debtors.id, debit: 0, credit: paymentAmount },
      ];
    } else {
      const creditors = await getAccountByCode(SYSTEM_ACCOUNTS.CREDITORS, tx);
      entryLines = [
        { accountId: creditors.id, debit: paymentAmount, credit: 0 },
        { accountId: journal.defaultAccountId, debit: 0, credit: paymentAmount },
      ];
    }

    const entry = await postJournalEntry(
      {
        journalId: journal.id,
        date: paymentDate,
        description: `Payment ${invoice.kind === "invoice" ? "received" : "made"} for ${invoice.kind} #${invoiceId}`,
        reference: `PAY-${invoiceId}`,
        createdBy: userId,
        lines: entryLines,
      },
      tx
    );

    const [payment] = await tx
      .insert(payments)
      .values({
        invoiceId,
        transactionId: entry.id,
        journalId: journal.id,
        date: paymentDate,
        amount: money(paymentAmount),
        method,
      })
      .returning();

    const newStatus = round2(Number(paid) + paymentAmount) >= round2(Number(invoice.totalAmount)) ? "paid" : "partial";
    await tx.update(invoices).set({ status: newStatus }).where(eq(invoices.id, invoiceId));

    return { ...payment, amount: Number(payment.amount), documentStatus: newStatus, balanceDue: round2(balanceDue - paymentAmount) };
  };

  return dbOrTx === db ? db.transaction(run) : run(dbOrTx);
}

module.exports = { recordPayment };
