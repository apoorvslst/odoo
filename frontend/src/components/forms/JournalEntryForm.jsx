import React, { useState } from 'react';
import { ArrowLeft, Check, Plus, AlertCircle, FileSpreadsheet } from 'lucide-react';

/**
 * JournalEntryForm Component
 * 
 * Manages double-entry bookkeeping Journal Entries.
 * Enforces fundamental accounting rule: Total Debit MUST equal Total Credit.
 */
export default function JournalEntryForm({ entryId, entries = [], journals = [], chartOfAccounts = [], contacts = [], onSave, onBack }) {
  const existing = entries.find(e => e.id === entryId || e.number === entryId);

  // STATE MANAGEMENT:
  // Tracks entry metadata and an array of balanced debit/credit lines
  const [formData, setFormData] = useState(existing || {
    id: `JE-${Date.now()}`,
    number: `MISC/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    partner: '',
    journal: journals[0]?.name || 'Customer Invoices',
    total: 0,
    lines: [
      { accountId: chartOfAccounts[0]?.id || '1001', debit: 0, credit: 0 },
      { accountId: chartOfAccounts[1]?.id || '4001', debit: 0, credit: 0 }
    ]
  });

  const [validationError, setValidationError] = useState('');

  // Handle line item edits (debit/credit amount or account selection)
  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.lines];
    updatedLines[index][field] = field === 'accountId' ? value : (parseFloat(value) || 0);
    setFormData(prev => ({ ...prev, lines: updatedLines }));
    setValidationError('');
  };

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: chartOfAccounts[0]?.id || '1001', debit: 0, credit: 0 }]
    }));
  };

  const removeLine = (index) => {
    if (formData.lines.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  // Compute total debits and credits
  const totalDebit = formData.lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) {
      setValidationError(`Debit ($${totalDebit.toFixed(2)}) must equal Credit ($${totalCredit.toFixed(2)}) to balance the books.`);
      return;
    }

    onSave({
      ...formData,
      total: totalDebit
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
          <ArrowLeft className="w-4 h-4" /> Back to Journal Entries
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isBalanced}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DF] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-[0_4px_12px_rgba(99,91,255,0.35)] transition cursor-pointer"
        >
          <Check className="w-4 h-4" /> {existing ? 'Update Entry' : 'Post Journal Entry'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0A2540]">
              {existing ? `Journal Entry: ${existing.number}` : 'New Manual Journal Entry'}
            </h2>
            <p className="text-sm text-slate-500">
              Record debit and credit ledger transactions across the Chart of Accounts.
            </p>
          </div>
        </div>

        {validationError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">Entry Number</label>
            <input
              type="text"
              value={formData.number}
              disabled
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Accounting Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">Journal</label>
            <select
              value={formData.journal}
              onChange={e => setFormData({ ...formData, journal: e.target.value })}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            >
              {journals.map(j => <option key={j.id} value={j.name}>{j.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">Partner (Optional)</label>
            <select
              value={formData.partner}
              onChange={e => setFormData({ ...formData, partner: e.target.value })}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            >
              <option value="">No Partner Selected</option>
              {contacts.map(c => <option key={c.id} value={c.name}>{c.name} ({c.type})</option>)}
            </select>
          </div>
        </div>

        {/* Double-Entry Ledger Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-[#0A2540]">Journal Lines (Debit / Credit)</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Account</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-44">Debit ($)</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-44">Credit ($)</th>
                  <th className="px-4 py-3.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.lines.map((line, idx) => (
                  <tr key={idx} className="bg-white hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <select
                        value={line.accountId}
                        onChange={e => handleLineChange(idx, 'accountId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white outline-none"
                      >
                        {chartOfAccounts.map(coa => (
                          <option key={coa.id} value={coa.id}>
                            {coa.id} - {coa.name} ({coa.type})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit || ''}
                        placeholder="0.00"
                        onChange={e => handleLineChange(idx, 'debit', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50 focus:bg-white outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit || ''}
                        placeholder="0.00"
                        onChange={e => handleLineChange(idx, 'credit', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl text-right bg-slate-50/50 focus:bg-white outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={formData.lines.length <= 2}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 cursor-pointer font-bold"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td className="px-4 py-4 text-slate-700">Total Balance</td>
                  <td className="px-4 py-4 text-right text-[#0A2540]">${totalDebit.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-[#0A2540]">${totalCredit.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Ledger Line
          </button>
        </div>
      </form>
    </div>
  );
}
