import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money } from '../../lib/api';
import { ModuleShell, Pagination, usePagedSearch } from './ui';

// Payments hub — GET /api/payments returns every payment with its journal + contact.

export default function PaymentsModule() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setPayments(await apiFetch('/payments')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(payments,
    (p, q) => (p.contactName || '').toLowerCase().includes(q) || String(p.invoiceId).includes(q) || (p.journalName || '').toLowerCase().includes(q));

  const total = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const received = payments.filter((p) => p.invoiceKind === 'invoice').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const sent = payments.filter((p) => p.invoiceKind === 'bill').reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <ModuleShell title="Payments" subtitle="Every cash/bank movement against invoices and bills" error={error} onDismissError={() => setError('')}>
      <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-emerald-500">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Received (invoices)</h3>
            <p className="text-2xl font-bold text-slate-800 mt-2">{money(received)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-orange-500">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sent (bills)</h3>
            <p className="text-2xl font-bold text-slate-800 mt-2">{money(sent)}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Movement</h3>
            <p className="text-2xl font-bold text-slate-800 mt-2">{money(total)}</p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 mb-6">
          <input type="text" placeholder="Search by contact, document, journal…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
        </div>

        <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-3">Date</th>
                <th className="py-4 px-3">Kind</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-3">Journal</th>
                <th className="py-4 px-3">Method</th>
                <th className="py-4 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pageItems.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/40">
                  <td className="py-4 px-4 font-mono font-bold text-emerald-700">PAY-{p.id}</td>
                  <td className="py-4 px-3 font-mono text-xs text-slate-600">{p.date}</td>
                  <td className="py-4 px-3 text-xs font-bold capitalize">{p.invoiceKind === 'bill' ? 'Bill paid' : 'Invoice received'}</td>
                  <td className="py-4 px-4 font-semibold text-slate-900">{p.contactName || '—'}</td>
                  <td className="py-4 px-3 text-xs">{p.journalName || `J-${p.journalId}`}</td>
                  <td className="py-4 px-3 capitalize text-xs">{p.method}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold">{money(p.amount)}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan="7" className="py-12 text-center text-slate-400 font-medium">No payments recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
      </div>
    </ModuleShell>
  );
}
