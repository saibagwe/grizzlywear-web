/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useAddressStore, Address } from '@/store/addressStore';
import { MapPin, Pencil, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry', 'Lakshadweep',
  'Andaman & Nicobar Islands', 'Dadra & Nagar Haveli', 'Daman & Diu',
];

const emptyForm = { label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

type FormData = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormData, string>>;

export default function AddressesPage() {
  const { addresses, addAddress, updateAddress, deleteAddress, setDefault } = useAddressStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setErrors({}); setShowModal(true); };
  const openEdit = (addr: Address) => {
    setForm({ label: addr.label, name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
    setEditingId(addr.id);
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit phone number';
    if (!form.line1.trim()) e.line1 = 'Address line 1 is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode.replace(/\s/g, ''))) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = { ...form, phone: form.phone.replace(/\s/g, ''), pincode: form.pincode.replace(/\s/g, '') };
    if (editingId) {
      updateAddress(editingId, data);
    } else {
      addAddress(data);
    }
    setShowModal(false);
    toast.success('Address saved successfully');
  };

  const handleDelete = (id: string) => {
    deleteAddress(id);
    setShowDeleteConfirm(null);
    toast.success('Address deleted');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-light uppercase tracking-tight mb-1">My Addresses</h1>
            <p className="text-sm text-gray-500">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-black text-white px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add New Address
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-gray-200 p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest">{addr.label}</span>
                {addr.isDefault && (
                  <span className="bg-black text-white text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold">Default</span>
                )}
              </div>
              <div className="text-sm text-gray-700 space-y-1 mb-6">
                <p className="font-medium text-black">{addr.name}</p>
                <p>{addr.phone}</p>
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{addr.city}, {addr.state} {addr.pincode}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={() => openEdit(addr)} className="flex items-center gap-1 uppercase tracking-widest font-bold hover:text-black text-gray-500 transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setShowDeleteConfirm(addr.id)} className="flex items-center gap-1 uppercase tracking-widest font-bold hover:text-red-600 text-gray-500 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                {!addr.isDefault && (
                  <button onClick={() => { setDefault(addr.id); toast.success('Default address updated'); }} className="uppercase tracking-widest font-bold hover:text-black text-gray-400 transition-colors ml-auto">
                    Set as Default
                  </button>
                )}
              </div>

              {/* Delete confirm */}
              {showDeleteConfirm === addr.id && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 border border-red-200">
                  <p className="text-sm font-medium mb-4 text-center">Are you sure you want to delete this address?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-black transition-colors">Cancel</button>
                    <button onClick={() => handleDelete(addr.id)} className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-8">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-light uppercase tracking-tight mb-6">{editingId ? 'Edit Address' : 'Add New Address'}</h2>

            <div className="space-y-5">
              {/* Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Label</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map((l) => (
                    <button key={l} onClick={() => setForm({ ...form, label: l })} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${form.label === l ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'}`}>
                      {l === 'Home' ? '🏠' : l === 'Office' ? '🏢' : '📍'} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {[
                { key: 'name' as const, label: 'Full Name *', placeholder: 'Full name' },
                { key: 'phone' as const, label: 'Phone Number * (10 digits)', placeholder: '9876543210' },
                { key: 'line1' as const, label: 'Address Line 1 *', placeholder: 'House/Flat no, Street' },
                { key: 'line2' as const, label: 'Address Line 2', placeholder: 'Landmark, Area (optional)' },
                { key: 'city' as const, label: 'City *', placeholder: 'City' },
                { key: 'pincode' as const, label: 'Pincode * (6 digits)', placeholder: '400001' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">{label}</label>
                  <input type="text" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" placeholder={placeholder} />
                  {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                </div>
              ))}

              {/* State */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">State *</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-white">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 accent-black" />
                <span className="text-xs uppercase tracking-widest font-bold">Set as default address</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:border-black transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors">Save Address</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
