import { useState, useEffect } from 'react';
import { apiFetch, money } from '../../lib/api';
import { Banner, ModuleShell } from './ui';

// Reports recompute from transaction_lines (ledger = source of truth).
// Endpoints: /reports/trial-balance?from&to | /reports/profit-loss?from&to | /reports/balance-sheet?asof | /reports/ledger/:accountId?from&to

const SUB_TABS = [
  { id: 'trial', label: 'Trial Balance' },
  { id: 'pl', label: 'Profit & Loss' },
  { id: 'bs', label: 'Balance Sheet' },
  { id: 'ledger', label: 'General Ledger' },
];

function AccountRows({ accounts }) {
  return (
    <tbody className="divide-y divide-slate-100 text-sm">
      {accounts.map((a) => (
        <tr key={a.id}>
          <td className="px-4 py-3 font-mono font-bold text-orange-600">{a.accountCode}</td>
          <td className="px-4 py-3 font-semibold text-slate-900">{a.accountName}</td>
          <td className="px-4 py-3 text-right font-mono">{money(a.amount)}</td>
        </tr>
      ))}
    </tbody>
  );
}

function TrialBalance({ from, to }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiFetch(`/reports/trial-balance?from=${from}&to=${to}`).then(setData).catch((e) => setError(e.message));
  }, [from, to]);
  if (error) return <Banner error={error} onDismiss={() => setError('')} />;
  if (!data) return <div className="text-center text-slate-400 py-16">Loading…</div>;
  return (
    <div className="border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
          <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Type</th>
            <th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th><th className="px-4 py-3 text-right">Balance</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {data.rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono font-bold text-orange-600">{r.accountCode}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{r.accountName}</td>
              <td className="px-4 py-3 text-xs">{r.type}</td>
              <td className="px-4 py-3 text-right font-mono">{money(r.debit)}</td>
              <td className="px-4 py-3 text-right font-mono">{money(r.credit)}</td>
              <td className="px-4 py-3 text-right font-mono font-bold">{money(r.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
          <tr>
            <td colSpan={3} className="px-4 py-3">Totals</td>
            <td className="px-4 py-3 text-right font-mono">{money(data.totals.debit)}</td>
            <td className="px-4 py-3 text-right font-mono">{money(data.totals.credit)}</td>
            <td className={`px-4 py-3 text-right text-xs ${data.totals.balanced ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.totals.balanced ? '✓ Balanced' : '✗ Out of balance'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ProfitLoss({ from, to }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiFetch(`/reports/profit-loss?from=${from}&to=${to}`).then(setData).catch((e) => setError(e.message));
  }, [from, to]);
  if (error) return <Banner error={error} onDismiss={() => setError('')} />;
  if (!data) return <div className="text-center text-slate-400 py-16">Loading…</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-emerald-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Income</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">{money(data.income.total)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expenses</h3>
          <p className="text-2xl font-bold text-slate-800 mt-2">{money(data.expenses.total)}</p>
        </div>
        <div className={`bg-white p-5 rounded-lg shadow-sm border-l-4 ${data.netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Profit</h3>
          <p className={`text-2xl font-bold mt-2 ${data.netProfit >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{money(data.netProfit)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <div className="px-4 py-3 bg-emerald-50 border-b border-slate-200 text-xs font-bold uppercase text-emerald-700">Income Accounts</div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Account</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
            <AccountRows accounts={data.income.accounts} />
          </table>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <div className="px-4 py-3 bg-red-50 border-b border-slate-200 text-xs font-bold uppercase text-red-700">Expense Accounts</div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Account</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
            <AccountRows accounts={data.expenses.accounts} />
          </table>
        </div>
      </div>
    </div>
  );
}

function BSSection({ title, section, color }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-x-auto">
      <div className={`px-4 py-3 border-b border-slate-200 text-xs font-bold uppercase ${color}`}>
        {title} — {money(section.total)}
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Account</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
        <AccountRows accounts={section.accounts} />
      </table>
    </div>
  );
}

function BalanceSheet({ asof }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiFetch(`/reports/balance-sheet?asof=${asof}`).then(setData).catch((e) => setError(e.message));
  }, [asof]);
  if (error) return <Banner error={error} onDismiss={() => setError('')} />;
  if (!data) return <div className="text-center text-slate-400 py-16">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BSSection title="Assets" section={data.assets} color="bg-sky-50 text-sky-700" />
        <BSSection title="Liabilities" section={data.liabilities} color="bg-orange-50 text-orange-700" />
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <div className="px-4 py-3 bg-purple-50 border-b border-slate-200 text-xs font-bold uppercase text-purple-700">
            Capital — {money(data.capital.totalWithEarnings)}
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500"><tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Account</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
            <AccountRows accounts={data.capital.accounts} />
            <tfoot className="bg-slate-50 border-t border-slate-200 text-sm">
              <tr><td colSpan={2} className="px-4 py-2 font-bold">Net Profit (current earnings)</td><td className="px-4 py-2 text-right font-mono font-bold">{money(data.capital.netProfit)}</td></tr>
              <tr><td colSpan={2} className="px-4 py-2 font-bold">Total incl. earnings</td><td className="px-4 py-2 text-right font-mono font-bold">{money(data.capital.totalWithEarnings)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className={`p-4 rounded-xl text-sm font-semibold ${data.check.holds ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
        {data.check.holds ? '✓' : '✗'} {data.check.equation}
      </div>
    </div>
  );
}

function Ledger({ accounts, from, to }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accountId) return;
    apiFetch(`/reports/ledger/${accountId}?from=${from}&to=${to}`).then(setData).catch((e) => setError(e.message));
  }, [accountId, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col max-w-sm">
        <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Account</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white cursor-pointer">
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}
        </select>
      </div>
      {error && <Banner error={error} onDismiss={() => setError('')} />}
      {!data && !error && accountId ? <div className="text-center text-slate-400 py-16">Loading…</div> : null}
      {data && (
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            {data.account.accountCode} — {data.account.accountName} • Closing balance: {money(data.closingBalance)}
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Journal</th><th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th><th className="px-4 py-3 text-right">Running</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.entries.map((e) => (
                <tr key={e.lineId}>
                  <td className="px-4 py-3 font-mono text-xs">{e.date}</td>
                  <td className="px-4 py-3 text-xs">{e.journalName}</td>
                  <td className="px-4 py-3">{e.description || '—'} {e.reference && <span className="text-xs text-slate-400">({e.reference})</span>}</td>
                  <td className="px-4 py-3 text-right font-mono">{e.debit ? money(e.debit) : ''}</td>
                  <td className="px-4 py-3 text-right font-mono">{e.credit ? money(e.credit) : ''}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{money(e.runningBalance)}</td>
                </tr>
              ))}
              {data.entries.length === 0 && (
                <tr><td colSpan="6" className="py-10 text-center text-slate-400">No entries in this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ReportsModule() {
  const [subTab, setSubTab] = useState('trial');
  const [accounts, setAccounts] = useState([]);
  const thisYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${thisYear}-01-01`);
  const [to, setTo] = useState(`${thisYear}-12-31`);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/accounts').then(setAccounts).catch((e) => setError(e.message));
  }, []);

  return (
    <ModuleShell title="Financial Reports" subtitle="Recomputed live from the ledger — pick your period" error={error} onDismissError={() => setError('')}>
      <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold flex-wrap">
            {SUB_TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setSubTab(t.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${subTab === t.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {subTab === 'bs' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-500">As of</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white" />
              </div>
            ) : (
              <>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white" />
                <span className="text-slate-400">→</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white" />
              </>
            )}
          </div>
        </div>

        {subTab === 'trial' && <TrialBalance key={`${from}:${to}`} from={from} to={to} />}
        {subTab === 'pl' && <ProfitLoss key={`${from}:${to}`} from={from} to={to} />}
        {subTab === 'bs' && <BalanceSheet key={to} asof={to} />}
        {subTab === 'ledger' && <Ledger accounts={accounts} from={from} to={to} />}
      </div>
    </ModuleShell>
  );
}
