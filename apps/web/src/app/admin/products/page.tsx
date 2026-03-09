'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { Edit, Trash2, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminProductsPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your storefront inventory, pricing, and variants.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-white border border-gray-200">
        {/* Filters/Search Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F9F9F9]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              className="w-full border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50 hover:border-black transition-colors w-full sm:w-auto justify-center">
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Inventory</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_PRODUCTS.map((prod) => {
                // Determine mock status based on static assignment for now to fix TS error.
                // In full implementation, we'd check variant inventory.
                const stock = Math.floor(Math.random() * 100) + 10; // Mock stock count
                const status = stock > 0 ? 'Active' : 'Out of Stock';

                return (
                  <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-12 relative bg-gray-100 flex-shrink-0">
                          <Image src={prod.images[0]} alt={prod.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-black">{prod.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">SKU: GW-{prod.id.slice(0, 6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                        status === 'Active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{stock} in stock</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{prod.category}</td>
                    <td className="px-6 py-4 text-gray-900 text-right font-medium">₹{prod.price.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex gap-3 justify-end">
                          <button className="text-gray-400 hover:text-black transition-colors">
                            <Edit size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-gray-200 bg-[#F9F9F9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          <span>Showing 1 to {MOCK_PRODUCTS.length} of {MOCK_PRODUCTS.length} products</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors" disabled>Prev</button>
            <button className="px-4 py-2 border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
