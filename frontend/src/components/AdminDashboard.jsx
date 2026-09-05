import React, { useState, useEffect, useCallback } from 'react';

// ========================================================================================
// API HELPER — attaches JWT from localStorage
// ========================================================================================

const API_BASE = '/api';

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const d = await res.json(); msg = d.message || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ========================================================================================
// GLOBAL CSS STYLES
// ========================================================================================

const globalStyles = `
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .integrated-app-container {
    min-height: 100%;
    background-color: #fcfcfd;
    position: relative;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    border-radius: 1rem;
  }
  .content-layer {
    position: relative;
    z-index: 10;
  }
  .user-rainbow-accent {
    position: absolute;
    bottom: -180px;
    right: -180px;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle at bottom right, 
      rgba(131, 58, 180, 0.18) 0%, 
      rgba(253, 29, 29, 0.12) 25%, 
      rgba(252, 176, 69, 0.10) 50%, 
      transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .user-underline-input {
    border-bottom: 2px solid #e2e8f0;
    transition: border-color 0.2s ease-in-out;
  }
  .user-underline-input:focus {
    border-color: #2563eb;
    outline: none;
  }
  .product-rainbow-accent {
    position: absolute;
    bottom: -180px;
    right: -180px;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle at bottom right, 
      rgba(236, 72, 153, 0.15) 0%, 
      rgba(249, 115, 22, 0.12) 30%, 
      rgba(168, 85, 247, 0.10) 60%, 
      transparent 75%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
  .product-underline-input {
    border-bottom: 2px solid #fbcfe8;
    transition: border-color 0.2s ease-in-out;
  }
  .product-underline-input:focus {
    border-color: #db2777;
    outline: none;
  }
`;

// ========================================================================================
// SHARED UI COMPONENTS
// ========================================================================================

const Card = ({ title, value, colorClass, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${colorClass} cursor-pointer hover:shadow-md transition duration-200 ease-in-out animate-fade-in`}
    >
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
);

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '', title = '' }) => {
    const baseStyle = "px-6 py-2.5 font-semibold rounded-xl transition-all shadow-sm focus:outline-none flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200",
        secondary: "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-md",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-md",
        pink: "bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-200",
        ghost: "bg-transparent text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200",
        menuActive: "bg-gray-900 text-white shadow-md",
        menuInactive: "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
    };
    const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95";
    return (
        <button type={type} onClick={onClick} disabled={disabled} title={title}
            className={`${baseStyle} ${variants[variant]} ${disabledStyle} ${className}`}>
            {children}
        </button>
    );
};

// Pagination helper
const PAGE_SIZE = 20;
const Pagination = ({ currentPage, totalItems, onPageChange }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (totalItems <= PAGE_SIZE) return null;
    return (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages} ({totalItems} items)</span>
            <div className="flex gap-2">
                <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>← Prev</Button>
                <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Next →</Button>
            </div>
        </div>
    );
};

const paginate = (items, page) => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


// ========================================================================================
// DASHBOARD COMPONENT
// ========================================================================================

const Dashboard = ({ navigate }) => {
    const [metrics, setMetrics] = useState({ products: 0, contacts: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                const [prods, conts] = await Promise.all([
                    apiFetch('/products'),
                    apiFetch('/contacts'),
                ]);
                setMetrics({ products: prods.length, contacts: conts.length });
            } catch {}
        };
        load();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">App Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of company-wide metrics (All Access)</p>
                </div>
            </div>
            <section>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><span>🛒</span> Sales</h2>
                    <Button onClick={() => navigate('sales')} variant="primary">New Order</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="All" value="—" colorClass="border-blue-500" onClick={() => navigate('sales')} />
                    <Card title="Confirmed" value="—" colorClass="border-green-500" onClick={() => navigate('sales')} />
                    <Card title="Draft" value="—" colorClass="border-yellow-500" onClick={() => navigate('sales')} />
                </div>
            </section>
            <section>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><span>🛍️</span> Product</h2>
                    <Button onClick={() => navigate('product')} variant="pink">New Product</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Total Products" value={metrics.products} colorClass="border-pink-500" onClick={() => navigate('product')} />
                    <Card title="Total Contacts" value={metrics.contacts} colorClass="border-green-500" onClick={() => navigate('users')} />
                    <Card title="Active" value="—" colorClass="border-yellow-500" onClick={() => navigate('product')} />
                </div>
            </section>
            <section>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><span>📈</span> Budget Reports</h2>
                    <Button onClick={() => navigate('report')} variant="success">View Reports</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Achieved" value="—" colorClass="border-teal-500" onClick={() => navigate('report')} />
                    <Card title="Budget" value="—" colorClass="border-purple-500" onClick={() => navigate('report')} />
                    <Card title="Committed" value="—" colorClass="border-orange-500" onClick={() => navigate('report')} />
                </div>
            </section>
        </div>
    );
};


// ========================================================================================
// MODULE 1: USERS & CONTACTS (ADMIN SUITE)
// ========================================================================================

// Backend contact schema: { id, name, type, email, mobile, city, state, pincode, profileImage, isArchived, createdAt }
// Required fields for create: name, type
// type must be: "customer" | "vendor" | "both"

const ContactFormView = ({ initialData, invoices = [], payments = [], onBack, onSave, onNew }) => {
    const emptyForm = { id: null, name: '', type: 'customer', email: '', mobile: '', city: '', state: '', pincode: '', profileImage: null };
    const [formData, setFormData] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('details');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setImagePreview(initialData.profileImage || null);
        } else {
            setFormData(emptyForm);
            setImagePreview(null);
        }
    }, [initialData]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            setFormData(prev => ({ ...prev, profileImage: url }));
        }
    };

    const handleConfirmSubmit = () => {
        if (!formData.name.trim()) { setErrorMsg('Please enter a Contact Name'); return; }
        if (!formData.type) { setErrorMsg('Please select a Contact Type'); return; }
        if (!formData.email.trim()) { setErrorMsg('Please enter an Email'); return; }
        setErrorMsg('');
        onSave(formData);
    };

    return (
        <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-100">
                <div className="flex gap-3">
                    <Button onClick={() => { setFormData(emptyForm); setImagePreview(null); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
                    <Button onClick={handleConfirmSubmit} variant="primary">Confirm</Button>
                </div>
                <Button onClick={onBack} variant="secondary">Back</Button>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    {formData.id ? `Edit Contact: ${formData.name}` : 'Create Contact Master'}
                </h2>
                {formData.id && (
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('details')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${activeSubTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Contact Details
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('invoices')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'invoices' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Invoices Attached <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px]">{invoices.length}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('payments')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeSubTab === 'payments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Payments Recorded <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-full font-mono text-[10px]">{payments.length}</span>
                        </button>
                    </div>
                )}
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg font-medium shadow-sm flex items-center gap-2">
                    <span>⚠️</span> {errorMsg}
                </div>
            )}

            {activeSubTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="col-span-2 space-y-6">
                        <div className="flex items-baseline">
                            <label className="w-36 font-semibold text-gray-700 text-sm">Contact Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                        </div>
                        <div className="flex items-baseline">
                            <label className="w-36 font-semibold text-gray-700 text-sm">Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium cursor-pointer">
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <div className="flex items-baseline">
                            <label className="w-36 font-semibold text-gray-700 text-sm">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Unique Email" className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                        </div>
                        <div className="flex items-baseline">
                            <label className="w-36 font-semibold text-gray-700 text-sm">Mobile</label>
                            <input type="text" name="mobile" value={formData.mobile || ''} onChange={handleChange} placeholder="+91 9090090909" className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <label className="block font-bold text-gray-800 mb-4 text-sm tracking-wide uppercase">Address</label>
                            <div className="space-y-4 pl-3 border-l-2 border-blue-100">
                                <input type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="City" className="w-full user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                                <input type="text" name="state" value={formData.state || ''} onChange={handleChange} placeholder="State" className="w-full user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                                <input type="text" name="pincode" value={formData.pincode || ''} onChange={handleChange} placeholder="Pincode" className="w-full user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-center justify-start border-l border-gray-100 pl-8">
                        <div className="w-52 h-52 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-400 transition-all cursor-pointer relative overflow-hidden group shadow-inner">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Contact Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100/60 text-blue-600 flex items-center justify-center font-bold text-lg">&#8682;</div>
                                    <span className="text-sm font-semibold text-gray-600 group-hover:text-blue-600">Upload Image</span>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        {imagePreview && (
                            <button onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, profileImage: null })); }} className="mt-3 text-xs text-red-500 font-medium hover:underline">Remove Image</button>
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'invoices' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Invoices chained to <strong className="text-gray-900">{formData.name}</strong> from database:</p>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                            Total: ₹{invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                                    <th className="py-3 px-4">Invoice #</th>
                                    <th className="py-3 px-4">Kind</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Due Date</th>
                                    <th className="py-3 px-4 text-right">Total</th>
                                    <th className="py-3 px-4 text-right">Paid</th>
                                    <th className="py-3 px-4 text-right">Balance Due</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-indigo-50/30">
                                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">INV-{inv.id}</td>
                                        <td className="py-3 px-4 capitalize text-xs">{inv.kind}</td>
                                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">{inv.date}</td>
                                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">{inv.dueDate || '—'}</td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold">₹{Number(inv.totalAmount).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-mono text-emerald-600">₹{Number(inv.paid || 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-mono text-amber-600 font-bold">₹{Number(inv.balanceDue || 0).toLocaleString()}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'sent' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr><td colSpan="8" className="py-8 text-center text-gray-400">No invoices attached to this contact.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeSubTab === 'payments' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Payment records attached to <strong className="text-gray-900">{formData.name}</strong>:</p>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            Total Paid: ₹{payments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                                    <th className="py-3 px-4">Payment #</th>
                                    <th className="py-3 px-4">Invoice #</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Method</th>
                                    <th className="py-3 px-4">Journal</th>
                                    <th className="py-3 px-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map(pay => (
                                    <tr key={pay.id} className="hover:bg-emerald-50/30">
                                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">PAY-{pay.id}</td>
                                        <td className="py-3 px-4 font-mono text-indigo-700">INV-{pay.invoiceId}</td>
                                        <td className="py-3 px-4 text-gray-600 font-mono text-xs">{pay.date}</td>
                                        <td className="py-3 px-4 capitalize font-semibold text-xs">{pay.method}</td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">{pay.journalName || `J-${pay.journalId}`}</td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">₹{Number(pay.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan="6" className="py-8 text-center text-gray-400">No payment records found for this contact.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// Contact List View with pagination, invoices/payments columns
const ContactListView = ({ contacts, contactInvoicesMap = {}, contactPaymentsMap = {}, onNew, onBack, onSwitchToKanban, onSelectRow, onDelete, onArchive }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const filtered = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const pageItems = paginate(filtered, page);

    useEffect(() => { setPage(1); }, [searchTerm]);

    return (
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    <Button onClick={onNew} variant="primary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" />
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <Button variant="menuInactive" className="!bg-white !text-blue-600 !px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
                        <Button variant="ghost" onClick={onSwitchToKanban} className="!px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Contact Master List</h2>
            <div className="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="py-4 px-3 w-12 text-center">#</th>
                            <th className="py-4 px-3 w-16">Avatar</th>
                            <th className="py-4 px-4">Contact Name</th>
                            <th className="py-4 px-3">Type</th>
                            <th className="py-4 px-4">Email</th>
                            <th className="py-4 px-3">Mobile</th>
                            <th className="py-4 px-4 text-center">Invoices Attached</th>
                            <th className="py-4 px-4 text-center">Payments Recorded</th>
                            <th className="py-4 px-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {pageItems.map((contact) => {
                            const invData = contactInvoicesMap[contact.id] || { count: 0, totalAmount: 0 };
                            const payData = contactPaymentsMap[contact.id] || { count: 0, totalAmount: 0 };
                            return (
                                <tr key={contact.id} className="hover:bg-blue-50/40 cursor-pointer group transition-colors">
                                    <td className="py-4 px-3 text-center font-mono text-xs text-gray-400">{contact.id}</td>
                                    <td className="py-4 px-3">
                                        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold text-gray-500 group-hover:border-blue-400">
                                            {contact.profileImage ? <img src={contact.profileImage} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0).toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 font-bold text-gray-900 group-hover:text-blue-600" onClick={() => onSelectRow(contact)}>
                                        {contact.name}
                                        {contact.city && <span className="block text-xs font-normal text-gray-400">{contact.city}{contact.state ? `, ${contact.state}` : ''}</span>}
                                    </td>
                                    <td className="py-4 px-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${contact.type === 'customer' ? 'bg-blue-50 text-blue-700 border border-blue-200' : contact.type === 'vendor' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                            {contact.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600">{contact.email || '—'}</td>
                                    <td className="py-4 px-3 text-gray-600 font-mono text-xs">{contact.mobile || '—'}</td>
                                    <td className="py-4 px-4 text-center">
                                        {invData.count > 0 ? (
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                                    {invData.count} inv
                                                </span>
                                                <span className="text-[11px] font-mono text-gray-500 mt-0.5 font-semibold">
                                                    ₹{invData.totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 font-medium">0</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        {payData.count > 0 ? (
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                    {payData.count} paid
                                                </span>
                                                <span className="text-[11px] font-mono text-emerald-600 mt-0.5 font-semibold">
                                                    ₹{payData.totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 font-medium">0</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-3 text-center">
                                        <div className="flex gap-2 justify-center items-center">
                                            <button onClick={(e) => { e.stopPropagation(); onArchive(contact); }} className="p-1 rounded hover:bg-gray-100 text-sm" title={contact.isArchived ? 'Unarchive' : 'Archive'}>
                                                {contact.isArchived ? '📂' : '📁'}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(contact); }} className="p-1 rounded hover:bg-red-50 text-sm" title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {pageItems.length === 0 && (
                            <tr><td colSpan="9" className="py-12 text-center text-gray-400 font-medium">No contacts found matching search filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </div>
    );
};


// Contact Kanban View with pagination
const ContactKanbanView = ({ contacts, onNew, onBack, onSwitchToList, onSelectCard }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const filtered = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const pageItems = paginate(filtered, page);

    useEffect(() => { setPage(1); }, [searchTerm]);

    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    <Button onClick={onNew} variant="primary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search cards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" />
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <Button variant="ghost" onClick={onSwitchToList} className="!px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
                        <Button variant="menuInactive" className="!bg-white !text-blue-600 !px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Contact Kanban View</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map((contact) => (
                    <div key={contact.id} onClick={() => onSelectCard(contact)} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer transform hover:-translate-y-1 flex items-center gap-4 group">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border flex-shrink-0 flex items-center justify-center font-bold text-xl text-gray-400 group-hover:border-blue-300">
                            {contact.profileImage ? <img src={contact.profileImage} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-extrabold text-gray-900 truncate group-hover:text-blue-600 text-base">{contact.name}</h3>
                            <p className="text-xs text-gray-500 truncate font-medium mt-0.5">{contact.email || '—'}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{contact.mobile || '—'}</p>
                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${contact.type === 'customer' ? 'bg-blue-100 text-blue-700' : contact.type === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{contact.type}</span>
                        </div>
                    </div>
                ))}
            </div>
            <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </div>
    );
};


// User Module Main Wrapper — wired to backend
const AdvancedUsersModule = () => {
    const [activeView, setActiveView] = useState('menu');
    const [contacts, setContacts] = useState([]);
    const [editingContact, setEditingContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [contactInvoicesMap, setContactInvoicesMap] = useState({});
    const [contactPaymentsMap, setContactPaymentsMap] = useState({});

    const loadContacts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/contacts');
            setContacts(data);
        } catch (e) { setError(e.message); }
        setLoading(false);
    }, []);

    const loadLinkedFinancials = useCallback(async () => {
        try {
            const [invs, pays] = await Promise.all([
                apiFetch('/invoices').catch(() => []),
                apiFetch('/payments').catch(() => []),
            ]);

            const invMap = {};
            (invs || []).forEach(inv => {
                const cid = inv.contactId;
                if (!invMap[cid]) {
                    invMap[cid] = { count: 0, totalAmount: 0, balanceDue: 0, list: [] };
                }
                invMap[cid].count += 1;
                invMap[cid].totalAmount += Number(inv.totalAmount || 0);
                invMap[cid].balanceDue += Number(inv.balanceDue || 0);
                invMap[cid].list.push(inv);
            });
            setContactInvoicesMap(invMap);

            const payMap = {};
            (pays || []).forEach(p => {
                const cid = p.contactId;
                if (!payMap[cid]) {
                    payMap[cid] = { count: 0, totalAmount: 0, list: [] };
                }
                payMap[cid].count += 1;
                payMap[cid].totalAmount += Number(p.amount || 0);
                payMap[cid].list.push(p);
            });
            setContactPaymentsMap(payMap);
        } catch {}
    }, []);

    useEffect(() => { loadContacts(); loadLinkedFinancials(); }, [loadContacts, loadLinkedFinancials]);

    const handleOpenNewForm = () => { setEditingContact(null); setActiveView('form'); };
    const handleEditContact = (contact) => { setEditingContact(contact); setActiveView('form'); };

    const handleSaveContact = async (formData) => {
        try {
            const payload = { name: formData.name, type: formData.type, email: formData.email, mobile: formData.mobile, city: formData.city, state: formData.state, pincode: formData.pincode, profileImage: formData.profileImage };
            if (formData.id) {
                await apiFetch(`/contacts/${formData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                await apiFetch('/contacts', { method: 'POST', body: JSON.stringify(payload) });
            }
            await loadContacts();
            setActiveView('list');
        } catch (e) { setError(e.message); }
    };

    const handleDeleteContact = async (contact) => {
        if (!confirm(`Delete contact "${contact.name}"?`)) return;
        try {
            await apiFetch(`/contacts/${contact.id}`, { method: 'DELETE' });
            await loadContacts();
            await loadLinkedFinancials();
        } catch (e) { alert(e.message); }
    };

    const handleArchiveContact = async (contact) => {
        try {
            await apiFetch(`/contacts/${contact.id}/archive`, { method: 'PATCH' });
            await loadContacts();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="integrated-app-container p-2 md:p-6 shadow-sm border border-gray-100">
            <div className="user-rainbow-accent"></div>

            <div className="max-w-5xl mx-auto mb-10 content-layer animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/80 pb-6 gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Odoo Integrated Suite</span>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Users & Contact Master</h1>
                        {loading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                        {['menu', 'form', 'list', 'kanban'].map(view => (
                            <Button key={view} onClick={() => setActiveView(view)} variant={activeView === view ? 'primary' : 'menuInactive'} className="!px-4 !py-2 !text-xs capitalize">
                                {view} {view !== 'menu' && 'View'}
                            </Button>
                        ))}
                    </div>
                </div>
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">dismiss</button></div>}
            </div>

            {activeView === 'menu' && (
                <div className="max-w-4xl mx-auto my-12 content-layer animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div onClick={handleOpenNewForm} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-blue-400 cursor-pointer text-center group">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#43;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Form View</h3>
                        </div>
                        <div onClick={() => setActiveView('list')} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-blue-400 cursor-pointer text-center group">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#9776;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">List View</h3>
                        </div>
                        <div onClick={() => setActiveView('kanban')} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-blue-400 cursor-pointer text-center group">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#8862;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Kanban View</h3>
                        </div>
                    </div>
                </div>
            )}
            {activeView === 'form' && (
                <ContactFormView
                    initialData={editingContact}
                    invoices={editingContact ? (contactInvoicesMap[editingContact.id]?.list || []) : []}
                    payments={editingContact ? (contactPaymentsMap[editingContact.id]?.list || []) : []}
                    onBack={() => setActiveView('menu')}
                    onSave={handleSaveContact}
                    onNew={handleOpenNewForm}
                />
            )}
            {activeView === 'list' && (
                <ContactListView
                    contacts={contacts}
                    contactInvoicesMap={contactInvoicesMap}
                    contactPaymentsMap={contactPaymentsMap}
                    onNew={handleOpenNewForm}
                    onBack={() => setActiveView('menu')}
                    onSwitchToKanban={() => setActiveView('kanban')}
                    onSelectRow={handleEditContact}
                    onDelete={handleDeleteContact}
                    onArchive={handleArchiveContact}
                />
            )}
            {activeView === 'kanban' && <ContactKanbanView contacts={contacts} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToList={() => setActiveView('list')} onSelectCard={handleEditContact} />}
        </div>
    );
};


// ========================================================================================
// MODULE 2: PRODUCT MASTER SUITE
// ========================================================================================

// Backend product schema: { id, name, type, salesPrice, purchaseCost, category, quantityOnHand, isArchived }
// type must be lowercase: "goods" | "service" | "combo"
// No vendorPrice column in backend

const ProductFormView = ({ initialData, onBack, onSave, onNew, categories, onAddCategory }) => {
    const emptyForm = { id: null, name: '', type: 'goods', category: '', salesPrice: '', purchaseCost: '', profileImage: null };
    const [formData, setFormData] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, salesPrice: initialData.salesPrice || '', purchaseCost: initialData.purchaseCost || '' });
            setImagePreview(null);
        } else {
            setFormData(emptyForm);
            setImagePreview(null);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category' && value === 'CREATE_NEW') { setIsCreatingCategory(true); return; }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleSaveNewCategory = () => {
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim());
            setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
            setIsCreatingCategory(false);
            setNewCategoryName('');
        }
    };

    const handleConfirmSubmit = () => {
        if (!formData.name.trim()) { setErrorMsg('Please enter a Product Name'); return; }
        if (!formData.category.trim() && !isCreatingCategory) { setErrorMsg('Please select or create a Category'); return; }
        setErrorMsg('');
        onSave(formData);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-100">
                <div className="flex gap-3">
                    <Button onClick={() => { setFormData(emptyForm); setImagePreview(null); setIsCreatingCategory(false); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
                    <Button onClick={handleConfirmSubmit} variant="pink">Confirm</Button>
                </div>
                <Button onClick={onBack} variant="secondary">Back</Button>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">
                {formData.id ? 'Edit Product Master' : 'Product Master Form View'}
            </h2>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg font-medium shadow-sm flex items-center gap-2">
                    <span>⚠️</span> {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="col-span-1 flex flex-col items-center justify-start border-r border-gray-100 pr-8">
                    <div className="w-52 h-52 border-2 border-dashed border-pink-200 rounded-3xl flex flex-col items-center justify-center bg-pink-50/20 hover:bg-pink-50/60 hover:border-pink-400 transition-all cursor-pointer relative overflow-hidden group shadow-inner">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4">
                                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">&#8682;</div>
                                <span className="text-sm font-semibold text-pink-700 group-hover:text-pink-800">Upload Image</span>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    {imagePreview && (
                        <button onClick={() => setImagePreview(null)} className="mt-3 text-xs text-red-500 font-medium hover:underline">Remove Image</button>
                    )}
                </div>

                <div className="col-span-2 space-y-7">
                    <div className="flex items-baseline">
                        <label className="w-36 font-bold text-pink-700 text-sm">Product Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Executive Office Chair" className="flex-1 product-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                    </div>

                    <div className="flex items-baseline">
                        <label className="w-36 font-bold text-pink-700 text-sm">Product Type</label>
                        <div className="flex-1 relative">
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full product-underline-input py-1.5 bg-transparent text-gray-900 font-medium cursor-pointer appearance-none pr-8">
                                <option value="goods">Goods (Ready made furniture)</option>
                                <option value="service">Service (Custom furniture)</option>
                                <option value="combo">Combo (Hybrid approach)</option>
                            </select>
                            <span className="absolute right-2 top-2 pointer-events-none text-gray-400 text-xs">&#9660;</span>
                        </div>
                    </div>

                    <div className="flex items-baseline">
                        <label className="w-36 font-bold text-pink-700 text-sm">Category</label>
                        {isCreatingCategory ? (
                            <div className="flex-1 flex gap-2 items-center bg-orange-50/80 p-2 rounded-xl border border-orange-200">
                                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter New Category Name..." className="flex-1 bg-white px-3 py-1 text-sm text-gray-800 rounded-lg border border-orange-300 focus:outline-none" autoFocus />
                                <Button onClick={handleSaveNewCategory} variant="success" className="!px-3 !py-1.5 !text-xs !rounded-lg">Save</Button>
                                <Button onClick={() => setIsCreatingCategory(false)} variant="ghost" className="!px-2 !text-xs">Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex-1 relative">
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full product-underline-input py-1.5 bg-transparent text-gray-900 font-medium cursor-pointer appearance-none pr-8">
                                    <option value="" disabled>Selection</option>
                                    {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                                    <option value="CREATE_NEW" className="font-bold text-orange-600 bg-orange-50">+ Create New Category...</option>
                                </select>
                                <span className="absolute right-2 top-2 pointer-events-none text-gray-400 text-xs">&#9660;</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-100">
                        <div className="flex items-baseline">
                            <label className="w-24 font-bold text-pink-700 text-sm">Sales Price</label>
                            <span className="text-gray-500 mr-2 text-sm font-medium">Rs.</span>
                            <input type="number" name="salesPrice" value={formData.salesPrice} onChange={handleChange} placeholder="100.00" className="flex-1 product-underline-input py-1 bg-transparent text-sm text-gray-900 font-mono font-bold" />
                        </div>
                        <div className="flex items-baseline">
                            <label className="w-28 font-bold text-pink-700 text-sm">Purchase Cost</label>
                            <span className="text-gray-500 mr-2 text-sm font-medium">Rs.</span>
                            <input type="number" name="purchaseCost" value={formData.purchaseCost} onChange={handleChange} placeholder="50.00" className="flex-1 product-underline-input py-1 bg-transparent text-sm text-gray-900 font-mono font-bold" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Product List View with pagination
const ProductListView = ({ products, onNew, onBack, onSwitchToKanban, onSelectRow, onDelete, onArchive }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [page, setPage] = useState(1);

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) || p.type.toLowerCase().includes(searchTerm.toLowerCase()));
    const pageItems = paginate(filtered, page);
    const handleToggleSelectAll = (e) => { e.target.checked ? setSelectedIds(pageItems.map(p => p.id)) : setSelectedIds([]); };
    const handleToggleRow = (id, e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

    useEffect(() => { setPage(1); }, [searchTerm]);

    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    <Button onClick={onNew} variant="secondary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search products by name, category, or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm text-gray-800 placeholder-gray-400" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm font-bold">&#10005;</button>}
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <Button variant="menuInactive" className="!bg-white !text-gray-900 !px-3 !py-1.5 !border-gray-200"><span className="text-base">&#9776;</span></Button>
                        <Button variant="ghost" onClick={onSwitchToKanban} className="!text-pink-500 hover:!text-pink-600 !px-3 !py-1.5"><span className="text-base">&#8862;</span></Button>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Product Master List View</h2>
                {selectedIds.length > 0 && <span className="text-xs font-bold bg-pink-100 text-pink-700 px-3 py-1 rounded-full">{selectedIds.length} Selected</span>}
            </div>

            <div className="overflow-hidden bg-white rounded-2xl border border-gray-300 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900 text-gray-100 text-sm font-medium tracking-wide">
                            <th className="py-4 px-4 w-16 text-center border-b border-gray-700"><input type="checkbox" onChange={handleToggleSelectAll} checked={pageItems.length > 0 && selectedIds.length === pageItems.length} className="w-4 h-4 text-pink-600 rounded border-gray-500 focus:ring-pink-500 cursor-pointer" /></th>
                            <th className="py-4 px-4 border-b border-gray-700">Product</th>
                            <th className="py-4 px-4 border-b border-gray-700">Category</th>
                            <th className="py-4 px-4 border-b border-gray-700">Type</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-right">Sales Price</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-right">Purchase Cost</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-right">Qty on Hand</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm bg-white">
                        {pageItems.length === 0 ? (
                            <tr><td colSpan="8" className="py-12 text-center text-gray-400 font-medium">No products match your search query.</td></tr>
                        ) : (
                            pageItems.map((product) => (
                                <tr key={product.id} onClick={() => onSelectRow(product)} className={`hover:bg-pink-50/40 cursor-pointer transition-colors group ${selectedIds.includes(product.id) ? 'bg-pink-50/60' : ''}`}>
                                    <td className="py-4 px-4 text-center" onClick={(e) => handleToggleRow(product.id, e)}><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => { }} className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500 cursor-pointer" /></td>
                                    <td className="py-4 px-4 font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                                        <span>{product.name}</span>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 font-medium"><span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700 font-semibold">{product.category || 'Uncategorized'}</span></td>
                                    <td className="py-4 px-4 text-gray-600">{product.type}</td>
                                    <td className="py-4 px-4 text-gray-900 font-mono font-bold text-right">Rs. {Number(product.salesPrice || 0).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-gray-900 font-mono text-right">Rs. {Number(product.purchaseCost || 0).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-gray-700 font-mono text-right">{Number(product.quantityOnHand || 0)}</td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex gap-1 justify-center">
                                            <button onClick={(e) => { e.stopPropagation(); onArchive(product); }} className="text-xs text-amber-600 hover:underline" title={product.isArchived ? 'Unarchive' : 'Archive'}>{product.isArchived ? '📂' : '📁'}</button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(product); }} className="text-xs text-red-500 hover:underline" title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </div>
    );
};


// Product Kanban View with pagination
const ProductKanbanView = ({ products, onNew, onBack, onSwitchToList, onSelectCard }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) || p.type.toLowerCase().includes(searchTerm.toLowerCase()));
    const pageItems = paginate(filtered, page);

    useEffect(() => { setPage(1); }, [searchTerm]);

    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    <Button onClick={onNew} variant="secondary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search cards by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm text-gray-800 placeholder-gray-400" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm font-bold">&#10005;</button>}
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <Button variant="ghost" onClick={onSwitchToList} className="!px-3 !py-1.5"><span className="text-base">&#9776;</span></Button>
                        <Button variant="menuInactive" className="!bg-white !text-pink-600 !px-3 !py-1.5 !border-gray-200"><span className="text-base">&#8862;</span></Button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Product Master Kanban View</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {pageItems.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">No products found matching search filter.</div>
                ) : (
                    pageItems.map((product) => (
                        <div key={product.id} onClick={() => onSelectCard(product)} className="p-5 bg-gray-900 text-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-pink-500 border border-gray-800 transition-all cursor-pointer flex items-center gap-5 group">
                            <div className="w-20 h-20 rounded-2xl bg-gray-800 overflow-hidden border border-gray-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-pink-500 transition-colors">
                                <span className="text-gray-400 text-xs">{product.name ? product.name.charAt(0).toUpperCase() : '?'}</span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-lg text-gray-100 truncate mb-1 group-hover:text-pink-400 transition-colors">{product.name}</h3>
                                <div className="flex flex-col gap-0.5 text-xs text-gray-300 font-mono">
                                    <p className="font-semibold text-gray-200">Sales Price <span className="text-pink-400 font-bold">{Number(product.salesPrice || 0).toLocaleString()}</span></p>
                                    <p>Cost <span className="text-gray-400">{Number(product.purchaseCost || 0).toLocaleString()}</span></p>
                                    <p className="text-green-400 text-[11px]">Qty: {Number(product.quantityOnHand || 0)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <Pagination currentPage={page} totalItems={filtered.length} onPageChange={setPage} />
        </div>
    );
};


// Product Module Main Wrapper — wired to backend
const ProductApp = () => {
    const [activeView, setActiveView] = useState('menu');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/products');
            setProducts(data);
            // Extract unique categories from products
            const cats = [...new Set(data.map(p => p.category).filter(Boolean))];
            setCategories(prev => [...new Set([...prev, ...cats])]);
        } catch (e) { setError(e.message); }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadProducts();
        // Seed some default categories if empty
        setCategories(prev => prev.length ? prev : ['Chair', 'Table', 'Dining', 'Sofa', 'Electronics', 'Appliances']);
    }, [loadProducts]);

    const handleOpenNewForm = () => { setEditingProduct(null); setActiveView('form'); };
    const handleEditProduct = (product) => { setEditingProduct(product); setActiveView('form'); };

    const handleSaveProduct = async (formData) => {
        try {
            const payload = { name: formData.name, type: formData.type, salesPrice: Number(formData.salesPrice) || 0, purchaseCost: Number(formData.purchaseCost) || 0, category: formData.category };
            if (formData.id) {
                await apiFetch(`/products/${formData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
            }
            await loadProducts();
            setActiveView('list');
        } catch (e) { setError(e.message); }
    };

    const handleAddCategory = (newCat) => { if (!categories.includes(newCat)) setCategories(prev => [...prev, newCat]); };

    const handleDeleteProduct = async (product) => {
        if (!confirm(`Delete product "${product.name}"?`)) return;
        try {
            await apiFetch(`/products/${product.id}`, { method: 'DELETE' });
            await loadProducts();
        } catch (e) { alert(e.message); }
    };

    const handleArchiveProduct = async (product) => {
        try {
            await apiFetch(`/products/${product.id}/archive`, { method: 'PATCH' });
            await loadProducts();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="integrated-app-container p-2 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
            <div className="product-rainbow-accent"></div>

            <div className="max-w-5xl mx-auto mb-10 content-layer">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/80 pb-6 gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full">Odoo ERP Master Suite</span>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Product Master Suite</h1>
                        {loading && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
                    </div>
                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex-wrap">
                        {['menu', 'form', 'list', 'kanban'].map(view => (
                            <Button key={view} onClick={() => setActiveView(view)} variant={activeView === view ? (view === 'menu' ? 'menuActive' : 'pink') : 'menuInactive'} className="!px-3 !py-1.5 !text-xs capitalize">
                                {view === 'menu' ? 'Hub' : `${view} View`}
                            </Button>
                        ))}
                    </div>
                </div>
                {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error} <button onClick={() => setError('')} className="ml-2 underline">dismiss</button></div>}
            </div>

            {activeView === 'menu' && (
                <div className="max-w-4xl mx-auto my-8 content-layer space-y-8 animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">Select a Product View Component</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage product catalog via Form, List, or Kanban views.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div onClick={handleOpenNewForm} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-pink-400 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#43;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Form View</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">Create/edit products with sales price, cost price, image upload & category selection.</p>
                        </div>
                        <div onClick={() => setActiveView('list')} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-pink-400 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#9776;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">List View</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">Tabular list showing products, categories, types, sales prices.</p>
                        </div>
                        <div onClick={() => setActiveView('kanban')} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-pink-400 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#8862;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Kanban View</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">Visual grid of dark rounded cards displaying product details.</p>
                        </div>
                    </div>
                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-base text-pink-400">Database Record Status</h4>
                            <p className="text-xs text-gray-400 mt-0.5">Live database currently holds <strong className="text-white">{products.length} Products</strong> across <strong className="text-white">{categories.length} Categories</strong>.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'form' && <ProductFormView initialData={editingProduct} onBack={() => setActiveView('menu')} onSave={handleSaveProduct} onNew={handleOpenNewForm} categories={categories} onAddCategory={handleAddCategory} />}
            {activeView === 'list' && <ProductListView products={products} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToKanban={() => setActiveView('kanban')} onSelectRow={handleEditProduct} onDelete={handleDeleteProduct} onArchive={handleArchiveProduct} />}
            {activeView === 'kanban' && <ProductKanbanView products={products} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToList={() => setActiveView('list')} onSelectCard={handleEditProduct} />}
        </div>
    );
};


// ========================================================================================
// MAIN APPLICATION SHELL (ROUTING / SIDEBAR)
// ========================================================================================

export default function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof onLogout === 'function') onLogout();
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'sales', label: 'Sales', icon: '🛒' },
        { id: 'product', label: 'Product', icon: '🛍️' },
        { id: 'account', label: 'Account', icon: '💼' },
        { id: 'report', label: 'Report', icon: '📈' },
        { id: 'users', label: 'Users (Admin)', icon: '👥' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard navigate={setActiveTab} />;
            case 'users': return <AdvancedUsersModule />;
            case 'product': return <ProductApp />;
            case 'sales':
            case 'report':
            case 'account':
                return (
                    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <span className="text-5xl mb-4 text-gray-300">🚧</span>
                        <h2 className="text-2xl font-medium text-gray-700">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
                        <p className="text-gray-500 mt-2">Click 'Product' or 'Users' to see live integrations.</p>
                        <Button onClick={() => setActiveTab('dashboard')} className="mt-6" variant="secondary">Back to Dashboard</Button>
                    </div>
                );
            default: return <Dashboard navigate={setActiveTab} />;
        }
    };

    // Get user info from localStorage
    const userInfo = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
    })();

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

            {/* Sidebar Navigation */}
            <aside className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-20 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="h-16 flex items-center justify-center border-b border-slate-800">
                    <button className="text-2xl hover:text-white transition p-2 rounded-md" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar">🛋️</button>
                    {sidebarOpen && <span className="ml-3 font-bold text-lg text-white whitespace-nowrap overflow-hidden">Urban Furniture</span>}
                </div>
                <nav className="flex-1 py-6 overflow-y-auto space-y-2 px-3">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span className="text-xl w-8 text-center">{item.icon}</span>
                            {sidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800 bg-slate-950">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                            {(userInfo.username || 'A').charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="ml-3 overflow-hidden flex-1">
                                <p className="text-sm font-bold text-white truncate">{userInfo.username || 'Admin'}</p>
                                <p className="text-xs text-green-400 font-medium truncate flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 block"></span> {userInfo.role || 'admin'}
                                </p>
                            </div>
                        )}
                        {sidebarOpen && (
                            <button onClick={handleLogout} className="ml-2 text-xs text-red-400 hover:text-red-300 font-medium" title="Logout">⏻</button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
                    <div className="flex items-center text-gray-500 text-sm font-medium">
                        System <span className="mx-2">/</span> <span className="text-gray-900 capitalize font-semibold">{activeTab}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Admin Mode</span>
                        <button onClick={handleLogout} className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors">Logout</button>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50 relative">
                    <div className="max-w-7xl mx-auto pb-12">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}
