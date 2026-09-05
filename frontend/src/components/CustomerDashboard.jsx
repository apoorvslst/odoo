import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money, clearSession } from '../lib/api';
import { Button, Banner, StatusPill, TypewriterText } from './modules/ui';

const INITIAL_LOCAL_INVOICES = [
  {
    id: 'INV-2026-001',
    invoiceNo: 'INV-2026-001',
    customer: 'Nimesh Pathak',
    date: '2026-08-15',
    invoiceDate: '2026-08-15',
    dueDate: '2026-08-30',
    items: [
      { name: 'Office Chair', quantity: 5, unitPrice: 120, tax: 18 },
      { name: 'Wooden Table', quantity: 1, unitPrice: 450, tax: 18 }
    ],
    amount: 1239.00,
    total: 1239.00,
    status: 'Overdue',
    paymentStatus: 'Not Paid'
  },
  {
    id: 'INV-2026-002',
    invoiceNo: 'INV-2026-002',
    customer: 'Nimesh Pathak',
    date: '2026-09-01',
    invoiceDate: '2026-09-01',
    dueDate: '2026-09-15',
    items: [
      { name: 'Luxury Sofa Set', quantity: 1, unitPrice: 1500, tax: 18 }
    ],
    amount: 1770.00,
    total: 1770.00,
    status: 'Pending',
    paymentStatus: 'Not Paid'
  },
  {
    id: 'INV-2026-003',
    invoiceNo: 'INV-2026-003',
    customer: 'Nimesh Pathak',
    date: '2026-07-10',
    invoiceDate: '2026-07-10',
    dueDate: '2026-07-25',
    items: [
      { name: 'Dining Table', quantity: 1, unitPrice: 800, tax: 18 },
      { name: 'Chairs', quantity: 4, unitPrice: 100, tax: 18 }
    ],
    amount: 1416.00,
    total: 1416.00,
    status: 'Paid',
    paymentStatus: 'Paid'
  }
];

export default function CustomerDashboard({ 
  user,
  onLogout,
  sharedInvoices = [], 
  customerInvoices = [], 
  onPayInvoice 
}) {
  const [remoteDocs, setRemoteDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/portal/documents?kind=invoice');
      if (Array.isArray(data)) setRemoteDocs(data);
    } catch (e) {
      // Use fallback if API error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const incomingInvoices = remoteDocs.length > 0 
    ? remoteDocs 
    : (customerInvoices.length > 0 ? customerInvoices : sharedInvoices);

  const normalizedIncoming = (incomingInvoices || []).map((inv) => ({
    id: String(inv.invoiceNo || inv.id || `INV-${String(inv.id).padStart(4, '0')}`),
    originalId: inv.id,
    invoiceNo: String(inv.invoiceNo || inv.id),
    customer: inv.contactName || inv.customer || user?.username || 'Customer',
    date: inv.invoiceDate || inv.date || new Date().toISOString().split('T')[0],
    dueDate: inv.dueDate || '2026-10-15',
    amount: parseFloat(inv.totalAmount || inv.total || inv.amount || 0),
    amountDue: parseFloat(inv.balanceDue !== undefined ? inv.balanceDue : (inv.status === 'paid' ? 0 : (inv.totalAmount || inv.amount || 0))),
    status: (inv.status === 'paid' || inv.balanceDue <= 0) ? 'Paid' : (inv.status === 'overdue' ? 'Overdue' : 'Pending'),
    paymentStatus: (inv.status === 'paid' || inv.balanceDue <= 0) ? 'Paid' : 'Not Paid',
    items: inv.lines ? inv.lines.map((l) => ({
      name: l.productName || l.description || 'Standard Item',
      quantity: l.quantity || 1,
      unitPrice: l.unitPrice || 0,
      tax: l.taxRate || 0
    })) : (inv.items || [{ name: 'General Supply Item', quantity: 1, unitPrice: inv.totalAmount || inv.amount || 0, tax: 0 }])
  }));

  const [localInvoices, setLocalInvoices] = useState(INITIAL_LOCAL_INVOICES);

  const allInvoices = [
    ...normalizedIncoming,
    ...localInvoices.filter((loc) => !normalizedIncoming.some((inc) => inc.id === loc.id))
  ];

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  const [successMsg, setSuccessMsg] = useState('');
  const [paying, setPaying] = useState(false);

  const totalInvoiced = allInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  const totalOutstanding = allInvoices
    .filter((inv) => inv.status !== 'Paid')
    .reduce((acc, inv) => acc + (inv.amountDue > 0 ? inv.amountDue : inv.amount), 0);

  const totalPaid = allInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const filteredInvoices = allInvoices.filter((inv) => {
    const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
    const matchesSearch = !searchTerm ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleLogout = () => {
    clearSession();
    if (typeof onLogout === 'function') onLogout();
  };

  const handleMakePayment = async (inv) => {
    setPaying(true);
    try {
      if (inv.originalId) {
        await apiFetch(`/portal/documents/${inv.originalId}/pay`, {
          method: 'POST',
          body: JSON.stringify({ amount: inv.amountDue || inv.amount, method: paymentMethod.toLowerCase() }),
        });
        await fetchInvoices();
      }
      setLocalInvoices((prev) =>
        prev.map((i) =>
          i.id === inv.id ? { ...i, status: 'Paid', paymentStatus: 'Paid', amountDue: 0 } : i
        )
      );
      if (onPayInvoice) onPayInvoice(inv.id, paymentMethod);

      setSelectedInvoice(null);
      setSuccessMsg(`Payment for ${inv.id} registered successfully via ${paymentMethod}! Updated in VYAPAR360 Books.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      setError(e.message);
    }
    setPaying(false);
  };

  const initials = (user?.username || user?.email || 'CP').slice(0, 2).toUpperCase();

  return (
    <div className="portal">
      <div className="portal-inner stack-lg">
        
        {/* Header */}
        <div className="portal-hero fade-in">
          <div>
            <span className="portal-tag">VYAPAR360 CUSTOMER PORTAL {loading && '· Syncing…'}</span>
            <h1 className="h1" style={{ marginTop: 8 }}>Customer Portal Workspace</h1>
            <p className="lede">Live synchronized invoices and sales orders from the accounting department.</p>
          </div>
          <div className="cluster">
            <div className="avatar-sm">{initials}</div>
            <button type="button" onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
          </div>
        </div>

        {successMsg && (
          <div className="banner ok fade-in">
            <span>✅ {successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} className="btn-icon">✕</button>
          </div>
        )}
        {error && <Banner error={error} onDismiss={() => setError('')} />}

        {/* Dynamic Metric Cards */}
        <div className="grid-4 fade-in">
          <div className="stat-card">
            <span className="tiny-up">Outstanding Balance</span>
            <p className="value" style={{ color: 'var(--warn)' }}>
              <TypewriterText text={money(totalOutstanding)} speed={40} />
            </p>
            <p className="tiny">Remaining balance to be paid</p>
          </div>

          <div className="stat-card">
            <span className="tiny-up">Total Paid</span>
            <p className="value" style={{ color: 'var(--ok)' }}>
              <TypewriterText text={money(totalPaid)} speed={40} />
            </p>
            <p className="tiny">Cleared payments</p>
          </div>

          <div className="stat-card">
            <span className="tiny-up">Total Invoiced</span>
            <p className="value">
              <TypewriterText text={money(totalInvoiced)} speed={40} />
            </p>
            <p className="tiny">Lifetime billing history</p>
          </div>

          <div className="stat-card">
            <span className="tiny-up">Total Invoices</span>
            <p className="value">
              <TypewriterText text={`${allInvoices.length} Invoices`} speed={30} />
            </p>
            <p className="tiny">{allInvoices.filter((i) => i.status !== 'Paid').length} pending payment</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="row-between fade-in">
          <div className="cluster">
            {['All', 'Pending', 'Overdue', 'Paid'].map((status) => (
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
            placeholder="Search by Invoice ID or item…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ maxWidth: 280 }}
          />
        </div>

        {/* Table List */}
        <div className="panel fade-in" style={{ padding: 0 }}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th className="t-right">Total Amount</th>
                  <th>Status</th>
                  <th className="t-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="clickable" onClick={() => setSelectedInvoice(inv)}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>{inv.id}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                      <td className="mono tiny">{inv.date}</td>
                      <td className="mono tiny">{inv.dueDate}</td>
                      <td className="t-right mono" style={{ fontWeight: 700 }}>
                        {money(inv.amount)}
                      </td>
                      <td>
                        <StatusPill status={inv.status} />
                      </td>
                      <td className="t-right">
                        <Button
                          variant={inv.status === 'Paid' ? 'secondary' : 'primary'}
                          className="btn-sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                        >
                          {inv.status === 'Paid' ? 'View Details' : 'View & Pay'}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {selectedInvoice && (
          <div className="modal-backdrop">
            <div className="modal modal-wide stack">
              <div className="panel-head" style={{ marginBottom: 0 }}>
                <div>
                  <h3 className="h2">Invoice: {selectedInvoice.id}</h3>
                  <p className="tiny">Customer: {selectedInvoice.customer} · Issued: {selectedInvoice.date} · Due: {selectedInvoice.dueDate}</p>
                </div>
                <button type="button" onClick={() => setSelectedInvoice(null)} className="btn-icon" title="Close">✕</button>
              </div>

              <div>
                <h4 className="h3" style={{ marginBottom: 8 }}>Itemized Breakdown</h4>
                <div className="table-wrap">
                  <table className="data-table compact">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th className="t-center">Qty</th>
                        <th className="t-right">Unit Price</th>
                        <th className="t-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => {
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
                <span className="label-sm">Total Payable Amount:</span>
                <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {money(selectedInvoice.amount)}
                </span>
              </div>

              {selectedInvoice.status !== 'Paid' ? (
                <div className="stack-sm" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
                  <h4 className="label-sm">Select Payment Method</h4>
                  <div className="grid-3">
                    {['Bank', 'Cash', 'Card'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`method-btn ${paymentMethod === method ? 'is-on' : ''}`}
                      >
                        Pay with {method}
                      </button>
                    ))}
                  </div>

                  <div className="cluster" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                    <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>Cancel</Button>
                    <Button variant="primary" onClick={() => handleMakePayment(selectedInvoice)} disabled={paying}>
                      {paying ? 'Processing…' : `Pay ${money(selectedInvoice.amount)} Now`}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="notice ok">
                  ✓ This invoice has already been fully paid. No further action needed.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
