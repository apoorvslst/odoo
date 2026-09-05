import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, clearSession } from '../lib/api';
import { Button, Banner, StatusPill, TypewriterText } from './modules/ui';

const docLabel = (doc, kind) => {
  if (doc.id?.toString().startsWith('INV') || doc.id?.toString().startsWith('VB')) return doc.id;
  return kind === 'bill' ? `VB/2026/${String(doc.id).padStart(4, '0')}` : `INV/2026/${String(doc.id).padStart(4, '0')}`;
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
        <button type="button" onClick={onClose} className="btn-icon" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
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
      ) : (
        doc.status !== 'draft' && <div className="notice ok">Fully paid. No balance remaining.</div>
      )}
    </div>
  );
};

export default function PortalDashboard({ user, onLogout }) {
  const isVendor = user?.contactType === 'vendor';
  const isCustomer = user?.contactType === 'customer';
  const [docs, setDocs] = useState([]);
  const [kind, setKind] = useState(isVendor ? 'bill' : 'invoice');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/portal/documents?kind=${kind}`);
      setDocs(data);
    } catch (e) { setError(e.message); }
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
  const initials = (user?.username || user?.email || 'CP').slice(0, 2).toUpperCase();

  const portalTag = isVendor
    ? 'VYAPAR360 VENDOR PORTAL'
    : isCustomer
    ? 'VYAPAR360 CUSTOMER PORTAL'
    : 'VYAPAR360 PARTNER PORTAL';

  const portalTitle = isVendor
    ? 'Vendor Portal Workspace'
    : isCustomer
    ? 'Customer Portal Workspace'
    : 'Customer & Partner Portal';

  const portalDesc = isVendor
    ? 'Synchronized vendor bills, purchase orders, and payment receipts.'
    : isCustomer
    ? 'Synchronized sales invoices, commercial orders, and payment receipts.'
    : 'Synchronized orders, invoices, vendor bills, and payment settlements.';

  return (
    <div className="portal">
      <div className="portal-inner">
        <div className="portal-hero fade-in">
          <div>
            <span className="portal-tag">{portalTag} {loading && '· Syncing…'}</span>
            <h1 className="h1" style={{ marginTop: 8 }}>{portalTitle}</h1>
            <p className="lede">{portalDesc}</p>
          </div>
          <div className="cluster">
            <div className="avatar-sm">{initials}</div>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
          </div>
        </div>

        {error && <Banner error={error} onDismiss={() => setError('')} />}

        <div className="grid-4 fade-in">
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

        <div className="row-between fade-in">
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
            placeholder="Search documents…" className="input" style={{ maxWidth: 240 }} />
        </div>

        <div className="panel fade-in" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document #</th><th>Party</th><th>Date</th><th>Due Date</th>
                  <th className="t-right">Total</th><th>Status</th><th className="t-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => {
                  const isPaid = Number(d.balanceDue) <= 0 && d.status !== 'draft';
                  return (
                    <tr key={d.id} className="clickable" onClick={() => setDetailId(d.id)}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{docLabel(d, kind)}</td>
                      <td style={{ fontWeight: 600 }}>{d.contactName || user?.username || '—'}</td>
                      <td className="mono tiny">{d.date}</td>
                      <td className="mono tiny">{d.dueDate || '—'}</td>
                      <td className="t-right mono" style={{ fontWeight: 700 }}>{money(d.totalAmount)}</td>
                      <td><StatusPill status={d.status} /></td>
                      <td className="t-right">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDetailId(d.id); }} className="btn btn-secondary btn-sm">
                          {isPaid ? 'Details' : 'View & Pay'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && !loading && (
                  <tr><td colSpan={7} className="empty">No documents found.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={7} className="empty">Loading…</td></tr>
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

      {detailId && (
        <div className="modal-backdrop">
          <DocumentDetailView docId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
        </div>
      )}
    </div>
  );
}
