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
    if (['debit', 'credit'].includes(field) && value !== '' && Number(value) < 0) {
      return;
    }
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
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <Button onClick={handleSubmit} variant="primary" disabled={saving || !isBalanced}>{saving ? 'Posting…' : 'Post Entry'}</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>New Journal Entry</h2>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="field">
          <label className="label-sm">Journal *</label>
          <select value={header.journalId} onChange={(e) => setHeader({ ...header, journalId: e.target.value })}
            className="input">
            <option value="">Select journal…</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label-sm">Date</label>
          <input type="date" value={header.date} onChange={(e) => setHeader({ ...header, date: e.target.value })} className="input mono" />
        </div>
        <div className="field">
          <label className="label-sm">Reference</label>
          <input type="text" value={header.reference} onChange={(e) => setHeader({ ...header, reference: e.target.value })}
            placeholder="e.g. Bank advice / Voucher" className="input" />
        </div>
        <div className="field">
          <label className="label-sm">Description</label>
          <input type="text" value={header.description} onChange={(e) => setHeader({ ...header, description: e.target.value })}
            placeholder="Entry narration" className="input" />
        </div>
      </div>

      <h3 className="h3" style={{ marginBottom: '0.75rem' }}>Journal Lines (Debit / Credit)</h3>
      <div className="table-wrap" style={{ marginBottom: '1rem' }}>
        <table className="data-table compact">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Account</th>
              <th className="t-right" style={{ width: '22%' }}>Debit</th>
              <th className="t-right" style={{ width: '22%' }}>Credit</th>
              <th style={{ width: '6%' }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td>
                  <select value={line.accountId} onChange={(e) => setLine(idx, 'accountId', e.target.value)} className="input">
                    <option value="">Select account…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountCode} {a.accountName} ({a.type})</option>)}
                  </select>
                </td>
                <td>
                  <input type="number" min="0" step="0.1" value={line.debit} placeholder="0.00"
                    onChange={(e) => setLine(idx, 'debit', e.target.value)} className="input mono t-right" />
                </td>
                <td>
                  <input type="number" min="0" step="0.1" value={line.credit} placeholder="0.00"
                    onChange={(e) => setLine(idx, 'credit', e.target.value)} className="input mono t-right" />
                </td>
                <td className="t-center">
                  <button type="button" onClick={() => removeLine(idx)} disabled={lines.length <= 2}
                    className="btn-icon" title="Remove line">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="t-right" style={{ fontWeight: 700 }}>Total</td>
              <td className="t-right mono" style={{ fontWeight: 700 }}>{money(totalDebit)}</td>
              <td className="t-right mono" style={{ fontWeight: 700 }}>{money(totalCredit)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="row-between">
        <Button variant="secondary" onClick={addLine}>+ Add Line</Button>
        <span className="tiny mono" style={{ fontWeight: 700, color: isBalanced ? 'var(--ok)' : 'var(--danger)' }}>
          {isBalanced ? 'Balanced' : `Difference: ${money(Math.abs(totalDebit - totalCredit))}`}
        </span>
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

  if (error) return <div className="max-w-4xl mx-auto"><Banner error={error} onDismiss={onBack} /></div>;
  if (!entry) return <div className="loading">Loading journal entry…</div>;

  return (
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <h2 className="h2">Journal Entry #{entry.id}</h2>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="grid-4" style={{ marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
        <div><span className="tiny-up">Date</span><span className="mono">{entry.date}</span></div>
        <div><span className="tiny-up">Journal</span>{entry.journalName} ({entry.journalCode})</div>
        <div><span className="tiny-up">Reference</span><span className="mono">{entry.reference || '—'}</span></div>
        <div><span className="tiny-up">Total</span><span className="mono" style={{ fontWeight: 700 }}>{money(entry.total)}</span></div>
      </div>
      {entry.description && <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>{entry.description}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Account</th><th className="t-right">Debit</th><th className="t-right">Credit</th></tr>
          </thead>
          <tbody>
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td><span className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{l.accountCode}</span> — {l.accountName}</td>
                <td className="t-right mono">{l.debit ? money(l.debit) : ''}</td>
                <td className="t-right mono">{l.credit ? money(l.credit) : ''}</td>
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
    <ModuleShell title="Journal Entries" subtitle="The general ledger — double-entry transactions from all sources" error={error} onDismissError={() => setError('')}>
      <div className="panel fade-in">
        <div className="toolbar">
          <input type="text" placeholder="Search by description, reference, journal…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="input grow" style={{ maxWidth: 400 }} />
          <Button onClick={() => setActiveView('form')} variant="primary">New Entry</Button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Journal</th>
                <th className="t-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => { setDetailId(t.id); setActiveView('detail'); }}>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{t.id}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{t.date}</td>
                  <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{t.description || '—'}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{t.reference || '—'}</td>
                  <td><span className="pill pill-neutral">{t.journalName}</span></td>
                  <td className="t-right mono" style={{ fontWeight: 700 }}>{money(t.total)}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={6} className="empty">No journal entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
      </div>
    </ModuleShell>
  );
}
