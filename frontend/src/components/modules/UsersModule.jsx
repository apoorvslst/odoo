import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { Button, ModuleShell, StatusPill } from './ui';

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

  return (
    <ModuleShell title="User Management" subtitle="Provision administrative, accounting, and portal accounts" error={error} onDismissError={() => setError('')}>
      <div className="panel fade-in">
        <div className="toolbar">
          <div className="grow" />
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Cancel' : 'Create User'}
          </Button>
        </div>

        {showForm && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--bg)' }}>
            {formError && <div className="form-error">{formError}</div>}
            <div className="grid-4" style={{ marginBottom: '1rem' }}>
              <div className="field">
                <label className="label-sm">Username *</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input" />
              </div>
              <div className="field">
                <label className="label-sm">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input" />
              </div>
              <div className="field">
                <label className="label-sm">Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input" />
              </div>
              <div className="field">
                <label className="label-sm">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {form.role === 'contact' && (
              <div className="field" style={{ maxWidth: 320, marginBottom: '1rem' }}>
                <label className="label-sm">Linked Contact *</label>
                <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="input">
                  <option value="">Select contact…</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </select>
              </div>
            )}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={handleSubmit} variant="primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</Button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Linked Contact</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const contact = contacts.find((c) => c.id === u.contactId);
                return (
                  <tr key={u.id}>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{u.id}</td>
                    <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{u.username}</td>
                    <td style={{ color: 'var(--ink-secondary)' }}>{u.email}</td>
                    <td>
                      <StatusPill status={u.role} />
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{u.contactId ? `#${u.contactId} — ${contact ? contact.name : ''}` : '—'}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} className="empty">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleShell>
  );
}
