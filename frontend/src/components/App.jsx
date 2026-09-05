import { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import AdminDashboard from './AdminDashboard';
import PortalDashboard from './PortalDashboard';
import { getSession, clearSession, homeViewFor } from '../lib/api';
import '../styles/App.css';

const VIEW = {
  LANDING: 'landing',
  LOGIN: 'login',
  SIGNUP: 'signup',
  OFFICE: 'office',
  PORTAL: 'portal',
};

// Every tile maps to a real back-office module id (AdminDashboard nav item).
const MODULE_TILES = [
  { id: 'contacts', label: 'Contacts', desc: 'Customers, vendors and dual-role partners.' },
  { id: 'product', label: 'Products', desc: 'Goods, services and combos with live stock.' },
  { id: 'sales', label: 'Sales', desc: 'Orders, customer invoices and receipts.' },
  { id: 'purchase', label: 'Purchase', desc: 'Vendor orders, bills and payments.' },
  { id: 'account', label: 'Accounting', desc: 'Chart of accounts, journals, ledger entries.' },
  { id: 'budget', label: 'Budgets', desc: 'Analytic plans with automatic variance.' },
  { id: 'report', label: 'Reports', desc: 'Trial balance, P&L and balance sheet.' },
];

const ICONS = {
  contacts: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  product: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05" /><path d="M12 22.08V12" /></svg>
  ),
  sales: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
  ),
  purchase: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  ),
  account: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
  ),
  budget: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
  ),
  report: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15v-4" /><path d="M12 15V7" /><path d="M17 15v-8" /></svg>
  ),
};

function Wordmark({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 shrink-0 cursor-pointer">
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Accountant<span className="text-orange-500">++</span>
      </span>
    </button>
  );
}

function FloatingBack({ onBack, label = '← Back' }) {
  return (
    <button type="button" onClick={onBack} className="btn-floating-back">
      {label}
    </button>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState(VIEW.LANDING);
  const [initialTab, setInitialTab] = useState('dashboard');
  const [user, setUser] = useState(getSession);

  const isLoggedIn = Boolean(user);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setInitialTab('dashboard');
    setCurrentView(VIEW.LANDING);
  };

  // data = { token, user } exactly as POST /api/auth/login returns
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

  // Landing tiles & nav links: not signed in -> login; contact -> portal; else office on that module.
  const onTileClick = (moduleId) => {
    if (!isLoggedIn) {
      setCurrentView(VIEW.LOGIN);
      return;
    }
    openDashboard(moduleId);
  };

  if (currentView === VIEW.LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack onBack={() => setCurrentView(VIEW.LANDING)} label="← Back to Overview" />
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset is handled by your administrator (admin creates users via POST /api/auth/users).')
          }
        />
      </div>
    );
  }

  if (currentView === VIEW.SIGNUP) {
    return (
      <div className="view-wrapper">
        <FloatingBack onBack={() => setCurrentView(VIEW.LANDING)} label="← Back to Overview" />
        <SignUp
          onNavigateToLogin={() => setCurrentView(VIEW.LOGIN)}
          onNavigateToForgotPassword={() => alert('Password reset is handled by your administrator.')}
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

  /* ── Landing page ── */
  return (
    <div className="landing-shell">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Wordmark onClick={() => setCurrentView(VIEW.LANDING)} />

          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-1">
            {['sales', 'purchase', 'account', 'report'].map((id) => (
              <button key={id} type="button" onClick={() => onTileClick(id)}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors capitalize">
                {id === 'account' ? 'Accounting' : id}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5 mr-1">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold text-slate-900">{user.username || user.email}</p>
                    <p className="text-[11px] text-orange-600 font-semibold capitalize">{user.role}</p>
                  </div>
                </div>
                <button type="button" onClick={() => openDashboard('dashboard')}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer">
                  Dashboard
                </button>
                <button type="button" onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setCurrentView(VIEW.LOGIN)}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                  Sign in
                </button>
                <button type="button" onClick={() => setCurrentView(VIEW.SIGNUP)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer">
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Accounting for Urban Furniture
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Accountant<span className="text-orange-500">++</span>
          </h1>
          <p className="max-w-2xl mx-auto mt-5 text-base sm:text-lg text-slate-500 leading-relaxed">
            Master data, orders, invoices, payments and financial reports — one clean,
            double-entry system that keeps every rupee accounted for.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <button type="button" onClick={() => openDashboard('dashboard')}
                className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer">
                Open your dashboard
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setCurrentView(VIEW.LOGIN)}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer">
                  Sign in
                </button>
                <button type="button" onClick={() => setCurrentView(VIEW.SIGNUP)}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                  Create free account
                </button>
              </>
            )}
          </div>
        </section>

        {/* Modules */}
        <section aria-label="Modules" className="border-t border-slate-200 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULE_TILES.map((tile) => (
                <button key={tile.id} type="button" onClick={() => onTileClick(tile.id)}
                  className="group text-left card p-5 sm:p-6 hover:border-orange-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    {ICONS[tile.id]('#ea580c')}
                  </div>
                  <h3 className="font-bold text-slate-900">{tile.label}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{tile.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <span aria-hidden="true">→</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            Accountant<span className="text-orange-500">++</span>
          </span>
          <p className="text-xs text-slate-400">Double-entry accounting · Urban Furniture hackathon build</p>
        </div>
      </footer>
    </div>
  );
}
