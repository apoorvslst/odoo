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

  const setLine = (idx, field, value) => {
    if (['quantity', 'unitPrice', 'taxRate'].includes(field) && value !== '' && Number(value) < 0) {
      return;
    }
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

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
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <Button onClick={handleSubmit} disabled={saving} variant="primary">
          {saving ? 'Creating…' : `Save ${isInvoice ? 'Invoice' : 'Bill'}`}
        </Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>
        New {isInvoice ? 'Customer Invoice' : 'Vendor Bill'}
      </h2>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="field">
          <label className="label-sm">{isInvoice ? 'Customer *' : 'Vendor *'}</label>
          <select value={header.contactId} onChange={(e) => setHeader((h) => ({ ...h, contactId: e.target.value }))} className="input">
            <option value="">Select contact…</option>
            {eligibleContacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label-sm">Date</label>
          <input type="date" value={header.date} onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))} className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">Due Date</label>
          <input type="date" value={header.dueDate} onChange={(e) => setHeader((h) => ({ ...h, dueDate: e.target.value }))} className="input mono" />
        </div>
      </div>

      <h3 className="h3" style={{ marginBottom: '0.75rem' }}>Line Items</h3>
      <div className="table-wrap" style={{ marginBottom: '1rem' }}>
        <table className="data-table compact">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Product</th>
              <th style={{ width: '15%' }}>Account</th>
              <th style={{ width: '15%' }}>Analytic</th>
              <th style={{ width: '20%' }}>Description</th>
              <th className="t-right" style={{ width: '8%' }}>Qty</th>
              <th className="t-right" style={{ width: '10%' }}>Unit Price</th>
              <th className="t-right" style={{ width: '10%' }}>Tax %</th>
              <th style={{ width: '4%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td>
                  <select value={line.productId} onChange={(e) => handleProductChange(idx, e.target.value)} className="input">
                    <option value="">Custom / Service…</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td>
                  <select value={line.accountId} onChange={(e) => setLine(idx, 'accountId', e.target.value)} className="input">
                    <option value="">Default Account</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} {a.accountName}</option>)}
                  </select>
                </td>
                <td>
                  <select value={line.analyticAccountId || ''} onChange={(e) => setLine(idx, 'analyticAccountId', e.target.value)} className="input">
                    <option value="">None</option>
                    {analytics.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </td>
                <td>
                  <input type="text" value={line.description} onChange={(e) => setLine(idx, 'description', e.target.value)}
                    placeholder="Description" className="input" />
                </td>
                <td>
                  <input type="number" min="0" step="0.1" value={line.quantity} onChange={(e) => setLine(idx, 'quantity', e.target.value)}
                    className="input t-right mono" />
                </td>
                <td>
                  <input type="number" min="0" step="0.1" value={line.unitPrice} onChange={(e) => setLine(idx, 'unitPrice', e.target.value)}
                    className="input t-right mono" />
                </td>
                <td>
                  <input type="number" min="0" step="0.1" value={line.taxRate} onChange={(e) => setLine(idx, 'taxRate', e.target.value)}
                    className="input t-right mono" />
                </td>
                <td className="t-center">
                  <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="btn-icon" title="Remove line">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={5} className="t-right">Untaxed Amount</td><td colSpan={2} className="t-right mono">{money(subtotal)}</td></tr>
            <tr><td colSpan={5} className="t-right">Taxes</td><td colSpan={2} className="t-right mono">{money(taxAmount)}</td></tr>
            <tr><td colSpan={5} className="t-right" style={{ fontWeight: 700 }}>Total</td><td colSpan={2} className="t-right mono" style={{ fontWeight: 700 }}>{money(subtotal + taxAmount)}</td></tr>
          </tfoot>
        </table>
      </div>
      <div><Button variant="secondary" onClick={addLine}>+ Add Line</Button></div>
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
    <div className="modal-backdrop">
      <div className="modal stack">
        <h3 className="h2">Register Payment</h3>
        <p className="tiny">
          {doc.kind === 'bill' ? 'Pay vendor bill' : 'Receive from customer'} #{doc.id} — balance due {money(doc.balanceDue)}
        </p>
        {error && <Banner error={error} onDismiss={() => setError('')} />}
        <div className="stack-sm">
          <div className="field">
            <label className="label-sm">Amount</label>
            <input type="number" min="0" step="0.1" value={amount} onChange={(e) => {
              if (e.target.value !== '' && Number(e.target.value) < 0) return;
              setAmount(e.target.value);
            }}
              className="input mono" />
          </div>
          <div className="field">
            <label className="label-sm">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div className="field">
            <label className="label-sm">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mono" />
          </div>
        </div>
        <div className="cluster" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
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
  if (!doc) return <div className="loading">Loading document…</div>;

  const handlePost = async () => {
    setActionError('');
    try {
      await apiFetch(`/invoices/${doc.id}/post`, { method: 'POST' });
      await load();
      onChanged();
    } catch (e) { setActionError(e.message); }
  };

  const handleSendReminder = async () => {
    setActionError('');
    try {
      const res = await apiFetch(`/invoices/${doc.id}/remind`, { method: 'POST' });
      if (res.url) {
        window.open(res.url, '_blank');
      }
      alert('Reminder sent successfully! ' + (res.url ? 'Opening preview...' : ''));
    } catch (e) { setActionError(e.message); }
  };

  return (
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <div className="cluster">
          {doc.status === 'draft' && <Button onClick={handlePost} variant="primary">Post to Ledger</Button>}
          {doc.status !== 'draft' && doc.balanceDue > 0 && (
            <>
              <Button onClick={() => setPaymentOpen(true)} variant="primary">Register Payment</Button>
              <Button onClick={handleSendReminder} variant="secondary">Send Reminder</Button>
            </>
          )}
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="row-between" style={{ marginBottom: '1.25rem' }}>
        <h2 className="h2">
          {doc.kind === 'bill' ? 'Vendor Bill' : 'Customer Invoice'} #{doc.id}
        </h2>
        <StatusPill status={doc.status} />
      </div>
      {actionError && <div style={{ marginBottom: '1rem' }}><Banner error={actionError} onDismiss={() => setActionError('')} /></div>}

      <div className="grid-4" style={{ marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
        <div><span className="tiny-up">{doc.kind === 'bill' ? 'Vendor' : 'Customer'}</span>{doc.contactName}</div>
        <div><span className="tiny-up">Date</span><span className="mono">{doc.date}</span></div>
        <div><span className="tiny-up">Due Date</span><span className="mono">{doc.dueDate}</span></div>
        <div><span className="tiny-up">Ledger Entry</span>{doc.transactionId ? `TXN-${doc.transactionId}` : 'Not Posted'}</div>
      </div>

      <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th><th>Account</th><th>Description</th>
              <th className="t-right">Qty</th><th className="t-right">Unit Price</th>
              <th className="t-right">Tax %</th><th className="t-right">Subtotal</th><th className="t-right">Tax</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lines || []).map((l) => (
              <tr key={l.id}>
                <td>{l.productName || '—'}</td>
                <td className="mono" style={{ fontSize: '11px' }}>{l.accountCode ? `${l.accountCode} ${l.accountName}` : '—'}</td>
                <td style={{ color: 'var(--muted)' }}>{l.description || '—'}</td>
                <td className="t-right mono">{l.quantity}</td>
                <td className="t-right mono">{money(l.unitPrice)}</td>
                <td className="t-right mono">{l.taxRate}%</td>
                <td className="t-right mono">{money(l.lineSubtotal)}</td>
                <td className="t-right mono">{money(l.lineTax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={6} className="t-right">Subtotal</td><td colSpan={2} className="t-right mono">{money(doc.subtotal)}</td></tr>
            <tr><td colSpan={6} className="t-right">Tax</td><td colSpan={2} className="t-right mono">{money(doc.taxAmount)}</td></tr>
            <tr><td colSpan={6} className="t-right" style={{ fontWeight: 700 }}>Total</td><td colSpan={2} className="t-right mono" style={{ fontWeight: 700 }}>{money(doc.totalAmount)}</td></tr>
            <tr><td colSpan={6} className="t-right" style={{ color: 'var(--ok)' }}>Paid</td><td colSpan={2} className="t-right mono" style={{ color: 'var(--ok)', fontWeight: 700 }}>{money(doc.paid)}</td></tr>
            <tr><td colSpan={6} className="t-right" style={{ color: 'var(--warn)' }}>Balance Due</td><td colSpan={2} className="t-right mono" style={{ color: 'var(--warn)', fontWeight: 700 }}>{money(doc.balanceDue)}</td></tr>
          </tfoot>
        </table>
      </div>

      {(doc.payments || []).length > 0 && (
        <div className="table-wrap">
          <div className="table-cap">Payment History</div>
          <table className="data-table compact">
            <tbody>
              {doc.payments.map((p) => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--ok)' }}>PAY-{p.id}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{p.date}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                  <td className="t-right mono" style={{ fontWeight: 700 }}>{money(p.amount)}</td>
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
      subtitle={isInvoice ? 'Accounts Receivable & revenue posting' : 'Accounts Payable & expense posting'}
      error={error} onDismissError={() => setError('')}
    >
      <div className="panel fade-in">
        <div className="toolbar">
          <input type="text" placeholder="Search documents…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="input grow" style={{ maxWidth: 400 }} />
          <div className="cluster">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input" style={{ width: 'auto' }}>
              <option value="">All Statuses</option>
              {['draft', 'posted', 'partial', 'paid'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={() => setActiveView('form')} variant="primary">New {isInvoice ? 'Invoice' : 'Bill'}</Button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>#</th>
                <th>{isInvoice ? 'Customer' : 'Vendor'}</th>
                <th>Date</th>
                <th>Due Date</th>
                <th className="t-right">Total</th>
                <th className="t-right">Paid</th>
                <th className="t-right">Balance Due</th>
                <th className="t-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d) => (
                <tr key={d.id} className="clickable" onClick={() => { setDetailId(d.id); setActiveView('detail'); }}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{isInvoice ? 'INV' : 'BILL'}-{d.id}</td>
                  <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{d.contactName}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{d.date}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{d.dueDate}</td>
                  <td className="t-right mono" style={{ fontWeight: 700 }}>{money(d.totalAmount)}</td>
                  <td className="t-right mono" style={{ color: 'var(--ok)' }}>{money(d.paid)}</td>
                  <td className="t-right mono" style={{ color: 'var(--warn)', fontWeight: 700 }}>{money(d.balanceDue)}</td>
                  <td className="t-center"><StatusPill status={d.status} /></td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={8} className="empty">No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
      </div>
    </ModuleShell>
  );
}
