import React, { useState } from 'react';

// ==========================================
// MOCK DATA: Initial customer invoices list
// ==========================================
const INITIAL_INVOICES = [
  {
    id: 'INV-2026-001',
    date: '2026-08-15',
    dueDate: '2026-08-30',
    items: [
      { name: 'Office Chair', quantity: 5, unitPrice: 120, tax: 18 },
      { name: 'Wooden Table', quantity: 1, unitPrice: 450, tax: 18 }
    ],
    amount: 1239.00,
    status: 'Overdue', // Options: 'Paid', 'Pending', 'Overdue'
  },
  {
    id: 'INV-2026-002',
    date: '2026-09-01',
    dueDate: '2026-09-15',
    items: [
      { name: 'Luxury Sofa Set', quantity: 1, unitPrice: 1500, tax: 18 }
    ],
    amount: 1770.00,
    status: 'Pending',
  },
  {
    id: 'INV-2026-003',
    date: '2026-07-10',
    dueDate: '2026-07-25',
    items: [
      { name: 'Dining Table', quantity: 1, unitPrice: 800, tax: 18 },
      { name: 'Chairs', quantity: 4, unitPrice: 100, tax: 18 }
    ],
    amount: 1416.00,
    status: 'Paid',
  }
];

export default function CustomerDashboard() {
  // ------------------------------------------
  // STATE MANAGEMENT (Simple and easy to track)
  // ------------------------------------------
  // 1. Store list of customer invoices
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);

  // 2. Filter state: 'All', 'Pending', 'Paid', 'Overdue'
  const [filterStatus, setFilterStatus] = useState('All');

  // 3. Search query state
  const [searchTerm, setSearchTerm] = useState('');

  // 4. Modal state for viewing invoice details & paying
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // 5. Selected payment method inside modal
  const [paymentMethod, setPaymentMethod] = useState('Bank');

  // 6. Simulation success alert message
  const [successMsg, setSuccessMsg] = useState('');

  // ------------------------------------------
  // CALCULATE DASHBOARD METRICS (Dynamic Totals)
  // ------------------------------------------
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  
  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((acc, inv) => acc + inv.amount, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((acc, inv) => acc + inv.amount, 0);

  // ------------------------------------------
  // FILTER & SEARCH INVOICES
  // ------------------------------------------
  const filteredInvoices = invoices.filter(inv => {
    // Filter by status tab
    const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
    // Filter by search text (ID or Item name)
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // ------------------------------------------
  // HANDLER: REGISTER PAYMENT (Simulates making a payment)
  // ------------------------------------------
  const handleMakePayment = (invoiceId) => {
    // Update invoice status from 'Pending'/'Overdue' to 'Paid'
    setInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv
      )
    );

    // Close the modal
    setSelectedInvoice(null);

    // Display temporary success banner
    setSuccessMsg(`Payment for ${invoiceId} registered successfully via ${paymentMethod}!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ------------------------------------------
  // RENDER UI
  // ------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. TOP HEADER & CUSTOMER PROFILE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Customer Portal
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Welcome back, Nimesh Pathak</h1>
            <p className="text-sm text-gray-500">Email: nimesh@example.com | Contact ID: CUST-8092</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
              NP
            </div>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-800 hover:text-emerald-900">×</button>
          </div>
        )}

        {/* 2. DASHBOARD KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Outstanding Balance */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
            <h2 className="text-2xl font-extrabold text-amber-600 mt-1">
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Amount remaining to be paid</p>
          </div>

          {/* Card 2: Total Paid */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Paid</p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Cleared payments</p>
          </div>

          {/* Card 3: Total Invoiced */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Invoiced</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
              ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Lifetime billing history</p>
          </div>

          {/* Card 4: Total Invoices Count */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Invoices</p>
            <h2 className="text-2xl font-extrabold text-indigo-600 mt-1">
              {invoices.length} Records
            </h2>
            <p className="text-xs text-gray-400 mt-1">{invoices.filter(i => i.status === 'Pending').length} pending action</p>
          </div>
        </div>

        {/* 3. CONTROLS: FILTERS & SEARCH */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Status Tabs */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['All', 'Pending', 'Overdue', 'Paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search by Invoice ID or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 4. INVOICES LIST TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">
            My Invoices & Bills
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Issue Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-indigo-600">{inv.id}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.dueDate}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ${inv.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {/* Status Badges */}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors ${
                            inv.status === 'Paid'
                              ? 'bg-gray-700 hover:bg-gray-800'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {inv.status === 'Paid' ? 'View Details' : 'View & Pay'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. INVOICE DETAIL & PAYMENT MODAL */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invoice: {selectedInvoice.id}</h3>
                  <p className="text-xs text-gray-500">Issued on {selectedInvoice.date} | Due on {selectedInvoice.dueDate}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Itemized Breakdown</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3">Tax Rate</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedInvoice.items.map((item, idx) => {
                        const itemSubtotal = item.quantity * item.unitPrice * (1 + item.tax / 100);
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-medium text-gray-800">{item.name}</td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">${item.unitPrice.toFixed(2)}</td>
                            <td className="p-3">{item.tax}%</td>
                            <td className="p-3 text-right font-semibold">${itemSubtotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand Total Summary */}
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Payable Amount:</span>
                <span className="text-xl font-extrabold text-indigo-600">
                  ${selectedInvoice.amount.toFixed(2)}
                </span>
              </div>

              {/* Payment Section (If not already paid) */}
              {selectedInvoice.status !== 'Paid' ? (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700">Select Payment Method</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['Bank', 'Cash', 'Card'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 text-xs font-medium border rounded-lg flex flex-col items-center gap-1 ${
                          paymentMethod === method
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{method === 'Bank' ? '🏦' : method === 'Cash' ? '💵' : '💳'}</span>
                        {method} Transfer
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="w-1/2 py-2.5 px-4 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleMakePayment(selectedInvoice.id)}
                      className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                    >
                      Pay ${selectedInvoice.amount.toFixed(2)} Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg text-center font-medium">
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
