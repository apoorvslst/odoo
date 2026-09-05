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
    <div className="max-w-2xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <Button onClick={handleSubmit} variant="primary">Confirm</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        {initialData ? `Edit Analytic Account: ${initialData.name}` : 'New Analytic Account'}
      </h2>
      {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">⚠️ {errorMsg}</div>}
      <div className="space-y-6">
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-purple-700 text-sm">Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Showroom Renovation" className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
        </div>
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-purple-700 text-sm">Type</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
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
    <ModuleShell title="Analytic Accounts" subtitle="Department / project markers that feed budget actuals" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' ? (
        <AnalyticFormView initialData={editing} onBack={() => setActiveView('list')} onSave={handleSave} />
      ) : (
        <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
          <div className="flex justify-between items-center gap-4 mb-8">
            <input type="text" placeholder="Search analytic accounts…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
            <Button onClick={() => { setEditing(null); setActiveView('form'); }} variant="primary">New Analytic Account</Button>
          </div>

          <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-3">Type</th>
                  {isAdmin && <th className="py-4 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pageItems.map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/40 cursor-pointer group" onClick={() => { setEditing(a); setActiveView('form'); }}>
                    <td className="py-4 px-4 font-mono text-xs text-slate-400">{a.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-purple-600">{a.name}</td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${a.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{a.type}</span>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-3 text-center">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(a); }} className="p-1 rounded hover:bg-red-50 text-sm" title="Delete">🗑️</button>
                      </td>
                    )}
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan={isAdmin ? 4 : 3} className="py-12 text-center text-slate-400 font-medium">No analytic accounts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="h-6" />
          <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
        </div>
      )}
    </ModuleShell>
  );
}
