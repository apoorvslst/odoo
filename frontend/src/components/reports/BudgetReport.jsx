import React from 'react';
import { TrendingUp, Target, AlertCircle, FileText } from 'lucide-react';

/**
 * BudgetReport Component
 * 
 * Displays analytical project budgets comparison with visual progress bars,
 * committed targets, actual achieved numbers, and variances.
 */
export default function BudgetReport({ budgets = [] }) {
  const totalCommitted = budgets.reduce((acc, b) => acc + (parseFloat(b.committed) || 0), 0);
  const totalAchieved = budgets.reduce((acc, b) => acc + (parseFloat(b.achieved) || 0), 0);
  const overallPercentage = totalCommitted > 0 ? Math.min(Math.round((totalAchieved / totalCommitted) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Analytical Report
          </span>
          <h2 className="text-2xl font-extrabold text-[#0A2540] mt-2">Budget Variance Report</h2>
          <p className="text-sm text-slate-500">Track financial commitments versus actual achievements across projects.</p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
        >
          <FileText className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Committed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[#0A2540] mt-2">${totalCommitted.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-1">Total planned budget</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Achieved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-[#0A2540] mt-2">${totalAchieved.toFixed(2)}</h3>
          <p className="text-xs text-slate-400 mt-1">Realized financial volume</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Overall Execution</span>
            <span className="text-sm font-extrabold text-[#635BFF]">{overallPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
            <div
              className="bg-[#635BFF] h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{budgets.length} active analytical projects</p>
        </div>
      </div>

      {/* Budget Comparison Table */}
      <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-base text-[#0A2540]">
          Project Performance Breakdown
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Budget ID & Name</th>
                <th className="px-6 py-3.5">Period</th>
                <th className="px-6 py-3.5 text-right">Committed ($)</th>
                <th className="px-6 py-3.5 text-right">Achieved ($)</th>
                <th className="px-6 py-3.5 text-right">Remaining ($)</th>
                <th className="px-6 py-3.5">Progress</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budgets.map((b, idx) => {
                const committed = parseFloat(b.committed) || 0;
                const achieved = parseFloat(b.achieved) || 0;
                const remaining = committed - achieved;
                const pct = committed > 0 ? Math.min(Math.round((achieved / committed) * 100), 100) : 0;

                return (
                  <tr key={b.id || idx} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#0A2540]">{b.name}</span>
                      <span className="block text-xs text-slate-400">ID: {b.id}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {b.start} to {b.end}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0A2540]">
                      ${committed.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      ${achieved.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${remaining >= 0 ? 'text-slate-600' : 'text-rose-600'}`}>
                      ${remaining.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#635BFF]'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                        b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {b.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
