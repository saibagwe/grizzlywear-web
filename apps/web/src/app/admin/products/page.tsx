'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Star, 
  Loader2, 
  Plus, 
  LayoutGrid, 
  Table as TableIcon,
  ChevronDown,
  Package,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  subscribeToProducts,
  deleteProduct,
  updateProduct,
  type FirestoreProduct,
} from '@/lib/firestore/productService';

// ─── SKELETON LOADERS ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
      <div className="aspect-[4/5] bg-[var(--bg)] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-[var(--bg)] animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-[var(--bg)]/50 animate-pulse rounded" />
        <div className="h-5 w-1/3 bg-[var(--bg)] animate-pulse rounded-full" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-4"><div className="w-12 h-16 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-32 bg-[var(--bg)] animate-pulse rounded mb-2" /><div className="h-3 w-20 bg-[var(--bg)]/50 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-5 w-16 bg-[var(--bg)] animate-pulse rounded-full" /></td>
      <td className="px-6 py-4"><div className="h-4 w-12 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-6 py-4 text-right"><div className="h-4 w-16 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
      <td className="px-6 py-4 text-right"><div className="h-8 w-20 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
    </tr>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });
    
    // Remember view preference
    const savedMode = localStorage.getItem('product-view-preference');
    if (savedMode === 'grid' || savedMode === 'table') setViewMode(savedMode);
    
    return () => unsub();
  }, []);

  const handleViewToggle = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('product-view-preference', mode);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }, []);

  const handleToggleFeatured = useCallback(async (product: FirestoreProduct) => {
    try {
      await updateProduct(product.id, { isFeatured: !product.isFeatured });
      toast.success(product.isFeatured ? 'Removed from featured' : 'Added to featured');
    } catch {
      toast.error('Failed to update product');
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
      {/* ── Confirm Delete Modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in" onClick={() => setConfirmDeleteId(null)} />
          <div className="bg-[var(--bg-card)] rounded-2xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-6 mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">Delete Product?</h3>
            <p className="text-sm text-[var(--text-muted)] text-center mb-8">
              This action is permanent and will remove <span className="text-[var(--text-primary)] font-bold">"{products.find(p => p.id === confirmDeleteId)?.name}"</span> from your catalog.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-xl hover:bg-[var(--bg)] transition-all">Cancel</button>
              <button 
                onClick={() => handleDelete(confirmDeleteId)} 
                disabled={deletingId === confirmDeleteId}
                className="flex-1 bg-red-600 text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDeleteId ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Products Catalog</h1>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] shadow-sm">{products.length} Items</span>
        </div>
        <Link href="/admin/products/new" className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
          <Plus size={16} /> Add New Product
        </Link>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] p-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg)] border-none rounded-lg pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[var(--bg)] border-none rounded-lg pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{cat === 'all' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center bg-[var(--bg)] p-1 rounded-lg gap-1">
              <button 
                onClick={() => handleViewToggle('table')}
                className={cn("p-2 rounded-md transition-all", viewMode === 'table' ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
              >
                <TableIcon size={16} />
              </button>
              <button 
                onClick={() => handleViewToggle('grid')}
                className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
             <table className="w-full text-left">
               <tbody className="divide-y divide-[var(--border)]">
                 {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
               </tbody>
             </table>
          </div>
        )
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-2xl py-32 text-center shadow-sm border border-[var(--border)]">
           <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center text-gray-300 mb-6">
                <Package size={32} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">No products yet</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 mb-8 max-w-xs mx-auto">Start building your catalog by adding your first product to the store.</p>
              <Link href="/admin/products/new" className="bg-black text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
                <Plus size={16} /> Add First Product
              </Link>
           </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {filteredProducts.map(product => (
             <div key={product.id} className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden group hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col">
               <div className="aspect-[4/5] relative bg-[var(--bg)]">
                 {product.images[0] ? (
                   <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300">NO IMAGE</div>
                 )}
                 <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button 
                      onClick={() => handleToggleFeatured(product)}
                      className={cn("p-2 rounded-full shadow-lg transition-all backdrop-blur-md", product.isFeatured ? "bg-yellow-400 text-white" : "bg-[var(--bg-card)]/80 text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
                    >
                      <Star size={14} className={product.isFeatured ? "fill-current" : ""} />
                    </button>
                 </div>
                 <div className="absolute bottom-4 left-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/50",
                      product.inStock ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
                    )}>
                      {product.inStock ? 'Active' : 'Out of Stock'}
                    </span>
                 </div>
               </div>
               <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] capitalize">{product.category}</span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight mt-0.5 line-clamp-1">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <span className="text-lg font-bold text-[var(--text-primary)]">₹{product.price.toLocaleString('en-IN')}</span>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/products/new?edit=${product.id}`} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] rounded-lg transition-all">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => setConfirmDeleteId(product.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
               </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                  <th className="px-6 py-5">Product</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Price</th>
                  <th className="px-6 py-5">Sizes</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-[var(--bg)]/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 relative bg-gray-100 rounded border border-gray-50 overflow-hidden flex-shrink-0">
                          {product.images[0] ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" /> : <div className="text-[8px] text-gray-300 text-center flex items-center justify-center h-full">NO IMG</div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{product.name}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{product.id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] px-3 py-1 bg-[var(--bg)] rounded-full border border-[var(--border)]">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[var(--text-primary)]">₹{product.price.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {product.sizes.map(s => (
                          <span key={s} className="text-[9px] font-bold text-[var(--text-muted)] w-6 h-6 border border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-center rounded-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                        product.inStock ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                      )}>
                        {product.inStock ? 'ACTIVE' : 'OUT OF STOCK'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/products/new?edit=${product.id}`} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-all">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => setConfirmDeleteId(product.id)} className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
