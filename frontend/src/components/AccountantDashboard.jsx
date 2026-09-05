import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, ShoppingBag, BookOpen, FileBarChart,
  Plus, Search, ArrowLeft, Check, AlertTriangle, FileText,
  Briefcase, LayoutList, DollarSign, User, ExternalLink, ShieldCheck, Send, CheckCircle2, Clock, TrendingUp, Sparkles, Layers, CreditCard
} from 'lucide-react';

import ContactForm from './forms/ContactForm';
import ProductForm from './forms/ProductForm';
import ChartOfAccountsForm from './forms/ChartOfAccountsForm';
import JournalForm from './forms/JournalForm';
import JournalEntryForm from './forms/JournalEntryForm';
import BudgetForm from './forms/BudgetForm';
import ProfitLossReport from './reports/ProfitLossReport';
import BudgetReport from './reports/BudgetReport';

// Shared reusable UI components (Stripe-inspired)
const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, size = 'md', title = '' }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-4.5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variants = {
    primary: "text-white bg-[#635BFF] hover:bg-[#5851DF] focus:ring-[#635BFF]/50 shadow-[0_4px_12px_rgba(99,91,255,0.35)] border border-transparent hover:-translate-y-0.5",
    secondary: "text-[#0A2540] bg-white border border-slate-200/80 hover:bg-slate-50 focus:ring-slate-200 shadow-[0_2px_5px_rgba(50,50,93,0.04)]",
    danger: "text-white bg-[#DF1B41] hover:bg-[#C9183A] focus:ring-[#DF1B41]/50 shadow-[0_4px_12px_rgba(223,27,65,0.3)]",
    success: "text-white bg-[#00D4B2] hover:bg-[#00be9f] text-[#0A2540] font-semibold focus:ring-[#00D4B2]/50 shadow-[0_4px_12px_rgba(0,212,178,0.3)]",
    ghost: "text-slate-600 hover:text-[#0A2540] hover:bg-slate-100/80 focus:ring-slate-200"
  };
  
  return (
    <button onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled} title={title}>
      {Icon && <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} mr-2`} />}
      {children}
    </button>
  );
};

const Card = ({ children, title, subtitle, className = '', action }) => (
  <div className={`bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06),_0_5px_15px_rgba(0,0,0,0.04)] border border-slate-200/70 overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(50,50,93,0.1)] ${className}`}>
    {(title || subtitle || action) && (
      <div className="px-7 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-b from-white to-slate-50/50">
        <div>
          {title && <h3 className="text-base font-bold text-[#0A2540] tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-7">{children}</div>
  </div>
);

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, className = '', disabled = false }) => (
  <div className={`flex flex-col ${className}`}>
    {label && <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition-all bg-slate-50/50 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
    />
  </div>
);

const Select = ({ label, value, onChange, options, required = false, className = '' }) => (
  <div className={`flex flex-col ${className}`}>
    {label && <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <select
      value={value}
      onChange={onChange}
      required={required}
      className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] transition-all"
    >
      <option value="">Select...</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value || opt}>{opt.label || opt}</option>
      ))}
    </select>
  </div>
);

/**
 * AccountantDashboard - Full ERP Accounting Dashboard
 */
export default function AccountantDashboard({ data, setData }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModule, setActiveModule] = useState(null); 
  const [viewState, setViewState] = useState({ type: 'list', id: null });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: ShoppingCart, 
      modules: [
        { id: 'sales_orders', label: 'Sales Orders' },
        { id: 'customer_invoices', label: 'Customer Invoices' }
      ]
    },
    { id: 'purchase', label: 'Purchase', icon: ShoppingBag,
      modules: [
        { id: 'purchase_orders', label: 'Purchase Orders' },
        { id: 'vendor_bills', label: 'Vendor Bills' }
      ]
    },
    { id: 'account', label: 'Account', icon: BookOpen,
      modules: [
        { id: 'contacts', label: 'Contacts' },
        { id: 'products', label: 'Products' },
        { id: 'budgets', label: 'Analytical Budget' },
        { id: 'coa', label: 'Chart of Accounts' },
        { id: 'journals', label: 'Journals' },
        { id: 'journal_entries', label: 'Journal Entries' }
      ]
    },
    { id: 'report', label: 'Report', icon: FileBarChart,
      modules: [
        { id: 'pl', label: 'Profit and Loss' },
        { id: 'budget_report', label: 'Budget Report' }
      ]
    }
  ];

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleNavClick = (tabId, moduleId = null) => {
    setActiveTab(tabId);
    if (moduleId) {
      setActiveModule(moduleId);
      setViewState({ type: 'list', id: null });
    } else if (tabId === 'dashboard') {
      setActiveModule(null);
    } else {
      const tab = navTabs.find(t => t.id === tabId);
      if (tab && tab.modules && tab.modules.length > 0) {
        setActiveModule(tab.modules[0].id);
        setViewState({ type: 'list', id: null });
      }
    }
  };

  // ===================== DASHBOARD VIEW =====================
  const renderDashboard = () => {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#0A2540] to-[#13315C] p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[#635BFF]/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#00D4B2] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Financial Operations Flow Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Company Financial Overview</h1>
            <p className="text-slate-300 text-sm mt-1">Real-time accounting ledger ensuring accurate Invoice and Bill lifecycles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            title="Sales & Invoices" 
            action={<Button size="sm" icon={Plus} variant="secondary" onClick={() => { handleNavClick('sales', 'sales_orders'); setViewState({ type: 'form', id: null }); }}>New SO</Button>}
          >
            <div className="flex items-end justify-between mt-2">
              <div>
                <div className="text-4xl font-extrabold text-[#0A2540] tracking-tight">{data.customerInvoices.length}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Customer Invoices</div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="cursor-pointer group inline-flex items-center justify-end gap-1.5" onClick={() => handleNavClick('sales', 'sales_orders')}>
                  <span className="text-xs text-slate-500 group-hover:text-[#635BFF]">Sales Orders: <span className="font-bold text-[#0A2540]">{data.salesOrders.length}</span></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>
            </div>
          </Card>

          <Card 
            title="Purchases & Bills"
            action={<Button size="sm" icon={Plus} variant="secondary" onClick={() => { handleNavClick('purchase', 'purchase_orders'); setViewState({ type: 'form', id: null }); }}>New PO</Button>}
          >
             <div className="flex items-end justify-between mt-2">
              <div>
                <div className="text-4xl font-extrabold text-[#0A2540] tracking-tight">{data.vendorBills.length}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Vendor Bills</div>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <div className="cursor-pointer group inline-flex items-center justify-end gap-1.5" onClick={() => handleNavClick('purchase', 'purchase_orders')}>
                  <span className="text-xs text-slate-500 group-hover:text-[#635BFF]">Purchase Orders: <span className="font-bold text-[#0A2540]">{data.purchaseOrders.length}</span></span>
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                </div>
              </div>
            </div>
          </Card>

          <Card 
            title="Budget Analytics"
            action={<Button size="sm" variant="secondary" onClick={() => handleNavClick('report', 'budget_report')}>Report</Button>}
          >
            <div className="flex items-end justify-between mt-2">
              <div>
                <div className="text-4xl font-extrabold text-[#0A2540] tracking-tight">${data.budgets[0]?.achieved || 0}</div>
                <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mt-1">Achieved to Date</div>
              </div>
               <div className="flex flex-col gap-1 text-right">
                <div className="cursor-pointer group" onClick={() => handleNavClick('account', 'budgets')}>
                  <span className="text-xs text-slate-500 group-hover:text-[#635BFF]">Committed: <span className="font-bold text-[#0A2540]">${data.budgets[0]?.committed || 0}</span></span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ===================== SALES ORDER FORM =====================
  const SalesOrderForm = ({ soId, onBack }) => {
    const existing = data.salesOrders.find(s => s.id === soId);
    const [formData, setFormData] = useState(existing || {
      id: `SO${Math.floor(1000 + Math.random() * 9000)}`,
      customer: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      lines: [{ product: '', analytics: '', qty: 1, unitPrice: 0, total: 0 }]
    });

    const handleLineChange = (idx, field, val) => {
      const lines = [...formData.lines];
      lines[idx][field] = val;
      if (field === 'qty' || field === 'unitPrice') {
        const q = parseFloat(field === 'qty' ? val : lines[idx].qty) || 0;
        const p = parseFloat(field === 'unitPrice' ? val : lines[idx].unitPrice) || 0;
        lines[idx].total = q * p;
      }
      setFormData({ ...formData, lines });
    };

    const addLine = () => setFormData({ ...formData, lines: [...formData.lines, { product: '', analytics: '', qty: 1, unitPrice: 0, total: 0 }] });
    const removeLine = (idx) => {
      if (formData.lines.length <= 1) return;
      setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) });
    };

    const totalAmount = formData.lines.reduce((acc, l) => acc + (parseFloat(l.total) || 0), 0);

    const handleConfirm = () => {
      const updated = { ...formData, status: 'Confirmed', total: totalAmount };
      setFormData(updated);

      // Auto-generate corresponding Customer Invoice for this SO
      const invoiceNo = `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`;
      const newInv = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        invoiceNo: invoiceNo,
        customer: formData.customer || 'Mr. Rahul',
        status: 'Confirmed',
        invoiceReference: formData.id,
        invoiceDate: formData.date || new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
        amountDue: totalAmount,
        total: totalAmount,
        paymentStatus: 'Not Paid',
        lines: formData.lines.map(l => ({ ...l, coa: '4001' }))
      };

      // Create Sales Journal Entry
      const journalEntry = {
        id: `JE-${Date.now()}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        number: invoiceNo,
        partner: formData.customer || 'Mr. Rahul',
        journal: 'Customer Invoices',
        total: totalAmount,
        lines: [
          { accountId: '1002', debit: totalAmount, credit: 0 },
          { accountId: '4001', debit: 0, credit: totalAmount }
        ]
      };
      
      setData(prev => {
        const exists = prev.salesOrders.some(s => s.id === updated.id);
        const newSOs = exists ? prev.salesOrders.map(s => s.id === updated.id ? updated : s) : [...prev.salesOrders, updated];
        return { 
          ...prev, 
          salesOrders: newSOs,
          customerInvoices: [...prev.customerInvoices, newInv],
          journalEntries: [...prev.journalEntries, journalEntry]
        };
      });
      showNotification(`Sales Order confirmed! Invoice ${invoiceNo} generated and synced to Customer Portal.`);
    };

    const handleCreateInvoice = () => {
      if (formData.status !== 'Confirmed') return showNotification("Confirm SO first.");

      const invoiceNo = `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`;
      const newInv = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        invoiceNo: invoiceNo,
        customer: formData.customer || 'Mr. Rahul',
        status: 'Confirmed',
        invoiceReference: formData.id,
        invoiceDate: formData.date || new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
        amountDue: totalAmount,
        total: totalAmount,
        paymentStatus: 'Not Paid',
        lines: formData.lines.map(l => ({ ...l, coa: '4001' }))
      };

      setData(prev => ({
        ...prev,
        customerInvoices: [...prev.customerInvoices, newInv]
      }));

      showNotification(`Customer Invoice ${invoiceNo} created!`);
      handleNavClick('sales', 'customer_invoices');
    };

    return (
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
            {formData.status === 'Draft' && <Button variant="primary" icon={Check} onClick={handleConfirm}>Confirm SO</Button>}
            {formData.status === 'Confirmed' && <Button variant="primary" icon={FileText} onClick={handleCreateInvoice}>Create Invoice</Button>}
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${formData.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            Status: {formData.status}
          </span>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Input label="SO No." value={formData.id} disabled />
            <Select 
              label="Customer Name" 
              value={formData.customer} 
              onChange={e => setFormData({ ...formData, customer: e.target.value })}
              options={data.contacts.filter(c => c.type === 'Customer' || c.type === 'Both').map(c => c.name)}
              required
            />
            <Input label="SO Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>

          <h3 className="text-base font-bold text-[#0A2540] mb-4">Sales Order Items</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Master</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Analytics</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Qty</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.lines.map((line, idx) => (
                  <tr key={idx} className="bg-white hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.product} onChange={e => handleLineChange(idx, 'product', e.target.value)}>
                        <option value="">Select Product...</option>
                        {data.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.analytics} onChange={e => handleLineChange(idx, 'analytics', e.target.value)}>
                        <option value="">Select Analytics...</option>
                        {data.budgets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-center bg-slate-50/50 outline-none" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50 outline-none" value={line.unitPrice} onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0A2540]">${(line.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-4 py-4 font-bold text-slate-700">Total SO Value</td>
                  <td className="px-4 py-4 text-right font-extrabold text-lg text-[#0A2540]">${totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4">
            <Button variant="secondary" size="sm" icon={Plus} onClick={addLine}>Add Item Line</Button>
          </div>
        </div>
      </div>
    );
  };

  // ===================== CUSTOMER INVOICE FORM =====================
  const CustomerInvoiceForm = ({ invId, onBack }) => {
    const existing = data.customerInvoices.find(i => i.id === invId || i.invoiceNo === invId);
    const [formData, setFormData] = useState(existing || {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNo: `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      customer: '',
      status: 'Draft',
      invoiceReference: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      amountDue: 0,
      total: 0,
      paymentStatus: 'Not Paid',
      lines: [{ product: '', coa: '4001', analytics: '', qty: 1, unitPrice: 0, total: 0 }]
    });

    const totalAmount = formData.lines.reduce((acc, l) => acc + (parseFloat(l.total) || 0), 0);

    const handleLineChange = (idx, field, val) => {
      const lines = [...formData.lines];
      lines[idx][field] = val;
      if (field === 'qty' || field === 'unitPrice') {
        const q = parseFloat(field === 'qty' ? val : lines[idx].qty) || 0;
        const p = parseFloat(field === 'unitPrice' ? val : lines[idx].unitPrice) || 0;
        lines[idx].total = q * p;
      }
      setFormData({ ...formData, lines });
    };

    const handleConfirmInvoice = () => {
      const journalEntry = {
        id: `JE-${Date.now()}`,
        date: formData.invoiceDate,
        number: formData.invoiceNo,
        partner: formData.customer,
        journal: 'Customer Invoices',
        total: totalAmount,
        lines: [
          { accountId: '1002', debit: totalAmount, credit: 0 },
          { accountId: '4001', debit: 0, credit: totalAmount }
        ]
      };

      const updated = { ...formData, status: 'Confirmed', total: totalAmount, amountDue: totalAmount };
      setData(prev => ({
        ...prev,
        customerInvoices: existing ? prev.customerInvoices.map(i => i.invoiceNo === invId ? updated : i) : [...prev.customerInvoices, updated],
        journalEntries: [...prev.journalEntries, journalEntry]
      }));
      setFormData(updated);
      showNotification("Customer Invoice Confirmed! Sales Journal Entry created.");
    };

    const handleOpenPayment = () => {
      setPaymentModalOpen(true);
    };

    return (
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
            {formData.status === 'Draft' && <Button variant="primary" icon={Check} onClick={handleConfirmInvoice}>Confirm Invoice</Button>}
            {formData.status === 'Confirmed' && formData.paymentStatus !== 'Paid' && <Button variant="success" icon={DollarSign} onClick={handleOpenPayment}>Register Payment</Button>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${formData.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {formData.status}
            </span>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${formData.paymentStatus === 'Paid' ? 'bg-blue-50 text-blue-700' : formData.paymentStatus === 'Partial' ? 'bg-orange-50 text-orange-700' : 'bg-rose-50 text-rose-700'}`}>
              {formData.paymentStatus}
            </span>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Input label="Customer Invoice No." value={formData.invoiceNo} disabled />
            <Select label="Customer Name" value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} options={data.contacts.filter(c => c.type === 'Customer' || c.type === 'Both').map(c => c.name)} required />
            <Input label="Invoice Reference" value={formData.invoiceReference} onChange={e => setFormData({ ...formData, invoiceReference: e.target.value })} />
            <Input label="Invoice Date" type="date" value={formData.invoiceDate} onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })} required />
            <Input label="Due Date" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required />
          </div>

          <h3 className="text-base font-bold text-[#0A2540] mb-4">Invoice Line Items</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Chart of Account</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Analytics</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Qty</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.lines.map((line, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.product} onChange={e => handleLineChange(idx, 'product', e.target.value)}>
                        <option value="">Select Product...</option>
                        {data.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.coa} onChange={e => handleLineChange(idx, 'coa', e.target.value)}>
                        {data.chartOfAccounts.map(c => <option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.analytics} onChange={e => handleLineChange(idx, 'analytics', e.target.value)}>
                        <option value="">Select Analytics...</option>
                        {data.budgets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-center bg-slate-50/50 outline-none" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50 outline-none" value={line.unitPrice} onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0A2540]">${(line.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={5} className="px-4 py-4 font-bold text-slate-700">Total</td>
                  <td className="px-4 py-4 text-right font-extrabold text-[#0A2540]">${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 font-bold text-slate-500">Amount Due</td>
                  <td className="px-4 py-2 text-right font-extrabold text-amber-600">${formData.amountDue.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {paymentModalOpen && (
          <div className="fixed inset-0 bg-[#0A2540]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200">
              <h3 className="text-xl font-extrabold text-[#0A2540] mb-2">Register Invoice Payment</h3>
              <p className="text-sm text-slate-500 mb-6">Process receipt against invoice #{formData.invoiceNo}</p>
              <div className="space-y-4">
                <Select label="Payment Type" options={['Receive', 'Send']} value="Receive" onChange={() => {}} disabled />
                <Input label="Date" type="date" value={new Date().toISOString().split('T')[0]} onChange={() => {}} />
                <Input label="Customer Partner" value={formData.customer} disabled />
                <Select label="Payment Via" options={['Bank (1001)', 'Cash (1002)']} value="Bank (1001)" onChange={() => {}} />
                <Input label="Amount Received" type="number" value={formData.amountDue} disabled />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {
                  setPaymentModalOpen(false);
                  const updated = { ...formData, paymentStatus: 'Paid', amountDue: 0 };
                  setFormData(updated);
                  setData(prev => ({
                    ...prev,
                    customerInvoices: prev.customerInvoices.map(i => i.invoiceNo === formData.invoiceNo ? updated : i)
                  }));
                  showNotification("Invoice Payment successfully recorded!");
                }}>Confirm Payment</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== PURCHASE ORDER FORM =====================
  const PurchaseOrderForm = ({ poId, onBack }) => {
    const existing = data.purchaseOrders.find(p => p.id === poId);
    const [formData, setFormData] = useState(existing || {
      id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      lines: [{ product: '', analytics: '', qty: 1, unitPrice: 0, total: 0 }]
    });

    const handleLineChange = (idx, field, val) => {
      const lines = [...formData.lines];
      lines[idx][field] = val;
      if (field === 'qty' || field === 'unitPrice') {
        const q = parseFloat(field === 'qty' ? val : lines[idx].qty) || 0;
        const p = parseFloat(field === 'unitPrice' ? val : lines[idx].unitPrice) || 0;
        lines[idx].total = q * p;
      }
      setFormData({ ...formData, lines });
    };

    const addLine = () => setFormData({ ...formData, lines: [...formData.lines, { product: '', analytics: '', qty: 1, unitPrice: 0, total: 0 }] });
    const removeLine = (idx) => {
      if (formData.lines.length <= 1) return;
      setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== idx) });
    };

    const totalAmount = formData.lines.reduce((acc, l) => acc + (parseFloat(l.total) || 0), 0);

    const handleConfirm = () => {
      const updated = { ...formData, status: 'Confirmed', total: totalAmount };
      setFormData(updated);

      // Auto-generate corresponding Vendor Bill (Vendor Invoice) for this PO
      const billNo = `VB/2026/${Math.floor(1000 + Math.random() * 9000)}`;
      const newBill = {
        id: `VB-${Date.now().toString().slice(-4)}`,
        billNo: billNo,
        vendor: formData.vendor || 'TechSupplies Inc',
        status: 'Confirmed',
        billReference: formData.id,
        billDate: formData.date || new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
        amountDue: totalAmount,
        total: totalAmount,
        paymentStatus: 'Not Paid',
        lines: formData.lines.map(l => ({ ...l, coa: '5001' }))
      };

      // Create Purchase Journal Entry
      const journalEntry = {
        id: `JE-${Date.now()}`,
        date: formData.date || new Date().toISOString().split('T')[0],
        number: billNo,
        partner: formData.vendor || 'TechSupplies Inc',
        journal: 'Vendor Bills',
        total: totalAmount,
        lines: [
          { accountId: '5001', debit: totalAmount, credit: 0 },
          { accountId: '2001', debit: 0, credit: totalAmount }
        ]
      };

      setData(prev => ({
        ...prev,
        purchaseOrders: prev.purchaseOrders.some(p => p.id === updated.id) ? prev.purchaseOrders.map(p => p.id === updated.id ? updated : p) : [...prev.purchaseOrders, updated],
        vendorBills: [...prev.vendorBills, newBill],
        journalEntries: [...prev.journalEntries, journalEntry]
      }));
      showNotification(`Purchase Order confirmed! Vendor Bill ${billNo} generated and synced to Vendor Portal.`);
    };

    const handleCreateBill = () => {
      if (formData.status !== 'Confirmed') return showNotification("Confirm PO first.");

      const billNo = `VB/2026/${Math.floor(1000 + Math.random() * 9000)}`;
      const newBill = {
        id: `VB-${Date.now().toString().slice(-4)}`,
        billNo: billNo,
        vendor: formData.vendor || 'TechSupplies Inc',
        status: 'Confirmed',
        billReference: formData.id,
        billDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
        amountDue: totalAmount,
        total: totalAmount,
        paymentStatus: 'Not Paid',
        lines: formData.lines.map(l => ({ ...l, coa: '5001' }))
      };

      setData(prev => ({
        ...prev,
        vendorBills: [...prev.vendorBills, newBill]
      }));

      showNotification(`Vendor Bill ${billNo} created!`);
      handleNavClick('purchase', 'vendor_bills');
    };

    return (
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
            {formData.status === 'Draft' && <Button variant="primary" icon={Check} onClick={handleConfirm}>Confirm PO</Button>}
            {formData.status === 'Confirmed' && <Button variant="primary" icon={FileText} onClick={handleCreateBill}>Create Bill</Button>}
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${formData.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            Status: {formData.status}
          </span>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Input label="PO No." value={formData.id} disabled />
            <Select label="Vendor Name" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} options={data.contacts.filter(c => c.type === 'Vendor' || c.type === 'Both').map(c => c.name)} required />
            <Input label="PO Date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>

          <h3 className="text-base font-bold text-[#0A2540] mb-4">Purchase Order Items</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Master</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Analytics</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Qty</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                  <th className="px-4 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.lines.map((line, idx) => (
                  <tr key={idx} className="bg-white hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.product} onChange={e => handleLineChange(idx, 'product', e.target.value)}>
                        <option value="">Select Product...</option>
                        {data.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.analytics} onChange={e => handleLineChange(idx, 'analytics', e.target.value)}>
                        <option value="">Select Analytics...</option>
                        {data.budgets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-center bg-slate-50/50 outline-none" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50 outline-none" value={line.unitPrice} onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0A2540]">${(line.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-4 py-4 font-bold text-slate-700">Total PO Value</td>
                  <td className="px-4 py-4 text-right font-extrabold text-lg text-[#0A2540]">${totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4">
            <Button variant="secondary" size="sm" icon={Plus} onClick={addLine}>Add Item Line</Button>
          </div>
        </div>
      </div>
    );
  };

  // ===================== VENDOR BILL FORM =====================
  const VendorBillForm = ({ billId, onBack }) => {
    const existing = data.vendorBills.find(b => b.id === billId || b.billNo === billId);
    const [formData, setFormData] = useState(existing || {
      id: `VB-${Date.now().toString().slice(-4)}`,
      billNo: `VB/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      vendor: '',
      status: 'Draft',
      billReference: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      amountDue: 0,
      total: 0,
      paymentStatus: 'Not Paid',
      lines: [{ product: '', coa: '5001', analytics: '', qty: 1, unitPrice: 0, total: 0 }]
    });

    const totalAmount = formData.lines.reduce((acc, l) => acc + (parseFloat(l.total) || 0), 0);

    const handleLineChange = (idx, field, val) => {
      const lines = [...formData.lines];
      lines[idx][field] = val;
      if (field === 'qty' || field === 'unitPrice') {
        const q = parseFloat(field === 'qty' ? val : lines[idx].qty) || 0;
        const p = parseFloat(field === 'unitPrice' ? val : lines[idx].unitPrice) || 0;
        lines[idx].total = q * p;
      }
      setFormData({ ...formData, lines });
    };

    const handleConfirmBill = () => {
      const journalEntry = {
        id: `JE-${Date.now()}`,
        date: formData.billDate,
        number: formData.billNo,
        partner: formData.vendor,
        journal: 'Vendor Bills',
        total: totalAmount,
        lines: [
          { accountId: '5001', debit: totalAmount, credit: 0 },
          { accountId: '2001', debit: 0, credit: totalAmount }
        ]
      };

      const updated = { ...formData, status: 'Confirmed', total: totalAmount, amountDue: totalAmount };
      setData(prev => ({
        ...prev,
        vendorBills: existing ? prev.vendorBills.map(b => b.billNo === billId ? updated : b) : [...prev.vendorBills, updated],
        journalEntries: [...prev.journalEntries, journalEntry]
      }));
      setFormData(updated);
      showNotification("Vendor Bill Confirmed! Purchase Journal Entry created.");
    };

    const handleOpenPayment = () => {
      setPaymentModalOpen(true);
    };

    return (
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
          <div className="flex gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={onBack}>Back</Button>
            {formData.status === 'Draft' && <Button variant="primary" icon={Check} onClick={handleConfirmBill}>Confirm Bill</Button>}
            {formData.status === 'Confirmed' && formData.paymentStatus !== 'Paid' && <Button variant="success" icon={DollarSign} onClick={handleOpenPayment}>Register Payment</Button>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${formData.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {formData.status}
            </span>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${formData.paymentStatus === 'Paid' ? 'bg-blue-50 text-blue-700' : formData.paymentStatus === 'Partial' ? 'bg-orange-50 text-orange-700' : 'bg-rose-50 text-rose-700'}`}>
              {formData.paymentStatus}
            </span>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Input label="Vendor Bill No." value={formData.billNo} disabled />
            <Select label="Vendor Name" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })} options={data.contacts.filter(c => c.type === 'Vendor' || c.type === 'Both').map(c => c.name)} required />
            <Input label="Bill Reference" value={formData.billReference} onChange={e => setFormData({ ...formData, billReference: e.target.value })} />
            <Input label="Bill Date" type="date" value={formData.billDate} onChange={e => setFormData({ ...formData, billDate: e.target.value })} required />
            <Input label="Due Date" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required />
          </div>

          <h3 className="text-base font-bold text-[#0A2540] mb-4">Bill Line Items</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Chart of Account</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Analytics</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Qty</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.lines.map((line, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.product} onChange={e => handleLineChange(idx, 'product', e.target.value)}>
                        <option value="">Select Product...</option>
                        {data.products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.coa} onChange={e => handleLineChange(idx, 'coa', e.target.value)}>
                        {data.chartOfAccounts.map(c => <option key={c.id} value={c.id}>{c.id} - {c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 outline-none" value={line.analytics} onChange={e => handleLineChange(idx, 'analytics', e.target.value)}>
                        <option value="">Select Analytics...</option>
                        {data.budgets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-center bg-slate-50/50 outline-none" value={line.qty} onChange={e => handleLineChange(idx, 'qty', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50 outline-none" value={line.unitPrice} onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0A2540]">${(line.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={5} className="px-4 py-4 font-bold text-slate-700">Total</td>
                  <td className="px-4 py-4 text-right font-extrabold text-[#0A2540]">${totalAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 font-bold text-slate-500">Amount Due</td>
                  <td className="px-4 py-2 text-right font-extrabold text-amber-600">${formData.amountDue.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {paymentModalOpen && (
          <div className="fixed inset-0 bg-[#0A2540]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200">
              <h3 className="text-xl font-extrabold text-[#0A2540] mb-2">Register Bill Payment</h3>
              <p className="text-sm text-slate-500 mb-6">Process payment against bill #{formData.billNo}</p>
              <div className="space-y-4">
                <Select label="Payment Type" options={['Send', 'Receive']} value="Send" onChange={() => {}} disabled />
                <Input label="Date" type="date" value={new Date().toISOString().split('T')[0]} onChange={() => {}} />
                <Input label="Vendor Partner" value={formData.vendor} disabled />
                <Select label="Payment Via" options={['Bank (1001)', 'Cash (1002)']} value="Bank (1001)" onChange={() => {}} />
                <Input label="Amount Sent" type="number" value={formData.amountDue} disabled />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {
                  setPaymentModalOpen(false);
                  const updated = { ...formData, paymentStatus: 'Paid', amountDue: 0 };
                  setFormData(updated);
                  setData(prev => ({
                    ...prev,
                    vendorBills: prev.vendorBills.map(b => b.billNo === formData.billNo ? updated : b)
                  }));
                  showNotification("Vendor Bill Payment successfully recorded!");
                }}>Confirm Payment</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== GENERIC LIST VIEW =====================
  const GenericList = ({ title, columns, dataList, onNew, onRowClick }) => (
    <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
        <h2 className="text-lg font-extrabold text-[#0A2540]">{title}</h2>
        <div className="flex gap-3">
          {onNew && <Button icon={Plus} onClick={onNew}>New</Button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col, i) => <th key={i} className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{col.header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataList.length === 0 ? (
               <tr><td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 text-sm">No records found.</td></tr>
            ) : (
              dataList.map((row, i) => (
                <tr key={i} onClick={() => onRowClick(row)} className="bg-white hover:bg-slate-50/80 cursor-pointer transition-colors">
                  {columns.map((col, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-slate-700">{col.render ? col.render(row) : row[col.field]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ===================== MODULE ROUTER =====================
  const renderModuleContent = () => {
    switch (activeModule) {
      // 1. SALES
      case 'sales_orders':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Sales Orders" 
            dataList={data.salesOrders}
            columns={[
              { header: 'SO No', render: (r) => <span className="font-bold text-[#0A2540]">{r.id}</span> },
              { header: 'Customer', field: 'customer' },
              { header: 'Date', field: 'date' },
              { header: 'Status', render: (r) => <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${r.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span> },
              { header: 'Total', render: (r) => <span className="font-extrabold text-[#0A2540]">${(r.total || 0).toFixed(2)}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <SalesOrderForm soId={viewState.id} onBack={() => setViewState({ type: 'list', id: null })} />;
        }

      case 'customer_invoices':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Customer Invoices" 
            dataList={data.customerInvoices}
            columns={[
              { header: 'Invoice No', render: (r) => <span className="font-bold text-[#0A2540]">{r.invoiceNo}</span> },
              { header: 'Customer', field: 'customer' },
              { header: 'Payment Status', render: (r) => <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${r.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.paymentStatus}</span> },
              { header: 'Amount Due', render: (r) => <span className="font-extrabold text-amber-600">${(r.amountDue || 0).toFixed(2)}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.invoiceNo || r.id })}
          />;
        } else {
          return <CustomerInvoiceForm invId={viewState.id} onBack={() => setViewState({ type: 'list', id: null })} />;
        }

      // 2. PURCHASE
      case 'purchase_orders':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Purchase Orders" 
            dataList={data.purchaseOrders}
            columns={[
              { header: 'PO No', render: (r) => <span className="font-bold text-[#0A2540]">{r.id}</span> },
              { header: 'Vendor', field: 'vendor' },
              { header: 'Date', field: 'date' },
              { header: 'Status', render: (r) => <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${r.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span> },
              { header: 'Total', render: (r) => <span className="font-extrabold text-[#0A2540]">${(r.total || 0).toFixed(2)}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <PurchaseOrderForm poId={viewState.id} onBack={() => setViewState({ type: 'list', id: null })} />;
        }

      case 'vendor_bills':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Vendor Bills" 
            dataList={data.vendorBills}
            columns={[
              { header: 'Bill No', render: (r) => <span className="font-bold text-[#0A2540]">{r.billNo}</span> },
              { header: 'Vendor', field: 'vendor' },
              { header: 'Payment Status', render: (r) => <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${r.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.paymentStatus}</span> },
              { header: 'Amount Due', render: (r) => <span className="font-extrabold text-amber-600">${(r.amountDue || 0).toFixed(2)}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.billNo || r.id })}
          />;
        } else {
          return <VendorBillForm billId={viewState.id} onBack={() => setViewState({ type: 'list', id: null })} />;
        }

      // 3. MASTER DATA & ACCOUNTS
      case 'contacts':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Contacts Master (Customers & Vendors)" 
            dataList={data.contacts}
            columns={[
              { header: 'Name', render: (r) => <span className="font-bold text-[#0A2540]">{r.name}</span> },
              { header: 'Type', render: (r) => (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  r.type === 'Customer' ? 'bg-indigo-50 text-indigo-700' : r.type === 'Vendor' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {r.type}
                </span>
              )},
              { header: 'Email', field: 'email' },
              { header: 'Mobile', field: 'phone' },
              { header: 'Address', field: 'address' }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <ContactForm 
            contactId={viewState.id} 
            contacts={data.contacts}
            onSave={(contact) => {
              setData(prev => {
                const exists = prev.contacts.some(c => c.id === contact.id);
                return {
                  ...prev,
                  contacts: exists ? prev.contacts.map(c => c.id === contact.id ? contact : c) : [...prev.contacts, contact]
                };
              });
              showNotification(`Contact "${contact.name}" saved successfully!`);
              setViewState({ type: 'list', id: null });
            }}
            onBack={() => setViewState({ type: 'list', id: null })}
          />;
        }

      case 'products':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Products Master" 
            dataList={data.products}
            columns={[
              { header: 'Product Name', render: (r) => <span className="font-bold text-[#0A2540]">{r.name}</span> },
              { header: 'Type', render: (r) => <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">{r.type}</span> },
              { header: 'Category', field: 'category' },
              { header: 'Sales Price', render: (r) => <span className="font-bold text-emerald-600">${(r.price || 0).toFixed(2)}</span> },
              { header: 'Cost Price', render: (r) => <span className="text-slate-600">${(r.cost || 0).toFixed(2)}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <ProductForm 
            productId={viewState.id}
            products={data.products}
            onSave={(product) => {
              setData(prev => {
                const exists = prev.products.some(p => p.id === product.id);
                return {
                  ...prev,
                  products: exists ? prev.products.map(p => p.id === product.id ? product : p) : [...prev.products, product]
                };
              });
              showNotification(`Product "${product.name}" saved successfully!`);
              setViewState({ type: 'list', id: null });
            }}
            onBack={() => setViewState({ type: 'list', id: null })}
          />;
        }

      case 'coa':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Chart of Accounts (General Ledger)" 
            dataList={data.chartOfAccounts}
            columns={[
              { header: 'Account Code', render: (r) => <span className="font-bold text-[#635BFF]">{r.id}</span> },
              { header: 'Account Name', field: 'name' },
              { header: 'Type', render: (r) => (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  r.type === 'Asset' ? 'bg-blue-50 text-blue-700' :
                  r.type === 'Liability' ? 'bg-amber-50 text-amber-700' :
                  r.type === 'Income' ? 'bg-emerald-50 text-emerald-700' :
                  r.type === 'Expense' ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {r.type}
                </span>
              )}
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <ChartOfAccountsForm 
            accountId={viewState.id}
            accounts={data.chartOfAccounts}
            onSave={(account) => {
              setData(prev => {
                const exists = prev.chartOfAccounts.some(a => a.id === account.id);
                return {
                  ...prev,
                  chartOfAccounts: exists ? prev.chartOfAccounts.map(a => a.id === account.id ? account : a) : [...prev.chartOfAccounts, account]
                };
              });
              showNotification(`Account "${account.name}" saved!`);
              setViewState({ type: 'list', id: null });
            }}
            onBack={() => setViewState({ type: 'list', id: null })}
          />;
        }

      case 'journals':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Accounting Journals" 
            dataList={data.journals}
            columns={[
              { header: 'Journal ID', render: (r) => <span className="font-bold text-[#0A2540]">{r.id}</span> },
              { header: 'Journal Name', field: 'name' },
              { header: 'Type', render: (r) => <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700">{r.type}</span> },
              { header: 'Default Account', render: (r) => {
                const acc = data.chartOfAccounts.find(a => a.id === r.defaultAccount);
                return <span>{r.defaultAccount} - {acc?.name || ''}</span>;
              }}
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <JournalForm 
            journalId={viewState.id}
            journals={data.journals}
            chartOfAccounts={data.chartOfAccounts}
            onSave={(journal) => {
              setData(prev => {
                const exists = prev.journals.some(j => j.id === journal.id);
                return {
                  ...prev,
                  journals: exists ? prev.journals.map(j => j.id === journal.id ? journal : j) : [...prev.journals, journal]
                };
              });
              showNotification(`Journal "${journal.name}" saved!`);
              setViewState({ type: 'list', id: null });
            }}
            onBack={() => setViewState({ type: 'list', id: null })}
          />;
        }

      case 'journal_entries':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Journal Entries (Posted Books)" 
            dataList={data.journalEntries}
            columns={[
              { header: 'Date', field: 'date' },
              { header: 'Entry Number', field: 'number' },
              { header: 'Partner', field: 'partner' },
              { header: 'Journal', field: 'journal' },
              { header: 'Total', render: (r) => <span className="font-extrabold text-[#0A2540]">${(r.total || 0).toFixed(2)}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id || r.number })}
          />;
        } else {
          return <JournalEntryForm 
            entryId={viewState.id}
            entries={data.journalEntries}
            journals={data.journals}
            chartOfAccounts={data.chartOfAccounts}
            contacts={data.contacts}
            onSave={(entry) => {
              setData(prev => {
                const exists = prev.journalEntries.some(e => e.id === entry.id || e.number === entry.number);
                return {
                  ...prev,
                  journalEntries: exists ? prev.journalEntries.map(e => e.id === entry.id || e.number === entry.number ? entry : e) : [...prev.journalEntries, entry]
                };
              });
              showNotification(`Journal Entry ${entry.number} recorded successfully!`);
              setViewState({ type: 'list', id: null });
            }}
            onBack={() => setViewState({ type: 'list', id: null })}
          />;
        }

      case 'budgets':
        if (viewState.type === 'list') {
          return <GenericList 
            title="Analytical Budgets" 
            dataList={data.budgets}
            columns={[
              { header: 'Project / Budget', render: (r) => <span className="font-bold text-[#0A2540]">{r.name}</span> },
              { header: 'Period', render: (r) => `${r.start} to ${r.end}` },
              { header: 'Committed', render: (r) => <span className="font-bold text-slate-800">${(r.committed || 0).toFixed(2)}</span> },
              { header: 'Achieved', render: (r) => <span className="font-extrabold text-emerald-600">${(r.achieved || 0).toFixed(2)}</span> },
              { header: 'Status', render: (r) => <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700">{r.status || 'Confirmed'}</span> }
            ]}
            onNew={() => setViewState({ type: 'form', id: null })}
            onRowClick={(r) => setViewState({ type: 'form', id: r.id })}
          />;
        } else {
          return <BudgetForm 
            budgetId={viewState.id}
            budgets={data.budgets}
            onSave={(budget) => {
              setData(prev => {
                const exists = prev.budgets.some(b => b.id === budget.id);
                return {
                  ...prev,
                  budgets: exists ? prev.budgets.map(b => b.id === budget.id ? budget : b) : [...prev.budgets, budget]
                };
              });
              showNotification(`Budget "${budget.name}" saved!`);
              setViewState({ type: 'list', id: null });
            }}
            onBack={() => setViewState({ type: 'list', id: null })}
          />;
        }

      // 4. REPORTS
      case 'pl':
        return <ProfitLossReport 
          customerInvoices={data.customerInvoices} 
          vendorBills={data.vendorBills} 
          chartOfAccounts={data.chartOfAccounts} 
        />;

      case 'budget_report':
        return <BudgetReport budgets={data.budgets} />;
      
      default:
        return (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 shadow-sm">
            <LayoutList className="w-12 h-12 mb-4 text-[#635BFF]" />
            <h3 className="text-lg font-bold text-[#0A2540]">Module: {activeModule}</h3>
          </div>
        );
    }
  };

  // ===================== MAIN LAYOUT =====================
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#0A2540] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#00D4B2]" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Accountant Top Nav */}
      <header className="bg-[#0A2540] border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center">
              <span className="text-xl font-extrabold tracking-tight mr-8 flex items-center gap-2.5 text-white">
                CorpBooks
              </span>
              <nav className="hidden md:flex space-x-1">
                {navTabs.map(tab => (
                  <button key={tab.id} onClick={() => handleNavClick(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer
                      ${activeTab === tab.id ? 'bg-[#635BFF] text-white' : 'text-slate-300 hover:bg-white/10'}`}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area with Sidebar */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {activeTab !== 'dashboard' && (
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden sticky top-24">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                <h3 className="font-extrabold text-[#0A2540] text-xs uppercase tracking-wider">
                  {navTabs.find(t => t.id === activeTab)?.label}
                </h3>
              </div>
              <ul className="p-2.5 space-y-1">
                {navTabs.find(t => t.id === activeTab)?.modules?.map(module => (
                  <li key={module.id}>
                    <button onClick={() => handleNavClick(activeTab, module.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
                        ${activeModule === module.id ? 'bg-[#635BFF] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {module.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
        <div className="flex-1 min-w-0">
          {activeTab === 'dashboard' ? renderDashboard() : renderModuleContent()}
        </div>
      </main>
    </div>
  );
}
