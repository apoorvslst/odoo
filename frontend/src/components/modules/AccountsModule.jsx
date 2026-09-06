import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { Button, Pagination, usePagedSearch, ModuleShell } from './ui';

// Account schema per routes_db.md:
// { id, accountCode, accountName, type: "Asset"|"Liability"|"Income"|"Expense"|"Capital", balance, isArchived }
// Type is LOCKED once the account has ledger activity (backend 409).

const ACCOUNT_TYPES = ['Asset', 'Liability', 'Income', 'Expense', 'Capital'];

const AccountFormView = ({ initialData, onBack, onSave }) => {
  const [formData, setFormData] = useState(
    initialData || { accountCode: '', accountName: '', type: 'Asset' }
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    if (!formData.accountCode.trim()) { setErrorMsg('Account Code is required (e.g. 1020)'); return; }
    if (!formData.accountName.trim()) { setErrorMsg('Account Name is required'); return; }
    setErrorMsg('');
    onSave(formData);
  };

  return (
    <div className="panel max-w-3xl mx-auto fade-in">
      <div className="panel-head">
        <Button onClick={handleSubmit} variant="primary">Confirm</Button>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>
        {initialData ? `Edit Account: ${initialData.accountName}` : 'New Chart of Account'}
      </h2>
      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="stack" style={{ gap: '1.25rem' }}>
        <div className="form-row">
          <label className="form-label">Account Code</label>
          <input type="text" name="accountCode" value={formData.accountCode} onChange={handleChange}
            placeholder="e.g. 1020" disabled={Boolean(initialData)}
            className="input mono" />
        </div>
        <div className="form-row">
          <label className="form-label">Account Name</label>
          <input type="text" name="accountName" value={formData.accountName} onChange={handleChange}
            placeholder="e.g. Petty Cash"
            className="input" />
        </div>
        <div className="form-row">
          <label className="form-label">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input">
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <p className="tiny">
          Normal balance: Debit for Asset/Expense, Credit for Liability/Income/Capital.
          The type cannot be changed once the account has ledger activity.
        </p>
      </div>
    </div>
  );
};

export default function AccountsModule({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [editingAccount, setEditingAccount] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (showArchived) params.set('archived', 'true');
      const data = await apiFetch(`/accounts${params.toString() ? `?${params}` : ''}`);
      setAccounts(data);
    } catch (e) { setError(e.message); }
  }, [typeFilter, showArchived]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        // accountCode is immutable; send name + type only.
        await apiFetch(`/accounts/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify({ accountName: formData.accountName, type: formData.type }),
        });
      } else {
        await apiFetch('/accounts', {
          method: 'POST',
          body: JSON.stringify({ accountCode: formData.accountCode, accountName: formData.accountName, type: formData.type }),
        });
      }
      await loadAccounts();
      setActiveView('list');
    } catch (e) { setError(e.message); }
  };

  const handleArchive = async (account) => {
    try {
      await apiFetch(`/accounts/${account.id}/archive`, { method: 'PATCH' });
      await loadAccounts();
    } catch (e) { window.alert(e.message); }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.accountName}"?`)) return;
    try {
      // 409 if the account has ledger activity.
      await apiFetch(`/accounts/${account.id}`, { method: 'DELETE' });
      await loadAccounts();
    } catch (e) { window.alert(e.message); }
  };

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(accounts,
    (a, q) => a.accountName.toLowerCase().includes(q) || a.accountCode.toLowerCase().includes(q));
  const isAdmin = user?.role === 'admin';

  return (
    <ModuleShell title="Chart of Accounts" subtitle="Master ledger classification and account definitions" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' ? (
        <AccountFormView initialData={editingAccount} onBack={() => setActiveView('list')} onSave={handleSave} />
      ) : (
        <div className="panel fade-in">
          <div className="toolbar">
            <div className="cluster grow" style={{ maxWidth: 500 }}>
              <Button onClick={() => { setEditingAccount(null); setActiveView('form'); }} variant="primary">New Account</Button>
              <input type="text" placeholder="Search accounts…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="input grow" />
            </div>
            <div className="cluster">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input" style={{ width: 'auto' }}>
                <option value="">All Types</option>
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="check-row">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show Archived
              </label>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th className="t-right">Balance</th>
                  <th className="t-center">Status</th>
                  <th className="t-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((account) => (
                  <tr key={account.id} className="clickable" onClick={() => { setEditingAccount(account); setActiveView('form'); }}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{account.accountCode}</td>
                    <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{account.accountName}</td>
                    <td>
                      <span className="pill pill-neutral">{account.type}</span>
                    </td>
                    <td className="t-right mono" style={{ fontWeight: 650, color: 'var(--ink)' }}>
                      ₹{Number(account.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="t-center">
                      <span className={`pill ${account.isArchived ? 'pill-default' : 'pill-paid'}`}>
                        {account.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="t-center" onClick={(e) => e.stopPropagation()}>
                      {isAdmin && (
                        <div className="cluster" style={{ justifyContent: 'center', gap: '4px' }}>
                          <button type="button" onClick={() => handleArchive(account)} className="btn btn-secondary btn-sm" title={account.isArchived ? 'Unarchive' : 'Archive'}>
                            {account.isArchived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button type="button" onClick={() => handleDelete(account)} className="btn btn-danger btn-sm" title="Delete">
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan={6} className="empty">No accounts found.</td></tr>
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
