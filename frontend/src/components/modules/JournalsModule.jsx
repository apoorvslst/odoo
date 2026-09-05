import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { Button, ModuleShell, Pagination, usePagedSearch } from './ui';

// Journal schema per routes_db.md:
// { id, name, type: "sale"|"purchase"|"bank"|"cash", defaultAccountId, defaultAccountName, defaultAccountCode }

const JOURNAL_TYPES = ['sale', 'purchase', 'bank', 'cash'];

const JournalFormView = ({ accounts, onBack, onSave }) => {
  const [formData, setFormData] = useState({ name: '', type: 'sale', defaultAccountId: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = () => {
    if (!formData.name.trim()) { setErrorMsg('Journal Name is required'); return; }
    if (!formData.defaultAccountId) { setErrorMsg('Select the Default Account this journal posts to'); return; }
    setErrorMsg('');
    onSave(formData);
  };

  return (
    <div className="max-w-3xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <Button onClick={handleSubmit} variant="primary">Confirm</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">New Journal</h2>
      <p className="text-sm text-slate-500 mb-6">A journal groups similar transactions (sales, purchases, bank, cash).</p>
      {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">⚠️ {errorMsg}</div>}

      <div className="space-y-6">
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-orange-600 text-sm">Journal Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Secondary Bank Journal" className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
        </div>
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-orange-600 text-sm">Type</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
            {JOURNAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-orange-600 text-sm">Default Account</label>
          <select value={formData.defaultAccountId} onChange={(e) => setFormData({ ...formData, defaultAccountId: e.target.value })}
            className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
            <option value="">Select account…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName} ({a.type})</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default function JournalsModule() {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [error, setError] = useState('');

  const loadJournals = useCallback(async () => {
    try { setJournals(await apiFetch('/journals')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    loadJournals();
    apiFetch('/accounts').then(setAccounts).catch(() => {});
  }, [loadJournals]);

  const handleSave = async (formData) => {
    try {
      await apiFetch('/journals', {
        method: 'POST',
        body: JSON.stringify({ name: formData.name, type: formData.type, defaultAccountId: Number(formData.defaultAccountId) }),
      });
      await loadJournals();
      setActiveView('list');
    } catch (e) { setError(e.message); }
  };

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(journals,
    (j, q) => j.name.toLowerCase().includes(q) || j.type.includes(q));

  return (
    <ModuleShell title="Journals" subtitle="Books that organize transactions by activity type" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' ? (
        <JournalFormView accounts={accounts} onBack={() => setActiveView('list')} onSave={handleSave} />
      ) : (
        <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
          <div className="flex justify-between items-center gap-4 mb-8">
            <input type="text" placeholder="Search journals…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
            <Button onClick={() => setActiveView('form')} variant="primary">New Journal</Button>
          </div>

          <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4">#</th>
                  <th className="py-4 px-4">Journal Name</th>
                  <th className="py-4 px-3">Type</th>
                  <th className="py-4 px-4">Default Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pageItems.map((j) => (
                  <tr key={j.id} className="hover:bg-blue-50/40">
                    <td className="py-4 px-4 font-mono text-xs text-slate-400">{j.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{j.name}</td>
                    <td className="py-4 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-indigo-50 text-indigo-700">{j.type}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-mono text-xs">{j.defaultAccountCode} — {j.defaultAccountName}</td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan="4" className="py-12 text-center text-slate-400 font-medium">No journals found.</td></tr>
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
