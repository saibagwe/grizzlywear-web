'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AddProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State Mock
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Men',
    stock: '',
  });

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault();
      setSizes([...sizes, e.currentTarget.value.trim().toUpperCase()]);
      e.currentTarget.value = '';
    }
  };

  const handleAddColor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault();
      setColors([...colors, e.currentTarget.value.trim()]);
      e.currentTarget.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Product added successfully!');
      router.push('/admin/products');
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new item in your catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
             <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Basic Information</h2>
             
             <div className="space-y-6">
               <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Product Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Oversized Heavyweight Hoodie"
                    className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
               </div>
               
               <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    required 
                    rows={6}
                    placeholder="Detailed description of the product..."
                    className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
               </div>
             </div>
          </div>

          {/* Media */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Media</h2>
            
            <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4 group-hover:border-black transition-colors">
                <Upload size={24} className="text-gray-400 group-hover:text-black transition-colors" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Upload product images</p>
              <p className="text-xs text-gray-500">Drag and drop or click to browse (PNG, JPG, WebP)</p>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8">
             <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Variants</h2>
             
             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Sizes</label>
                   <div className="w-full border border-gray-200 px-4 py-3 min-h-[50px] flex flex-wrap gap-2 focus-within:border-black transition-colors cursor-text">
                     {sizes.map(size => (
                       <span key={size} className="bg-gray-100 px-3 py-1 text-xs font-medium flex items-center gap-2">
                         {size} 
                         <button type="button" onClick={() => setSizes(sizes.filter(s => s !== size))}><X size={12} /></button>
                       </span>
                     ))}
                     <input 
                       type="text" 
                       placeholder="Type size and press Enter (e.g. S, M, L)"
                       className="flex-1 min-w-[200px] outline-none text-sm bg-transparent"
                       onKeyDown={handleAddSize}
                     />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Colors</label>
                   <div className="w-full border border-gray-200 px-4 py-3 min-h-[50px] flex flex-wrap gap-2 focus-within:border-black transition-colors cursor-text">
                     {colors.map(color => (
                       <span key={color} className="bg-gray-100 px-3 py-1 text-xs font-medium flex items-center gap-2 capitalize">
                         {color} 
                         <button type="button" onClick={() => setColors(colors.filter(c => c !== color))}><X size={12} /></button>
                       </span>
                     ))}
                     <input 
                       type="text" 
                       placeholder="Type color and press Enter (e.g. Black, Olive)"
                       className="flex-1 min-w-[200px] outline-none text-sm bg-transparent"
                       onKeyDown={handleAddColor}
                     />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8 mt-8 lg:mt-0">
          
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Pricing</h2>
            
            <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Price (₹) <span className="text-red-500">*</span></label>
               <input 
                 type="number" 
                 required 
                 min="0"
                 placeholder="0.00"
                 className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                 value={formData.price}
                 onChange={(e) => setFormData({...formData, price: e.target.value})}
               />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Organization</h2>
            
            <div className="space-y-6">
              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category <span className="text-red-500">*</span></label>
                 <div className="relative">
                   <select 
                     className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors appearance-none bg-white"
                     value={formData.category}
                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                   >
                     <option value="Men">Men</option>
                     <option value="Women">Women</option>
                     <option value="Accessories">Accessories</option>
                     <option value="New Arrivals">New Arrivals</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                     <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                   </div>
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Inventory <span className="text-red-500">*</span></label>
                 <input 
                   type="number" 
                   required 
                   min="0"
                   placeholder="Stock count"
                   className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                   value={formData.stock}
                   onChange={(e) => setFormData({...formData, stock: e.target.value})}
                 />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#F9F9F9] border border-gray-200 p-6 sticky top-28">
            <button 
              type="button"
              className="w-full border border-gray-200 bg-white text-black px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] mb-4 hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-50 flex justify-center"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : 'Publish Product'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
