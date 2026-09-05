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
    <tbody>
      {accounts.map((a) => (
        <tr key={a.id}>
          <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{a.accountCode}</td>
          <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{a.accountName}</td>
          <td className="t-right mono">{money(a.amount)}</td>
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
  if (!data) return <div className="loading">Loading Trial Balance…</div>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>Code</th>
            <th>Account</th>
            <th>Type</th>
            <th className="t-right">Debit</th>
            <th className="t-right">Credit</th>
            <th className="t-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.id}>
              <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.accountCode}</td>
              <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.accountName}</td>
              <td><span className="pill pill-neutral">{r.type}</span></td>
              <td className="t-right mono">{money(r.debit)}</td>
              <td className="t-right mono">{money(r.credit)}</td>
              <td className="t-right mono" style={{ fontWeight: 700 }}>{money(r.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Totals</td>
            <td className="t-right mono">{money(data.totals.debit)}</td>
            <td className="t-right mono">{money(data.totals.credit)}</td>
            <td className={`t-right mono`} style={{ color: data.totals.balanced ? 'var(--ok)' : 'var(--danger)' }}>
              {data.totals.balanced ? 'Balanced' : 'Out of Balance'}
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
  if (!data) return <div className="loading">Loading Profit & Loss…</div>;
  return (
    <div className="stack">
      <div className="grid-3">
        <div className="stat-card">
          <span className="tiny-up">Income</span>
          <p className="value" style={{ color: 'var(--ok)' }}>{money(data.income.total)}</p>
        </div>
        <div className="stat-card">
          <span className="tiny-up">Expenses</span>
          <p className="value" style={{ color: 'var(--danger)' }}>{money(data.expenses.total)}</p>
        </div>
        <div className="stat-card">
          <span className="tiny-up">Net Profit</span>
          <p className={`value`} style={{ color: data.netProfit >= 0 ? 'var(--ink)' : 'var(--danger)' }}>{money(data.netProfit)}</p>
        </div>
      </div>
      <div className="grid-2">
        <div className="table-wrap">
          <div className="table-cap">Income Accounts</div>
          <table className="data-table compact">
            <thead><tr><th>Code</th><th>Account</th><th className="t-right">Amount</th></tr></thead>
            <AccountRows accounts={data.income.accounts} />
          </table>
        </div>
        <div className="table-wrap">
          <div className="table-cap">Expense Accounts</div>
          <table className="data-table compact">
            <thead><tr><th>Code</th><th>Account</th><th className="t-right">Amount</th></tr></thead>
            <AccountRows accounts={data.expenses.accounts} />
          </table>
        </div>
      </div>
    </div>
  );
}

function BSSection({ title, section }) {
  return (
    <div className="table-wrap">
      <div className="table-cap">
        {title} — {money(section.total)}
      </div>
      <table className="data-table compact">
        <thead><tr><th>Code</th><th>Account</th><th className="t-right">Amount</th></tr></thead>
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
  if (!data) return <div className="loading">Loading Balance Sheet…</div>;

  return (
    <div className="stack">
      <div className="grid-3">
        <BSSection title="Assets" section={data.assets} />
        <BSSection title="Liabilities" section={data.liabilities} />
        <div className="table-wrap">
          <div className="table-cap">
            Capital — {money(data.capital.totalWithEarnings)}
          </div>
          <table className="data-table compact">
            <thead><tr><th>Code</th><th>Account</th><th className="t-right">Amount</th></tr></thead>
            <AccountRows accounts={data.capital.accounts} />
            <tfoot>
              <tr><td colSpan={2}>Net Profit (Earnings)</td><td className="t-right mono">{money(data.capital.netProfit)}</td></tr>
              <tr><td colSpan={2} style={{ fontWeight: 700 }}>Total incl. earnings</td><td className="t-right mono" style={{ fontWeight: 700 }}>{money(data.capital.totalWithEarnings)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className={`notice ${data.check.holds ? 'ok' : 'info'}`}>
        Equation check: {data.check.equation} ({data.check.holds ? 'Holds' : 'Imbalance'})
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
    <div className="stack">
      <div className="field" style={{ maxWidth: 320 }}>
        <label className="label-sm">Select Account</label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input">
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}
        </select>
      </div>
      {error && <Banner error={error} onDismiss={() => setError('')} />}
      {!data && !error && accountId ? <div className="loading">Loading ledger…</div> : null}
      {data && (
        <div className="table-wrap">
          <div className="table-cap">
            {data.account.accountCode} — {data.account.accountName} · Closing Balance: {money(data.closingBalance)}
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Journal</th><th>Description</th>
                <th className="t-right">Debit</th><th className="t-right">Credit</th><th className="t-right">Running</th></tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={e.lineId}>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{e.date}</td>
                  <td><span className="pill pill-neutral">{e.journalName}</span></td>
                  <td>{e.description || '—'} {e.reference && <span className="tiny mono">({e.reference})</span>}</td>
                  <td className="t-right mono">{e.debit ? money(e.debit) : ''}</td>
                  <td className="t-right mono">{e.credit ? money(e.credit) : ''}</td>
                  <td className="t-right mono" style={{ fontWeight: 700 }}>{money(e.runningBalance)}</td>
                </tr>
              ))}
              {data.entries.length === 0 && (
                <tr><td colSpan={6} className="empty">No entries in this period.</td></tr>
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
    <ModuleShell title="Financial Statements" subtitle="Recomputed live from the general ledger" error={error} onDismissError={() => setError('')}>
      <div className="panel fade-in">
        <div className="row-between" style={{ marginBottom: '1.5rem' }}>
          <div className="subtabs" style={{ marginBottom: 0 }}>
            {SUB_TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setSubTab(t.id)}
                className={`subtab ${subTab === t.id ? 'is-on' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="cluster">
            {subTab === 'bs' ? (
              <div className="cluster">
                <span className="tiny-up">As of</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input mono" style={{ width: 'auto' }} />
              </div>
            ) : (
              <div className="cluster">
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input mono" style={{ width: 'auto' }} />
                <span className="tiny">→</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input mono" style={{ width: 'auto' }} />
              </div>
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
