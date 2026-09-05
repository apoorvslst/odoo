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
    <div className="max-w-3xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <div className="flex gap-3">
          <Button onClick={handleSubmit} variant="primary">Confirm</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        {initialData ? `Edit Account: ${initialData.accountName}` : 'New Chart of Account'}
      </h2>
      {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">⚠️ {errorMsg}</div>}

      <div className="space-y-6">
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-orange-600 text-sm">Account Code</label>
          <input type="text" name="accountCode" value={formData.accountCode} onChange={handleChange}
            placeholder="e.g. 1020" disabled={Boolean(initialData)}
            className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium disabled:text-slate-400" />
        </div>
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-orange-600 text-sm">Account Name</label>
          <input type="text" name="accountName" value={formData.accountName} onChange={handleChange}
            placeholder="e.g. Petty Cash"
            className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
        </div>
        <div className="flex items-baseline">
          <label className="w-40 font-bold text-orange-600 text-sm">Type</label>
          <select name="type" value={formData.type} onChange={handleChange}
            className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-400">
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
    <ModuleShell title="Chart of Accounts" subtitle="Master ledger classification — the buckets every transaction lands in" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' ? (
        <AccountFormView initialData={editingAccount} onBack={() => setActiveView('list')} onSave={handleSave} />
      ) : (
        <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-3 w-full sm:w-2/3">
              <Button onClick={() => { setEditingAccount(null); setActiveView('form'); }} variant="primary">New Account</Button>
              <input type="text" placeholder="Search accounts…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white cursor-pointer">
                <option value="">All types</option>
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Archived
              </label>
            </div>
          </div>

          <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4">Code</th>
                  <th className="py-4 px-4">Account Name</th>
                  <th className="py-4 px-3">Type</th>
                  <th className="py-4 px-4 text-right">Balance</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {pageItems.map((account) => (
                  <tr key={account.id} className="hover:bg-blue-50/40 cursor-pointer group" onClick={() => { setEditingAccount(account); setActiveView('form'); }}>
                    <td className="py-4 px-4 font-mono font-bold text-orange-600">{account.accountCode}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-orange-600">{account.accountName}</td>
                    <td className="py-4 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{account.type}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(account.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${account.isArchived ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                        {account.isArchived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      {isAdmin && (
                        <div className="flex gap-2 justify-center">
                          <button onClick={(e) => { e.stopPropagation(); handleArchive(account); }} className="p-1 rounded hover:bg-slate-100 text-sm" title={account.isArchived ? 'Unarchive' : 'Archive'}>
                            {account.isArchived ? '📂' : '📁'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(account); }} className="p-1 rounded hover:bg-red-50 text-sm" title="Delete">🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No accounts found.</td></tr>
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
