import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, clearSession, today } from '../lib/api';
import { Button, Banner, StatusPill, TypewriterText } from './modules/ui';
import CustomerStorefront from './CustomerStorefront';

const docLabel = (doc, kind) => {
  if (doc.id?.toString().startsWith('INV') || doc.id?.toString().startsWith('VB')) return doc.id;
  return kind === 'bill' ? `VB/2026/${String(doc.id).padStart(4, '0')}` : `INV/2026/${String(doc.id).padStart(4, '0')}`;
};

const VendorBillForm = ({ products, onClose, onSaved }) => {
  const [form, setForm] = useState({
    date: today(),
    dueDate: today(),
    productId: '',
    quantity: 1,
    unitPrice: '',
    taxRate: 18,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find((p) => String(p.id) === String(form.productId));

  const handleProductChange = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    setForm((prev) => ({
      ...prev,
      productId,
      unitPrice: product ? product.purchaseCost : prev.unitPrice,
    }));
  };

  const submit = async () => {
    const quantity = Number(form.quantity);
    const unitPrice = Number(form.unitPrice);
    const taxRate = Number(form.taxRate);
    if (!form.date || !form.dueDate) { setError('Invoice and due dates are required.'); return; }
    if (!(quantity > 0)) { setError('Quantity must be positive.'); return; }
    if (!(unitPrice >= 0)) { setError('Unit price is required.'); return; }
    if (taxRate < 0 || taxRate > 100) { setError('Tax rate must be between 0 and 100.'); return; }

    setSaving(true);
    setError('');
    try {
      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'bill',
          date: form.date,
          dueDate: form.dueDate,
          lines: [{
            productId: form.productId ? Number(form.productId) : null,
            description: selectedProduct?.name || 'Vendor bill line',
            quantity,
            unitPrice,
            taxRate,
          }],
        }),
      });
      onSaved();
      onClose();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="modal modal-wide stack">
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="h2">Submit Vendor Bill</h3>
          <p className="tiny">Draft bill only — internal accountant will review and post it to the ledger.</p>
        </div>
        <button type="button" onClick={onClose} className="btn-icon" title="Close">✕</button>
      </div>

      {error && <Banner error={error} onDismiss={() => setError('')} />}

      <div className="grid-2">
        <div className="field">
          <label className="label-sm">Bill Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">Due Date</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input mono" />
        </div>
      </div>

      <div className="field">
        <label className="label-sm">Product</label>
        <select value={form.productId} onChange={(e) => handleProductChange(e.target.value)} className="input">
          <option value="">Select product / service…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid-4">
        <div className="field">
          <label className="label-sm">Quantity</label>
          <input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">Unit Price</label>
          <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">Tax %</label>
          <input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">Estimated Total</label>
          <div className="input mono" style={{ background: 'var(--bg)', borderColor: 'var(--line-soft)' }}>
            {money((Number(form.quantity || 0) * Number(form.unitPrice || 0)) * (1 + Number(form.taxRate || 0) / 100))}
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Draft Bill'}</Button>
      </div>
    </div>
  );
};

const DocumentDetailView = ({ docId, onClose, onChanged }) => {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [method, setMethod] = useState('bank');
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch(`/portal/documents/${docId}`);
      setDoc(d);
      setAmount(String(d.balanceDue ?? ''));
    } catch (e) { setError(e.message); }
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="container" style={{ maxWidth: 672 }}><Banner error={error} onDismiss={onClose} /></div>;
  if (!doc) return <div className="loading">Loading…</div>;

  const handlePay = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setActionError('Enter a positive amount.'); return; }
    if (amt > Number(doc.balanceDue) + 0.001) { setActionError('Amount cannot exceed balance due.'); return; }
    setPaying(true);
    setActionError('');
    try {
      await apiFetch(`/portal/documents/${doc.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount: amt, method }),
      });
      await load();
      onChanged();
    } catch (e) { setActionError(e.message); }
    setPaying(false);
  };

  return (
    <div className="modal modal-wide stack">
      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="h2">{doc.kind === 'bill' ? 'Vendor Bill' : 'Customer Invoice'} #{doc.id}</h3>
          <p className="tiny">Issued {doc.date} · Due {doc.dueDate || '—'}</p>
        </div>
        <div className="cluster">
          <button type="button" onClick={() => window.open(`/?print=${doc.id}`, '_blank')} className="btn btn-secondary btn-sm" title="Download PDF Invoice">
            Download PDF
          </button>
          <button type="button" onClick={onClose} className="btn-icon" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {actionError && <Banner error={actionError} onDismiss={() => setActionError('')} />}

      <div className="grid-4" style={{ fontSize: '0.8125rem' }}>
        <div><span className="tiny-up">Total</span>{money(doc.totalAmount)}</div>
        <div><span className="tiny-up">Paid</span>{money(doc.paid)}</div>
        <div><span className="tiny-up">Balance Due</span><span className="mono" style={{ fontWeight: 700, color: 'var(--warn)' }}>{money(doc.balanceDue)}</span></div>
        <div><span className="tiny-up">Status</span><StatusPill status={doc.status} /></div>
      </div>

      {(doc.lines || []).length > 0 && (
        <div className="table-wrap">
          <table className="data-table compact">
            <thead>
              <tr><th>Description</th><th className="t-right">Qty</th><th className="t-right">Unit Price</th></tr>
            </thead>
            <tbody>
              {doc.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.description || l.productName || '—'}</td>
                  <td className="t-right mono">{l.quantity}</td>
                  <td className="t-right mono">{money(l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {doc.status !== 'draft' && doc.balanceDue > 0 ? (
        <div className="stack" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
          <h4 className="h3">Register Payment</h4>
          <div className="grid-2">
            {['bank', 'cash'].map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`method-btn ${method === m ? 'is-on' : ''}`}>
                Pay with {m}
              </button>
            ))}
          </div>
          <input type="number" min="0" step="0.1" value={amount} onChange={(e) => {
            if (e.target.value !== '' && Number(e.target.value) < 0) return;
            setAmount(e.target.value);
          }} className="input mono" />
          <div className="row">
            <Button variant="secondary" className="btn-half" onClick={onClose}>Close</Button>
            <Button variant="primary" className="btn-half" onClick={handlePay} disabled={paying}>
              {paying ? 'Processing…' : `Pay ${money(amount || 0)}`}
            </Button>
          </div>
        </div>
      ) : doc.status === 'draft' ? (
        <div className="notice warn stack" style={{ marginTop: '1rem' }}>
          {doc.kind === 'bill' ? (
            <>
              <p>This Purchase Order / Draft Bill is currently <strong>PENDING APPROVAL</strong>.</p>
              <div className="row" style={{ marginTop: 8 }}>
                <Button variant="primary" onClick={async () => {
                  try {
                    await apiFetch(`/portal/documents/${doc.id}/approve`, { method: 'POST' });
                    await load();
                    onChanged();
                  } catch (e) { setActionError(e.message); }
                }}>Accept & Confirm Order</Button>
              </div>
            </>
          ) : (
            <p>This order is currently <strong>PENDING APPROVAL</strong> from the store administrator. You will be able to complete your payment once it is approved.</p>
          )}
        </div>
      ) : (
        <div className="notice ok" style={{ marginTop: '1rem' }}>Fully paid. No balance remaining.</div>
      )}
    </div>
  );
};

const ContactAdminForm = () => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    setLoading(true);
    setStatus('');
    try {
      await apiFetch('/portal/messages', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setStatus('Message sent successfully! We will get back to you soon.');
      setForm({ subject: '', message: '' });
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="panel stack fade-in" style={{ maxWidth: 600, margin: '2rem auto' }}>
      <div className="panel-head">
        <h3 className="h3">Contact Administrator</h3>
        <p className="tiny">Send a direct message to the store owner or support team.</p>
      </div>
      {status && <div className={status.startsWith('Error') ? 'notice warn' : 'notice ok'}>{status}</div>}
      <form onSubmit={submit} className="stack">
        <div className="field">
          <label className="label-sm">Subject</label>
          <input type="text" className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required placeholder="E.g. Issue with my recent order" />
        </div>
        <div className="field">
          <label className="label-sm">Message</label>
          <textarea className="input" rows="5" value={form.message} onChange={e => setForm({...form, message: e.target.value})} required placeholder="Type your message here..." />
        </div>
        <div>
          <Button variant="primary" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</Button>
        </div>
      </form>
    </div>
  );
};

const TransactionLinesTab = () => {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/portal/documents/lines')
      .then(data => { setLines(data); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  if (loading) return <div className="loading" style={{ margin: '2rem' }}>Loading transaction lines...</div>;

  return (
    <div className="panel fade-in" style={{ margin: '2rem' }}>
      <div className="panel-head">
        <h3 className="h3">Transaction Lines</h3>
        <p className="tiny">A complete history of every item you've purchased.</p>
      </div>
      <div className="table-wrap" style={{ border: 'none' }}>
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Date</th>
              <th>Document</th>
              <th>Product / Description</th>
              <th className="t-right">Qty</th>
              <th className="t-right">Unit Price</th>
              <th className="t-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan="6" className="t-center empty">No transaction lines found.</td></tr>
            ) : lines.map(l => (
              <tr key={l.id}>
                <td className="mono tiny">{l.date}</td>
                <td className="mono" style={{fontWeight: 600}}>INV/2026/{String(l.invoiceId).padStart(4, '0')}</td>
                <td>{l.productName || l.description}</td>
                <td className="t-right mono">{l.quantity}</td>
                <td className="t-right mono">{money(l.unitPrice)}</td>
                <td className="t-right mono" style={{fontWeight: 700}}>{money(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function PortalDashboard({ user, onLogout }) {
  const isVendor = user?.contactType === 'vendor';
  const isCustomer = user?.contactType === 'customer';
  
  const [activeTab, setActiveTab] = useState(isCustomer ? 'store' : 'orders');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [docs, setDocs] = useState([]);
  const [kind, setKind] = useState(isVendor ? 'bill' : 'invoice');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        apiFetch(`/portal/documents?kind=${kind}`),
        apiFetch('/products'),
      ]);
      setDocs(dRes);
      setProducts(pRes);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    clearSession();
    if (typeof onLogout === 'function') onLogout();
  };

  const outstanding = docs.reduce((acc, d) => acc + Number(d.balanceDue || 0), 0);
  const totalBilled = docs.reduce((acc, d) => acc + Number(d.totalAmount || 0), 0);
  const totalPaid = docs.reduce((acc, d) => acc + Number(d.paid || 0), 0);

  const filtered = docs.filter((d) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'paid' && Number(d.balanceDue) <= 0 && d.status !== 'draft') ||
      (filter === 'pending' && Number(d.balanceDue) > 0 && d.status !== 'draft' && d.status !== 'overdue') ||
      (filter === 'overdue' && d.status === 'overdue');
    const searchLower = search.toLowerCase();
    const matchSearch = !search ||
      docLabel(d, kind).toLowerCase().includes(searchLower) ||
      (d.contactName || '').toLowerCase().includes(searchLower);
    return matchFilter && matchSearch;
  });

  const pageSize = 10;
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  
  const portalTag = isVendor ? 'VYAPAR360 VENDOR' : 'VYAPAR360 CUSTOMER';
  
  // Render tabs
  const renderTab = () => {
    if (activeTab === 'store') return <div style={{padding: '2rem'}}><CustomerStorefront onCheckoutSuccess={load} /></div>;
    if (activeTab === 'contact') return <ContactAdminForm />;
    if (activeTab === 'lines') return <TransactionLinesTab />;
    if (activeTab === 'payments') {
      return (
        <div className="fade-in" style={{ padding: '2rem' }}>
          <h2 className="h2" style={{ marginBottom: '1.5rem' }}>Payment Dashboard</h2>
          <div className="grid-4">
            <div className="stat-card">
              <span className="tiny-up">{isVendor ? 'Outstanding Payable' : 'Outstanding Due'}</span>
              <p className="value" style={{ color: 'var(--warn)' }}><TypewriterText text={money(outstanding)} speed={40} /></p>
              <p className="tiny">{isVendor ? 'Pending disbursements' : 'Remaining balance due'}</p>
            </div>
            <div className="stat-card">
              <span className="tiny-up">{isVendor ? 'Total Received' : 'Total Settled'}</span>
              <p className="value" style={{ color: 'var(--ok)' }}><TypewriterText text={money(totalPaid)} speed={40} /></p>
              <p className="tiny">{isVendor ? 'Cleared payouts' : 'Cleared payments'}</p>
            </div>
            <div className="stat-card">
              <span className="tiny-up">{isVendor ? 'Total Billed Amount' : 'Total Invoiced'}</span>
              <p className="value"><TypewriterText text={money(totalBilled)} speed={40} /></p>
              <p className="tiny">{isVendor ? 'Lifetime billing volume' : 'Total sales volume'}</p>
            </div>
            <div className="stat-card">
              <span className="tiny-up">Documents</span>
              <p className="value"><TypewriterText text={docs.length} speed={30} /></p>
              <p className="tiny">{docs.filter((d) => Number(d.balanceDue) > 0).length} pending</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Default / Orders Tab
    return (
      <div className="fade-in" style={{ padding: '2rem' }}>
        <h2 className="h2" style={{ marginBottom: '1.5rem' }}>{isVendor ? 'Purchase Orders' : 'Previous Orders & Invoices'}</h2>
        <div className="row-between" style={{ marginBottom: '1rem' }}>
          <div className="cluster">
            {[{ id: 'invoice', label: 'Invoices' }, { id: 'bill', label: 'Bills' }].map((t) => (
              <button key={t.id} type="button" onClick={() => { setKind(t.id); setFilter('all'); setPage(1); }}
                className={`subtab ${kind === t.id ? 'is-on' : ''}`}>{t.label}</button>
            ))}
            {['all', 'pending', 'overdue', 'paid'].map((f) => (
              <button key={f} type="button" onClick={() => { setFilter(f); setPage(1); }}
                className={`chip-tab ${filter === f ? 'is-on' : ''}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents..." className="input" style={{ maxWidth: 240 }} />
        </div>

        <div className="panel" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document #</th><th>Date</th><th>Due Date</th>
                  <th className="t-right">Total</th><th>Status</th><th className="t-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => {
                  const isDraft = d.status === 'draft';
                  const isPaid = Number(d.balanceDue) <= 0 && !isDraft;
                  
                  return (
                    <tr key={d.id} className="clickable" onClick={() => setDetailId(d.id)}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{docLabel(d, kind)}</td>
                      <td className="mono tiny">{d.date}</td>
                      <td className="mono tiny">{d.dueDate || '—'}</td>
                      <td className="t-right mono" style={{ fontWeight: 700 }}>{money(d.totalAmount)}</td>
                      <td>
                        {isDraft ? (
                          <span className="portal-tag" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>PENDING APPROVAL</span>
                        ) : (
                          <StatusPill status={d.status} />
                        )}
                      </td>
                      <td className="t-right">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDetailId(d.id); }} className="btn btn-secondary btn-sm" disabled={isDraft && !isVendor}>
                          {isDraft ? 'Details' : isPaid ? 'Details' : 'View & Pay'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && !loading && (
                  <tr><td colSpan={6} className="empty">No documents found.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={6} className="empty">Loading...</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > pageSize && (
            <div className="pagination" style={{ margin: 0, padding: '1rem 1.25rem' }}>
              <span>Page {page} of {totalPages}</span>
              <div className="cluster">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="btn btn-secondary btn-sm">Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="btn btn-secondary btn-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-shell">
      {/* Sidebar Nav */}
      <aside className={`sidebar ${!sidebarOpen ? 'is-slim' : ''}`}>
        <div className="sidebar-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div style={{ width: 28, height: 22, background: '#0052cc', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>
              V
            </div>
            {sidebarOpen && <span className="sidebar-title">PORTAL</span>}
          </div>
          <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            {sidebarOpen && <div className="nav-group-label">CUSTOMER PORTAL</div>}
            <button type="button" onClick={() => setActiveTab('store')} className={`nav-item ${activeTab === 'store' ? 'is-active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              {sidebarOpen && <span>Online Store</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('payments')} className={`nav-item ${activeTab === 'payments' ? 'is-active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
              {sidebarOpen && <span>Payment Dashboard</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('orders')} className={`nav-item ${activeTab === 'orders' ? 'is-active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              {sidebarOpen && <span>Previous Orders</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('lines')} className={`nav-item ${activeTab === 'lines' ? 'is-active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              {sidebarOpen && <span>Transaction Lines</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('contact')} className={`nav-item ${activeTab === 'contact' ? 'is-active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {sidebarOpen && <span>Contact Admin</span>}
            </button>
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="row">
            <div className="avatar-sm" style={{ width: 32, height: 32, borderRadius: 4, background: '#1e293b' }}>
              {(user?.username || 'C').charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="grow">
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{user?.username || 'Customer'}</p>
                <p className="user-role">
                  <span className="dot" />
                  {isVendor ? 'Vendor' : 'Customer'}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button type="button" onClick={handleLogout} className="btn-icon" title="Logout" style={{ color: '#8b99ad' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        
        {/* Top Navbar */}
        <header className="topbar">
          <div className="row">
            <p className="crumb">Portal <span style={{ margin: '0 4px', color: '#cbd5e1' }}>/</span> <strong>{activeTab.toUpperCase()}</strong></p>
          </div>
          <div className="cluster">
             <span className="mode-pill">{portalTag} Workspace</span>
             {error && <Banner error={error} onDismiss={() => setError('')} />}
             {isVendor && <button type="button" onClick={() => setShowBillForm(true)} className="btn btn-primary btn-sm">Submit Bill</button>}
          </div>
        </header>

        {/* Tab Content */}
        <main className="app-content">
          {renderTab()}
        </main>

        {showBillForm && (
          <div className="modal-backdrop">
            <VendorBillForm products={products} onClose={() => setShowBillForm(false)} onSaved={load} />
          </div>
        )}

        {detailId && (
          <div className="modal-backdrop">
            <DocumentDetailView docId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
          </div>
        )}
      </div>
    </div>
  );
}
