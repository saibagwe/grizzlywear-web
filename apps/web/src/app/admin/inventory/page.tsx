'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  Edit2, 
  AlertTriangle, 
  Loader2, 
  X, 
  Package, 
  PackageMinus, 
  PackageX, 
  TrendingUp, 
  Plus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getProducts,
  createProduct,
  updateProduct,
  type ProductInput,
} from '@/lib/firestore/productService';
import {
  subscribeToInventory,
  updateInventoryStock,
  syncInventoryWithProducts,
  createInventoryItem,
  type InventoryItem,
} from '@/lib/firestore/inventoryService';

// ─── STOCK EDIT MODAL ─────────────────────────────────────────────────────────

function StockEditModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [localStock, setLocalStock] = useState<Record<string, number>>({ ...item.stock });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateInventoryStock(item.productId, localStock);
      toast.success('Stock updated successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-[var(--bg)] p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-20 relative bg-[var(--bg-card)] rounded border border-[var(--border)] overflow-hidden shadow-sm flex-shrink-0">
               {item.imageUrl ? <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" /> : <div className="p-2 text-[8px] text-gray-300">NO IMG</div>}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{item.productName}</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Product Inventory Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card)] rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(localStock).map(([size, count]) => (
              <div key={size} className="flex items-center justify-between bg-[var(--bg)] p-4 rounded-xl border border-gray-50/50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{size} Unit</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Current Stock: {item.stock[size] || 0}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="relative">
                     <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                     <input 
                       type="number"
                       min="0"
                       value={count}
                       onChange={(e) => setLocalStock({ ...localStock, [size]: Math.max(0, parseInt(e.target.value) || 0) })}
                       className="w-32 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2.5 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-black transition-all"
                     />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-[var(--bg)] border-t border-[var(--border)] flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border border-[var(--border)] bg-[var(--bg-card)] rounded-xl hover:bg-[var(--bg)] transition-all">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 bg-black text-white py-4 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Confirm Stock Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD PRODUCT MODAL (QUICK ADD) ────────────────────────────────────────────

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

function AddProductModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'men',
    price: '',
    description: '',
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSizes.length === 0) {
      toast.error('Select at least one size.');
      return;
    }
    setIsSubmitting(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const initialStock: Record<string, number> = {};
      selectedSizes.forEach(s => initialStock[s] = 0);
      
      const productInput: ProductInput = {
        name: formData.name,
        slug,
        category: formData.category as any,
        subcategory: '',
        price: parseFloat(formData.price),
        description: formData.description,
        shortDescription: formData.description.slice(0, 100),
        images: [],
        sizes: selectedSizes,
        colors: [],
        material: '',
        fit: '',
        careInstructions: [],
        features: [],
        stock: {},
        isFeatured: false,
        isNew: true,
        inStock: true,
        rating: 0,
        reviewCount: 0,
        tags: [],
      };
      
      const productId = await createProduct(productInput);
      await createInventoryItem({
        productId,
        productName: formData.name,
        category: formData.category,
        imageUrl: '',
        stock: initialStock,
        totalStock: 0,
        lowStockThreshold: 10,
      });
      
      toast.success('Product created. Set stock counts below.');
      onClose();
    } catch (err) {
      toast.error('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-8 pb-4 border-b border-gray-50 flex items-center justify-between">
           <h3 className="text-xl font-bold text-[var(--text-primary)]">Quick Add Product</h3>
           <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Product Name</label>
               <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--bg)] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all" />
             </div>
             <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Category</label>
               <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[var(--bg)] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer">
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="accessories">Accessories</option>
               </select>
             </div>
             <div>
               <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Price (₹)</label>
               <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full bg-[var(--bg)] border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all" />
             </div>
           </div>
           <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Select Available Sizes</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SIZES.map(size => (
                  <label key={size} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedSizes.includes(size)} onChange={() => toggleSize(size)} className="sr-only" />
                    <div className={cn("w-14 h-12 border flex items-center justify-center text-[11px] font-bold tracking-widest uppercase transition-all rounded-lg", selectedSizes.includes(size) ? "bg-black text-white border-black shadow-md" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-black hover:text-[var(--text-primary)]")}>{size}</div>
                  </label>
                ))}
              </div>
           </div>
           <div>
             <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Short Description</label>
             <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[var(--bg)] border-none rounded-lg px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-black transition-all" />
           </div>
           <div className="flex gap-4 pt-4">
             <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-xl hover:bg-[var(--bg)] transition-all">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-1 bg-black text-white py-4 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2">
               {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={16} />}
               Create Product Entry
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const initInventory = async () => {
      try {
        const prods = await getProducts();
        await syncInventoryWithProducts(prods);
      } catch (err) { console.error('Sync failed', err); }
    };
    initInventory();

    const unsub = subscribeToInventory((items) => {
      setInventory(items.sort((a, b) => a.totalStock - b.totalStock));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      if (filter === 'low') return matchesSearch && item.totalStock > 0 && item.totalStock <= item.lowStockThreshold;
      if (filter === 'out') return matchesSearch && item.totalStock === 0;
      if (filter === 'in') return matchesSearch && item.totalStock > 10;
      return matchesSearch;
    });
  }, [inventory, searchTerm, filter]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const low = inventory.filter(i => i.totalStock > 0 && i.totalStock <= i.lowStockThreshold).length;
    const out = inventory.filter(i => i.totalStock === 0).length;
    return { total, low, out };
  }, [inventory]);

  const lowStockItems = useMemo(() => inventory.filter(i => i.totalStock > 0 && i.totalStock <= i.lowStockThreshold).slice(0, 5), [inventory]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Stock Inventory</h1>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] shadow-sm">{inventory.length} SKUs</span>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
          <Plus size={16} /> Quick Add SKU
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-black group">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)]">
                <Package size={20} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Inventory Items</span>
           </div>
           <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-yellow-500 group">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
                <PackageMinus size={20} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Low Stock SKUs</span>
           </div>
           <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.low}</p>
        </div>
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-red-500 group">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <PackageX size={20} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Out of Stock</span>
           </div>
           <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.out}</p>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4 text-yellow-800">
              <div className="w-12 h-12 bg-yellow-100/50 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest">Low Stock Alert</h4>
                <p className="text-[11px] mt-1 font-medium opacity-80">
                  <span className="font-bold underline">{lowStockItems.length}</span> critical items need attention: {lowStockItems.map(i => i.productName).join(', ')}...
                </p>
              </div>
           </div>
           <div className="flex flex-wrap gap-2">
             {lowStockItems.slice(0, 3).map(item => (
               <button 
                 key={item.productId} 
                 onClick={() => setEditingItem(item)}
                 className="px-6 py-2 bg-[var(--bg-card)] text-yellow-700 border border-yellow-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-100 transition-all flex items-center gap-2 shadow-sm"
               >
                 Restock {item.productName.split(' ')[0]} <ArrowRight size={12} />
               </button>
             ))}
           </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] p-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search products in inventory..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg)] border-none rounded-lg pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg)] p-1.5 rounded-xl border border-gray-50">
            {(['all', 'in', 'low', 'out'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all',
                  filter === f ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-lg shadow-black/5' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                <th className="px-6 py-5">Product SKU</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Breakdown (Size)</th>
                <th className="px-6 py-5 text-center">In Units</th>
                <th className="px-6 py-5">Stock Status</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-gray-50">
                    <td className="px-6 py-6"><div className="w-48 h-10 bg-[var(--bg)] rounded" /></td>
                    <td className="px-6 py-6"><div className="w-20 h-5 bg-[var(--bg)] rounded-full" /></td>
                    <td className="px-6 py-6"><div className="w-40 h-8 bg-[var(--bg)] rounded-lg" /></td>
                    <td className="px-6 py-6"><div className="w-10 h-5 bg-[var(--bg)] rounded mx-auto" /></td>
                    <td className="px-6 py-6"><div className="w-24 h-6 bg-[var(--bg)] rounded-full" /></td>
                    <td className="px-6 py-6 text-right"><div className="w-16 h-4 bg-[var(--bg)] rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredInventory.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <Package size={48} className="text-[var(--text-muted)] mb-4" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Empty Inventory</h3>
                      </div>
                   </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.productId} className="hover:bg-[var(--bg)]/60 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 relative bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden flex-shrink-0">
                          {item.imageUrl ? <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" /> : <div className="p-2 text-[8px] text-gray-300">SKU</div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{item.productName}</span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{item.productId.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] border border-[var(--border)] px-3 py-1 rounded-full">{item.category}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {Object.entries(item.stock).map(([size, count]) => (
                          <div key={size} className={cn(
                            "flex items-center px-2 py-1 rounded-md border min-w-[50px] justify-between",
                            count === 0 ? "bg-red-50 border-red-100 text-red-600" : 
                            count <= 5 ? "bg-yellow-50 border-yellow-100 text-yellow-600" :
                            "bg-green-50 border-green-100 text-green-600"
                          )}>
                            <span className="text-[9px] font-bold uppercase">{size}</span>
                            <span className="text-[9px] font-bold font-mono ml-2">{count}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{item.totalStock}</span>
                    </td>
                    <td className="px-6 py-5">
                      {item.totalStock === 0 ? (
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full" /> Out of Stock
                        </span>
                      ) : item.totalStock <= item.lowStockThreshold ? (
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-yellow-600">
                          <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-pulse" /> Low Balance
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" /> Healthy Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button onClick={() => setEditingItem(item)} className="p-3 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl hover:bg-black hover:text-white hover:shadow-lg transition-all opacity-0 group-hover:opacity-100">
                          <Edit2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && <StockEditModal item={editingItem} onClose={() => setEditingItem(null)} />}
      {isAdding && <AddProductModal onClose={() => setIsAdding(false)} />}
    </div>
  );
}
