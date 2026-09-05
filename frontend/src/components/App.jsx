import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import AdminLogin from './AdminLogin';
import ConsumerLogin from './ConsumerLogin';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import VendorDashboard from './VendorDashboard';
import '../styles/App.css';

const VIEW = {
  LANDING: 'landing',
  LOGIN_SELECT: 'login_select',
  LOGIN: 'login',
  ADMIN_LOGIN: 'admin_login',
  CONSUMER_LOGIN: 'consumer_login',
  SIGNUP: 'signup',
  ADMIN_DASHBOARD: 'admin_dashboard',
  CUSTOMER_DASHBOARD: 'customer_dashboard',
  VENDOR_DASHBOARD: 'vendor_dashboard',
};

export default function App() {
  const [currentView, setCurrentView] = useState(VIEW.LANDING);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView(VIEW.LANDING);
  };

  const navigateUserDashboard = (currentUser = user) => {
    if (!currentUser) {
      setCurrentView(VIEW.LOGIN_SELECT);
      return;
    }
    if (currentUser.role === 'admin' || currentUser.role === 'accountant') {
      setCurrentView(VIEW.ADMIN_DASHBOARD);
    } else if (currentUser.contactType === 'vendor') {
      setCurrentView(VIEW.VENDOR_DASHBOARD);
    } else {
      setCurrentView(VIEW.CUSTOMER_DASHBOARD);
    }
  };

  /* ── Back button (reused across auth screens) ── */
  const FloatingBack = ({ to = VIEW.LANDING, label = '← Back' }) => (
    <button
      type="button"
      onClick={() => setCurrentView(to)}
      className="btn-floating-back"
    >
      {label}
    </button>
  );

  /* ── Portal selection screen ── */
  if (currentView === VIEW.LOGIN_SELECT) {
    return (
      <div className="portal-select-screen">
        <FloatingBack to={VIEW.LANDING} label="← Back to Overview" />

        <div className="portal-select-heading">
          <h2>Select your portal</h2>
          <p>Choose how you'd like to sign in</p>
        </div>

        <div className="portal-cards-row">
          <div
            className="portal-card portal-card-admin"
            onClick={() => setCurrentView(VIEW.ADMIN_LOGIN)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentView(VIEW.ADMIN_LOGIN)}
            aria-label="Admin Portal Login"
          >
            <div className="portal-card-icon">🛡️</div>
            <span className="portal-card-label">Admin Portal</span>
            <span className="portal-card-desc">
              Full system access, user management &amp; reporting
            </span>
            <span className="portal-card-cta">Sign In →</span>
          </div>

          <div
            className="portal-card portal-card-consumer"
            onClick={() => setCurrentView(VIEW.CONSUMER_LOGIN)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentView(VIEW.CONSUMER_LOGIN)}
            aria-label="Consumer Portal Login"
          >
            <div className="portal-card-icon">🧑‍💼</div>
            <span className="portal-card-label">Consumer Portal</span>
            <span className="portal-card-desc">
              Access your orders, invoices &amp; account settings
            </span>
            <span className="portal-card-cta">Sign In →</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin Login ── */
  if (currentView === VIEW.ADMIN_LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LOGIN_SELECT} label="← Choose Portal" />
        <AdminLogin
          onLoginSuccess={(data) => {
            if (data?.user) setUser(data.user);
            setCurrentView(VIEW.ADMIN_DASHBOARD);
          }}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset link dispatched to your admin account.')
          }
        />
      </div>
    );
  }

  /* ── Admin Dashboard Wrapper ── */
  if (currentView === VIEW.ADMIN_DASHBOARD) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  /* ── Consumer Login ── */
  if (currentView === VIEW.CONSUMER_LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LOGIN_SELECT} label="← Choose Portal" />
        <ConsumerLogin
          onLoginSuccess={(data) => {
            if (data?.user) setUser(data.user);
            if (data?.user?.contactType === 'vendor') {
              setCurrentView(VIEW.VENDOR_DASHBOARD);
            } else {
              setCurrentView(VIEW.CUSTOMER_DASHBOARD);
            }
          }}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset link dispatched to your consumer account.')
          }
        />
      </div>
    );
  }

  /* ── Customer Dashboard ── */
  if (currentView === VIEW.CUSTOMER_DASHBOARD) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LANDING} label="← Back to Overview" />
        <CustomerDashboard onLogout={handleLogout} />
      </div>
    );
  }

  /* ── Vendor Dashboard ── */
  if (currentView === VIEW.VENDOR_DASHBOARD) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LANDING} label="← Back to Overview" />
        <VendorDashboard onLogout={handleLogout} />
      </div>
    );
  }

  /* ── Generic Login (original) ── */
  if (currentView === VIEW.LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LANDING} label="← Back to Overview" />
        <Login
          onLoginSuccess={(data) => {
            if (data?.user) setUser(data.user);
            navigateUserDashboard(data?.user);
          }}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset link has been dispatched to your administrator.')
          }
        />
      </div>
    );
  }

  /* ── Sign Up ── */
  if (currentView === VIEW.SIGNUP) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LANDING} label="← Back to Overview" />
        <SignUp
          onNavigateToLogin={() => setCurrentView(VIEW.LOGIN_SELECT)}
          onNavigateToForgotPassword={() =>
            alert('Password reset link has been dispatched to your administrator.')
          }
        />
      </div>
    );
  }

  /* ── Landing Page ── */
  return (
    <div className="landing-wrapper">
      <header className="odoo-header">
        <div className="brand-logo" onClick={() => setCurrentView(VIEW.LANDING)}>
          <span>odoo</span>
          <span className="brand-logo-circle" />
        </div>

        <nav aria-label="Primary Navigation">
          <ul className="nav-menu">
            <li><button type="button" className="nav-link-btn">Apps</button></li>
            <li><button type="button" className="nav-link-btn">Industries</button></li>
            <li><button type="button" className="nav-link-btn">Community</button></li>
            <li><button type="button" className="nav-link-btn">Pricing</button></li>
            <li><button type="button" className="nav-link-btn">Help</button></li>
          </ul>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="profile-menu">
              <div className="profile-avatar">
                {(user.username || user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <span className="profile-name">{user.username || user.name || user.email}</span>
                <span className="profile-badge">{user.role}</span>
              </div>
              <button
                type="button"
                onClick={() => navigateUserDashboard(user)}
                className="btn-header-signin"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-logout"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}
                className="btn-header-signin"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setCurrentView(VIEW.SIGNUP)}
                className="btn-header-try"
              >
                Try it free
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero-container">
          <h1 className="hero-heading">
            All your business on <span className="highlight-brush">one platform.</span><br />
            Simple, efficient, yet <span className="underline-brush">affordable!</span>
          </h1>

          <div className="cta-row">
            <button
              type="button"
              onClick={() => setCurrentView(VIEW.SIGNUP)}
              className="btn-start-free"
            >
              Start now - It's free
            </button>
            <button
              type="button"
              onClick={() => alert('Consultant booking scheduling initiated.')}
              className="btn-meet-advisor"
            >
              Meet an advisor
            </button>
          </div>

          <aside className="pricing-callout" aria-label="Pricing announcement">
            <svg
              className="callout-arrow"
              viewBox="0 0 50 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M40 8 C32 18, 18 24, 14 38" />
              <path d="M8 32 L14 40 L22 35" />
            </svg>
            <span className="pricing-text">580.00 Rs / month</span>
            <span>for ALL apps</span>
          </aside>

          <div className="banner-pill-wrapper">
            <div className="banner-pill">
              <span role="img" aria-label="India flag">🇮🇳</span>
              <span className="banner-pill-title">Odoo F&amp;B Innovation Day 2026</span>
              <span className="banner-pill-date">Sep 11, 2026</span>
              <button
                type="button"
                onClick={() => setCurrentView(VIEW.SIGNUP)}
                className="banner-pill-link"
              >
                Register →
              </button>
            </div>
          </div>
        </section>

        <section className="arc-container" aria-label="Applications Suite">
          <div className="apps-grid">
            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#FDF2F8' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="19" y1="5" x2="5" y2="19" />
                  <circle cx="6.5" cy="6.5" r="2.5" fill="#DB2777" />
                  <circle cx="17.5" cy="17.5" r="2.5" fill="#DB2777" />
                </svg>
              </div>
              <span className="app-tile-name">Accounting</span>
            </div>

            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#F0FDF4' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="#DCFCE7" />
                </svg>
              </div>
              <span className="app-tile-name">Knowledge</span>
            </div>

            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#EFF6FF' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                  <path d="M14.06 6.19l3.75 3.75" />
                </svg>
              </div>
              <span className="app-tile-name">Sign</span>
            </div>

            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#FAF5FF' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="app-tile-name">CRM</span>
            </div>

            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#FFFBEB' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="app-tile-name">Studio</span>
            </div>

            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#ECFDF5' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6" />
                  <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
              <span className="app-tile-name">Subscriptions</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}