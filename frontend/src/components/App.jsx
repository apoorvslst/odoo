import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import AdminLogin from './AdminLogin';
import ConsumerLogin from './ConsumerLogin';
import CustomerDashboard from './CustomerDashboard';
import VendorDashboard from './VendorDashboard';
import '../styles/App.css';

const VIEW = {
  LANDING:            'landing',
  LOGIN_SELECT:       'login_select',
  LOGIN:              'login',
  ADMIN_LOGIN:        'admin_login',
  CONSUMER_LOGIN:     'consumer_login',
  SIGNUP:             'signup',
  CUSTOMER_DASHBOARD: 'customer_dashboard',
  VENDOR_DASHBOARD:   'vendor_dashboard',
};

export default function App() {
  const [currentView, setCurrentView] = useState(VIEW.LANDING);
  const [user, setUser] = useState(null);

  // Handles logout — clears user and goes back to landing
  const handleLogout = () => {
    setUser(null);
    setCurrentView(VIEW.LANDING);
  };

  // Handles login success — stores user data and navigates to dashboard
  const handleLoginSuccess = (data) => {
    setUser(data.user);
    const role = (data.user?.role || '').toLowerCase();
    if (role === 'admin') {
      setCurrentView(VIEW.LANDING);
    } else if (role === 'vendor') {
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
          {/* Admin card */}
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

          {/* Consumer card */}
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

          {/* Vendor card */}
          <div
            className="portal-card portal-card-vendor"
            onClick={() => setCurrentView(VIEW.VENDOR_DASHBOARD)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentView(VIEW.VENDOR_DASHBOARD)}
            aria-label="Vendor Portal"
          >
            <div className="portal-card-icon">🏭</div>
            <span className="portal-card-label">Vendor Portal</span>
            <span className="portal-card-desc">
              Manage purchase bills, vendor orders &amp; payments
            </span>
            <span className="portal-card-cta">View Portal →</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Customer Dashboard ── */
  if (currentView === VIEW.CUSTOMER_DASHBOARD) {
    return (
      <div className="view-wrapper">
        <div className="dashboard-topbar">
          <button className="btn-floating-back" onClick={() => setCurrentView(VIEW.LANDING)}>← Back</button>
          {user ? (
            <div className="profile-menu">
              <div className="profile-avatar">{user.name ? user.name[0].toUpperCase() : (user.login_id ? user.login_id[0].toUpperCase() : 'C')}</div>
              <span className="profile-name">{user.name || user.login_id}</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn-logout" onClick={() => setCurrentView(VIEW.CONSUMER_LOGIN)}>Sign In</button>
          )}
        </div>
        <CustomerDashboard />
      </div>
    );
  }

  /* ── Vendor Dashboard ── */
  if (currentView === VIEW.VENDOR_DASHBOARD) {
    return (
      <div className="view-wrapper">
        <div className="dashboard-topbar">
          <button className="btn-floating-back" onClick={() => setCurrentView(VIEW.LANDING)}>← Back</button>
          {user ? (
            <div className="profile-menu">
              <div className="profile-avatar">{user.name ? user.name[0].toUpperCase() : (user.login_id ? user.login_id[0].toUpperCase() : 'V')}</div>
              <span className="profile-name">{user.name || user.login_id}</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn-logout" onClick={() => setCurrentView(VIEW.CONSUMER_LOGIN)}>Sign In</button>
          )}
        </div>
        <VendorDashboard />
      </div>
    );
  }

  /* ── Admin Login ── */
  if (currentView === VIEW.ADMIN_LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LOGIN_SELECT} label="← Choose Portal" />
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset link dispatched to your admin account.')
          }
        />
      </div>
    );
  }

  /* ── Consumer Login ── */
  if (currentView === VIEW.CONSUMER_LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LOGIN_SELECT} label="← Choose Portal" />
        <ConsumerLogin
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignUp={() => setCurrentView(VIEW.SIGNUP)}
          onNavigateToForgotPassword={() =>
            alert('Password reset link dispatched to your consumer account.')
          }
        />
      </div>
    );
  }

  /* ── Generic Login (original — kept for direct app-tile clicks) ── */
  if (currentView === VIEW.LOGIN) {
    return (
      <div className="view-wrapper">
        <FloatingBack to={VIEW.LANDING} label="← Back to Overview" />
        <Login
          onLoginSuccess={handleLoginSuccess}
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
      {/* Top Header */}
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
              <button
                type="button"
                onClick={() => {
                  const role = (user.role || '').toLowerCase();
                  if (role === 'vendor') {
                    setCurrentView(VIEW.VENDOR_DASHBOARD);
                  } else {
                    setCurrentView(VIEW.CUSTOMER_DASHBOARD);
                  }
                }}
                className="btn-header-dashboard"
              >
                Dashboard
              </button>
              <div className="profile-avatar">{user.name ? user.name[0].toUpperCase() : (user.login_id ? user.login_id[0].toUpperCase() : 'U')}</div>
              <span className="profile-name">{user.name || user.login_id}</span>
              <button type="button" onClick={handleLogout} className="btn-logout">Logout</button>
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

      {/* Hero Body */}
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

          {/* Pricing callout */}
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

          {/* Event Announcement Pill */}
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

        {/* Convex Curved Apps Tray — clicking tiles goes to portal selector */}
        <section className="arc-container" aria-label="Applications Suite">
          <div className="apps-grid">
            {/* Accounting */}
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

            {/* Knowledge */}
            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#F0FDF4' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="#DCFCE7" />
                </svg>
              </div>
              <span className="app-tile-name">Knowledge</span>
            </div>

            {/* Sign */}
            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#EFF6FF' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                  <path d="M14.06 6.19l3.75 3.75" />
                </svg>
              </div>
              <span className="app-tile-name">Sign</span>
            </div>

            {/* CRM */}
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

            {/* Studio */}
            <div className="app-tile" onClick={() => setCurrentView(VIEW.LOGIN_SELECT)}>
              <div className="app-icon-squircle" style={{ backgroundColor: '#FFFBEB' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="app-tile-name">Studio</span>
            </div>

            {/* Subscriptions */}
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