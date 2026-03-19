'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, Trash2, Search, Filter, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  subscribeToProducts,
  deleteProduct,
  updateProduct,
  type FirestoreProduct,
} from '@/lib/firestore/productService';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete product. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, []);

  const handleToggleFeatured = useCallback(async (product: FirestoreProduct) => {
    try {
      await updateProduct(product.id, { isFeatured: !product.isFeatured });
      toast.success(`${product.isFeatured ? 'Removed from' : 'Added to'} featured.`);
    } catch (err) {
      toast.error('Failed to update product.');
      console.error(err);
    }
  }, []);

  const handleToggleInStock = useCallback(async (product: FirestoreProduct) => {
    try {
      await updateProduct(product.id, { inStock: !product.inStock });
      toast.success(`Product marked as ${product.inStock ? 'out of stock' : 'in stock'}.`);
    } catch (err) {
      toast.error('Failed to update product.');
      console.error(err);
    }
  }, []);

  return (
    <div>
      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="bg-white border border-gray-200 p-8 max-w-sm w-full relative z-10 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action is permanent and cannot be undone. The product will immediately disappear from your store.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-gray-200 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 bg-red-600 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDeleteId ? <Loader2 size={14} className="animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Products Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${products.length} products — live from Firestore`}
          </p>
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
              placeholder="Search by name, category, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50 hover:border-black transition-colors w-full sm:w-auto justify-center">
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-xl font-light uppercase tracking-widest text-gray-400 mb-2">
                {searchTerm ? 'No results found' : 'No Products Yet'}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                {searchTerm ? 'Try a different search term.' : 'Add your first product to get started.'}
              </p>
              {!searchTerm && (
                <Link href="/admin/products/new" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                  + Add First Product
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Featured</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => {
                  const status = prod.inStock ? 'Active' : 'Out of Stock';
                  return (
                    <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-12 relative bg-gray-100 flex-shrink-0 overflow-hidden">
                            {prod.images[0] ? (
                              <Image src={prod.images[0]} alt={prod.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">IMG</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-black">{prod.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                              ID: {prod.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleInStock(prod)}
                          className={cn(
                            'inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-70',
                            status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          )}
                          title="Click to toggle stock status"
                        >
                          {status}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleFeatured(prod)}
                          title={prod.isFeatured ? 'Remove from featured' : 'Add to featured'}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            prod.isFeatured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                          )}
                        >
                          <Star size={16} className={prod.isFeatured ? 'fill-current' : ''} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{prod.stock} in stock</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{prod.category}</td>
                      <td className="px-6 py-4 text-gray-900 text-right font-medium">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-3 justify-end">
                          <Link
                            href={`/admin/products/new?edit=${prod.id}`}
                            className="text-gray-400 hover:text-black transition-colors"
                            title="Edit product"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => setConfirmDeleteId(prod.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="p-4 border-t border-gray-200 bg-[#F9F9F9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
