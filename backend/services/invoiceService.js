const { eq, inArray, sql } = require("drizzle-orm");
const { db } = require("../db");
const { invoices, invoiceLines, contacts, products } = require("../db/schema");
const ApiError = require("../utils/apiError");
const { postJournalEntry, getAccountByCode, getJournalByType } = require("./journalService");
const { SYSTEM_ACCOUNTS, KIND_TO_JOURNAL_TYPE, INVOICE_KINDS } = require("../utils/constants");
const { round2, money, lineSubtotal, lineTax } = require("../utils/money");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// A customer can only get invoices, a vendor only bills; 'both' can get either.
function assertContactKind(contact, kind) {
  if (kind === "invoice" && !(contact.type === "customer" || contact.type === "both")) {
    throw new ApiError(400, "Invoices can only be issued to customers");
  }
  if (kind === "bill" && !(contact.type === "vendor" || contact.type === "both")) {
    throw new ApiError(400, "Bills can only be received from vendors");
  }
}

// Creates a DRAFT invoice/bill. Drafts never touch the ledger - the accounting
// entry only appears when the document is posted (see postInvoice below).
// Totals are always computed server-side from lines.
async function createDraft({ kind, contactId, date, dueDate, orderId = null, lines }, dbOrTx = db) {
  if (!INVOICE_KINDS.includes(kind)) throw new ApiError(400, "kind must be 'invoice' or 'bill'");
  if (!contactId || !date || !dueDate) throw new ApiError(400, "contactId, date and dueDate are required");
  if (!ISO_DATE.test(date) || !ISO_DATE.test(dueDate)) throw new ApiError(400, "dates must be YYYY-MM-DD");
  if (!Array.isArray(lines) || lines.length === 0) throw new ApiError(400, "Document needs at least one line");

  const run = async (tx) => {
    const [contact] = await tx.select().from(contacts).where(eq(contacts.id, contactId));
    if (!contact) throw new ApiError(404, "Contact not found");
    if (contact.isArchived) throw new ApiError(400, "Contact is archived");
    if (contact.status !== "active" && kind === "bill") {
      throw new ApiError(400, `Cannot issue vendor bills for contact with status '${contact.status}'. Contact must be approved first.`);
    }
    assertContactKind(contact, kind);

    const fallbackAccount = await getAccountByCode(
      kind === "invoice" ? SYSTEM_ACCOUNTS.SALE_INCOME : SYSTEM_ACCOUNTS.PURCHASE_EXPENSE,
      tx
    );

    // Products referenced on lines drive price defaults and later stock moves.
    const productIds = [...new Set(lines.filter((l) => l.productId).map((l) => l.productId))];
    const productRows = productIds.length
      ? await tx.select().from(products).where(inArray(products.id, productIds))
      : [];
    const productById = new Map(productRows.map((p) => [p.id, p]));
    for (const pid of productIds) {
      const p = productById.get(pid);
      if (!p) throw new ApiError(400, `Product ${pid} does not exist`);
      if (p.isArchived) throw new ApiError(400, `Product '${p.name}' is archived`);
    }

    const prepared = lines.map((l) => {
      const product = l.productId ? productById.get(l.productId) : null;
      const quantity = round2(l.quantity ?? 1);
      if (!(quantity > 0)) throw new ApiError(400, "quantity must be positive");
      const unitPrice =
        l.unitPrice !== undefined
          ? round2(l.unitPrice)
          : product
            ? round2(kind === "invoice" ? product.salesPrice : product.purchaseCost)
            : NaN;
      if (!(unitPrice >= 0)) throw new ApiError(400, "unitPrice is required when the line has no product");
      const taxRate = round2(l.taxRate ?? 0);
      if (taxRate < 0 || taxRate > 100) throw new ApiError(400, "taxRate must be between 0 and 100");
      return {
        productId: l.productId ?? null,
        accountId: l.accountId ?? fallbackAccount.id,
        analyticAccountId: l.analyticAccountId ?? null,
        description: l.description ?? product?.name ?? null,
        quantity,
        unitPrice,
        taxRate,
      };
    });

    const subtotal = round2(prepared.reduce((s, l) => s + lineSubtotal(l), 0));
    const taxAmount = round2(prepared.reduce((s, l) => s + lineTax(l), 0));
    const totalAmount = round2(subtotal + taxAmount);

    const [invoice] = await tx
      .insert(invoices)
      .values({
        kind,
        orderId,
        contactId,
        date,
        dueDate,
        subtotal: money(subtotal),
        taxAmount: money(taxAmount),
        totalAmount: money(totalAmount),
        status: "draft",
      })
      .returning();

    await tx.insert(invoiceLines).values(
      prepared.map((l) => ({
        invoiceId: invoice.id,
        productId: l.productId,
        accountId: l.accountId,
        analyticAccountId: l.analyticAccountId,
        description: l.description,
        quantity: money(l.quantity),
        unitPrice: money(l.unitPrice),
        taxRate: money(l.taxRate),
      }))
    );

    return invoice;
  };

  return dbOrTx === db ? db.transaction(run) : run(dbOrTx);
}

// Posting is the moment the document enters the books:
//   Customer invoice: Dr Debtors (total) / Cr income accounts (per line) / Cr Tax Payable
//   Vendor bill:      Dr expense accounts (per line) / Dr Tax Payable / Cr Creditors (total)
// Stock moves in the SAME transaction: bill adds, invoice subtracts.
async function postInvoice({ invoiceId, userId }, dbOrTx = db) {
  const run = async (tx) => {
    const [invoice] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) throw new ApiError(404, "Document not found");
    if (invoice.status !== "draft") {
      throw new ApiError(400, `Cannot post a document in status '${invoice.status}'`);
    }

    const lines = await tx.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId));
    if (lines.length === 0) throw new ApiError(400, "Document has no lines");

    const journal = await getJournalByType(KIND_TO_JOURNAL_TYPE[invoice.kind], tx);
    const taxAccount = await getAccountByCode(SYSTEM_ACCOUNTS.TAX_PAYABLE, tx);

    const subtotalByAccount = new Map();
    for (const l of lines) {
      subtotalByAccount.set(l.accountId, round2((subtotalByAccount.get(l.accountId) || 0) + lineSubtotal(l)));
    }
    const taxTotal = round2(Number(invoice.taxAmount));
    const total = round2(invoice.totalAmount);

    let entryLines;
    if (invoice.kind === "invoice") {
      const debtors = await getAccountByCode(SYSTEM_ACCOUNTS.DEBTORS, tx);
      entryLines = [
        { accountId: debtors.id, debit: total, credit: 0 },
        ...[...subtotalByAccount.entries()].map(([accountId, amount]) => ({ accountId, debit: 0, credit: amount })),
      ];
      if (taxTotal > 0) entryLines.push({ accountId: taxAccount.id, debit: 0, credit: taxTotal });
    } else {
      const creditors = await getAccountByCode(SYSTEM_ACCOUNTS.CREDITORS, tx);
      entryLines = [
        ...[...subtotalByAccount.entries()].map(([accountId, amount]) => ({ accountId, debit: amount, credit: 0 })),
      ];
      if (taxTotal > 0) entryLines.push({ accountId: taxAccount.id, debit: taxTotal, credit: 0 });
      entryLines.push({ accountId: creditors.id, debit: 0, credit: total });
    }

    const entry = await postJournalEntry(
      {
        journalId: journal.id,
        date: invoice.date,
        description: `${invoice.kind === "invoice" ? "Invoice" : "Bill"} #${invoice.id} posted`,
        reference: `${invoice.kind === "invoice" ? "INV" : "BILL"}-${invoice.id}`,
        createdBy: userId,
        lines: entryLines,
      },
      tx
    );

    // Stock move for goods/combo products, inside the same atomic transaction.
    const stockLines = lines.filter((l) => l.productId);
    if (stockLines.length) {
      const productRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, [...new Set(stockLines.map((l) => l.productId))]));
      const typeById = new Map(productRows.map((p) => [p.id, p.type]));
      for (const l of stockLines) {
        if (typeById.get(l.productId) === "service") continue;
        const delta = invoice.kind === "bill" ? round2(l.quantity) : round2(-l.quantity);
        await tx
          .update(products)
          .set({ quantityOnHand: sql`${products.quantityOnHand} + ${money(delta)}::numeric` })
          .where(eq(products.id, l.productId));
      }
    }

    const [updated] = await tx
      .update(invoices)
      .set({ transactionId: entry.id, status: "posted" })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return { invoice: updated, transaction: entry };
  };

  return dbOrTx === db ? db.transaction(run) : run(dbOrTx);
}

module.exports = { createDraft, postInvoice };
