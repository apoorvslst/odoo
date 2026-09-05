import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';

/**
 * ProfitLossReport Component
 * 
 * Generates an automated Profit and Loss (P&L) financial statement
 * based on confirmed Customer Invoices (Income) and Vendor Bills (Expenses).
 */
export default function ProfitLossReport({ customerInvoices = [], vendorBills = [], chartOfAccounts = [] }) {
  // Calculate total income from confirmed customer invoices
  const totalIncome = customerInvoices
    .filter(i => i.status === 'Confirmed')
    .reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);

  // Calculate total expenses from confirmed vendor bills
  const totalExpense = vendorBills
    .filter(b => b.status === 'Confirmed')
    .reduce((acc, b) => acc + (parseFloat(b.total) || 0), 0);

  const netProfit = totalIncome - totalExpense;
  const marginPercentage = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#635BFF] bg-[#635BFF]/10 px-3 py-1 rounded-full">
            Financial Statement
          </span>
          <h2 className="text-2xl font-extrabold text-[#0A2540] mt-2">Profit and Loss Statement</h2>
          <p className="text-sm text-slate-500">Live summary of revenues, cost of sales, and operating expenses.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Operating Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[#0A2540] mt-2">${totalIncome.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-1">From {customerInvoices.filter(i => i.status === 'Confirmed').length} confirmed sales invoices</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Operating Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[#0A2540] mt-2">${totalExpense.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-1">From {vendorBills.filter(b => b.status === 'Confirmed').length} confirmed vendor bills</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Net Operating Income</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#635BFF] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-3xl font-extrabold mt-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${netProfit.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Net Margin: {marginPercentage}%</p>
        </div>
      </div>

      {/* Detailed Ledger Breakdown */}
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-base text-[#0A2540]">
          Statement Line Items
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Account Code & Name</th>
                <th className="px-6 py-3.5">Classification</th>
                <th className="px-6 py-3.5 text-right">Debit ($)</th>
                <th className="px-6 py-3.5 text-right">Credit ($)</th>
                <th className="px-6 py-3.5 text-right">Net Balance ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-emerald-50/40">
                <td className="px-6 py-4 font-bold text-[#0A2540]">4001 - Sales Revenue</td>
                <td className="px-6 py-4 font-medium text-emerald-700">Income</td>
                <td className="px-6 py-4 text-right text-slate-600">$0.00</td>
                <td className="px-6 py-4 text-right text-emerald-700 font-bold">${totalIncome.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-emerald-700 font-extrabold">+${totalIncome.toFixed(2)}</td>
              </tr>
              <tr className="bg-rose-50/40">
                <td className="px-6 py-4 font-bold text-[#0A2540]">5001 - Purchase Expense</td>
                <td className="px-6 py-4 font-medium text-rose-700">Expense</td>
                <td className="px-6 py-4 text-right text-rose-700 font-bold">${totalExpense.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-slate-600">$0.00</td>
                <td className="px-6 py-4 text-right text-rose-700 font-extrabold">-${totalExpense.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-base text-[#0A2540]">Net Profit / (Loss)</td>
                <td className={`px-6 py-4 text-right text-lg font-extrabold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${netProfit.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
