import React, { useState } from 'react';
import { ArrowLeft, Check, Upload, User } from 'lucide-react';

/**
 * ContactForm Component
 * 
 * Manages creation and editing of Contact records (Customers, Vendors, or Both).
 * Uses useState to track individual form inputs and beginner-friendly structure.
 */
export default function ContactForm({ contactId, contacts = [], onSave, onBack }) {
  // Find existing contact if editing, otherwise set default initial state
  const existing = contacts.find(c => c.id === contactId || c.id === Number(contactId));

  // STATE MANAGEMENT:
  // We use useState to hold all contact field values in a single state object
  const [formData, setFormData] = useState(existing || {
    id: Date.now(),
    name: '',
    type: 'Customer', // Options: 'Customer', 'Vendor', 'Both'
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    image: null
  });

  // Image preview state for the profile picture upload
  const [imagePreview, setImagePreview] = useState(existing?.image || null);

  // Handle generic text/select input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image file upload & preview generation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Construct full address string if city/state/pincode are filled
    const fullAddress = formData.address || `${formData.city || ''}, ${formData.state || ''} ${formData.pincode || ''}`.trim();
    
    const contactToSave = {
      ...formData,
      address: fullAddress || '123 Business St'
    };

    onSave(contactToSave);
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
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5851DF] rounded-xl shadow-[0_4px_12px_rgba(99,91,255,0.35)] transition cursor-pointer"
        >
          <Check className="w-4 h-4" /> {existing ? 'Update Contact' : 'Save Contact'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-[#0A2540]">
            {existing ? `Edit Contact: ${existing.name}` : 'New Contact Master'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Fill in contact details, partner type, address and profile image.
          </p>
        </div>

        {/* Profile Image & Contact Type Section */}
        <div className="flex flex-col sm:flex-row gap-8 items-start pb-6 border-b border-slate-100">
          {/* Profile Image Upload Box */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center relative group">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
              <label className="absolute inset-0 bg-black/40 text-white text-xs font-semibold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Upload className="w-5 h-5 mb-1" />
                Change
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            <span className="text-xs text-slate-500 font-medium">Profile Image</span>
          </div>

          {/* Contact Type: Customer / Vendor / Both */}
          <div className="flex-1 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Partner Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {['Customer', 'Vendor', 'Both'].map((typeOption) => (
                <label
                  key={typeOption}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition ${
                    formData.type === typeOption
                      ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={typeOption}
                    checked={formData.type === typeOption}
                    onChange={handleChange}
                    className="accent-[#635BFF]"
                  />
                  {typeOption}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp or John Doe"
              required
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="billing@example.com"
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
              Mobile / Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 0192"
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
            />
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider mb-4">
            Address Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0A2540]">
                Pincode / ZIP
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="10001"
                className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#635BFF]/30 focus:border-[#635BFF] outline-none transition"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
