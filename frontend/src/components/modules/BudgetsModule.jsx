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

  const setLine = (idx, field, value) => {
    if (field === 'plannedAmount' && value !== '' && Number(value) < 0) {
      return;
    }
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };
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
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <Button onClick={handleSubmit} variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Create Budget'}</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>New Budget</h2>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="field">
          <label className="label-sm">Budget Name *</label>
          <input type="text" value={header.name} onChange={(e) => setHeader({ ...header, name: e.target.value })}
            placeholder="e.g. Q1 2026 Operations" className="input" />
        </div>
        <div className="field">
          <label className="label-sm">Start Date *</label>
          <input type="date" value={header.startDate} onChange={(e) => setHeader({ ...header, startDate: e.target.value })}
            className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">End Date *</label>
          <input type="date" value={header.endDate} onChange={(e) => setHeader({ ...header, endDate: e.target.value })}
            className="input mono" />
        </div>
      </div>

      <h3 className="h3" style={{ marginBottom: '0.75rem' }}>Budget Lines (Planned per Analytic Account)</h3>
      <div className="stack-sm" style={{ marginBottom: '1rem' }}>
        {lines.map((line, idx) => (
          <div key={idx} className="row">
            <select value={line.analyticAccountId} onChange={(e) => setLine(idx, 'analyticAccountId', e.target.value)}
              className="input grow">
              <option value="">Select analytic account…</option>
              {analytics.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
            <input type="number" min="0" step="0.1" value={line.plannedAmount} placeholder="Planned amount"
              onChange={(e) => setLine(idx, 'plannedAmount', e.target.value)}
              className="input mono t-right" style={{ width: '180px' }} />
            <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
              className="btn-icon" title="Remove line">&times;</button>
          </div>
        ))}
      </div>
      <div className="row-between">
        <Button variant="secondary" onClick={addLine}>+ Add Line</Button>
        <span className="mono" style={{ fontWeight: 700, fontSize: '0.875rem' }}>Total Planned: {money(totalPlanned)}</span>
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
  if (!report) return <div className="loading">Computing variance…</div>;

  return (
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <div>
          <h2 className="h2">Budget Variance: {report.budget.name}</h2>
          <p className="tiny">{report.budget.startDate} → {report.budget.endDate} (actuals from posted documents)</p>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Analytic Account</th><th>Type</th>
              <th className="t-right">Planned</th><th className="t-right">Actual</th>
              <th className="t-right">Variance</th><th className="t-right">Achievement</th>
            </tr>
          </thead>
          <tbody>
            {report.lines.map((l) => (
              <tr key={l.analyticAccountId}>
                <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{l.analyticName}</td>
                <td style={{ textTransform: 'capitalize', fontSize: '11px', color: 'var(--muted)' }}>{l.analyticType}</td>
                <td className="t-right mono">{money(l.planned)}</td>
                <td className="t-right mono">{money(l.actual)}</td>
                <td className={`t-right mono`} style={{ fontWeight: 700, color: l.variance >= 0 ? 'var(--ok)' : 'var(--danger)' }}>{money(l.variance)}</td>
                <td className="t-right">
                  <div className="cluster" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                    <div className="bar" style={{ width: '4rem' }}>
                      <span className={l.achievementPct >= 100 ? 'full' : ''}
                        style={{ width: `${Math.min(Math.max(l.achievementPct, 0), 100)}%` }} />
                    </div>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>{l.achievementPct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Totals</td>
              <td className="t-right mono">{money(report.totals.planned)}</td>
              <td className="t-right mono">{money(report.totals.actual)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="tiny">For expense lines positive variance indicates under budget. For income lines higher actual than planned is favorable.</p>
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
      <div className="panel fade-in">
        <div className="toolbar">
          <div className="grow" />
          <Button onClick={() => setActiveView('form')} variant="primary">New Budget</Button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Budget Name</th>
                <th>Period</th>
                <th>Responsible</th>
                <th className="t-center">Variance Report</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{b.id}</td>
                  <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{b.name}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{b.startDate} → {b.endDate}</td>
                  <td style={{ color: 'var(--muted)' }}>{b.responsibleName || '—'}</td>
                  <td className="t-center">
                    <Button variant="secondary" className="btn-sm" onClick={() => { setReportId(b.id); setActiveView('report'); }}>
                      View Variance
                    </Button>
                  </td>
                </tr>
              ))}
              {budgets.length === 0 && (
                <tr><td colSpan={5} className="empty">No budgets yet. Create the first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
