'use client';

import Link from 'next/link';

// Mock Product Data for Admin Table
const MOCK_PRODUCTS = [
  { id: '1', name: 'Oversized Onyx Hoodie', status: 'Active', inventory: 145, category: 'Men', price: '₹3,499' },
  { id: '2', name: 'Essential Cargo Pants', status: 'Active', inventory: 89, category: 'Men', price: '₹4,299' },
  { id: '3', name: 'Technical Windbreaker', status: 'Draft', inventory: 0, category: 'Unisex', price: '₹5,999' },
  { id: '4', name: 'Heavyweight Graphic Tee', status: 'Active', inventory: 320, category: 'Men', price: '₹1,899' },
  { id: '5', name: 'Ribbed Knit Tank Top', status: 'Active', inventory: 210, category: 'Women', price: '₹1,299' },
  { id: '6', name: 'Parachute Skirt', status: 'Out of Stock', inventory: 0, category: 'Women', price: '₹2,899' },
];

export default function AdminProductsPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your storefront catalog and inventory.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors inline-flex items-center justify-center rounded-md"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Filters/Search Bar */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          />
          <button className="text-sm text-gray-600 border border-gray-300 bg-white px-4 py-2 rounded-md hover:bg-gray-50">
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Inventory</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_PRODUCTS.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      prod.status === 'Active' ? 'bg-green-100 text-green-700' :
                      prod.status === 'Draft' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {prod.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{prod.inventory} in stock</td>
                  <td className="px-6 py-4 text-gray-600">{prod.category}</td>
                  <td className="px-6 py-4 text-gray-900 text-right font-medium">{prod.price}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium mr-4">Edit</button>
                    <button className="text-red-400 hover:text-red-600 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to {MOCK_PRODUCTS.length} of {MOCK_PRODUCTS.length} products</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
