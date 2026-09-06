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
    <div className="panel max-w-3xl mx-auto fade-in">
      <div className="panel-head">
        <Button onClick={handleSubmit} variant="primary">Confirm</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '0.5rem' }}>New Journal</h2>
      <p className="lede" style={{ marginBottom: '1.25rem' }}>A journal groups similar transactions (sales, purchases, bank, cash).</p>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="stack" style={{ gap: '1.25rem' }}>
        <div className="form-row">
          <label className="form-label">Journal Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Main Bank Journal" className="input" />
        </div>
        <div className="form-row">
          <label className="form-label">Type</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="input">
            {JOURNAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label className="form-label">Default Account</label>
          <select value={formData.defaultAccountId} onChange={(e) => setFormData({ ...formData, defaultAccountId: e.target.value })}
            className="input">
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
    <ModuleShell title="Journals" subtitle="Accounting ledgers organized by business activity" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' ? (
        <JournalFormView accounts={accounts} onBack={() => setActiveView('list')} onSave={handleSave} />
      ) : (
        <div className="panel fade-in">
          <div className="toolbar">
            <input type="text" placeholder="Search journals…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input grow" style={{ maxWidth: 400 }} />
            <Button onClick={() => setActiveView('form')} variant="primary">New Journal</Button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Journal Name</th>
                  <th>Type</th>
                  <th>Default Account</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((j) => (
                  <tr key={j.id}>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{j.id}</td>
                    <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{j.name}</td>
                    <td>
                      <span className="pill pill-neutral" style={{ textTransform: 'capitalize' }}>{j.type}</span>
                    </td>
                    <td className="mono" style={{ fontSize: '12px' }}>{j.defaultAccountCode} — {j.defaultAccountName}</td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan={4} className="empty">No journals found.</td></tr>
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
