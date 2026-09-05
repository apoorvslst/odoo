import React, { useState } from 'react';
import { ArrowLeft, Check, Package } from 'lucide-react';

/**
 * ProductForm Component
 * 
 * Manages creation and editing of Product Master data.
 * Explains useState hooks clearly for beginners.
 */
export default function ProductForm({ productId, products = [], onSave, onBack }) {
  // Find existing product if in edit mode
  const existing = products.find(p => p.id === productId || p.id === Number(productId));

  // STATE MANAGEMENT:
  // Store form field values: name, type, category, price, cost
  const [formData, setFormData] = useState(existing || {
    id: Date.now(),
    name: '',
    type: 'Goods', // Dropdown options: 'Goods', 'Service', 'Combo'
    category: 'Hardware', // Dropdown categories
    price: '',
    cost: ''
  });

  // Handle generic form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'cost' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0
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
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DF] rounded-xl shadow-[0_4px_12px_rgba(99,91,255,0.35)] transition cursor-pointer"
        >
          <Check className="w-4 h-4" /> {existing ? 'Update Product' : 'Save Product'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#635BFF] flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0A2540]">
              {existing ? `Edit Product: ${existing.name}` : 'New Product Master'}
            </h2>
            <p className="text-sm text-slate-500">
              Configure product details, categorization, sales price, and cost.
            </p>
          </div>
        </div>

        {/* Product Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Server Rack, Consulting Services"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Product Type (Dropdown: Goods, Service, Combo) */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Product Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            >
              <option value="Goods">Goods (Physical Stock)</option>
              <option value="Service">Service</option>
              <option value="Combo">Combo (Bundle)</option>
            </select>
          </div>
        </div>

        {/* Category & Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category Dropdown */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            >
              <option value="Professional">Professional</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>

          {/* Sales Price (Number) */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Sales Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          {/* Cost / Purchase Price (Number) */}
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Cost / Purchase Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              placeholder="0.00"
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
