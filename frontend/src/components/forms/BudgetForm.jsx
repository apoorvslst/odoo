import React, { useState } from 'react';
import { ArrowLeft, Check, TrendingUp } from 'lucide-react';

/**
 * BudgetForm Component
 * 
 * Manages Analytical Project Budgets.
 * Tracks Committed targets vs Achieved actuals for cost/revenue control.
 */
export default function BudgetForm({ budgetId, budgets = [], onSave, onBack }) {
  const existing = budgets.find(b => b.id === budgetId);

  // STATE MANAGEMENT:
  // Tracks budget ID, Project Name, Start/End dates, Committed and Achieved amounts
  const [formData, setFormData] = useState(existing || {
    id: `B-${Date.now().toString().slice(-4)}`,
    name: '',
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 90*86400000).toISOString().split('T')[0],
    committed: '',
    achieved: '',
    status: 'Draft' // Options: 'Draft', 'Confirmed'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'committed' || name === 'achieved' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      committed: parseFloat(formData.committed) || 0,
      achieved: parseFloat(formData.achieved) || 0,
      status: formData.status || 'Confirmed'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Budgets
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DF] rounded-xl shadow-[0_4px_12px_rgba(99,91,255,0.35)] transition cursor-pointer"
        >
          <Check className="w-4 h-4" /> {existing ? 'Update Budget' : 'Save Budget'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0A2540]">
              {existing ? `Edit Analytical Budget: ${existing.name}` : 'New Analytical Project Budget'}
            </h2>
            <p className="text-sm text-slate-500">
              Set planned spending/revenue targets against actual performance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project / Budget Name */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Budget / Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Project Alpha, Q3 IT Operations"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Start Date */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start"
              value={formData.start}
              onChange={handleChange}
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="end"
              value={formData.end}
              onChange={handleChange}
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Committed Amount */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Committed Budget ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="committed"
              value={formData.committed}
              onChange={handleChange}
              placeholder="10000.00"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Achieved Amount */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Achieved to Date ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="achieved"
              value={formData.achieved}
              onChange={handleChange}
              placeholder="0.00"
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            >
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
