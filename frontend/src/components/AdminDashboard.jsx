import { useState } from 'react';
import { clearSession } from '../lib/api';
import DashboardHome from './modules/DashboardHome';
import ContactsModule from './modules/ContactsModule';
import ProductsModule from './modules/ProductsModule';
import AccountsModule from './modules/AccountsModule';
import JournalsModule from './modules/JournalsModule';
import JournalEntriesModule from './modules/JournalEntriesModule';
import OrdersModule from './modules/OrdersModule';
import InvoicesModule from './modules/InvoicesModule';
import PaymentsModule from './modules/PaymentsModule';
import AnalyticsModule from './modules/AnalyticsModule';
import BudgetsModule from './modules/BudgetsModule';
import ReportsModule from './modules/ReportsModule';
import UsersModule from './modules/UsersModule';

// Accounting groups CoA, Journals, Journal Entries, Payments and the order lifecycles.
// Defined at module scope so toggling the sidebar doesn't remount and reset sub-tabs.
function AccountingHub({ user }) {
  const [subTab, setSubTab] = useState('coa');
  const subTabs = [
    { id: 'coa', label: 'Chart of Accounts' },
    { id: 'journals', label: 'Journals' },
    { id: 'entries', label: 'Journal Entries' },
    { id: 'so', label: 'Sales Orders' },
    { id: 'po', label: 'Purchase Orders' },
    { id: 'payments', label: 'Payments' },
  ];
  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {subTabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${subTab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'coa' && <AccountsModule user={user} />}
      {subTab === 'journals' && <JournalsModule />}
      {subTab === 'entries' && <JournalEntriesModule />}
      {subTab === 'so' && <OrdersModule kind="sale" />}
      {subTab === 'po' && <OrdersModule kind="purchase" />}
      {subTab === 'payments' && <PaymentsModule />}
    </div>
  );
}

// Budgets groups analytic accounts + budgets with their variance reports.
function BudgetHub({ user }) {
  const [subTab, setSubTab] = useState('budgets');
  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <button type="button" onClick={() => setSubTab('budgets')}
          className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${subTab === 'budgets' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}>
          Budgets
        </button>
        <button type="button" onClick={() => setSubTab('analytics')}
          className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${subTab === 'analytics' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'}`}>
          Analytic Accounts
        </button>
      </div>
      {subTab === 'budgets' && <BudgetsModule user={user} />}
      {subTab === 'analytics' && <AnalyticsModule user={user} />}
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
  ) },
  { id: 'sales', label: 'Sales', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
  ) },
  { id: 'purchase', label: 'Purchase', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  ) },
  { id: 'contacts', label: 'Contacts', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ) },
  { id: 'product', label: 'Products', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05" /><path d="M12 22.08V12" /></svg>
  ) },
  { id: 'account', label: 'Accounting', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
  ) },
  { id: 'budget', label: 'Budgets', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
  ) },
  { id: 'report', label: 'Reports', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15v-4" /><path d="M12 15V7" /><path d="M17 15v-8" /></svg>
  ) },
];

export default function AdminDashboard({ user, onLogout, initialTab = 'dashboard' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    if (typeof onLogout === 'function') onLogout();
  };

  const navItems = [
    ...NAV_ITEMS,
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'Users', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ) }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome navigate={setActiveTab} />;
      case 'sales': return <InvoicesModule kind="invoice" />;
      case 'purchase': return <InvoicesModule kind="bill" />;
      case 'contacts': return <ContactsModule user={user} />;
      case 'product': return <ProductsModule user={user} />;
      case 'account': return <AccountingHub user={user} />;
      case 'budget': return <BudgetHub user={user} />;
      case 'report': return <ReportsModule />;
      case 'users': return user?.role === 'admin' ? <UsersModule /> : <DashboardHome navigate={setActiveTab} />;
      default: return <DashboardHome navigate={setActiveTab} />;
    }
  };

  const nav = (extraClass = '') => (
    <nav className={`py-4 space-y-1 ${extraClass}`}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeTab === item.id
              ? 'bg-orange-50 text-orange-600 font-semibold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className={activeTab === item.id ? 'text-orange-500' : 'text-slate-400'}>{item.icon}</span>
          <span className="whitespace-nowrap">{item.label}</span>
          {activeTab === item.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />}
        </button>
      ))}
    </nav>
  );

  const userCard = (
    <div className="p-4 border-t border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {(user?.username || 'A').charAt(0).toUpperCase()}
        </div>
        <div className={`overflow-hidden flex-1 ${sidebarOpen ? '' : 'md:hidden'}`}>
          <p className="text-sm font-bold text-slate-900 truncate">{user?.username || 'Admin'}</p>
          <p className="text-xs text-orange-600 font-semibold capitalize truncate">{user?.role || 'admin'}</p>
        </div>
        <button onClick={handleLogout} className="ml-auto p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex bg-white border-r border-slate-200 flex-col transition-all duration-200 shrink-0 ${sidebarOpen ? 'w-60' : 'w-[76px]'}`}>
        <div className={`h-16 flex items-center gap-2.5 border-b border-slate-200 px-5 ${sidebarOpen ? '' : 'justify-center px-0'}`}>
          <button className="text-slate-400 hover:text-slate-900 transition p-1 rounded-md cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar" aria-label="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
          </button>
          {sidebarOpen && (
            <span className="text-base font-extrabold tracking-tight whitespace-nowrap">
              Accountant<span className="text-orange-500">++</span>
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-3">{nav()}</div>
        {userCard}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 flex flex-col shadow-2xl animate-fade-in">
            <div className="h-16 flex items-center justify-between border-b border-slate-200 px-5">
              <span className="text-base font-extrabold tracking-tight">
                Accountant<span className="text-orange-500">++</span>
              </span>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 cursor-pointer" aria-label="Close menu">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3">{nav()}</div>
            {userCard}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 cursor-pointer" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
            </button>
            <p className="text-sm text-slate-400 truncate">
              <span className="hidden sm:inline">Urban Furniture </span>/ <span className="text-slate-900 font-semibold capitalize">{navItems.find((n) => n.id === activeTab)?.label || activeTab}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
              {user?.role === 'admin' ? 'Admin' : 'Accountant'}
            </span>
            <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-full hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
