import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money } from '../../lib/api';
import { Button, Banner, ModuleShell } from './ui';

// Budgets = header (name, period, responsible) + lines (analytic account, planned amount).
// GET /:id/report sums POSTED documents tagged with each analytic account inside the period.

const BudgetFormView = ({ analytics, currentUser, onBack, onSaved }) => {
  const [header, setHeader] = useState({ name: '', startDate: '', endDate: '', responsibleId: currentUser?.id || '' });
  const [lines, setLines] = useState([{ analyticAccountId: '', plannedAmount: '' }]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const setLine = (idx, field, value) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  const addLine = () => setLines((prev) => [...prev, { analyticAccountId: '', plannedAmount: '' }]);
  const totalPlanned = lines.reduce((acc, l) => acc + (parseFloat(l.plannedAmount) || 0), 0);

  const handleSubmit = async () => {
    if (!header.name.trim() || !header.startDate || !header.endDate) { setErrorMsg('Budget name, start and end dates are required.'); return; }
    if (lines.some((l) => !l.analyticAccountId)) { setErrorMsg('Every budget line needs an analytic account.'); return; }
    setSaving(true);
    setErrorMsg('');
    try {
      await apiFetch('/budgets', {
        method: 'POST',
        body: JSON.stringify({
          name: header.name,
          startDate: header.startDate,
          endDate: header.endDate,
          responsibleId: Number(header.responsibleId) || undefined,
          lines: lines.map((l) => ({
            analyticAccountId: Number(l.analyticAccountId),
            plannedAmount: parseFloat(l.plannedAmount) || 0,
          })),
        }),
      });
      onSaved();
    } catch (e) { setErrorMsg(e.message); }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <Button onClick={handleSubmit} variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Create Budget'}</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">New Budget</h2>
      {errorMsg && <div className="mb-6"><Banner error={errorMsg} onDismiss={() => setErrorMsg('')} /></div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="flex flex-col md:col-span-2">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Budget Name *</label>
          <input type="text" value={header.name} onChange={(e) => setHeader({ ...header, name: e.target.value })}
            placeholder="e.g. Q1 2026 Operations" className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Start Date *</label>
          <input type="date" value={header.startDate} onChange={(e) => setHeader({ ...header, startDate: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">End Date *</label>
          <input type="date" value={header.endDate} onChange={(e) => setHeader({ ...header, endDate: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-3">Budget Lines (planned per analytic account)</h3>
      <div className="space-y-3">
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-3 items-center">
            <select value={line.analyticAccountId} onChange={(e) => setLine(idx, 'analyticAccountId', e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50">
              <option value="">Select analytic account…</option>
              {analytics.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
            <input type="number" min="0" step="0.01" value={line.plannedAmount} placeholder="Planned amount"
              onChange={(e) => setLine(idx, 'plannedAmount', e.target.value)}
              className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50" />
            <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
              className="text-slate-400 hover:text-red-500 font-bold px-2">&times;</button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button variant="secondary" onClick={addLine}>+ Add Line</Button>
        <span className="text-sm font-bold text-slate-700">Total planned: {money(totalPlanned)}</span>
      </div>
    </div>
  );
};

const BudgetReportView = ({ budgetId, onBack }) => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/budgets/${budgetId}/report`).then(setReport).catch((e) => setError(e.message));
  }, [budgetId]);

  if (error) return <div className="max-w-4xl mx-auto"><Banner error={error} onDismiss={onBack} /></div>;
  if (!report) return <div className="text-center text-slate-400 py-24">Computing variance…</div>;

  return (
    <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Budget Variance: {report.budget.name}</h2>
          <p className="text-sm text-slate-500">{report.budget.startDate} → {report.budget.endDate} (actuals from posted documents)</p>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Analytic Account</th><th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Planned</th><th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Variance</th><th className="px-4 py-3 text-right">Achievement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.lines.map((l) => (
              <tr key={l.analyticAccountId}>
                <td className="px-4 py-3 font-bold text-slate-900">{l.analyticName}</td>
                <td className="px-4 py-3 capitalize text-xs">{l.analyticType}</td>
                <td className="px-4 py-3 text-right font-mono">{money(l.planned)}</td>
                <td className="px-4 py-3 text-right font-mono">{money(l.actual)}</td>
                <td className={`px-4 py-3 text-right font-mono font-bold ${l.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{money(l.variance)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-20 bg-slate-100 h-2 rounded-full overflow-x-auto">
                      <div className={`h-full rounded-full ${l.achievementPct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(Math.max(l.achievementPct, 0), 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold">{l.achievementPct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
            <tr>
              <td colSpan={2} className="px-4 py-3">Totals</td>
              <td className="px-4 py-3 text-right font-mono">{money(report.totals.planned)}</td>
              <td className="px-4 py-3 text-right font-mono">{money(report.totals.actual)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-slate-400">For expense lines positive variance means under budget (good). For income lines higher actual than planned is good.</p>
    </div>
  );
};

export default function BudgetsModule({ user }) {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setBudgets(await apiFetch('/budgets')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    load();
    apiFetch('/analytic-accounts').then(setAnalytics).catch(() => {});
  }, [load]);

  if (activeView === 'report' && reportId) {
    return (
      <ModuleShell title="Budgets" error={error} onDismissError={() => setError('')}>
        <BudgetReportView budgetId={reportId} onBack={() => setActiveView('list')} />
      </ModuleShell>
    );
  }

  if (activeView === 'form') {
    return (
      <ModuleShell title="Budgets" error={error} onDismissError={() => setError('')}>
        <BudgetFormView analytics={analytics} currentUser={user} onBack={() => setActiveView('list')} onSaved={async () => { await load(); setActiveView('list'); }} />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title="Budgets" subtitle="Planned amounts per analytic account with automatic variance" error={error} onDismissError={() => setError('')}>
      <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Budgets</h2>
          <Button onClick={() => setActiveView('form')} variant="primary">New Budget</Button>
        </div>

        <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">Budget Name</th>
                <th className="py-4 px-3">Period</th>
                <th className="py-4 px-3">Responsible</th>
                <th className="py-4 px-3 text-center">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {budgets.map((b) => (
                <tr key={b.id} className="hover:bg-purple-50/40">
                  <td className="py-4 px-4 font-mono text-xs text-slate-400">{b.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{b.name}</td>
                  <td className="py-4 px-3 font-mono text-xs text-slate-600">{b.startDate} → {b.endDate}</td>
                  <td className="py-4 px-3 text-slate-600">{b.responsibleName || '—'}</td>
                  <td className="py-4 px-3 text-center">
                    <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => { setReportId(b.id); setActiveView('report'); }}>
                      View Variance
                    </Button>
                  </td>
                </tr>
              ))}
              {budgets.length === 0 && (
                <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No budgets yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
