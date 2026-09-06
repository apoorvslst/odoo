import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { Button, ModuleShell, Pagination, usePagedSearch } from './ui';

// Analytic accounts are cost-center markers used by order/invoice lines and budgets.

const AnalyticFormView = ({ initialData, onBack, onSave }) => {
  const [formData, setFormData] = useState(initialData || { name: '', type: 'expense' });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = () => {
    if (!formData.name.trim()) { setErrorMsg('Name is required.'); return; }
    setErrorMsg('');
    onSave(formData);
  };

  return (
    <div className="panel max-w-2xl mx-auto fade-in">
      <div className="panel-head">
        <Button onClick={handleSubmit} variant="primary">Confirm</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>
      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>
        {initialData ? `Edit Analytic Account: ${initialData.name}` : 'New Analytic Account'}
      </h2>
      {errorMsg && <div className="form-error">{errorMsg}</div>}
      <div className="stack" style={{ gap: '1.25rem' }}>
        <div className="form-row">
          <label className="form-label">Account Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Showroom Renovation" className="input" />
        </div>
        <div className="form-row">
          <label className="form-label">Type</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="input">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsModule({ user }) {
  const [items, setItems] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setItems(await apiFetch('/analytic-accounts')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        await apiFetch(`/analytic-accounts/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formData.name, type: formData.type }),
        });
      } else {
        await apiFetch('/analytic-accounts', {
          method: 'POST',
          body: JSON.stringify({ name: formData.name, type: formData.type }),
        });
      }
      await load();
      setActiveView('list');
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete analytic account "${item.name}"?`)) return;
    try {
      await apiFetch(`/analytic-accounts/${item.id}`, { method: 'DELETE' });
      await load();
    } catch (e) { window.alert(e.message); }
  };

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(items,
    (a, q) => a.name.toLowerCase().includes(q) || a.type.includes(q));
  const isAdmin = user?.role === 'admin';

  return (
    <ModuleShell title="Analytic Accounts" subtitle="Cost centers and department markers that feed budget actuals" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' ? (
        <AnalyticFormView initialData={editing} onBack={() => setActiveView('list')} onSave={handleSave} />
      ) : (
        <div className="panel fade-in">
          <div className="toolbar">
            <input type="text" placeholder="Search analytic accounts…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input grow" style={{ maxWidth: 400 }} />
            <Button onClick={() => { setEditing(null); setActiveView('form'); }} variant="primary">New Analytic Account</Button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Name</th>
                  <th>Type</th>
                  {isAdmin && <th className="t-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a) => (
                  <tr key={a.id} className="clickable" onClick={() => { setEditing(a); setActiveView('form'); }}>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{a.id}</td>
                    <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{a.name}</td>
                    <td>
                      <span className={`pill ${a.type === 'income' ? 'pill-paid' : 'pill-neutral'}`}>{a.type}</span>
                    </td>
                    {isAdmin && (
                      <td className="t-center" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => handleDelete(a)} className="btn btn-danger btn-sm" title="Delete">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan={isAdmin ? 4 : 3} className="empty">No analytic accounts yet.</td></tr>
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
