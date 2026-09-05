import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money } from '../../lib/api';
import { Button, Pagination, usePagedSearch, ModuleShell } from './ui';
import '../../styles/contacts.css';

// Contact schema per routes_db.md: { id, name, type, email, mobile, city, state, pincode, profileImage, isArchived }
// type: "customer" | "vendor" | "both"  — required fields for create: name, type
const EMPTY_CONTACT = { id: null, name: '', type: 'customer', email: '', mobile: '', city: '', state: '', pincode: '', profileImage: null };

const ContactFormView = ({ initialData, invoices = [], payments = [], onBack, onSave, onNew }) => {
  const [formData, setFormData] = useState(EMPTY_CONTACT);
  const [imagePreview, setImagePreview] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('details');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setImagePreview(initialData.profileImage || null);
    } else {
      setFormData(EMPTY_CONTACT);
      setImagePreview(null);
    }
  }, [initialData]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setFormData((prev) => ({ ...prev, profileImage: url }));
    }
  };

  const handleConfirmSubmit = () => {
    if (!formData.name.trim()) { setErrorMsg('Please enter a Contact Name'); return; }
    if (!formData.type) { setErrorMsg('Please select a Contact Type'); return; }
    setErrorMsg('');
    onSave(formData);
  };

  return (
    <div className="cm-container fade-in">
      <div className="cm-header-bar">
        <div className="cm-action-group">
          <Button onClick={() => { setFormData(EMPTY_CONTACT); setImagePreview(null); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
          <Button onClick={handleConfirmSubmit} variant="primary">Confirm</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="cm-header-title-row">
        <h2 className="cm-title">
          {formData.id ? `Edit Contact: ${formData.name}` : 'Create Contact Master'}
        </h2>
        {formData.id && (
          <div className="cm-tab-bar">
            <button
              type="button"
              onClick={() => setActiveSubTab('details')}
              className={`cm-tab-btn ${activeSubTab === 'details' ? 'cm-tab-btn-active' : ''}`}
            >
              Contact Details
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('invoices')}
              className={`cm-tab-btn ${activeSubTab === 'invoices' ? 'cm-tab-btn-active' : ''}`}
            >
              Documents <span className="cm-tab-badge">{invoices.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('payments')}
              className={`cm-tab-btn ${activeSubTab === 'payments' ? 'cm-tab-btn-active' : ''}`}
            >
              Payments <span className="cm-tab-badge">{payments.length}</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="cm-error-banner">{errorMsg}</div>
      )}

      {activeSubTab === 'details' && (
        <div className="cm-form-grid">
          <div className="cm-form-section">
            <div className="cm-form-field">
              <label className="cm-label">Contact Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Nimesh Pathak"
                className="cm-input"
              />
            </div>
            <div className="cm-form-field">
              <label className="cm-label">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="cm-input cm-select"
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="cm-form-field">
              <label className="cm-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="name@example.com"
                className="cm-input"
              />
            </div>
            <div className="cm-form-field">
              <label className="cm-label">Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile || ''}
                onChange={handleChange}
                placeholder="+91 9090090909"
                className="cm-input"
              />
            </div>
            <div className="cm-address-box">
              <label className="cm-address-title">Address</label>
              <div className="cm-address-inputs">
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  placeholder="City"
                  className="cm-input"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  placeholder="State"
                  className="cm-input"
                />
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode || ''}
                  onChange={handleChange}
                  placeholder="Pincode"
                  className="cm-input"
                />
              </div>
            </div>
          </div>

          <div className="cm-avatar-col">
            <div className="cm-avatar-uploader">
              {imagePreview ? (
                <img src={imagePreview} alt="Contact Avatar" className="cm-avatar-preview" />
              ) : (
                <div className="cm-avatar-placeholder">
                  <div className="cm-upload-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span className="cm-upload-text">Upload Image</span>
                  <p className="cm-upload-hint">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="cm-file-input" />
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImagePreview(null); setFormData((prev) => ({ ...prev, profileImage: null })); }}
                className="cm-remove-img-btn"
              >
                Remove Image
              </button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'invoices' && (
        <div>
          <div className="cm-tab-summary-bar">
            <p>Documents attached to <strong>{formData.name}</strong>:</p>
            <span className="cm-summary-badge">
              Total: {money(invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0))}
            </span>
          </div>
          <div className="cm-table-container">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Doc #</th>
                  <th>Kind</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th className="cm-text-right">Total</th>
                  <th className="cm-text-right">Paid</th>
                  <th className="cm-text-right">Balance Due</th>
                  <th className="cm-text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="cm-table-row">
                    <td className="cm-td-doc-id">{inv.kind === 'bill' ? 'BILL' : 'INV'}-{inv.id}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{inv.kind}</td>
                    <td className="cm-mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>{inv.date}</td>
                    <td className="cm-mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>{inv.dueDate || '—'}</td>
                    <td className="cm-text-right cm-mono cm-font-bold">{money(inv.totalAmount)}</td>
                    <td className="cm-text-right cm-mono cm-text-emerald">{money(inv.paid || 0)}</td>
                    <td className="cm-text-right cm-mono cm-text-amber cm-font-bold">{money(inv.balanceDue || 0)}</td>
                    <td className="cm-text-center" style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 650 }}>{inv.status}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="8" className="cm-text-center" style={{ padding: '32px', color: '#94a3b8' }}>
                      No documents attached to this contact.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div>
          <div className="cm-tab-summary-bar">
            <p>Payment records for <strong>{formData.name}</strong>:</p>
            <span className="cm-summary-badge">
              Total Paid: {money(payments.reduce((s, p) => s + Number(p.amount || 0), 0))}
            </span>
          </div>
          <div className="cm-table-container">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Doc #</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Journal</th>
                  <th className="cm-text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id} className="cm-table-row">
                    <td className="cm-td-pay-id">PAY-{pay.id}</td>
                    <td className="cm-td-doc-id">DOC-{pay.invoiceId}</td>
                    <td className="cm-mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>{pay.date}</td>
                    <td className="cm-font-bold" style={{ textTransform: 'capitalize', fontSize: '12px' }}>{pay.method}</td>
                    <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{pay.journalName || `J-${pay.journalId}`}</td>
                    <td className="cm-text-right cm-mono cm-font-bold cm-text-emerald">{money(pay.amount)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="cm-text-center" style={{ padding: '32px', color: '#94a3b8' }}>
                      No payment records found for this contact.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactListView = ({ contacts, contactInvoicesMap = {}, contactPaymentsMap = {}, user, onNew, onSwitchToKanban, onSelectRow, onDelete, onArchive }) => {
  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(contacts,
    (c, q) => c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  const isAdmin = user?.role === 'admin';

  return (
    <div className="cm-container fade-in">
      <div className="cm-toolbar">
        <div className="cm-toolbar-left">
          <Button onClick={onNew} variant="primary">New Contact</Button>
          <input
            type="text"
            placeholder="Search contacts…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cm-input cm-search-input"
          />
        </div>
        <div className="cm-view-toggle">
          <Button variant="secondary" className="btn-sm">List</Button>
          <Button variant="ghost" onClick={onSwitchToKanban} className="btn-sm">Kanban</Button>
        </div>
      </div>

      <div className="cm-table-container">
        <table className="cm-table">
          <thead>
            <tr>
              <th className="cm-text-center" style={{ width: '48px' }}>#</th>
              <th style={{ width: '48px' }}>Avatar</th>
              <th>Contact Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Mobile</th>
              <th className="cm-text-center">Documents</th>
              <th className="cm-text-center">Payments</th>
              {isAdmin && <th className="cm-text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((contact) => {
              const invData = contactInvoicesMap[contact.id] || { count: 0, totalAmount: 0 };
              const payData = contactPaymentsMap[contact.id] || { count: 0, totalAmount: 0 };
              return (
                <tr key={contact.id} className="cm-table-row" onClick={() => onSelectRow(contact)}>
                  <td className="cm-td-id">{contact.id}</td>
                  <td>
                    <div className="cm-avatar-thumb">
                      {contact.profileImage ? (
                        <img src={contact.profileImage} alt="" />
                      ) : (
                        contact.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="cm-contact-name">{contact.name}</span>
                    {contact.city && (
                      <span className="cm-contact-subtext">
                        {contact.city}{contact.state ? `, ${contact.state}` : ''}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`cm-type-badge ${contact.type === 'customer' ? 'cm-type-customer' : contact.type === 'vendor' ? 'cm-type-vendor' : 'cm-type-both'}`}>
                      {contact.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--ink-secondary)' }}>{contact.email || '—'}</td>
                  <td className="cm-mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>{contact.mobile || '—'}</td>
                  <td className="cm-text-center">
                    {invData.count > 0 ? (
                      <span className="cm-count-badge">
                        {invData.count} • {money(invData.totalAmount)}
                      </span>
                    ) : <span className="cm-empty-cell">0</span>}
                  </td>
                  <td className="cm-text-center">
                    {payData.count > 0 ? (
                      <span className="cm-count-badge" style={{ color: 'var(--ok)' }}>
                        {payData.count} • {money(payData.totalAmount)}
                      </span>
                    ) : <span className="cm-empty-cell">0</span>}
                  </td>
                  {isAdmin && (
                    <td className="cm-text-center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onArchive(contact)}
                          className="btn btn-secondary btn-sm"
                          title={contact.isArchived ? 'Unarchive' : 'Archive'}
                        >
                          {contact.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(contact)}
                          className="btn btn-danger btn-sm"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="cm-text-center" style={{ padding: '40px', color: '#94a3b8', fontWeight: 500 }}>
                  No contacts found matching search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
    </div>
  );
};

const ContactKanbanView = ({ contacts, onNew, onSwitchToList, onSelectCard }) => {
  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(contacts,
    (c, q) => c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));

  return (
    <div className="cm-container fade-in">
      <div className="cm-toolbar">
        <div className="cm-toolbar-left">
          <Button onClick={onNew} variant="primary">New Contact</Button>
          <input
            type="text"
            placeholder="Search cards…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cm-input cm-search-input"
          />
        </div>
        <div className="cm-view-toggle">
          <Button variant="ghost" onClick={onSwitchToList} className="btn-sm">List</Button>
          <Button variant="secondary" className="btn-sm">Kanban</Button>
        </div>
      </div>

      <div className="cm-kanban-grid">
        {pageItems.map((contact) => (
          <div key={contact.id} onClick={() => onSelectCard(contact)} className="cm-kanban-card">
            <div className="cm-kanban-avatar">
              {contact.profileImage ? (
                <img src={contact.profileImage} alt="" />
              ) : (
                contact.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="cm-kanban-info">
              <h3 className="cm-kanban-name">{contact.name}</h3>
              <p className="cm-kanban-detail">{contact.email || '—'}</p>
              <p className="cm-kanban-detail mono">{contact.mobile || '—'}</p>
              <span className={`cm-type-badge ${contact.type === 'customer' ? 'cm-type-customer' : contact.type === 'vendor' ? 'cm-type-vendor' : 'cm-type-both'}`} style={{ marginTop: '6px' }}>
                {contact.type}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
    </div>
  );
};

export default function ContactsModule({ user }) {
  const [activeView, setActiveView] = useState('list');
  const [contacts, setContacts] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [error, setError] = useState('');
  const [contactInvoicesMap, setContactInvoicesMap] = useState({});
  const [contactPaymentsMap, setContactPaymentsMap] = useState({});

  const loadContacts = useCallback(async () => {
    try {
      const data = await apiFetch('/contacts');
      setContacts(data);
    } catch (e) { setError(e.message); }
  }, []);

  // Invoices + payments hubs give us per-contact financial chaining without extra endpoints.
  const loadLinkedFinancials = useCallback(async () => {
    const [invs, pays] = await Promise.all([
      apiFetch('/invoices').catch(() => []),
      apiFetch('/payments').catch(() => []),
    ]);
    const invMap = {};
    (invs || []).forEach((inv) => {
      if (!invMap[inv.contactId]) invMap[inv.contactId] = { count: 0, totalAmount: 0, list: [] };
      invMap[inv.contactId].count += 1;
      invMap[inv.contactId].totalAmount += Number(inv.totalAmount || 0);
      invMap[inv.contactId].list.push(inv);
    });
    setContactInvoicesMap(invMap);

    const payMap = {};
    (pays || []).forEach((p) => {
      if (!payMap[p.contactId]) payMap[p.contactId] = { count: 0, totalAmount: 0, list: [] };
      payMap[p.contactId].count += 1;
      payMap[p.contactId].totalAmount += Number(p.amount || 0);
      payMap[p.contactId].list.push(p);
    });
    setContactPaymentsMap(payMap);
  }, []);

  useEffect(() => { loadContacts(); loadLinkedFinancials(); }, [loadContacts, loadLinkedFinancials]);

  const handleOpenNewForm = () => { setEditingContact(null); setActiveView('form'); };
  const handleEditContact = (contact) => { setEditingContact(contact); setActiveView('form'); };

  const handleSaveContact = async (formData) => {
    try {
      const payload = {
        name: formData.name, type: formData.type, email: formData.email, mobile: formData.mobile,
        city: formData.city, state: formData.state, pincode: formData.pincode, profileImage: formData.profileImage,
      };
      if (formData.id) {
        await apiFetch(`/contacts/${formData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/contacts', { method: 'POST', body: JSON.stringify(payload) });
      }
      await loadContacts();
      await loadLinkedFinancials();
      setActiveView('list');
    } catch (e) { setError(e.message); }
  };

  const handleDeleteContact = async (contact) => {
    if (!window.confirm(`Delete contact "${contact.name}"?`)) return;
    try {
      // 409 if the contact has invoices/bills — then archive instead.
      await apiFetch(`/contacts/${contact.id}`, { method: 'DELETE' });
      await loadContacts();
      await loadLinkedFinancials();
    } catch (e) { window.alert(e.message); }
  };

  const handleArchiveContact = async (contact) => {
    try {
      await apiFetch(`/contacts/${contact.id}/archive`, { method: 'PATCH' });
      await loadContacts();
    } catch (e) { window.alert(e.message); }
  };

  return (
    <ModuleShell title="Contacts Master" subtitle="Customers, vendors and business partners" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' && (
        <ContactFormView
          initialData={editingContact}
          invoices={editingContact ? (contactInvoicesMap[editingContact.id]?.list || []) : []}
          payments={editingContact ? (contactPaymentsMap[editingContact.id]?.list || []) : []}
          onBack={() => setActiveView('list')}
          onSave={handleSaveContact}
          onNew={handleOpenNewForm}
        />
      )}
      {activeView === 'list' && (
        <ContactListView
          contacts={contacts}
          contactInvoicesMap={contactInvoicesMap}
          contactPaymentsMap={contactPaymentsMap}
          user={user}
          onNew={handleOpenNewForm}
          onSwitchToKanban={() => setActiveView('kanban')}
          onSelectRow={handleEditContact}
          onDelete={handleDeleteContact}
          onArchive={handleArchiveContact}
        />
      )}
      {activeView === 'kanban' && (
        <ContactKanbanView contacts={contacts} onNew={handleOpenNewForm} onSwitchToList={() => setActiveView('list')} onSelectCard={handleEditContact} />
      )}
    </ModuleShell>
  );
}
