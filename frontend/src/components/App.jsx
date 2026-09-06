import { useState, useEffect } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import AdminDashboard from './AdminDashboard';
import PortalDashboard from './PortalDashboard';
import PrintInvoice from './PrintInvoice';
import { getSession, clearSession, homeViewFor } from '../lib/api';
import AnalyticsCharts from './AnalyticsCharts';
import '../styles/App.css';

const VIEW = {
  LANDING: 'landing',
  PORTAL_SELECT: 'portal_select',
  LOGIN: 'login',
  SIGNUP: 'signup',
  OFFICE: 'office',
  PORTAL: 'portal',
  PRINT: 'print',
};

const MODULE_TILES = [
  { id: 'contacts', label: 'Contacts', desc: 'Customers, vendors and business partners.' },
  { id: 'product', label: 'Products', desc: 'Goods, services and inventory with live stock.' },
  { id: 'sales', label: 'Sales Orders', desc: 'Commercial orders, customer invoices and receipts.' },
  { id: 'purchase', label: 'Purchases', desc: 'Vendor orders, purchase bills and disbursements.' },
  { id: 'account', label: 'Accounting', desc: 'Chart of accounts, journals, and ledger entries.' },
  { id: 'budget', label: 'Budgets', desc: 'Analytic plans with automatic variance.' },
  { id: 'report', label: 'Financial Reports', desc: 'Trial balance, P&L, and balance sheet.' },
];

const ICONS = {
  contacts: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  product: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
  ),
  sales: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
  ),
  purchase: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
  ),
  account: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><path d="M4 10v11" /><path d="M20 10v11" /></svg>
  ),
  budget: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
  ),
  report: (c) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /></svg>
  ),
};

function Wordmark({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="wordmark">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '24px', background: '#0052cc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '11px' }}>
          V
        </div>
        <span className="brand">
          VYAPAR<span className="brand-mark">360</span>
        </span>
      </div>
    </button>
  );
}

function FloatingBack({ onBack, label = 'Back' }) {
  return (
    <button type="button" onClick={onBack} className="btn-floating-back">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
      {label}
    </button>
  );
}

function PortalSelectView({ onSelectAdmin, onSelectCustomer, onSelectVendor, onBack }) {
  return (
    <div className="portal-pick fade-in">
      <FloatingBack onBack={onBack} label="Overview" />
      <div className="t-center" style={{ marginBottom: '2.5rem' }}>
        <h1 className="h1">Sign in to VYAPAR360</h1>
        <p className="lede" style={{ marginTop: 6 }}>Select access role workspace to continue</p>
      </div>
      <div className="portal-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', maxWidth: '960px', margin: '0 auto' }}>
        <button type="button" onClick={onSelectAdmin} className="portal-card">
          <div className="portal-ico">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2>Admin &amp; Accountant</h2>
          <p>Full double-entry general ledger, operational orders, inventory &amp; reporting.</p>
          <div className="portal-cta">ACCESS WORKSPACE</div>
        </button>
        <button type="button" onClick={onSelectCustomer} className="portal-card">
          <div className="portal-ico">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2>Customer Portal</h2>
          <p>Access your commercial sales orders, invoices, and online payment receipts.</p>
          <div className="portal-cta">CUSTOMER LOGIN</div>
        </button>
        <button type="button" onClick={onSelectVendor} className="portal-card">
          <div className="portal-ico">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h2>Vendor Portal</h2>
          <p>Access purchase orders, vendor bills, payables, and payment confirmations.</p>
          <div className="portal-cta">VENDOR LOGIN</div>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState(VIEW.LANDING);
  const [portalType, setPortalType] = useState('admin');
  const [initialTab, setInitialTab] = useState('dashboard');
  const [user, setUser] = useState(getSession);
  const [printDocId, setPrintDocId] = useState(null);

  // Check for print route
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('print');
    if (pId) {
      setPrintDocId(pId);
      setCurrentView(VIEW.PRINT);
    }
  }, []);

  const isLoggedIn = Boolean(user);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setInitialTab('dashboard');
    setCurrentView(VIEW.LANDING);
  };

  const handleLoginSuccess = (data) => {
    if (data?.token && data?.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setInitialTab('dashboard');
      setCurrentView(homeViewFor(data.user) === 'portal' ? VIEW.PORTAL : VIEW.OFFICE);
    }
  };

  const openDashboard = (tab = 'dashboard') => {
    if (!isLoggedIn) return;
    if (user.role === 'contact') {
      setCurrentView(VIEW.PORTAL);
    } else {
      setInitialTab(tab);
      setCurrentView(VIEW.OFFICE);
    }
  };

  const onTileClick = (moduleId) => {
    if (!isLoggedIn) {
      setCurrentView(VIEW.PORTAL_SELECT);
      return;
    }
    openDashboard(moduleId);
  };

  if (currentView === VIEW.PRINT) {
    return <PrintInvoice docId={printDocId} />;
  }

  if (currentView === VIEW.PORTAL_SELECT) {
    return (
      <PortalSelectView
        onSelectAdmin={() => { setPortalType('admin'); setCurrentView(VIEW.LOGIN); }}
        onSelectCustomer={() => { setPortalType('customer'); setCurrentView(VIEW.LOGIN); }}
        onSelectVendor={() => { setPortalType('vendor'); setCurrentView(VIEW.LOGIN); }}
        onBack={() => setCurrentView(VIEW.LANDING)}
      />
    );
  }

  if (currentView === VIEW.LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack onBack={() => setCurrentView(VIEW.PORTAL_SELECT)} label="Select Portal" />
        <Login
          portalType={portalType}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset is managed by your system administrator.')
          }
        />
      </div>
    );
  }

  if (currentView === VIEW.SIGNUP) {
    return (
      <div className="view-wrapper">
        <FloatingBack onBack={() => setCurrentView(VIEW.LANDING)} label="Overview" />
        <SignUp
          onNavigateToLogin={() => setCurrentView(VIEW.LOGIN)}
          onNavigateToForgotPassword={() => alert('Password reset is managed by your system administrator.')}
        />
      </div>
    );
  }

  if (currentView === VIEW.OFFICE && isLoggedIn && user.role !== 'contact') {
    return <AdminDashboard user={user} onLogout={handleLogout} initialTab={initialTab} />;
  }

  if (currentView === VIEW.PORTAL && isLoggedIn) {
    return <PortalDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="landing">
      <header className="site-header">
        <div className="site-header-inner">
          <Wordmark onClick={() => setCurrentView(VIEW.LANDING)} />
          <nav aria-label="Primary Navigation" className="site-nav">
            {['sales', 'purchase', 'account', 'report'].map((id) => (
              <button key={id} type="button" onClick={() => onTileClick(id)} className="nav-link">
                {id === 'account' ? 'Accounting' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </nav>
          <div className="cluster">
            {isLoggedIn ? (
              <>
                <div className="header-user">
                  <div className="avatar-sm" style={{ width: 28, height: 28 }}>{(user.username || user.email || 'U').charAt(0).toUpperCase()}</div>
                  <div>
                    <p>{user.username || user.email}</p>
                    <span>{user.role}</span>
                  </div>
                </div>
                <button type="button" onClick={() => openDashboard('dashboard')} className="btn btn-primary btn-sm">Dashboard</button>
                <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setCurrentView(VIEW.PORTAL_SELECT)} className="btn btn-secondary btn-sm">Sign In</button>
                <button type="button" onClick={() => setCurrentView(VIEW.SIGNUP)} className="btn btn-primary btn-sm">Get Started</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="grow">
        <section className="hero">
          <div className="hero-inner">
            <span className="hero-kicker"><i /> Financial &amp; Operations Suite</span>
            <h1>Double-entry accounting, <span>engineered for clarity.</span></h1>
            <p>
              Integrated commercial orders, real-time inventory balances, automated general ledger postings, and live statutory reporting.
            </p>
            <div className="hero-actions">
              {isLoggedIn ? (
                <button type="button" onClick={() => openDashboard('dashboard')} className="btn-hero btn-hero-primary">
                  Open Workspace
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => setCurrentView(VIEW.PORTAL_SELECT)} className="btn-hero btn-hero-primary">
                    Sign In to Portal
                  </button>
                  <button type="button" onClick={() => setCurrentView(VIEW.SIGNUP)} className="btn-hero btn-hero-ghost">
                    Register Account
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Modules" className="modules-band">
          <div className="container">
            <div className="module-grid">
              {MODULE_TILES.map((tile) => (
                <button key={tile.id} type="button" onClick={() => onTileClick(tile.id)} className="module-tile">
                  <div className="module-icon">{ICONS[tile.id]('#0052cc')}</div>
                  <h3>{tile.label}</h3>
                  <p>{tile.desc}</p>
                  <span className="module-go">Explore Module →</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shadcn UI Financial Analytics Charts */}
        <AnalyticsCharts />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <Wordmark onClick={() => setCurrentView(VIEW.LANDING)} />
          <p className="tiny">VYAPAR360 Core ERP &amp; General Ledger Engine</p>
        </div>
      </footer>
    </div>
  );
}
