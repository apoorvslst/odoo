import React, { useState, useEffect } from 'react';

// Sample data for fallback vendor purchase bills
const INITIAL_BILLS = [
  {
    id: 'BILL-101',
    poReference: 'PO-005',
    date: '2026-08-20',
    dueDate: '2026-09-05',
    items: [
      { name: 'Raw Teak Wood', quantity: 20, unitPrice: 150, tax: 18 },
      { name: 'Steel Joints', quantity: 50, unitPrice: 10, tax: 18 }
    ],
    amount: 4130.00,
    status: 'Pending',
  },
  {
    id: 'BILL-102',
    poReference: 'PO-008',
    date: '2026-09-01',
    dueDate: '2026-09-20',
    items: [
      { name: 'Sofa Fabrics & Foam', quantity: 10, unitPrice: 300, tax: 18 }
    ],
    amount: 3540.00,
    status: 'Pending',
  },
  {
    id: 'BILL-099',
    poReference: 'PO-001',
    date: '2026-07-15',
    dueDate: '2026-07-30',
    items: [
      { name: 'Plywood Sheets', quantity: 40, unitPrice: 40, tax: 18 }
    ],
    amount: 1888.00,
    status: 'Paid',
  }
];

const PAGE_SIZE = 10;

export default function VendorDashboard({ onLogout }) {
  const [bills, setBills] = useState(INITIAL_BILLS);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  // Load live vendor bills from backend portal API
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    fetch('/api/portal/documents?kind=bill', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(doc => ({
            id: `BILL-${doc.id}`,
            backendId: doc.id,
            poReference: `PO-${doc.id}`,
            date: doc.date,
            dueDate: doc.dueDate || '—',
            items: [],
            amount: Number(doc.totalAmount || 0),
            paid: Number(doc.paid || 0),
            balanceDue: Number(doc.balanceDue || 0),
            status: doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : 'Pending',
          }));
          setBills(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  // Calculate metrics
  const totalReceivable = bills
    .filter(bill => bill.status !== 'Paid')
    .reduce((acc, bill) => acc + bill.amount, 0);

  const totalReceived = bills
    .filter(bill => bill.status === 'Paid')
    .reduce((acc, bill) => acc + bill.amount, 0);

  const totalBilled = bills.reduce((acc, bill) => acc + bill.amount, 0);

  // Filter bills based on search and status
  const filteredBills = bills.filter(bill => {
    const matchesStatus = filterStatus === 'All' || bill.status === filterStatus;
    const matchesSearch = bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.poReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.items || []).some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
  const paginatedBills = filteredBills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Mark bill payment request
  const handleRequestPayment = (billId) => {
    setMessage(`Payment reminder sent for ${billId} to Urban Furniture Accountant.`);
    setSelectedBill(null);
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Vendor Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Vendor Portal {isLoading && '• Syncing...'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {currentUser.username || currentUser.name || 'Vendor Partner'}
            </h1>
            <p className="text-sm text-gray-500">
              Email: {currentUser.email || 'vendor@urbanfurniture.com'} | Vendor ID: #{currentUser.contactId || 'PORTAL'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
              {(currentUser.username || currentUser.name || 'V').charAt(0).toUpperCase()}
            </div>
            {typeof onLogout === 'function' && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Notification Banner */}
        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>ℹ️ {message}</span>
            <button onClick={() => setMessage('')} className="font-bold text-blue-800">×</button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Pending Payment to Receive */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Payment Due from Buyer</p>
            <h2 className="text-2xl font-extrabold text-amber-600 mt-1">
              ${totalReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Awaiting settlement</p>
          </div>

          {/* Card 2: Received Payments */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Received</p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">
              ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Cleared transactions</p>
          </div>

          {/* Card 3: Total Sales Billed */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Billed</p>
            <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
              ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-gray-400 mt-1">Gross supply orders</p>
          </div>

          {/* Card 4: Orders Count */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Bills / POs</p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {bills.length} Orders
            </h2>
            <p className="text-xs text-gray-400 mt-1">{bills.filter(b => b.status === 'Pending').length} pending payment</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {['All', 'Pending', 'Paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search by Bill ID, PO, or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Vendor Bills Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">
            Vendor Bills & Purchase Orders
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Bill ID</th>
                  <th className="px-6 py-3">PO Ref</th>
                  <th className="px-6 py-3">Bill Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBills.length > 0 ? (
                  paginatedBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-emerald-600">{bill.id}</td>
                      <td className="px-6 py-4 text-gray-600">{bill.poReference}</td>
                      <td className="px-6 py-4 text-gray-600">{bill.date}</td>
                      <td className="px-6 py-4 text-gray-600">{bill.dueDate}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ${bill.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          bill.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                          View Bill Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      No vendor bills match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          {filteredBills.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/70 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Showing page {currentPage} of {totalPages} ({filteredBills.length} bills)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bill Detail Modal */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full p-6 space-y-5">
              
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Bill: {selectedBill.id}</h3>
                  <p className="text-xs text-gray-500">PO Reference: {selectedBill.poReference} | Date: {selectedBill.date}</p>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Supplied Items Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Supplied Line Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Unit Cost</th>
                        <th className="p-3">Tax Rate</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedBill.items.map((item, idx) => {
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

              {/* Total Amount Summary */}
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Billed Amount:</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  ${selectedBill.amount.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="w-1/2 py-2.5 px-4 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>

                {selectedBill.status !== 'Paid' && (
                  <button
                    onClick={() => handleRequestPayment(selectedBill.id)}
                    className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                  >
                    Send Payment Reminder
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
