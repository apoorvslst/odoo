import { useState } from 'react';
import CustomerDashboard from './CustomerDashboard';
import VendorDashboard from './VendorDashboard';

export default function PortalDashboard({ user, onLogout }) {
  const isVendor = user?.contactType === 'vendor';
  const isCustomer = user?.contactType === 'customer';
  const [activePortal, setActivePortal] = useState(isVendor ? 'vendor' : 'customer');

  return (
    <div>
      {(user?.contactType === 'both' || (!isVendor && !isCustomer)) && (
        <div style={{ background: '#fff', borderBottom: '1px solid var(--line)', padding: '12px 24px' }}>
          <div className="cluster" style={{ justifyContent: 'center' }}>
            <span className="tiny-up" style={{ marginRight: 8 }}>Portal View:</span>
            <button
              type="button"
              onClick={() => setActivePortal('customer')}
              className={`subtab ${activePortal === 'customer' ? 'is-on' : ''}`}
            >
              Customer Portal
            </button>
            <button
              type="button"
              onClick={() => setActivePortal('vendor')}
              className={`subtab ${activePortal === 'vendor' ? 'is-on' : ''}`}
            >
              Vendor Portal
            </button>
          </div>
        </div>
      )}

      {activePortal === 'vendor' ? (
        <VendorDashboard user={user} onLogout={onLogout} />
      ) : (
        <CustomerDashboard user={user} onLogout={onLogout} />
      )}
    </div>
  );
}
