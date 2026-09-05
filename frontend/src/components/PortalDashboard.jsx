import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, clearSession } from '../lib/api';
import { Button, Banner, StatusPill } from './modules/ui';

// Portal = role "contact". Backend scopes everything to req.user.contactId automatically.
// Endpoints: GET /api/portal/documents?kind=invoice|bill, GET /api/portal/documents/:id,
//            POST /api/portal/documents/:id/pay { amount, method }

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

  if (error) return <div className="max-w-2xl mx-auto"><Banner error={error} onDismiss={onClose} /></div>;
  if (!doc) return <div className="text-center text-slate-400 py-16">Loading…</div>;

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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-start border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{doc.kind === 'bill' ? 'Vendor Bill' : 'Customer Invoice'} #{doc.id}</h3>
          <p className="text-xs text-slate-500">Issued {doc.date} • Due {doc.dueDate}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
      </div>

      {actionError && <Banner error={actionError} onDismiss={() => setActionError('')} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Total</span>{money(doc.totalAmount)}</div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Paid</span>{money(doc.paid)}</div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Balance Due</span><span className="font-bold text-amber-600">{money(doc.balanceDue)}</span></div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Status</span><StatusPill status={doc.status} /></div>
      </div>

      {(doc.lines || []).length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase font-bold">
              <tr><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit Price</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doc.lines.map((l) => (
                <tr key={l.id}>
                  <td className="p-3 font-medium text-slate-800">{l.description || l.productName || '—'}</td>
                  <td className="p-3 text-right">{l.quantity}</td>
                  <td className="p-3 text-right font-mono">{money(l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {doc.status !== 'draft' && doc.balanceDue > 0 ? (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-700">Make a Payment</h4>
          <div className="grid grid-cols-2 gap-3">
            {['bank', 'cash'].map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)}
                className={`p-3 text-sm font-medium border rounded-lg capitalize ${method === m ? 'border-orange-600 bg-orange-50 text-orange-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {m === 'bank' ? '🏦' : '💵'} {m} transfer
              </button>
            ))}
          </div>
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="w-1/2" onClick={onClose}>Close</Button>
            <Button variant="primary" className="w-1/2" onClick={handlePay} disabled={paying}>
              {paying ? 'Paying…' : `Pay ${money(amount || 0)} Now`}
            </Button>
          </div>
        </div>
      ) : doc.balanceDue <= 0 && doc.status !== 'draft' ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg text-center font-medium">
          ✓ Fully paid. No further action needed.
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-xs p-3 rounded-lg text-center font-medium">
          This document is still a draft — the accountant hasn't posted it yet.
        </div>
      )}
    </div>
  );
};

export default function PortalDashboard({ user, onLogout }) {
  const [kind, setKind] = useState('invoice');
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDocs(await apiFetch(`/portal/documents?kind=${kind}`)); } catch (e) { setError(e.message); }
    setLoading(false);
  }, [kind]);

  useEffect(() => { load(); setPage(1); }, [load]);

  const handleLogout = () => {
    clearSession();
    if (typeof onLogout === 'function') onLogout();
  };

  const outstanding = docs.filter((d) => d.status !== 'draft').reduce((acc, d) => acc + Number(d.balanceDue || 0), 0);
  const totalBilled = docs.reduce((acc, d) => acc + Number(d.totalAmount || 0), 0);
  const totalPaid = docs.reduce((acc, d) => acc + Number(d.paid || 0), 0);
  const pageSize = 10;
  const pageItems = docs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(docs.length / pageSize));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Partner Portal {loading && '• Syncing…'}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Welcome, {user?.username || user?.email}</h1>
            <p className="text-sm text-slate-500">Only your own documents are visible here (contact #{user?.contactId}).</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              {(user?.username || 'C').charAt(0).toUpperCase()}
            </div>
            <button type="button" onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              Logout
            </button>
          </div>
        </div>

        {error && <Banner error={error} onDismiss={() => setError('')} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Outstanding Balance</p>
            <h2 className="text-2xl font-extrabold text-amber-600 mt-1">{money(outstanding)}</h2>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Paid</p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">{money(totalPaid)}</h2>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Billed</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{money(totalBilled)}</h2>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            {[
              { id: 'invoice', label: 'My Invoices' },
              { id: 'bill', label: 'My Bills' },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => setKind(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${kind === t.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="p-4 border-b border-slate-100 font-semibold text-slate-800">
            {kind === 'invoice' ? 'Invoices issued to you' : 'Bills you issued to us'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-orange-600">{kind === 'bill' ? 'BILL' : 'INV'}-{d.id}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{d.date}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{d.dueDate || '—'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{money(d.totalAmount)}</td>
                    <td className="px-6 py-4 font-bold text-amber-600">{money(d.balanceDue)}</td>
                    <td className="px-6 py-4"><StatusPill status={d.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => setDetailId(d.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors">
                        View {d.balanceDue > 0 && d.status !== 'draft' ? '& Pay' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && !loading && (
                  <tr><td colSpan="7" className="text-center py-8 text-slate-400">No documents found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {docs.length > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/70 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages} ({docs.length} documents)</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40">← Previous</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>

        {detailId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <DocumentDetailView docId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
          </div>
        )}
      </div>
    </div>
  );
}
