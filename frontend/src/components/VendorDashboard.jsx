import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, clearSession } from '../lib/api';
import { Button, Banner, StatusPill, TypewriterText } from './modules/ui';

const INITIAL_LOCAL_BILLS = [
  {
    id: 'BILL-2026-101',
    billNo: 'BILL-2026-101',
    vendor: 'Azure Furniture Suppliers',
    poReference: 'PO-2026-005',
    date: '2026-08-20',
    billDate: '2026-08-20',
    dueDate: '2026-09-05',
    items: [
      { name: 'Raw Teak Wood', quantity: 20, unitPrice: 150, tax: 18 },
      { name: 'Steel Joints', quantity: 50, unitPrice: 10, tax: 18 }
    ],
    amount: 4130.00,
    total: 4130.00,
    status: 'Pending',
    paymentStatus: 'Not Paid'
  },
  {
    id: 'BILL-2026-102',
    billNo: 'BILL-2026-102',
    vendor: 'Azure Furniture Suppliers',
    poReference: 'PO-2026-008',
    date: '2026-09-01',
    billDate: '2026-09-01',
    dueDate: '2026-09-20',
    items: [
      { name: 'Sofa Fabrics & Foam', quantity: 10, unitPrice: 300, tax: 18 }
    ],
    amount: 3540.00,
    total: 3540.00,
    status: 'Pending',
    paymentStatus: 'Not Paid'
  },
  {
    id: 'BILL-2026-099',
    billNo: 'BILL-2026-099',
    vendor: 'Azure Furniture Suppliers',
    poReference: 'PO-2026-001',
    date: '2026-07-15',
    billDate: '2026-07-15',
    dueDate: '2026-07-30',
    items: [
      { name: 'Plywood Sheets', quantity: 40, unitPrice: 40, tax: 18 }
    ],
    amount: 1888.00,
    total: 1888.00,
    status: 'Paid',
    paymentStatus: 'Paid'
  }
];

export default function VendorDashboard({ 
  user,
  onLogout,
  sharedBills = [], 
  vendorBills = [], 
  onUpdateBill 
}) {
  const [remoteDocs, setRemoteDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/portal/documents?kind=bill');
      if (Array.isArray(data)) setRemoteDocs(data);
    } catch (e) {
      // Use fallback if API error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const incomingBills = remoteDocs.length > 0 
    ? remoteDocs 
    : (vendorBills.length > 0 ? vendorBills : sharedBills);

  const normalizedIncoming = (incomingBills || []).map((b) => ({
    id: String(b.billNo || b.id || `BILL-${String(b.id).padStart(4, '0')}`),
    originalId: b.id,
    billNo: String(b.billNo || b.id),
    vendor: b.contactName || b.vendor || user?.username || 'Azure Furniture Suppliers',
    poReference: b.billReference || b.poReference || 'Direct Bill',
    date: b.billDate || b.date || new Date().toISOString().split('T')[0],
    dueDate: b.dueDate || '2026-10-20',
    amount: parseFloat(b.totalAmount || b.total || b.amount || 0),
    amountDue: parseFloat(b.balanceDue !== undefined ? b.balanceDue : (b.status === 'paid' ? 0 : (b.totalAmount || b.amount || 0))),
    status: (b.status === 'paid' || b.balanceDue <= 0) ? 'Paid' : 'Pending',
    paymentStatus: (b.status === 'paid' || b.balanceDue <= 0) ? 'Paid' : 'Not Paid',
    items: b.lines ? b.lines.map((l) => ({
      name: l.productName || l.description || 'Supplied Materials',
      quantity: l.quantity || 1,
      unitPrice: l.unitPrice || 0,
      tax: l.taxRate || 0
    })) : (b.items || [{ name: 'Supplied Raw Material', quantity: 1, unitPrice: b.totalAmount || b.amount || 0, tax: 0 }])
  }));

  const [localBills] = useState(INITIAL_LOCAL_BILLS);

  const allBills = [
    ...normalizedIncoming,
    ...localBills.filter((loc) => !normalizedIncoming.some((inc) => inc.id === loc.id))
  ];

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [message, setMessage] = useState('');

  const totalReceivable = allBills
    .filter((bill) => bill.status !== 'Paid')
    .reduce((acc, bill) => acc + (bill.amountDue > 0 ? bill.amountDue : bill.amount), 0);

  const totalReceived = allBills
    .filter((bill) => bill.status === 'Paid')
    .reduce((acc, bill) => acc + bill.amount, 0);

  const totalBilled = allBills.reduce((acc, bill) => acc + bill.amount, 0);

  const filteredBills = allBills.filter((bill) => {
    const matchesStatus = filterStatus === 'All' || bill.status === filterStatus;
    const matchesSearch = !searchTerm ||
      bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.poReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleLogout = () => {
    clearSession();
    if (typeof onLogout === 'function') onLogout();
  };

  const handleRequestPayment = (billId) => {
    setMessage(`Payment reminder sent for ${billId} to Company Finance Department.`);
    setSelectedBill(null);
    if (onUpdateBill) onUpdateBill(billId);
    setTimeout(() => setMessage(''), 4000);
  };

  const initials = (user?.username || 'AF').slice(0, 2).toUpperCase();

  return (
    <div className="portal">
      <div className="portal-inner stack-lg">

        {/* Vendor Header */}
        <div className="portal-hero fade-in">
          <div>
            <span className="portal-tag">VYAPAR360 VENDOR PORTAL {loading && '· Syncing…'}</span>
            <h1 className="h1" style={{ marginTop: 8 }}>{user?.username || 'Azure Furniture Suppliers'}</h1>
            <p className="lede">Contact: Vendor Management | Vendor Account: VEND-4019</p>
          </div>

          <div className="cluster">
            <div className="avatar-sm">{initials}</div>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
          </div>
        </div>

        {message && (
          <div className="banner fade-in">
            <span>ℹ️ {message}</span>
            <button type="button" onClick={() => setMessage('')} className="btn-icon">✕</button>
          </div>
        )}
        {error && <Banner error={error} onDismiss={() => setError('')} />}

        {/* KPI Cards */}
        <div className="grid-4 fade-in">
          <div className="stat-card">
            <span className="tiny-up">Payment Due from Buyer</span>
            <p className="value" style={{ color: 'var(--warn)' }}>
              <TypewriterText text={money(totalReceivable)} speed={40} />
            </p>
            <p className="tiny">Awaiting settlement</p>
          </div>

          <div className="stat-card">
            <span className="tiny-up">Total Received</span>
            <p className="value" style={{ color: 'var(--ok)' }}>
              <TypewriterText text={money(totalReceived)} speed={40} />
            </p>
            <p className="tiny">Cleared transactions</p>
          </div>

          <div className="stat-card">
            <span className="tiny-up">Total Billed</span>
            <p className="value">
              <TypewriterText text={money(totalBilled)} speed={40} />
            </p>
            <p className="tiny">Gross supply orders</p>
          </div>

          <div className="stat-card">
            <span className="tiny-up">Total Bills / POs</span>
            <p className="value">
              <TypewriterText text={`${allBills.length} Orders`} speed={30} />
            </p>
            <p className="tiny">{allBills.filter((b) => b.status === 'Pending').length} pending settlement</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="row-between fade-in">
          <div className="cluster">
            {['All', 'Pending', 'Paid'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`chip-tab ${filterStatus === status ? 'is-on' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by Bill ID, PO, or item…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ maxWidth: 280 }}
          />
        </div>

        {/* Table */}
        <div className="panel fade-in" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>PO Ref</th>
                  <th>Bill Date</th>
                  <th>Due Date</th>
                  <th className="t-right">Amount</th>
                  <th>Status</th>
                  <th className="t-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length > 0 ? (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="clickable" onClick={() => setSelectedBill(bill)}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{bill.id}</td>
                      <td className="mono tiny">{bill.poReference}</td>
                      <td className="mono tiny">{bill.date}</td>
                      <td className="mono tiny">{bill.dueDate}</td>
                      <td className="t-right mono" style={{ fontWeight: 700 }}>
                        {money(bill.amount)}
                      </td>
                      <td>
                        <StatusPill status={bill.status} />
                      </td>
                      <td className="t-right">
                        <Button
                          variant="secondary"
                          className="btn-sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedBill(bill); }}
                        >
                          View Bill Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty">
                      No vendor bills match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill Detail Modal */}
        {selectedBill && (
          <div className="modal-backdrop">
            <div className="modal modal-wide stack">
              <div className="panel-head" style={{ marginBottom: 0 }}>
                <div>
                  <h3 className="h2">Bill: {selectedBill.id}</h3>
                  <p className="tiny">PO Reference: {selectedBill.poReference} · Date: {selectedBill.date} · Due: {selectedBill.dueDate}</p>
                </div>
                <button type="button" onClick={() => setSelectedBill(null)} className="btn-icon" title="Close">✕</button>
              </div>

              <div>
                <h4 className="h3" style={{ marginBottom: 8 }}>Supplied Line Items</h4>
                <div className="table-wrap">
                  <table className="data-table compact">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th className="t-center">Qty</th>
                        <th className="t-right">Unit Cost</th>
                        <th className="t-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.items.map((item, idx) => {
                        const itemSubtotal = (item.quantity || 1) * (item.unitPrice || 0);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td className="t-center mono">{item.quantity}</td>
                            <td className="t-right mono">{money(item.unitPrice)}</td>
                            <td className="t-right mono" style={{ fontWeight: 700 }}>{money(itemSubtotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row-between" style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: '6px' }}>
                <span className="label-sm">Total Billed Amount:</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {money(selectedBill.amount)}
                </span>
              </div>

              <div className="cluster" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                <Button variant="secondary" onClick={() => setSelectedBill(null)}>Close</Button>
                {selectedBill.status !== 'Paid' ? (
                  <Button variant="primary" onClick={() => handleRequestPayment(selectedBill.id)}>
                    Send Payment Reminder
                  </Button>
                ) : (
                  <span className="pill pill-paid">✓ Paid</span>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
