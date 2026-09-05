import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, today } from '../../lib/api';
import { Button, Banner, StatusPill, ModuleShell, Pagination, usePagedSearch } from './ui';

// Invoices & Bills share one endpoint family: /api/invoices with kind=invoice|bill.
// Draft -> post (creates the double entry + moves stock) -> payments (partial/paid).

const EMPTY_LINE = { productId: '', accountId: '', analyticAccountId: '', description: '', quantity: 1, unitPrice: '', taxRate: 0 };

const InvoiceFormView = ({ kind, contacts, products, accounts, analytics, onBack, onSaved }) => {
  const isInvoice = kind === 'invoice';
  const [header, setHeader] = useState({ contactId: '', date: today(), dueDate: today() });
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const eligibleContacts = contacts.filter((c) => (isInvoice ? c.type === 'customer' || c.type === 'both' : c.type === 'vendor' || c.type === 'both'));

  const setLine = (idx, field, value) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const handleProductChange = (idx, productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    setLines((prev) => prev.map((l, i) => {
      if (i !== idx) return l;
      if (!product) return { ...l, productId: '', description: '', unitPrice: '' };
      return { ...l, productId, description: product.name, unitPrice: isInvoice ? product.salesPrice : product.purchaseCost };
    }));
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);

  const lineSubtotal = (l) => (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);
  const lineTax = (l) => lineSubtotal(l) * ((parseFloat(l.taxRate) || 0) / 100);
  const subtotal = lines.reduce((acc, l) => acc + lineSubtotal(l), 0);
  const taxAmount = lines.reduce((acc, l) => acc + lineTax(l), 0);

  const handleSubmit = async () => {
    if (!header.contactId) { setErrorMsg('Select a contact.'); return; }
    if (lines.some((l) => !l.productId && !l.description.trim())) { setErrorMsg('Every line needs a product or a description.'); return; }
    setSaving(true);
    setErrorMsg('');
    try {
      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          contactId: Number(header.contactId),
          date: header.date,
          dueDate: header.dueDate,
          lines: lines.map((l) => ({
            productId: l.productId ? Number(l.productId) : null,
            accountId: l.accountId ? Number(l.accountId) : undefined,
            analyticAccountId: l.analyticAccountId ? Number(l.analyticAccountId) : null,
            description: l.description || null,
            quantity: parseFloat(l.quantity) || 1,
            unitPrice: parseFloat(l.unitPrice) || 0,
            taxRate: parseFloat(l.taxRate) || 0,
          })),
        }),
      });
      onSaved();
    } catch (e) { setErrorMsg(e.message); }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <Button onClick={handleSubmit} variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Draft'}</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
        {isInvoice ? 'New Customer Invoice' : 'New Vendor Bill'} <span className="text-sm font-medium text-slate-400">(direct draft — no order needed)</span>
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Drafts touch no ledger. Posting creates the double entry
        {isInvoice ? ' (Dr Debtors / Cr Income & Tax Payable)' : ' (Dr Expense & Tax Payable / Cr Creditors)'}.
      </p>
      {errorMsg && <div className="mb-6"><Banner error={errorMsg} onDismiss={() => setErrorMsg('')} /></div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{isInvoice ? 'Customer' : 'Vendor'} *</label>
          <select value={header.contactId} onChange={(e) => setHeader({ ...header, contactId: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50">
            <option value="">Select…</option>
            {eligibleContacts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Document Date *</label>
          <input type="date" value={header.date} onChange={(e) => setHeader({ ...header, date: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Due Date *</label>
          <input type="date" value={header.dueDate} onChange={(e) => setHeader({ ...header, dueDate: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-3">Line Items</h3>
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Product</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Income/Expense A/c</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Analytic</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-20">Qty</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-28 text-right">Unit Price</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-20">Tax %</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">
                  <select value={line.productId} onChange={(e) => handleProductChange(idx, e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50">
                    <option value="">Ad-hoc item…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select value={line.accountId} onChange={(e) => setLine(idx, 'accountId', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50" title="Leave empty to use the default (4000 income / 5000 expense)">
                    <option value="">Default</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select value={line.analyticAccountId} onChange={(e) => setLine(idx, 'analyticAccountId', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50">
                    <option value="">None</option>
                    {analytics.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input type="text" value={line.description} onChange={(e) => setLine(idx, 'description', e.target.value)}
                    placeholder="Description" className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50/50" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => setLine(idx, 'quantity', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center bg-slate-50/50" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => setLine(idx, 'unitPrice', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-right bg-slate-50/50" />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min="0" step="0.01" value={line.taxRate} onChange={(e) => setLine(idx, 'taxRate', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-center bg-slate-50/50" />
                </td>
                <td className="px-3 py-2 text-center">
                  <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200">
            <tr><td colSpan={7} className="px-3 py-2 font-bold text-slate-600">Untaxed Amount</td><td className="px-3 py-2 text-right font-mono font-bold">{money(subtotal)}</td></tr>
            <tr><td colSpan={7} className="px-3 py-2 font-bold text-slate-600">Taxes</td><td className="px-3 py-2 text-right font-mono font-bold">{money(taxAmount)}</td></tr>
            <tr><td colSpan={7} className="px-3 py-3 font-bold text-slate-800">Total</td><td className="px-3 py-3 text-right font-extrabold text-slate-900">{money(subtotal + taxAmount)}</td></tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-4"><Button variant="secondary" onClick={addLine}>+ Add Line</Button></div>
    </div>
  );
};

const PaymentModal = ({ doc, onClose, onDone }) => {
  const [amount, setAmount] = useState(String(doc.balanceDue ?? ''));
  const [method, setMethod] = useState('bank');
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a positive amount.'); return; }
    if (amt > Number(doc.balanceDue) + 0.001) { setError('Amount cannot exceed balance due.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/invoices/${doc.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: amt, method, date }),
      });
      onDone();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-200">
        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Register Payment</h3>
        <p className="text-sm text-slate-500 mb-6">
          {doc.kind === 'bill' ? 'Pay vendor bill' : 'Receive from customer'} #{doc.id} — balance due {money(doc.balanceDue)}
        </p>
        {error && <div className="mb-4"><Banner error={error} onDismiss={() => setError('')} /></div>}
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Amount *</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Pay Via *</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50">
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>{saving ? 'Posting…' : 'Confirm Payment'}</Button>
        </div>
      </div>
    </div>
  );
};

const InvoiceDetailView = ({ invoiceId, onBack, onChanged }) => {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);

  const load = useCallback(async () => {
    try { setDoc(await apiFetch(`/invoices/${invoiceId}`)); } catch (e) { setError(e.message); }
  }, [invoiceId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="max-w-4xl mx-auto"><Banner error={error} onDismiss={onBack} /></div>;
  if (!doc) return <div className="text-center text-slate-400 py-24">Loading document…</div>;

  const handlePost = async () => {
    setActionError('');
    try {
      await apiFetch(`/invoices/${doc.id}/post`, { method: 'POST' });
      await load();
      onChanged();
    } catch (e) { setActionError(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <div className="flex gap-3">
          {doc.status === 'draft' && <Button onClick={handlePost} variant="primary">Post to Ledger</Button>}
          {doc.status !== 'draft' && doc.balanceDue > 0 && (
            <Button onClick={() => setPaymentOpen(true)} variant="success">Register Payment</Button>
          )}
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {doc.kind === 'bill' ? 'Vendor Bill' : 'Customer Invoice'} #{doc.id}
        </h2>
        <StatusPill status={doc.status} />
      </div>
      {actionError && <div className="mb-6"><Banner error={actionError} onDismiss={() => setActionError('')} /></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
        <div><span className="block text-xs text-slate-400 uppercase font-bold">{doc.kind === 'bill' ? 'Vendor' : 'Customer'}</span>{doc.contactName}</div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Date</span><span className="font-mono">{doc.date}</span></div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Due Date</span><span className="font-mono">{doc.dueDate}</span></div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Ledger Entry</span>{doc.transactionId ? `TXN-${doc.transactionId}` : 'not posted'}</div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Tax %</th><th className="px-4 py-3 text-right">Subtotal</th><th className="px-4 py-3 text-right">Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(doc.lines || []).map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">{l.productName || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.accountCode ? `${l.accountCode} ${l.accountName}` : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{l.description || '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{l.quantity}</td>
                <td className="px-4 py-3 text-right font-mono">{money(l.unitPrice)}</td>
                <td className="px-4 py-3 text-right font-mono">{l.taxRate}%</td>
                <td className="px-4 py-3 text-right font-mono">{money(l.lineSubtotal)}</td>
                <td className="px-4 py-3 text-right font-mono">{money(l.lineTax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200">
            <tr><td colSpan={6} className="px-4 py-2 font-bold text-slate-600">Subtotal</td><td colSpan={2} className="px-4 py-2 text-right font-mono font-bold">{money(doc.subtotal)}</td></tr>
            <tr><td colSpan={6} className="px-4 py-2 font-bold text-slate-600">Tax</td><td colSpan={2} className="px-4 py-2 text-right font-mono font-bold">{money(doc.taxAmount)}</td></tr>
            <tr><td colSpan={6} className="px-4 py-3 font-bold text-slate-800">Total</td><td colSpan={2} className="px-4 py-3 text-right font-extrabold text-slate-900">{money(doc.totalAmount)}</td></tr>
            <tr><td colSpan={6} className="px-4 py-2 font-bold text-emerald-700">Paid</td><td colSpan={2} className="px-4 py-2 text-right font-mono font-bold text-emerald-700">{money(doc.paid)}</td></tr>
            <tr><td colSpan={6} className="px-4 py-2 font-bold text-amber-700">Balance Due</td><td colSpan={2} className="px-4 py-2 text-right font-mono font-bold text-amber-700">{money(doc.balanceDue)}</td></tr>
          </tfoot>
        </table>
      </div>

      {(doc.payments || []).length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">Payment History</div>
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100">
              {doc.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-700">PAY-{p.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.date}</td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paymentOpen && (
        <PaymentModal doc={doc} onClose={() => setPaymentOpen(false)} onDone={async () => { setPaymentOpen(false); await load(); onChanged(); }} />
      )}
    </div>
  );
};

export default function InvoicesModule({ kind }) {
  const [docs, setDocs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeView, setActiveView] = useState('list');
  const [detailId, setDetailId] = useState(null);
  const [error, setError] = useState('');

  const isInvoice = kind === 'invoice';
  const loadDocs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ kind });
      if (statusFilter) params.set('status', statusFilter);
      setDocs(await apiFetch(`/invoices?${params}`));
    } catch (e) { setError(e.message); }
  }, [kind, statusFilter]);

  useEffect(() => {
    loadDocs();
    apiFetch('/contacts').then(setContacts).catch(() => {});
    apiFetch('/products').then(setProducts).catch(() => {});
    apiFetch('/accounts').then(setAccounts).catch(() => {});
    apiFetch('/analytic-accounts').then(setAnalytics).catch(() => {});
  }, [loadDocs]);

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(docs,
    (d, q) => (d.contactName || '').toLowerCase().includes(q) || String(d.id).includes(q));

  if (activeView === 'detail' && detailId) {
    return (
      <ModuleShell title={isInvoice ? 'Customer Invoices' : 'Vendor Bills'} error={error} onDismissError={() => setError('')}>
        <InvoiceDetailView invoiceId={detailId} onBack={() => setActiveView('list')} onChanged={loadDocs} />
      </ModuleShell>
    );
  }

  if (activeView === 'form') {
    return (
      <ModuleShell title={isInvoice ? 'Customer Invoices' : 'Vendor Bills'} error={error} onDismissError={() => setError('')}>
        <InvoiceFormView kind={kind} contacts={contacts} products={products} accounts={accounts} analytics={analytics}
          onBack={() => setActiveView('list')} onSaved={async () => { await loadDocs(); setActiveView('list'); }} />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      title={isInvoice ? 'Customer Invoices' : 'Vendor Bills'}
      subtitle={isInvoice ? 'Dr Debtors / Cr Income — posted when you issue' : 'Dr Expense / Cr Creditors — posted when you book the bill'}
      error={error} onDismissError={() => setError('')}
    >
      <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <input type="text" placeholder="Search documents…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white cursor-pointer">
              <option value="">All statuses</option>
              {['draft', 'posted', 'partial', 'paid'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={() => setActiveView('form')} variant="primary">New {isInvoice ? 'Invoice' : 'Bill'}</Button>
          </div>
        </div>

        <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">{isInvoice ? 'Customer' : 'Vendor'}</th>
                <th className="py-4 px-3">Date</th>
                <th className="py-4 px-3">Due Date</th>
                <th className="py-4 px-4 text-right">Total</th>
                <th className="py-4 px-4 text-right">Paid</th>
                <th className="py-4 px-4 text-right">Balance Due</th>
                <th className="py-4 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pageItems.map((d) => (
                <tr key={d.id} className="hover:bg-blue-50/40 cursor-pointer" onClick={() => { setDetailId(d.id); setActiveView('detail'); }}>
                  <td className="py-4 px-4 font-mono font-bold text-orange-600">{isInvoice ? 'INV' : 'BILL'}-{d.id}</td>
                  <td className="py-4 px-4 font-semibold text-slate-900">{d.contactName}</td>
                  <td className="py-4 px-3 font-mono text-xs text-slate-600">{d.date}</td>
                  <td className="py-4 px-3 font-mono text-xs text-slate-600">{d.dueDate}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold">{money(d.totalAmount)}</td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-600">{money(d.paid)}</td>
                  <td className="py-4 px-4 text-right font-mono text-amber-600 font-bold">{money(d.balanceDue)}</td>
                  <td className="py-4 px-3 text-center"><StatusPill status={d.status} /></td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan="8" className="py-12 text-center text-slate-400 font-medium">No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
      </div>
    </ModuleShell>
  );
}
