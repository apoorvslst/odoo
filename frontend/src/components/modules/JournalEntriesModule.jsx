import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, today } from '../../lib/api';
import { Button, Banner, ModuleShell, Pagination, usePagedSearch } from './ui';

// Journal entries = GET/POST /api/transactions (manual double-entry).
// Backend validation (journalService): >=2 lines, each line debit>0 XOR credit>0, SUM(debit)==SUM(credit).

const EntryFormView = ({ journals, accounts, onBack, onSaved }) => {
  const [header, setHeader] = useState({ journalId: '', date: today(), description: '', reference: '' });
  const [lines, setLines] = useState([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const setLine = (idx, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { accountId: '', debit: '', credit: '' }]);
  const removeLine = (idx) => setLines((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)));

  const handleSubmit = async () => {
    if (!header.journalId) { setErrorMsg('Select a journal.'); return; }
    if (lines.some((l) => !l.accountId)) { setErrorMsg('Every line needs an account.'); return; }
    if (!isBalanced) {
      setErrorMsg(`Not balanced: debit ${money(totalDebit)} must equal credit ${money(totalCredit)}.`);
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          journalId: Number(header.journalId),
          date: header.date,
          description: header.description || null,
          reference: header.reference || null,
          lines: lines.map((l) => ({
            accountId: Number(l.accountId),
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
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
        <div className="flex gap-3">
          <Button onClick={handleSubmit} variant="primary" disabled={saving || !isBalanced}>{saving ? 'Posting…' : 'Post Entry'}</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">New Manual Journal Entry</h2>
      {errorMsg && <div className="mb-6"><Banner error={errorMsg} onDismiss={() => setErrorMsg('')} /></div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Journal *</label>
          <select value={header.journalId} onChange={(e) => setHeader({ ...header, journalId: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50">
            <option value="">Select…</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Date *</label>
          <input type="date" value={header.date} onChange={(e) => setHeader({ ...header, date: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Reference</label>
          <input type="text" value={header.reference} onChange={(e) => setHeader({ ...header, reference: e.target.value })}
            placeholder="e.g. CAP-001" className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
        <div className="flex flex-col">
          <label className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
          <input type="text" value={header.description} onChange={(e) => setHeader({ ...header, description: e.target.value })}
            placeholder="e.g. Owner Capital Addition" className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50" />
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-bold text-slate-800">Journal Lines (Debit / Credit)</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {isBalanced ? '✓ Balanced' : `✗ ${money(totalDebit)} / ${money(totalCredit)}`}
        </span>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Account</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-40">Debit</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-40">Credit</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3">
                  <select value={line.accountId} onChange={(e) => setLine(idx, 'accountId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50">
                    <option value="">Select account…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input type="number" step="0.01" min="0" value={line.debit} placeholder="0.00"
                    onChange={(e) => setLine(idx, 'debit', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50" />
                </td>
                <td className="px-4 py-3">
                  <input type="number" step="0.01" min="0" value={line.credit} placeholder="0.00"
                    onChange={(e) => setLine(idx, 'credit', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50" />
                </td>
                <td className="px-4 py-3 text-center">
                  <button type="button" onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
            <tr>
              <td className="px-4 py-4 text-slate-700">Total</td>
              <td className="px-4 py-4 text-right text-slate-900">{money(totalDebit)}</td>
              <td className="px-4 py-4 text-right text-slate-900">{money(totalCredit)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={addLine}>+ Add Line</Button>
      </div>
    </div>
  );
};

const EntryDetailView = ({ entryId, onBack }) => {
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/transactions/${entryId}`).then(setEntry).catch((e) => setError(e.message));
  }, [entryId]);

  if (error) return <div className="max-w-4xl mx-auto"><Banner error={error} onDismiss={() => onBack()} /></div>;
  if (!entry) return <div className="text-center text-slate-400 py-24">Loading entry…</div>;

  return (
    <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Journal Entry #{entry.id}</h2>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Journal</span>{entry.journalName}</div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Date</span><span className="font-mono">{entry.date}</span></div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Reference</span>{entry.reference || '—'}</div>
        <div><span className="block text-xs text-slate-400 uppercase font-bold">Created By</span>{entry.createdByUsername}</div>
      </div>
      <p className="text-sm text-slate-600 mb-4">{entry.description || '—'}</p>
      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            <tr><th className="px-4 py-3">Account</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3"><span className="font-mono text-orange-600 font-bold">{l.accountCode}</span> — {l.accountName}</td>
                <td className="px-4 py-3 text-right font-mono">{l.debit ? money(l.debit) : ''}</td>
                <td className="px-4 py-3 text-right font-mono">{l.credit ? money(l.credit) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function JournalEntriesModule() {
  const [entries, setEntries] = useState([]);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [detailId, setDetailId] = useState(null);
  const [error, setError] = useState('');

  const loadEntries = useCallback(async () => {
    try { setEntries(await apiFetch('/transactions')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    loadEntries();
    apiFetch('/journals').then(setJournals).catch(() => {});
    apiFetch('/accounts').then(setAccounts).catch(() => {});
  }, [loadEntries]);

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(entries,
    (t, q) => (t.description || '').toLowerCase().includes(q) || (t.reference || '').toLowerCase().includes(q) || (t.journalName || '').toLowerCase().includes(q));

  if (activeView === 'detail' && detailId) {
    return (
      <ModuleShell title="Journal Entry" error={error} onDismissError={() => setError('')}>
        <EntryDetailView entryId={detailId} onBack={() => setActiveView('list')} />
      </ModuleShell>
    );
  }

  if (activeView === 'form') {
    return (
      <ModuleShell title="Journal Entries" error={error} onDismissError={() => setError('')}>
        <EntryFormView journals={journals} accounts={accounts} onBack={() => setActiveView('list')} onSaved={async () => { await loadEntries(); setActiveView('list'); }} />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title="Journal Entries" subtitle="The immutable ledger — every posting from invoices, payments and manual entries" error={error} onDismissError={() => setError('')}>
      <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
        <div className="flex justify-between items-center gap-4 mb-8">
          <input type="text" placeholder="Search by description, reference, journal…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
          <Button onClick={() => setActiveView('form')} variant="primary">New Entry</Button>
        </div>

        <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Description</th>
                <th className="py-4 px-3">Reference</th>
                <th className="py-4 px-3">Journal</th>
                <th className="py-4 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pageItems.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/40 cursor-pointer" onClick={() => { setDetailId(t.id); setActiveView('detail'); }}>
                  <td className="py-4 px-4 font-mono text-xs text-slate-400">{t.id}</td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-600">{t.date}</td>
                  <td className="py-4 px-4 font-semibold text-slate-900">{t.description || '—'}</td>
                  <td className="py-4 px-3 text-slate-600 font-mono text-xs">{t.reference || '—'}</td>
                  <td className="py-4 px-3 text-xs">{t.journalName}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold">{money(t.total)}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No journal entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
      </div>
    </ModuleShell>
  );
}
