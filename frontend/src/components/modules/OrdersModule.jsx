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

  // sale orders need customer/both contacts; purchase orders need vendor/both.
  const eligibleContacts = contacts.filter((c) => (isSale ? c.type === 'customer' || c.type === 'both' : c.type === 'vendor' || c.type === 'both'));

  const setLine = (idx, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  // Picking a product auto-fills unit price (sales price on sale, cost on purchase) and description.
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
    <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <div className="flex gap-3">
          <Button onClick={handleSubmit} variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Save Draft'}</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        {isSale ? 'New Sales Order' : 'New Purchase Order'}
      </h2>
      {errorMsg && <div className="mb-6"><Banner error={errorMsg} onDismiss={() => setErrorMsg('')} /></div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{isSale ? 'Customer' : 'Vendor'} *</label>
          <select value={header.contactId} onChange={(e) => setHeader({ ...header, contactId: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50">
            <option value="">Select…</option>
            {eligibleContacts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Order Date *</label>
          <input type="date" value={header.date} onChange={(e) => setHeader({ ...header, date: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-3">{isSale ? 'Sales' : 'Purchase'} Order Items</h3>
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Product</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Analytic</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase">Description</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-20">Qty</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-28 text-right">Unit Price</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-20">Tax %</th>
              <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase w-28 text-right">Total</th>
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
                <td className="px-3 py-2 text-right font-bold text-slate-900">{money(lineTotal(line))}</td>
                <td className="px-3 py-2 text-center">
                  <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200">
            <tr>
              <td colSpan={6} className="px-3 py-3 font-bold text-slate-700">Total (incl. tax)</td>
              <td className="px-3 py-3 text-right font-extrabold text-slate-900">{money(totalAmount)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-4"><Button variant="secondary" onClick={addLine}>+ Add Item Line</Button></div>
    </div>
  );
};

const OrderDetailView = ({ order, onBack, onConfirm, onConvert, convertDueDate, setConvertDueDate, actionError }) => (
  <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
    <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
      <div className="flex gap-3">
        {order.status === 'draft' && <Button onClick={onConfirm} variant="primary">Confirm Order</Button>}
        {order.status === 'confirmed' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={convertDueDate} onChange={(e) => setConvertDueDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" title="Due date for the created draft document" />
            <Button onClick={onConvert} variant="success">Convert to {order.kind === 'sale' ? 'Invoice' : 'Bill'}</Button>
          </div>
        )}
      </div>
      <Button onClick={onBack} variant="secondary">Back</Button>
    </div>

    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        {order.kind === 'sale' ? 'Sales Order' : 'Purchase Order'} #{order.id}
      </h2>
      <StatusPill status={order.status} />
    </div>
    {actionError && <div className="mb-6"><Banner error={actionError} onDismiss={() => {}} /></div>}

    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-sm">
      <div><span className="block text-xs text-slate-400 uppercase font-bold">Contact</span>{order.contactName}</div>
      <div><span className="block text-xs text-slate-400 uppercase font-bold">Date</span><span className="font-mono">{order.date}</span></div>
      <div><span className="block text-xs text-slate-400 uppercase font-bold">Total</span><span className="font-bold">{money(order.totalAmount)}</span></div>
    </div>

    <div className="border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Product</th><th className="px-4 py-3">Description</th>
            <th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit Price</th>
            <th className="px-4 py-3 text-right">Tax %</th><th className="px-4 py-3 text-right">Line Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(order.lines || []).map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3">{l.productName || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{l.description || '—'}</td>
              <td className="px-4 py-3 text-right font-mono">{l.quantity}</td>
              <td className="px-4 py-3 text-right font-mono">{money(l.unitPrice)}</td>
              <td className="px-4 py-3 text-right font-mono">{l.taxRate}%</td>
              <td className="px-4 py-3 text-right font-mono font-bold">{money(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {order.document && (
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800">
        Converted to {order.kind === 'sale' ? 'Customer Invoice' : 'Vendor Bill'} #{order.document.id} (status: {order.document.status}).
        Open the {order.kind === 'sale' ? 'Customer Invoices' : 'Vendor Bills'} module to post it.
      </div>
    )}
  </div>
);

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
      window.alert(`Draft ${isSale ? 'Customer Invoice' : 'Vendor Bill'} #${doc.id} created. Open the ${isSale ? 'Customer Invoices' : 'Vendor Bills'} module to post it.`);
    } catch (e) { setActionError(e.message); }
  };

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(orders,
    (o, q) => (o.contactName || '').toLowerCase().includes(q) || String(o.id).includes(q) || o.status.includes(q));

  return (
    <ModuleShell
      title={isSale ? 'Sales Orders' : 'Purchase Orders'}
      subtitle={isSale ? 'Commercial intents for customers — converted into invoices' : 'Commercial intents for vendors — converted into bills'}
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
        <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
          <div className="flex justify-between items-center gap-4 mb-8">
            <input type="text" placeholder="Search orders…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
            <Button onClick={() => setActiveView('form')} variant="primary">New {isSale ? 'Sales' : 'Purchase'} Order</Button>
          </div>

          <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">{isSale ? 'Customer' : 'Vendor'}</th>
                  <th className="py-4 px-3">Date</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pageItems.map((o) => (
                  <tr key={o.id} className="hover:bg-blue-50/40 cursor-pointer" onClick={() => openDetail(o.id)}>
                    <td className="py-4 px-4 font-mono font-bold text-orange-600">{isSale ? 'SO' : 'PO'}-{o.id}</td>
                    <td className="py-4 px-4 font-semibold text-slate-900">{o.contactName}</td>
                    <td className="py-4 px-3 font-mono text-xs text-slate-600">{o.date}</td>
                    <td className="py-4 px-3"><StatusPill status={o.status} /></td>
                    <td className="py-4 px-4 text-right font-mono font-bold">{money(o.totalAmount)}</td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No orders yet. Create the first one.</td></tr>
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
