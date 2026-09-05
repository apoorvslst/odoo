import { useState } from 'react'
import CustomerDashboard from './components/CustomerDashboard'
import VendorDashboard from './components/VendorDashboard'
import AccountantDashboard from './components/AccountantDashboard'

// Shared MOCK_DATA used across all three dashboards
// This lives at the App level so accountant operations (creating invoices/bills)
// are immediately visible in the Customer and Vendor portals.
const MOCK_DATA = {
  contacts: [
    { id: 1, name: 'Acme Corp', email: 'billing@acme.com', phone: '555-0101', type: 'Customer', address: '123 Business St, New York, NY' },
    { id: 2, name: 'TechSupplies Inc', email: 'sales@techsupplies.com', phone: '555-0202', type: 'Vendor', address: '456 Tech Ave, San Francisco, CA' },
    { id: 3, name: 'Mr. Rahul', email: 'rahul@example.com', phone: '555-0303', type: 'Customer', address: '789 Market Rd, Mumbai, IN' }
  ],
  products: [
    { id: 1, name: 'Consulting Services', type: 'Service', category: 'Professional', price: 150, cost: 0 },
    { id: 2, name: 'Server Rack', type: 'Goods', category: 'Hardware', price: 1200, cost: 800 },
    { id: 3, name: 'Software License', type: 'Service', category: 'Software', price: 2000, cost: 200 }
  ],
  chartOfAccounts: [
    { id: '1001', name: 'Main Bank Account', type: 'Asset' },
    { id: '1002', name: 'Accounts Receivable (Debtors)', type: 'Asset' },
    { id: '2001', name: 'Accounts Payable (Creditors)', type: 'Liability' },
    { id: '3001', name: 'Owner Equity', type: 'Equity/Capital' },
    { id: '4001', name: 'Sales Revenue', type: 'Income' },
    { id: '5001', name: 'Purchase Expense', type: 'Expense' },
    { id: '5002', name: 'Office Supplies', type: 'Expense' }
  ],
  journals: [
    { id: 'J01', name: 'Customer Invoices', type: 'Sales', defaultAccount: '4001' },
    { id: 'J02', name: 'Vendor Bills', type: 'Purchase', defaultAccount: '5001' },
    { id: 'J03', name: 'Bank Operations', type: 'Bank', defaultAccount: '1001' }
  ],
  journalEntries: [
    { 
      id: 'JE-001', date: '2026-09-01', number: 'INV/2026/0001', partner: 'Mr. Rahul', journal: 'Customer Invoices', total: 6000,
      lines: [
        { accountId: '1002', debit: 6000, credit: 0 },
        { accountId: '4001', debit: 0, credit: 6000 }
      ]
    }
  ],
  salesOrders: [
    { id: 'SO0001', customer: 'Mr. Rahul', date: '2026-09-02', status: 'Confirmed', total: 6000, lines: [{ product: 'Software License', analytics: 'Project 1', qty: 3, unitPrice: 2000, total: 6000 }] },
    { id: 'SO0002', customer: 'Acme Corp', date: '2026-09-01', status: 'Draft', total: 450, lines: [{ product: 'Consulting Services', analytics: 'Project Alpha', qty: 3, unitPrice: 150, total: 450 }] }
  ],
  customerInvoices: [
    {
      id: 'INV-001', invoiceNo: 'INV/2026/0001', customer: 'Mr. Rahul', status: 'Confirmed', invoiceReference: 'SO0001',
      invoiceDate: '2026-09-02', dueDate: '2026-10-02', amountDue: 6000, total: 6000, paymentStatus: 'Not Paid',
      lines: [{ product: 'Software License', coa: '4001', analytics: 'Project 1', qty: 3, unitPrice: 2000, total: 6000 }]
    }
  ],
  purchaseOrders: [
    { 
      id: 'PO-201', vendor: 'TechSupplies Inc', date: '2026-09-03', status: 'Confirmed', total: 2400, 
      lines: [{ product: 'Server Rack', analytics: 'Q3 IT Operations', qty: 2, unitPrice: 1200, total: 2400 }] 
    }
  ],
  vendorBills: [
    {
      id: 'VB-001', billNo: 'VB/2026/0001', vendor: 'TechSupplies Inc', status: 'Confirmed', billReference: 'PO-201',
      billDate: '2026-09-03', dueDate: '2026-10-03', amountDue: 2400, total: 2400, paymentStatus: 'Not Paid',
      lines: [{ product: 'Server Rack', coa: '5001', analytics: 'Q3 IT Operations', qty: 2, unitPrice: 1200, total: 2400 }]
    }
  ],
  receipts: [],
  payments: [],
  budgets: [
    { id: 'B-Q3', name: 'Project 1', start: '2026-07-01', end: '2026-09-30', committed: 10000, achieved: 6000, status: 'Confirmed' }
  ]
};

function App() {
  // Role-based view: 'accountant' | 'customer' | 'vendor'
  const [activeView, setActiveView] = useState('accountant')

  // Shared data state - lifted to App so all dashboards share the same data.
  // When the accountant creates invoices/bills, they appear in Customer/Vendor dashboards.
  const [data, setData] = useState(MOCK_DATA)

  // Payment handler triggered from Customer Portal
  const handleCustomerPayInvoice = (invoiceId) => {
    setData(prev => ({
      ...prev,
      customerInvoices: prev.customerInvoices.map(inv =>
        (inv.invoiceNo === invoiceId || inv.id === invoiceId)
          ? { ...inv, paymentStatus: 'Paid', amountDue: 0 }
          : inv
      )
    }))
  }

  // Update handler for vendor actions
  const handleVendorUpdateBill = (billId, updates) => {
    setData(prev => ({
      ...prev,
      vendorBills: prev.vendorBills.map(b =>
        (b.billNo === billId || b.id === billId)
          ? { ...b, ...updates }
          : b
      )
    }))
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Top role-switcher bar when in Customer or Vendor view */}
      {activeView !== 'accountant' && (
        <nav className="bg-[#0A2540] border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tight text-white">
              CorpBooks
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('accountant')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeView === 'accountant'
                  ? 'bg-[#635BFF] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              Accountant Panel
            </button>
            <button
              onClick={() => setActiveView('customer')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeView === 'customer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              Customer Portal
            </button>
            <button
              onClick={() => setActiveView('vendor')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeView === 'vendor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              Vendor Portal
            </button>
          </div>
        </nav>
      )}

      {/* Accountant view with floating navigation switcher */}
      {activeView === 'accountant' && (
        <>
          <div className="fixed top-3 right-4 z-50 flex gap-1.5">
            <button
              onClick={() => setActiveView('customer')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/90 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
            >
              Customer Portal
            </button>
            <button
              onClick={() => setActiveView('vendor')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/90 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
            >
              Vendor Portal
            </button>
          </div>
          <AccountantDashboard data={data} setData={setData} />
        </>
      )}

      {/* Customer Dashboard receives shared customerInvoices & salesOrders with payment sync */}
      {activeView === 'customer' && (
        <CustomerDashboard
          customerInvoices={data.customerInvoices}
          sharedInvoices={data.customerInvoices}
          salesOrders={data.salesOrders}
          onPayInvoice={handleCustomerPayInvoice}
        />
      )}

      {/* Vendor Dashboard receives shared vendorBills & purchaseOrders */}
      {activeView === 'vendor' && (
        <VendorDashboard
          vendorBills={data.vendorBills}
          sharedBills={data.vendorBills}
          purchaseOrders={data.purchaseOrders}
          onUpdateBill={handleVendorUpdateBill}
        />
      )}
    </div>
  )
}

export default App
