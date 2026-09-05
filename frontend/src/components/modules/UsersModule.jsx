import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { Button, ModuleShell } from './ui';

// Admin-only user management: GET/POST /api/auth/users.
// Contact-role users REQUIRE a contactId linking them to a contacts row.

const ROLES = ['admin', 'accountant', 'contact'];

export default function UsersModule() {
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'accountant', contactId: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setUsers(await apiFetch('/auth/users')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => {
    load();
    apiFetch('/contacts').then(setContacts).catch(() => {});
  }, [load]);

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.email.trim() || form.password.length < 6) {
      setFormError('Username, email and a password (min 6 chars) are required.');
      return;
    }
    if (form.role === 'contact' && !form.contactId) {
      setFormError('Contact-role users must be linked to a contact record.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await apiFetch('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          contactId: form.role === 'contact' ? Number(form.contactId) : undefined,
        }),
      });
      setForm({ username: '', email: '', password: '', role: 'accountant', contactId: '' });
      setShowForm(false);
      await load();
    } catch (e) { setFormError(e.message); }
    setSaving(false);
  };

  const roleBadge = (role) => ({
    admin: 'bg-red-50 text-red-700 border border-red-200',
    accountant: 'bg-sky-50 text-sky-700 border border-sky-200',
    contact: 'bg-purple-50 text-purple-700 border border-purple-200',
  }[role] || 'bg-slate-100 text-slate-700');

  return (
    <ModuleShell title="User Management" subtitle="Admin only — provision back-office and portal users" error={error} onDismissError={() => setError('')}>
      <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Users</h2>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Cancel' : 'Create User'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {formError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Username *</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white cursor-pointer">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'contact' && (
              <div className="flex flex-col max-w-sm">
                <label className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Linked Contact *</label>
                <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white cursor-pointer">
                  <option value="">Select contact…</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Portal users only see documents of this contact.</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleSubmit} variant="primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</Button>
            </div>
          </div>
        )}

        <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4">#</th>
                <th className="py-4 px-4">Username</th>
                <th className="py-4 px-4">Email</th>
                <th className="py-4 px-3">Role</th>
                <th className="py-4 px-3">Linked Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((u) => {
                const contact = contacts.find((c) => c.id === u.contactId);
                return (
                  <tr key={u.id} className="hover:bg-blue-50/40">
                    <td className="py-4 px-4 font-mono text-xs text-slate-400">{u.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{u.username}</td>
                    <td className="py-4 px-4 text-slate-600">{u.email}</td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${roleBadge(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="py-4 px-3 text-slate-600 text-xs">{u.contactId ? `#${u.contactId} — ${contact ? contact.name : ''}` : '—'}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
