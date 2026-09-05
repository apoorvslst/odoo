import React, { useState } from 'react';
import { ArrowLeft, Check, Layers } from 'lucide-react';

/**
 * ChartOfAccountsForm Component
 * 
 * Manages ledger accounts for the Chart of Accounts (CoA).
 * Allows creating and editing accounts with their classification types:
 * (Asset, Liability, Expense, Income, Capital / Equity).
 */
export default function ChartOfAccountsForm({ accountId, accounts = [], onSave, onBack }) {
  const existing = accounts.find(a => a.id === accountId);

  // STATE MANAGEMENT:
  // Tracks account code (id), human-readable name, and standard financial type
  const [formData, setFormData] = useState(existing || {
    id: '',
    name: '',
    type: 'Asset' // Options: Asset, Liability, Expense, Income, Capital / Equity
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      id: formData.id.trim() || String(Math.floor(1000 + Math.random() * 8999))
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_15px_35px_rgba(50,50,93,0.06)] border border-slate-200 overflow-hidden">
      {/* Action Header */}
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to CoA
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DF] rounded-xl shadow-[0_4px_12px_rgba(99,91,255,0.35)] transition cursor-pointer"
        >
          <Check className="w-4 h-4" /> {existing ? 'Update Account' : 'Save Account'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0A2540]">
              {existing ? `Edit Account: ${existing.name}` : 'New Chart of Account'}
            </h2>
            <p className="text-sm text-slate-500">
              Classify general ledger accounts for journal entries and financial statements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Code / ID */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Account Code (ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="e.g. 1001, 2001, 4001"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Account Name */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Main Bank Account, Sales Revenue"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Account Type Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            >
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
              <option value="Equity/Capital">Capital / Equity</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
