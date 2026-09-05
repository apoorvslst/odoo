import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money } from '../../lib/api';
import { Button, Pagination, usePagedSearch, ModuleShell } from './ui';

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
    <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <div className="flex gap-3">
          <Button onClick={() => { setFormData(EMPTY_CONTACT); setImagePreview(null); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
          <Button onClick={handleConfirmSubmit} variant="primary">Confirm</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {formData.id ? `Edit Contact: ${formData.name}` : 'Create Contact Master'}
        </h2>
        {formData.id && (
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button type="button" onClick={() => setActiveSubTab('details')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeSubTab === 'details' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              Contact Details
            </button>
            <button type="button" onClick={() => setActiveSubTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'invoices' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              Documents <span className="px-1.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px]">{invoices.length}</span>
            </button>
            <button type="button" onClick={() => setActiveSubTab('payments')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'payments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              Payments <span className="px-1.5 bg-emerald-50 text-emerald-700 rounded-full font-mono text-[10px]">{payments.length}</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg font-medium shadow-sm">⚠️ {errorMsg}</div>
      )}

      {activeSubTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="col-span-2 space-y-6">
            <div className="flex items-baseline">
              <label className="w-36 font-semibold text-slate-700 text-sm">Contact Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Nimesh Pathak" className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
            </div>
            <div className="flex items-baseline">
              <label className="w-36 font-semibold text-slate-700 text-sm">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex items-baseline">
              <label className="w-36 font-semibold text-slate-700 text-sm">Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="name@example.com" className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
            </div>
            <div className="flex items-baseline">
              <label className="w-36 font-semibold text-slate-700 text-sm">Mobile</label>
              <input type="text" name="mobile" value={formData.mobile || ''} onChange={handleChange} placeholder="+91 9090090909" className="flex-1 user-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
            </div>
            <div className="pt-6 border-t border-slate-100">
              <label className="block font-bold text-slate-800 mb-4 text-sm tracking-wide uppercase">Address</label>
              <div className="space-y-4 pl-3 border-l-2 border-blue-100">
                <input type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="City" className="w-full user-underline-input py-1 bg-transparent text-sm text-slate-800" />
                <input type="text" name="state" value={formData.state || ''} onChange={handleChange} placeholder="State" className="w-full user-underline-input py-1 bg-transparent text-sm text-slate-800" />
                <input type="text" name="pincode" value={formData.pincode || ''} onChange={handleChange} placeholder="Pincode" className="w-full user-underline-input py-1 bg-transparent text-sm text-slate-800" />
              </div>
            </div>
          </div>

          <div className="col-span-1 flex flex-col items-center justify-start border-l border-slate-100 pl-8">
            <div className="w-52 h-52 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden group">
              {imagePreview ? (
                <img src={imagePreview} alt="Contact Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100/60 text-orange-600 flex items-center justify-center font-bold text-lg">&#8682;</div>
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-orange-600">Upload Image</span>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            {imagePreview && (
              <button onClick={() => { setImagePreview(null); setFormData((prev) => ({ ...prev, profileImage: null })); }} className="mt-3 text-xs text-red-500 font-medium hover:underline">Remove Image</button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Documents chained to <strong>{formData.name}</strong>:</p>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              Total: {money(invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0))}
            </span>
          </div>
          <div className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Doc #</th><th className="py-3 px-4">Kind</th><th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Due Date</th><th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th><th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-indigo-50/30">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{inv.kind === 'bill' ? 'BILL' : 'INV'}-{inv.id}</td>
                    <td className="py-3 px-4 capitalize text-xs">{inv.kind}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{inv.date}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{inv.dueDate || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">{money(inv.totalAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">{money(inv.paid || 0)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600 font-bold">{money(inv.balanceDue || 0)}</td>
                    <td className="py-3 px-4 text-center text-xs font-bold capitalize">{inv.status}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan="8" className="py-8 text-center text-slate-400">No documents attached to this contact.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Payment records for <strong>{formData.name}</strong>:</p>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Total Paid: {money(payments.reduce((s, p) => s + Number(p.amount || 0), 0))}
            </span>
          </div>
          <div className="overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Payment #</th><th className="py-3 px-4">Doc #</th><th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th><th className="py-3 px-4">Journal</th><th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-emerald-50/30">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">PAY-{pay.id}</td>
                    <td className="py-3 px-4 font-mono text-indigo-700">DOC-{pay.invoiceId}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{pay.date}</td>
                    <td className="py-3 px-4 capitalize font-semibold text-xs">{pay.method}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{pay.journalName || `J-${pay.journalId}`}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{money(pay.amount)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan="6" className="py-8 text-center text-slate-400">No payment records found for this contact.</td></tr>
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
    <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Button onClick={onNew} variant="primary">New</Button>
          <input type="text" placeholder="Search contacts…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Button variant="secondary" className="!px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
            <Button variant="ghost" onClick={onSwitchToKanban} className="!px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Contact Master List</h2>
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-3 w-12 text-center">#</th>
              <th className="py-4 px-3 w-16">Avatar</th>
              <th className="py-4 px-4">Contact Name</th>
              <th className="py-4 px-3">Type</th>
              <th className="py-4 px-4">Email</th>
              <th className="py-4 px-3">Mobile</th>
              <th className="py-4 px-4 text-center">Documents</th>
              <th className="py-4 px-4 text-center">Payments</th>
              {isAdmin && <th className="py-4 px-3 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {pageItems.map((contact) => {
              const invData = contactInvoicesMap[contact.id] || { count: 0, totalAmount: 0 };
              const payData = contactPaymentsMap[contact.id] || { count: 0, totalAmount: 0 };
              return (
                <tr key={contact.id} className="hover:bg-blue-50/40 cursor-pointer group transition-colors">
                  <td className="py-4 px-3 text-center font-mono text-xs text-slate-400">{contact.id}</td>
                  <td className="py-4 px-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center font-bold text-slate-500">
                      {contact.profileImage ? <img src={contact.profileImage} alt="" className="w-full h-full object-cover" /> : contact.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-orange-600" onClick={() => onSelectRow(contact)}>
                    {contact.name}
                    {contact.city && <span className="block text-xs font-normal text-slate-400">{contact.city}{contact.state ? `, ${contact.state}` : ''}</span>}
                  </td>
                  <td className="py-4 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${contact.type === 'customer' ? 'bg-sky-50 text-sky-700 border border-sky-200' : contact.type === 'vendor' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                      {contact.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{contact.email || '—'}</td>
                  <td className="py-4 px-3 text-slate-600 font-mono text-xs">{contact.mobile || '—'}</td>
                  <td className="py-4 px-4 text-center">
                    {invData.count > 0 ? (
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                        {invData.count} • {money(invData.totalAmount)}
                      </span>
                    ) : <span className="text-xs text-slate-300 font-medium">0</span>}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {payData.count > 0 ? (
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {payData.count} • {money(payData.totalAmount)}
                      </span>
                    ) : <span className="text-xs text-slate-300 font-medium">0</span>}
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-3 text-center">
                      <div className="flex gap-2 justify-center items-center">
                        <button onClick={(e) => { e.stopPropagation(); onArchive(contact); }} className="p-1 rounded hover:bg-slate-100 text-sm" title={contact.isArchived ? 'Unarchive' : 'Archive'}>
                          {contact.isArchived ? '📂' : '📁'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(contact); }} className="p-1 rounded hover:bg-red-50 text-sm" title="Delete">🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {pageItems.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400 font-medium">No contacts found matching search filter.</td></tr>
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
    <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Button onClick={onNew} variant="primary">New</Button>
          <input type="text" placeholder="Search cards…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 text-sm" />
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Button variant="ghost" onClick={onSwitchToList} className="!px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
          <Button variant="secondary" className="!px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Contact Kanban View</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.map((contact) => (
          <div key={contact.id} onClick={() => onSelectCard(contact)} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer transform hover:-translate-y-1 flex items-center gap-4 group">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border flex-shrink-0 flex items-center justify-center font-bold text-xl text-slate-400">
              {contact.profileImage ? <img src={contact.profileImage} alt="" className="w-full h-full object-cover" /> : contact.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-extrabold text-slate-900 truncate group-hover:text-orange-600 text-base">{contact.name}</h3>
              <p className="text-xs text-slate-500 truncate font-medium mt-0.5">{contact.email || '—'}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">{contact.mobile || '—'}</p>
              <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-slate-100 text-slate-700">{contact.type}</span>
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
    <ModuleShell title="Users & Contact Master" subtitle="Customers, vendors and dual-role partners" error={error} onDismissError={() => setError('')}>
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
