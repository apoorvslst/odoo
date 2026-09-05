import React, { useState, useEffect } from 'react';

// ========================================================================================
// GLOBAL CSS STYLES (DECLARED AT THE START)
// ========================================================================================
// [Shared CSS Usage: globalStyles (Count: 1) - Injected in the main App wrapper]

const globalStyles = `
  /* Animations */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Shared App Container Styles */
  .integrated-app-container {
    min-height: 100%;
    background-color: #fcfcfd;
    position: relative;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    border-radius: 1rem;
  }

  /* Z-Index Content Layering */
  .content-layer {
    position: relative;
    z-index: 10;
  }

  /* User Module Specific Accent */
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
  
  /* User Module Input Underline */
  .user-underline-input {
    border-bottom: 2px solid #e2e8f0;
    transition: border-color 0.2s ease-in-out;
  }
  .user-underline-input:focus {
    border-color: #2563eb;
    outline: none;
  }

  /* Product Module Specific Accent */
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

  /* Product Module Input Underline */
  .product-underline-input {
    border-bottom: 2px solid #fbcfe8;
    transition: border-color 0.2s ease-in-out;
  }
  .product-underline-input:focus {
    border-color: #db2777;
    outline: none;
  }
`;


//
//
//
//
//
//
//
// ========================================================================================
// SHARED UI COMPONENTS (REUSABLE FUNCTIONS DECLARED BEFORE MAIN MODULES)
// ========================================================================================

const Card = ({ title, value, colorClass, onClick }) => (
    // [Shared CSS Usage: .animate-fade-in (Count: 1)]
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
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseStyle} ${variants[variant]} ${disabledStyle} ${className}`}
        >
            {children}
        </button>
    );
};


//
//
//
//
//
//
//
//
//
//
//
//
//
// ========================================================================================
// DASHBOARD COMPONENT
// ========================================================================================

const Dashboard = ({ navigate }) => (
    // [Shared CSS Usage: .animate-fade-in (Count: 2)]
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
                {/* [Shared UI Usage: Button (Count: 1)] */}
                <Button onClick={() => navigate('sales')} variant="primary">New Order</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* [Shared UI Usage: Card (Count: 1, 2, 3)] */}
                <Card title="All" value="124" colorClass="border-blue-500" onClick={() => navigate('sales')} />
                <Card title="Confirmed" value="89" colorClass="border-green-500" onClick={() => navigate('sales')} />
                <Card title="Draft" value="35" colorClass="border-yellow-500" onClick={() => navigate('sales')} />
            </div>
        </section>

        <section>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><span>🛍️</span> Product</h2>
                {/* [Shared UI Usage: Button (Count: 2)] */}
                <Button onClick={() => navigate('product')} variant="pink">New Product</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* [Shared UI Usage: Card (Count: 4, 5, 6)] */}
                <Card title="All" value="86" colorClass="border-pink-500" onClick={() => navigate('product')} />
                <Card title="Confirmed" value="62" colorClass="border-green-500" onClick={() => navigate('product')} />
                <Card title="Draft" value="24" colorClass="border-yellow-500" onClick={() => navigate('product')} />
            </div>
        </section>

        <section>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><span>📈</span> Budget Reports</h2>
                {/* [Shared UI Usage: Button (Count: 3)] */}
                <Button onClick={() => navigate('report')} variant="success">View Reports</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* [Shared UI Usage: Card (Count: 7, 8, 9)] */}
                <Card title="Achieved" value="₹ 4,50k" colorClass="border-teal-500" onClick={() => navigate('report')} />
                <Card title="Budget" value="₹ 6,00k" colorClass="border-purple-500" onClick={() => navigate('report')} />
                <Card title="Committed" value="₹ 5,20k" colorClass="border-orange-500" onClick={() => navigate('report')} />
            </div>
        </section>
    </div>
);



//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// ========================================================================================
// ========================================================================================
// MODULE 1: USERS & CONTACTS (ADMIN SUITE)
// ========================================================================================
// ========================================================================================

const ContactFormView = ({ initialData, onBack, onSave, onNew }) => {
    const emptyForm = { id: null, name: '', email: '', phone: '', street: '', city: '', state: '', country: '', pincode: '', image: null };
    const [formData, setFormData] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setImagePreview(initialData.image || null);
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
            setFormData(prev => ({ ...prev, image: url }));
        }
    };

    const handleConfirmSubmit = () => {
        if (!formData.name.trim()) { setErrorMsg('Please enter a Contact Name'); return; }
        if (!formData.email.trim()) { setErrorMsg('Please enter a Unique Email'); return; }
        setErrorMsg('');
        onSave(formData);
    };

    // [Shared CSS Usage: .animate-fade-in (Count: 3), .content-layer (Count: 1), .user-underline-input (Count: 1 to 8)]
    return (
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-100">
                <div className="flex gap-3">
                    {/* [Shared UI Usage: Button (Count: 4, 5)] */}
                    <Button onClick={() => { setFormData(emptyForm); setImagePreview(null); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
                    <Button onClick={handleConfirmSubmit} variant="primary">Confirm</Button>
                </div>
                {/* [Shared UI Usage: Button (Count: 6)] */}
                <Button onClick={onBack} variant="secondary">Back</Button>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">
                {formData.id ? 'Edit Contact Master Form' : 'Contact Master Form View'}
            </h2>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg font-medium shadow-sm flex items-center gap-2">
                    <span>⚠️</span> {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-baseline">
                        <label className="w-36 font-semibold text-gray-700 text-sm">Contact Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                    </div>
                    <div className="flex items-baseline">
                        <label className="w-36 font-semibold text-gray-700 text-sm">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Unique Email" className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                    </div>
                    <div className="flex items-baseline">
                        <label className="w-36 font-semibold text-gray-700 text-sm">Phone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 555-0192" className="flex-1 user-underline-input py-1.5 bg-transparent text-gray-900 font-medium placeholder-gray-300" />
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <label className="block font-bold text-gray-800 mb-4 text-sm tracking-wide uppercase">Address</label>
                        <div className="space-y-4 pl-3 border-l-2 border-blue-100">
                            <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Street" className="w-full user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                            <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className="w-full user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                            <div className="flex gap-4">
                                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="w-1/2 user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className="w-1/2 user-underline-input py-1 bg-transparent text-sm text-gray-800 placeholder-gray-300" />
                            </div>
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
                        <button onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image: null })); }} className="mt-3 text-xs text-red-500 font-medium hover:underline">Remove Image</button>
                    )}
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------------
// USER LIST VIEW
// ----------------------------------------------------------------------------------------
const ContactListView = ({ contacts, onNew, onBack, onSwitchToKanban, onSelectRow }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // [Shared CSS Usage: .animate-fade-in (Count: 4), .content-layer (Count: 2)]
    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    {/* [Shared UI Usage: Button (Count: 7)] */}
                    <Button onClick={onNew} variant="primary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" />
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    {/* [Shared UI Usage: Button (Count: 8)] */}
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {/* [Shared UI Usage: Button (Count: 9, 10)] */}
                        <Button variant="menuInactive" className="!bg-white !text-blue-600 !px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
                        <Button variant="ghost" onClick={onSwitchToKanban} className="!px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Contact List View</h2>
            <div className="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="py-4 px-4 w-16 text-center">Select</th><th className="py-4 px-4 w-20">Image</th><th className="py-4 px-4">Name</th><th className="py-4 px-4">Email</th><th className="py-4 px-4">Phone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filtered.map((contact) => (
                            <tr key={contact.id} onClick={() => onSelectRow(contact)} className="hover:bg-blue-50/40 cursor-pointer group transition-colors">
                                <td className="py-4 px-4 text-center"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer" /></td>
                                <td className="py-4 px-4"><div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center font-bold text-gray-400 group-hover:border-blue-300">{contact.image ? <img src={contact.image} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0).toUpperCase()}</div></td>
                                <td className="py-4 px-4 font-bold text-gray-900 group-hover:text-blue-600">{contact.name}</td>
                                <td className="py-4 px-4 text-gray-600">{contact.email}</td>
                                <td className="py-4 px-4 text-gray-600 font-mono">{contact.phone || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------------
// USER KANBAN VIEW
// ----------------------------------------------------------------------------------------
const ContactKanbanView = ({ contacts, onNew, onBack, onSwitchToList, onSelectCard }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // [Shared CSS Usage: .animate-fade-in (Count: 5), .content-layer (Count: 3)]
    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    {/* [Shared UI Usage: Button (Count: 11)] */}
                    <Button onClick={onNew} variant="primary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search cards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" />
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                    {/* [Shared UI Usage: Button (Count: 12)] */}
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {/* [Shared UI Usage: Button (Count: 13, 14)] */}
                        <Button variant="ghost" onClick={onSwitchToList} className="!px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
                        <Button variant="menuInactive" className="!bg-white !text-blue-600 !px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Contact Kanban View</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((contact) => (
                    <div key={contact.id} onClick={() => onSelectCard(contact)} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer transform hover:-translate-y-1 flex items-center gap-4 group">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border flex-shrink-0 flex items-center justify-center font-bold text-xl text-gray-400 group-hover:border-blue-300">
                            {contact.image ? <img src={contact.image} alt="Avatar" className="w-full h-full object-cover" /> : contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-extrabold text-gray-900 truncate group-hover:text-blue-600 text-base">{contact.name}</h3>
                            <p className="text-xs text-gray-500 truncate font-medium mt-0.5">{contact.email}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{contact.phone || '—'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------------
// USER MODULE MAIN WRAPPER
// ----------------------------------------------------------------------------------------
const AdvancedUsersModule = () => {
    const [activeView, setActiveView] = useState('menu');
    const [contacts, setContacts] = useState([
        { id: 1, name: 'Open Wood', email: 'Openwood21@example.com', phone: '+91 9090090909', street: '12 Timber Yard', city: 'Bangalore', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
        { id: 2, name: 'Joey Wills', email: 'Joey.wills@example.com', phone: '+91 8080080808', street: '45 Sunset Blvd', city: 'Austin', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250' }
    ]);
    const [editingContact, setEditingContact] = useState(null);

    const handleOpenNewForm = () => { setEditingContact(null); setActiveView('form'); };
    const handleEditContact = (contact) => { setEditingContact(contact); setActiveView('form'); };
    const handleSaveContact = (formData) => {
        if (formData.id) setContacts(prev => prev.map(c => c.id === formData.id ? { ...formData } : c));
        else setContacts(prev => [...prev, { ...formData, id: Date.now() }]);
        setActiveView('list');
    };

    // [Shared CSS Usage: .integrated-app-container (Count: 1), .user-rainbow-accent (Count: 1), .animate-fade-in (Count: 6), .content-layer (Count: 4)]
    return (
        <div className="integrated-app-container p-2 md:p-6 shadow-sm border border-gray-100">
            <div className="user-rainbow-accent"></div>

            <div className="max-w-5xl mx-auto mb-10 content-layer animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/80 pb-6 gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Odoo Integrated Suite</span>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Users & Contact Master</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                        {['menu', 'form', 'list', 'kanban'].map(view => (
                            // [Shared UI Usage: Button (Count: 15, 16, 17, 18)]
                            <Button
                                key={view}
                                onClick={() => setActiveView(view)}
                                variant={activeView === view ? 'primary' : 'menuInactive'}
                                className="!px-4 !py-2 !text-xs capitalize"
                            >
                                {view} {view !== 'menu' && 'View'}
                            </Button>
                        ))}
                    </div>
                </div>
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
            {activeView === 'form' && <ContactFormView initialData={editingContact} onBack={() => setActiveView('menu')} onSave={handleSaveContact} onNew={handleOpenNewForm} />}
            {activeView === 'list' && <ContactListView contacts={contacts} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToKanban={() => setActiveView('kanban')} onSelectRow={handleEditContact} />}
            {activeView === 'kanban' && <ContactKanbanView contacts={contacts} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToList={() => setActiveView('list')} onSelectCard={handleEditContact} />}
        </div>
    );
};





//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// ========================================================================================
// ========================================================================================
// MODULE 2: PRODUCT MASTER SUITE
// ========================================================================================
// ========================================================================================

const ProductFormView = ({ initialData, onBack, onSave, onNew, categories, onAddCategory }) => {
    const emptyForm = { id: null, name: '', type: 'Goods', category: '', salesPrice: '', cost: '', vendorPrice: '', image: null };
    const [formData, setFormData] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setImagePreview(initialData.image || null);
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
            setFormData(prev => ({ ...prev, image: url }));
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

    // [Shared CSS Usage: .animate-fade-in (Count: 7), .content-layer (Count: 5), .product-underline-input (Count: 1 to 5)]
    return (
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-100">
                <div className="flex gap-3">
                    {/* [Shared UI Usage: Button (Count: 19, 20)] */}
                    <Button onClick={() => { setFormData(emptyForm); setImagePreview(null); setIsCreatingCategory(false); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
                    <Button onClick={handleConfirmSubmit} variant="pink">Confirm</Button>
                </div>
                {/* [Shared UI Usage: Button (Count: 21)] */}
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
                        <button onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, image: null })); }} className="mt-3 text-xs text-red-500 font-medium hover:underline">Remove Image</button>
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
                                <option value="Goods">Goods (Ready made furniture)</option>
                                <option value="Service">Service (Custom furniture)</option>
                                <option value="Combo">Combo (Hybrid approach)</option>
                            </select>
                            <span className="absolute right-2 top-2 pointer-events-none text-gray-400 text-xs">&#9660;</span>
                        </div>
                    </div>

                    <div className="flex items-baseline">
                        <label className="w-36 font-bold text-pink-700 text-sm">Category</label>
                        {isCreatingCategory ? (
                            <div className="flex-1 flex gap-2 items-center bg-orange-50/80 p-2 rounded-xl border border-orange-200">
                                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter New Category Name..." className="flex-1 bg-white px-3 py-1 text-sm text-gray-800 rounded-lg border border-orange-300 focus:outline-none" autoFocus />
                                {/* [Shared UI Usage: Button (Count: 22, 23)] */}
                                <Button onClick={handleSaveNewCategory} variant="success" className="!px-3 !py-1.5 !text-xs !rounded-lg">Save</Button>
                                <Button onClick={() => setIsCreatingCategory(false)} variant="ghost" className="!px-2 !text-xs">Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex-1 relative">
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full product-underline-input py-1.5 bg-transparent text-gray-900 font-medium cursor-pointer appearance-none pr-8">
                                    <option value="" disabled>Selection</option>
                                    {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                                    <option value="CREATE_NEW" className="font-bold text-orange-600 bg-orange-50">+ Create New Category (Many2One)...</option>
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
                            <label className="w-16 font-bold text-pink-700 text-sm">Cost</label>
                            <span className="text-gray-500 mr-2 text-sm font-medium">Rs.</span>
                            <input type="number" name="cost" value={formData.cost} onChange={handleChange} placeholder="50.00" className="flex-1 product-underline-input py-1 bg-transparent text-sm text-gray-900 font-mono font-bold" />
                        </div>
                        <div className="col-span-1 sm:col-span-2 flex items-baseline pt-2">
                            <label className="w-36 font-bold text-amber-700 text-sm">Vendor Price</label>
                            <span className="text-gray-500 mr-2 text-sm font-medium">Rs.</span>
                            <input type="number" name="vendorPrice" value={formData.vendorPrice} onChange={handleChange} placeholder="Special price for vendor..." className="flex-1 product-underline-input border-amber-200 py-1 bg-transparent text-sm text-gray-900 font-mono" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------------
// PRODUCT LIST VIEW
// ----------------------------------------------------------------------------------------
const ProductListView = ({ products, onNew, onBack, onSwitchToKanban, onSelectRow }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.type.toLowerCase().includes(searchTerm.toLowerCase()));
    const handleToggleSelectAll = (e) => { e.target.checked ? setSelectedIds(filtered.map(p => p.id)) : setSelectedIds([]); };
    const handleToggleRow = (id, e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

    // [Shared CSS Usage: .animate-fade-in (Count: 8), .content-layer (Count: 6)]
    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    {/* [Shared UI Usage: Button (Count: 24)] */}
                    <Button onClick={onNew} variant="secondary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search products by name, category, or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm text-gray-800 placeholder-gray-400" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm font-bold">&#10005;</button>}
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* [Shared UI Usage: Button (Count: 25)] */}
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {/* [Shared UI Usage: Button (Count: 26, 27)] */}
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
                            <th className="py-4 px-4 w-16 text-center border-b border-gray-700"><input type="checkbox" onChange={handleToggleSelectAll} checked={filtered.length > 0 && selectedIds.length === filtered.length} className="w-4 h-4 text-pink-600 rounded border-gray-500 focus:ring-pink-500 cursor-pointer" /></th>
                            <th className="py-4 px-4 border-b border-gray-700">Product</th>
                            <th className="py-4 px-4 border-b border-gray-700">Category</th>
                            <th className="py-4 px-4 border-b border-gray-700">Type</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-right">Sales Price</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-right">Cost</th>
                            <th className="py-4 px-4 border-b border-gray-700 text-right">Vendor Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm bg-white">
                        {filtered.length === 0 ? (
                            <tr><td colSpan="7" className="py-12 text-center text-gray-400 font-medium">No products match your search query.</td></tr>
                        ) : (
                            filtered.map((product) => (
                                <tr key={product.id} onClick={() => onSelectRow(product)} className={`hover:bg-pink-50/40 cursor-pointer transition-colors group ${selectedIds.includes(product.id) ? 'bg-pink-50/60' : ''}`}>
                                    <td className="py-4 px-4 text-center" onClick={(e) => handleToggleRow(product.id, e)}><input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => { }} className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500 cursor-pointer" /></td>
                                    <td className="py-4 px-4 font-bold text-gray-900 group-hover:text-pink-600 transition-colors flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-400">
                                            {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : product.name ? product.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span>{product.name}</span>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 font-medium"><span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700 font-semibold">{product.category || 'Uncategorized'}</span></td>
                                    <td className="py-4 px-4 text-gray-600">{product.type}</td>
                                    <td className="py-4 px-4 text-gray-900 font-mono font-bold text-right">Rs. {Number(product.salesPrice || 0).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-gray-900 font-mono text-right">Rs. {Number(product.cost || 0).toLocaleString()}</td>
                                    <td className="py-4 px-4 text-amber-700 font-mono text-right font-medium">{product.vendorPrice ? `Rs. ${Number(product.vendorPrice).toLocaleString()}` : '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------------
// PRODUCT KANBAN VIEW
// ----------------------------------------------------------------------------------------
const ProductKanbanView = ({ products, onNew, onBack, onSwitchToList, onSelectCard }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.type.toLowerCase().includes(searchTerm.toLowerCase()));

    // [Shared CSS Usage: .animate-fade-in (Count: 9), .content-layer (Count: 7)]
    return (
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-gray-100 shadow-2xl content-layer animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex items-center gap-3 w-full sm:w-2/3">
                    {/* [Shared UI Usage: Button (Count: 28)] */}
                    <Button onClick={onNew} variant="secondary">New</Button>
                    <div className="relative w-full">
                        <input type="text" placeholder="Search cards by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm text-gray-800 placeholder-gray-400" />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm font-bold">&#10005;</button>}
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* [Shared UI Usage: Button (Count: 29)] */}
                    <Button onClick={onBack} variant="secondary">Back</Button>
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {/* [Shared UI Usage: Button (Count: 30, 31)] */}
                        <Button variant="ghost" onClick={onSwitchToList} className="!px-3 !py-1.5"><span className="text-base">&#9776;</span></Button>
                        <Button variant="menuInactive" className="!bg-white !text-pink-600 !px-3 !py-1.5 !border-gray-200"><span className="text-base">&#8862;</span></Button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">Product Master Kanban View</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">No products found matching search filter.</div>
                ) : (
                    filtered.map((product) => (
                        <div key={product.id} onClick={() => onSelectCard(product)} className="p-5 bg-gray-900 text-white rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-pink-500 border border-gray-800 transition-all cursor-pointer flex items-center gap-5 group">
                            <div className="w-20 h-20 rounded-2xl bg-gray-800 overflow-hidden border border-gray-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-pink-500 transition-colors">
                                {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">Image</span>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-lg text-gray-100 truncate mb-1 group-hover:text-pink-400 transition-colors">{product.name}</h3>
                                <div className="flex flex-col gap-0.5 text-xs text-gray-300 font-mono">
                                    <p className="font-semibold text-gray-200">Sales Price <span className="text-pink-400 font-bold">{Number(product.salesPrice || 0).toLocaleString()}</span></p>
                                    <p>Cost <span className="text-gray-400">{Number(product.cost || 0).toLocaleString()}</span></p>
                                    {product.vendorPrice && <p className="text-amber-400 text-[11px]">Vendor {Number(product.vendorPrice).toLocaleString()}</p>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------------
// PRODUCT MODULE MAIN WRAPPER
// ----------------------------------------------------------------------------------------
const ProductApp = () => {
    const [activeView, setActiveView] = useState('menu');
    const [categories, setCategories] = useState(['Chair', 'Table', 'Dining', 'Sofa', 'Electronics', 'Appliances']);
    const [products, setProducts] = useState([
        { id: 1, name: 'Air Conditioner', category: 'Electronics', type: 'Goods', salesPrice: 25000, cost: 15000, vendorPrice: 22000, image: null },
        { id: 2, name: 'Refrigerator', category: 'Electronics', type: 'Goods', salesPrice: 10000, cost: 7000, vendorPrice: 8800, image: null },
        { id: 3, name: 'Executive Ergonomic Chair', category: 'Chair', type: 'Goods', salesPrice: 12500, cost: 8000, vendorPrice: 10500, image: null }
    ]);
    const [editingProduct, setEditingProduct] = useState(null);

    const handleOpenNewForm = () => { setEditingProduct(null); setActiveView('form'); };
    const handleEditProduct = (product) => { setEditingProduct(product); setActiveView('form'); };
    const handleSaveProduct = (formData) => {
        if (formData.id) setProducts(prev => prev.map(p => p.id === formData.id ? { ...formData } : p));
        else setProducts(prev => [...prev, { ...formData, id: Date.now() }]);
        setActiveView('list');
    };
    const handleAddCategory = (newCat) => { if (!categories.includes(newCat)) setCategories(prev => [...prev, newCat]); };

    // [Shared CSS Usage: .integrated-app-container (Count: 2), .product-rainbow-accent (Count: 1), .animate-fade-in (Count: 10), .content-layer (Count: 8)]
    return (
        <div className="integrated-app-container p-2 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
            <div className="product-rainbow-accent"></div>

            <div className="max-w-5xl mx-auto mb-10 content-layer">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/80 pb-6 gap-4">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-pink-600 bg-pink-50 px-3 py-1 rounded-full">Odoo ERP Master Suite</span>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-1">Product Master Suite</h1>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex-wrap">
                        {['menu', 'form', 'list', 'kanban'].map(view => (
                            // [Shared UI Usage: Button (Count: 32, 33, 34, 35)]
                            <Button
                                key={view}
                                onClick={() => setActiveView(view)}
                                variant={activeView === view ? (view === 'menu' ? 'menuActive' : 'pink') : 'menuInactive'}
                                className="!px-3 !py-1.5 !text-xs capitalize"
                            >
                                {view === 'menu' ? 'Hub' : `${view} View`}
                            </Button>
                        ))}
                    </div>
                </div>
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
                            <p className="text-xs text-gray-500 leading-relaxed">Create/edit products with sales price, cost price, vendor special price, image upload & category selection.</p>
                        </div>
                        <div onClick={() => setActiveView('list')} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-pink-400 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#9776;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">List View</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">Tabular list showing products, categories, types, sales prices. Click any row to edit in Form View.</p>
                        </div>
                        <div onClick={() => setActiveView('kanban')} className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-lg hover:shadow-2xl hover:border-pink-400 cursor-pointer transition-all transform hover:-translate-y-1 flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-110 transition-transform">&#8862;</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Kanban View</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">Visual grid of dark rounded cards displaying product image thumbnails alongside pricing details.</p>
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
            {activeView === 'list' && <ProductListView products={products} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToKanban={() => setActiveView('kanban')} onSelectRow={handleEditProduct} />}
            {activeView === 'kanban' && <ProductKanbanView products={products} onNew={handleOpenNewForm} onBack={() => setActiveView('menu')} onSwitchToList={() => setActiveView('list')} onSelectCard={handleEditProduct} />}
        </div>
    );
};


//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
// ========================================================================================
// ========================================================================================
// MAIN APPLICATION SHELL (ROUTING / SIDEBAR)
// ========================================================================================
// ========================================================================================

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
                        <p className="text-gray-500 mt-2">Wireframes accepted. Click 'Product' or 'Users' to see new integrations.</p>
                        {/* [Shared UI Usage: Button (Count: 36)] */}
                        <Button onClick={() => setActiveTab('dashboard')} className="mt-6" variant="secondary">Back to Dashboard</Button>
                    </div>
                );
            default: return <Dashboard navigate={setActiveTab} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">

            {/* [Shared CSS Injection]
        The CSS is defined globally at the top of this file in `globalStyles`.
        It is rendered here using a single style tag for the entire application.
      */}
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
                            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="text-xl w-8 text-center">{item.icon}</span>
                            {sidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800 bg-slate-950">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">A</div>
                        {sidebarOpen && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">Business Owner</p>
                                <p className="text-xs text-green-400 font-medium truncate flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 block"></span> All-Access
                                </p>
                            </div>
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

