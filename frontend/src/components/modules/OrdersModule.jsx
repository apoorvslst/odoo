import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, today } from '../../lib/api';
import { Button, Banner, StatusPill, ModuleShell, Pagination, usePagedSearch } from './ui';

// Orders are commercial intents: they NEVER touch the ledger.
// Lifecycle: draft -> (POST /:id/confirm) confirmed -> (POST /:id/convert) converted + draft invoice/bill created.

const EMPTY_LINE = { productId: '', analyticAccountId: '', description: '', quantity: 1, unitPrice: '', taxRate: 0 };

const OrderFormView = ({ kind, contacts, products, analytics, onBack, onSaved }) => {
  const isSale = kind === 'sale';
  const [header, setHeader] = useState({ contactId: '', date: today() });
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const eligibleContacts = contacts.filter((c) => (isSale ? c.type === 'customer' || c.type === 'both' : c.type === 'vendor' || c.type === 'both'));

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
      return {
        ...l,
        productId,
        description: product.name,
        unitPrice: isSale ? product.salesPrice : product.purchaseCost,
      };
    }));
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);

  const lineTotal = (l) => {
    const q = parseFloat(l.quantity) || 0;
    const p = parseFloat(l.unitPrice) || 0;
    const tax = parseFloat(l.taxRate) || 0;
    return q * p * (1 + tax / 100);
  };
  const totalAmount = lines.reduce((acc, l) => acc + lineTotal(l), 0);

  const handleSubmit = async () => {
    if (!header.contactId) { setErrorMsg('Select a contact.'); return; }
    if (lines.some((l) => !l.productId && !l.description.trim())) { setErrorMsg('Every line needs a product or a description.'); return; }
    if (lines.some((l) => !l.unitPrice && !l.productId)) { setErrorMsg('Ad-hoc lines need a unit price.'); return; }
    setSaving(true);
    setErrorMsg('');
    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          contactId: Number(header.contactId),
          date: header.date,
          lines: lines.map((l) => ({
            productId: l.productId ? Number(l.productId) : null,
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
          {saving ? 'Creating…' : `Save ${isSale ? 'Sales Order' : 'Purchase Order'}`}
        </Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>
        New {isSale ? 'Sales Order' : 'Purchase Order'}
      </h2>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="field">
          <label className="label-sm">{isSale ? 'Customer *' : 'Vendor *'}</label>
          <select value={header.contactId} onChange={(e) => setHeader((h) => ({ ...h, contactId: e.target.value }))} className="input">
            <option value="">Select contact…</option>
            {eligibleContacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label-sm">Order Date</label>
          <input type="date" value={header.date} onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))} className="input mono" />
        </div>
      </div>

      <h3 className="h3" style={{ marginBottom: '0.75rem' }}>Line Items</h3>
      <div className="table-wrap" style={{ marginBottom: '1rem' }}>
        <table className="data-table compact">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Product</th>
              <th style={{ width: '28%' }}>Description</th>
              <th className="t-right" style={{ width: '10%' }}>Qty</th>
              <th className="t-right" style={{ width: '15%' }}>Unit Price</th>
              <th className="t-right" style={{ width: '14%' }}>Tax %</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td>
                  <select value={line.productId} onChange={(e) => handleProductChange(idx, e.target.value)} className="input">
                    <option value="">Custom / Ad-hoc</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            <tr>
              <td colSpan={4} className="t-right" style={{ fontWeight: 700 }}>Total (incl. tax)</td>
              <td colSpan={2} className="t-right mono" style={{ fontWeight: 700 }}>{money(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div><Button variant="secondary" onClick={addLine}>+ Add Line</Button></div>
    </div>
  );
};

const OrderDetailView = ({ order, onBack, onConfirm, onConvert, convertDueDate, setConvertDueDate, actionError }) => {
  const isSale = order.kind === 'sale';
  return (
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <div className="cluster">
          {order.status === 'draft' && (
            <Button onClick={onConfirm} variant="primary">Confirm Order</Button>
          )}
          {order.status === 'confirmed' && (
            <div className="cluster">
              <label className="tiny">Due Date:</label>
              <input type="date" value={convertDueDate} onChange={(e) => setConvertDueDate(e.target.value)} className="input mono" style={{ width: 'auto' }} />
              <Button onClick={onConvert} variant="primary">
                Convert to {isSale ? 'Invoice' : 'Bill'}
              </Button>
            </div>
          )}
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="row-between" style={{ marginBottom: '1.25rem' }}>
        <h2 className="h2">{isSale ? 'Sales Order' : 'Purchase Order'} #{order.id}</h2>
        <StatusPill status={order.status} />
      </div>
      {actionError && <div style={{ marginBottom: '1rem' }}><Banner error={actionError} /></div>}

      <div className="grid-3" style={{ marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
        <div><span className="tiny-up">{isSale ? 'Customer' : 'Vendor'}</span>{order.contactName}</div>
        <div><span className="tiny-up">Date</span><span className="mono">{order.date}</span></div>
        <div><span className="tiny-up">Status</span><span style={{ textTransform: 'capitalize' }}>{order.status}</span></div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th><th>Description</th>
              <th className="t-right">Qty</th><th className="t-right">Unit Price</th>
              <th className="t-right">Tax %</th><th className="t-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.lines || []).map((l) => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>{l.productName || '—'}</td>
                <td style={{ color: 'var(--muted)' }}>{l.description || '—'}</td>
                <td className="t-right mono">{l.quantity}</td>
                <td className="t-right mono">{money(l.unitPrice)}</td>
                <td className="t-right mono">{l.taxRate}%</td>
                <td className="t-right mono" style={{ fontWeight: 650 }}>{money(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="t-right" style={{ fontWeight: 700 }}>Total</td>
              <td className="t-right mono" style={{ fontWeight: 700 }}>{money(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default function OrdersModule({ kind }) {
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [detail, setDetail] = useState(null);
  const [convertDueDate, setConvertDueDate] = useState(today());
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const isSale = kind === 'sale';
  const loadOrders = useCallback(async () => {
    try { setOrders(await apiFetch(`/orders?kind=${kind}`)); } catch (e) { setError(e.message); }
  }, [kind]);

  useEffect(() => {
    loadOrders();
    apiFetch('/contacts').then(setContacts).catch(() => {});
    apiFetch('/products').then(setProducts).catch(() => {});
    apiFetch('/analytic-accounts').then(setAnalytics).catch(() => {});
  }, [loadOrders]);

  const openDetail = async (orderId) => {
    setActionError('');
    try {
      const full = await apiFetch(`/orders/${orderId}`);
      setDetail(full);
      setActiveView('detail');
    } catch (e) { setError(e.message); }
  };

  const handleConfirm = async () => {
    setActionError('');
    try {
      await apiFetch(`/orders/${detail.id}/confirm`, { method: 'POST' });
      await openDetail(detail.id);
      await loadOrders();
    } catch (e) { setActionError(e.message); }
  };

  const handleConvert = async () => {
    setActionError('');
    try {
      const doc = await apiFetch(`/orders/${detail.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ dueDate: convertDueDate }),
      });
      await openDetail(detail.id);
      await loadOrders();
      window.alert(`Draft ${isSale ? 'Customer Invoice' : 'Vendor Bill'} #${doc.id} created.`);
    } catch (e) { setActionError(e.message); }
  };

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(orders,
    (o, q) => (o.contactName || '').toLowerCase().includes(q) || String(o.id).includes(q) || o.status.includes(q));

  return (
    <ModuleShell
      title={isSale ? 'Sales Orders' : 'Purchase Orders'}
      subtitle={isSale ? 'Commercial intents for customers' : 'Commercial intents for vendors'}
      error={error} onDismissError={() => setError('')}
    >
      {activeView === 'form' && (
        <OrderFormView kind={kind} contacts={contacts} products={products} analytics={analytics}
          onBack={() => setActiveView('list')} onSaved={async () => { await loadOrders(); setActiveView('list'); }} />
      )}
      {activeView === 'detail' && detail && (
        <OrderDetailView order={detail} onBack={() => setActiveView('list')} onConfirm={handleConfirm}
          onConvert={handleConvert} convertDueDate={convertDueDate} setConvertDueDate={setConvertDueDate} actionError={actionError} />
      )}
      {activeView === 'list' && (
        <div className="panel fade-in">
          <div className="toolbar">
            <input type="text" placeholder="Search orders…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input grow" style={{ maxWidth: 400 }} />
            <Button onClick={() => setActiveView('form')} variant="primary">New {isSale ? 'Sales' : 'Purchase'} Order</Button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>#</th>
                  <th>{isSale ? 'Customer' : 'Vendor'}</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="t-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => openDetail(o.id)}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{isSale ? 'SO' : 'PO'}-{o.id}</td>
                    <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{o.contactName}</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{o.date}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="t-right mono" style={{ fontWeight: 700 }}>{money(o.totalAmount)}</td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan="5" className="empty">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
        </div>
      )}
    </ModuleShell>
  );
}
