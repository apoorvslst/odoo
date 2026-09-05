import { useState, useEffect } from 'react';
import { apiFetch, money } from '../../lib/api';
import { Button, Banner } from './ui';

// Financial dashboard summary — GET /api/reports/dashboard
export default function DashboardHome({ navigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/reports/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <Banner error={error} onDismiss={() => setError('')} />
      </div>
    );
  }
  if (!data) return <div className="text-center text-slate-400 py-24">Loading dashboard…</div>;

  const cards = [
    { title: 'Income', value: money(data.income), dot: 'bg-emerald-500', tab: 'report' },
    { title: 'Expenses', value: money(data.expenses), dot: 'bg-rose-500', tab: 'report' },
    { title: 'Net Profit', value: money(data.netProfit), dot: 'bg-sky-500', tab: 'report' },
    { title: 'Cash Balance', value: money(data.cashBalance), dot: 'bg-teal-500', tab: 'account' },
    { title: 'Bank Balance', value: money(data.bankBalance), dot: 'bg-indigo-500', tab: 'account' },
    { title: 'Receivable (Debtors)', value: money(data.outstanding?.receivable ?? data.debtorsBalance), dot: 'bg-amber-500', tab: 'sales' },
    { title: 'Payable (Creditors)', value: money(data.outstanding?.payable ?? data.creditorsBalance), dot: 'bg-orange-500', tab: 'purchase' },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Financial Overview</h2>
          <p className="text-slate-500 mt-1 text-sm">Live snapshot recomputed from the ledger (transaction_lines).</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('sales')} variant="accent">New Sale</Button>
          <Button onClick={() => navigate('purchase')} variant="secondary">New Purchase</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => (
          <button key={c.title} type="button" onClick={() => navigate(c.tab)}
            className="card p-4 sm:p-5 text-left hover:border-orange-300 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{c.title}</h3>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">{c.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card overflow-x-auto">
          <div className="px-4 py-3.5 border-b border-slate-100 font-semibold text-slate-900 text-sm">Documents by Status</div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr><th className="py-3 px-4 font-semibold">Kind / Status</th><th className="py-3 px-4 text-right font-semibold">Count</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(data.documents?.byStatus || {}).map(([key, count]) => (
                <tr key={key}>
                  <td className="py-3 px-4 font-mono text-xs capitalize">{key.replace(':', ' → ')}</td>
                  <td className="py-3 px-4 text-right font-bold">{count}</td>
                </tr>
              ))}
              {Object.keys(data.documents?.byStatus || {}).length === 0 && (
                <tr><td colSpan="2" className="py-6 text-center text-slate-400">No documents yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="px-4 py-3.5 border-b border-slate-100 font-semibold text-slate-900 text-sm">Recent Transactions</div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr><th className="py-3 px-4 font-semibold">Date</th><th className="py-3 px-4 font-semibold">Description</th><th className="py-3 px-4 font-semibold">Journal</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.recentTransactions || []).map((t) => (
                <tr key={t.id}>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{t.date}</td>
                  <td className="py-3 px-4">{t.description || '—'} {t.reference && <span className="text-xs text-slate-400">({t.reference})</span>}</td>
                  <td className="py-3 px-4 text-xs">{t.journalName}</td>
                </tr>
              ))}
              {(data.recentTransactions || []).length === 0 && (
                <tr><td colSpan="3" className="py-6 text-center text-slate-400">No journal entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
