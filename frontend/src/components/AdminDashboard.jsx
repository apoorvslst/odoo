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

const NAV_ICONS = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  sales: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  purchase: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  contacts: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  product: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  account: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v4" /><path d="M12 14v4" /><path d="M16 14v4" />
    </svg>
  ),
  budget: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  report: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  users: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

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
    <div>
      <div className="subtabs">
        {subTabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setSubTab(t.id)}
            className={`subtab ${subTab === t.id ? 'is-on' : ''}`}>
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

function BudgetHub({ user }) {
  const [subTab, setSubTab] = useState('budgets');
  return (
    <div>
      <div className="subtabs">
        {[{ id: 'budgets', label: 'Budgets' }, { id: 'analytics', label: 'Analytic Accounts' }].map((t) => (
          <button key={t.id} type="button" onClick={() => setSubTab(t.id)}
            className={`subtab ${subTab === t.id ? 'is-on' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'budgets' && <BudgetsModule user={user} />}
      {subTab === 'analytics' && <AnalyticsModule user={user} />}
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sales', label: 'Sales' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'product', label: 'Products' },
  { id: 'account', label: 'Accounting' },
  { id: 'budget', label: 'Budgets' },
  { id: 'report', label: 'Reports' },
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
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'Users' }] : []),
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

  const navLabel = navItems.find((n) => n.id === activeTab)?.label || activeTab;

  const SidebarNav = ({ collapsed }) => (
    <nav className="sidebar-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
          className={`nav-item ${activeTab === item.id ? 'is-on' : ''}`}
          title={item.label}
        >
          <span className="nav-icon">{NAV_ICONS[item.id] || NAV_ICONS.dashboard}</span>
          {!collapsed && <span className="label">{item.label}</span>}
        </button>
      ))}
    </nav>
  );

  const isAdmin = user?.role === 'admin';
  const workspaceName = isAdmin ? 'VYAPAR360 Admin' : 'VYAPAR360 Accountant';

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? '' : 'is-slim'}`}>
        <div className="sidebar-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <div style={{ width: '28px', height: '22px', background: '#0052cc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '10px', flexShrink: 0 }}>
              V360
            </div>
            {sidebarOpen && <span className="sidebar-title">{workspaceName}</span>}
          </div>
          <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle Sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
        <SidebarNav collapsed={!sidebarOpen} />
        <div className="sidebar-user">
          <div className="row">
            <div className="avatar-sm" style={{ width: 32, height: 32, borderRadius: 4, background: '#1e293b' }}>
              {(user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="grow">
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{user?.username || (isAdmin ? 'Admin' : 'Accountant')}</p>
                <p className="user-role">
                  <span className="dot" />
                  {isAdmin ? 'Administrator' : 'Accountant'}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button type="button" onClick={handleLogout} className="btn-icon" title="Logout" style={{ color: '#8b99ad' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="drawer">
          <div className="drawer-mask" onClick={() => setMobileNavOpen(false)} />
          <aside className="drawer-panel">
            <div className="drawer-head">
              <span>{workspaceName}</span>
              <button type="button" onClick={() => setMobileNavOpen(false)} className="btn-icon" style={{ color: '#8b99ad' }}>✕</button>
            </div>
            <SidebarNav collapsed={false} />
          </aside>
        </div>
      )}

      <div className="app-main">
        <header className="topbar">
          <div className="row">
            <button type="button" className="menu-btn" onClick={() => setMobileNavOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
            </button>
            <p className="crumb">System <span style={{ margin: '0 4px', color: '#cbd5e1' }}>/</span> <strong>{navLabel}</strong></p>
          </div>
          <div className="cluster">
            <span className="mode-pill">{isAdmin ? 'Admin Workspace' : 'Accountant Workspace'}</span>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm logout-top">Logout</button>
          </div>
        </header>
        <main className="app-content">
          <div className="app-content-inner">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
