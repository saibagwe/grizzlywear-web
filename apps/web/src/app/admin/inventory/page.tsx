'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Search,
  ArrowUpDown,
  Download,
  Edit3,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Layers,
  Save,
  X,
  Plus,
  Minus,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useInventory,
  type InventoryProduct,
  type SizeStock,
  type StockFilter,
  type SortOption,
} from '@/hooks/useInventory';
import EditStockModal from '@/components/admin/inventory/EditStockModal';
import StockHistoryDrawer from '@/components/admin/inventory/StockHistoryDrawer';
import AlertBanners from '@/components/admin/inventory/AlertBanners';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'stock_high', label: 'Stock: High to Low' },
  { value: 'stock_low', label: 'Stock: Low to High' },
  { value: 'sales_high', label: 'Sales: High to Low' },
  { value: 'updated_recent', label: 'Recently Updated' },
];

const FILTER_TABS: { value: StockFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '' },
  { value: 'in_stock', label: 'In Stock', emoji: '🟢' },
  { value: 'low_stock', label: 'Low Stock', emoji: '🟡' },
  { value: 'out_of_stock', label: 'Out of Stock', emoji: '🔴' },
];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getStockBadge(status: string) {
  switch (status) {
    case 'in_stock':
      return {
        label: 'In Stock',
        classes: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30',
      };
    case 'low_stock':
      return {
        label: 'Low Stock',
        classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30',
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        classes: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30',
      };
    default:
      return { label: '—', classes: 'bg-gray-100 text-gray-700' };
  }
}

function getRowHighlight(product: InventoryProduct): string {
  if (product.stockStatus === 'out_of_stock') return 'bg-red-50/60 dark:bg-red-900/5';
  if (product.stockStatus === 'low_stock') return 'bg-amber-50/60 dark:bg-amber-900/5';
  return '';
}

function exportToCSV(products: InventoryProduct[]) {
  const headers = ['Product Name', 'Category', 'Total Stock', 'XS', 'S', 'M', 'L', 'XL', 'Sales Count', 'Stock Status', 'Last Updated'];
  const rows = products.map((p) => {
    const updatedAt = p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : '—';
    return [
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.totalStock,
      p.stock['XS'] ?? 0,
      p.stock['S'] ?? 0,
      p.stock['M'] ?? 0,
      p.stock['L'] ?? 0,
      p.stock['XL'] ?? 0,
      p.salesCount,
      p.stockStatus.replace('_', ' '),
      updatedAt,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `grizzlywear-inventory-${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Inventory exported as CSV');
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]/50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-12 bg-[var(--bg)] animate-pulse rounded" />
          <div>
            <div className="h-4 w-28 bg-[var(--bg)] animate-pulse rounded mb-1.5" />
            <div className="h-3 w-16 bg-[var(--bg)]/50 animate-pulse rounded" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4"><div className="h-4 w-10 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-5 py-4"><div className="h-4 w-32 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-5 py-4"><div className="h-4 w-12 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-5 py-4"><div className="h-6 w-20 bg-[var(--bg)] animate-pulse rounded-full" /></td>
      <td className="px-5 py-4"><div className="h-8 w-24 bg-[var(--bg)] animate-pulse rounded" /></td>
    </tr>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminInventoryPage() {
  const {
    products,
    filteredProducts,
    loading,
    counts,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    stockFilter,
    setStockFilter,
    updateStock,
    bulkUpdateStock,
  } = useInventory();

  const [currentPage, setCurrentPage] = useState(1);
  const [editModalProduct, setEditModalProduct] = useState<InventoryProduct | null>(null);
  const [historyProduct, setHistoryProduct] = useState<{ id: string; name: string } | null>(null);

  // Bulk edit state
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<string, SizeStock>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  // Mobile expansion
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mobile action menu
  const [mobileActionId, setMobileActionId] = useState<string | null>(null);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset page when filter/search changes
  const handleFilterChange = useCallback(
    (filter: StockFilter) => {
      setStockFilter(filter);
      setCurrentPage(1);
    },
    [setStockFilter]
  );

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
    },
    [setSearchTerm]
  );

  // Bulk edit helpers
  const handleBulkEditToggle = () => {
    if (bulkEditMode) {
      // Cancel
      setBulkEdits({});
      setBulkEditMode(false);
    } else {
      // Initialize bulk edits with current stock
      const edits: Record<string, SizeStock> = {};
      paginatedProducts.forEach((p) => {
        edits[p.id] = { ...p.stock };
      });
      setBulkEdits(edits);
      setBulkEditMode(true);
    }
  };

  const handleBulkValueChange = (productId: string, size: string, value: number) => {
    if (value < 0) return;
    setBulkEdits((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? {}),
        [size]: value,
      },
    }));
  };

  const handleBulkSave = async () => {
    setBulkSaving(true);
    try {
      const updates = paginatedProducts
        .filter((p) => {
          const edited = bulkEdits[p.id];
          if (!edited) return false;
          const sizes = Object.keys(p.stock).length > 0 ? Object.keys(p.stock) : p.sizes;
          return sizes.some((s) => (edited[s] ?? 0) !== (p.stock[s] ?? 0));
        })
        .map((p) => ({
          productId: p.id,
          productName: p.name,
          previousStock: p.stock,
          newStock: bulkEdits[p.id],
        }));

      if (updates.length === 0) {
        toast.error('No changes to save');
        setBulkSaving(false);
        return;
      }

      const count = await bulkUpdateStock(updates);
      toast.success(`${count} products updated successfully`);
      setBulkEditMode(false);
      setBulkEdits({});
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setBulkSaving(false);
    }
  };

  const getProductSizes = (product: InventoryProduct): string[] => {
    if (Object.keys(product.stock).length > 0) return Object.keys(product.stock);
    if (product.sizes.length > 0) return product.sizes;
    return STANDARD_SIZES;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 pt-4 px-1 sm:px-0">
      {/* ── Edit Stock Modal ── */}
      {editModalProduct && (
        <EditStockModal
          isOpen={true}
          onClose={() => setEditModalProduct(null)}
          productName={editModalProduct.name}
          productId={editModalProduct.id}
          currentStock={editModalProduct.stock}
          sizes={getProductSizes(editModalProduct)}
          onSave={updateStock}
        />
      )}

      {/* ── Stock History Drawer ── */}
      {historyProduct && (
        <StockHistoryDrawer
          isOpen={true}
          onClose={() => setHistoryProduct(null)}
          productId={historyProduct.id}
          productName={historyProduct.name}
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Inventory
          </h1>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] shadow-sm">
            {products.length} Products
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              id="export-inventory-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg-hover)] transition-all shadow-sm"
            >
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      exportToCSV(filteredProducts);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg)] transition-all uppercase tracking-widest"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToCSV(filteredProducts);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg)] transition-all uppercase tracking-widest border-t border-[var(--border)]"
                  >
                    Export as Excel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bulk Edit Toggle */}
          <div className="hidden md:block">
            <button
              onClick={handleBulkEditToggle}
              id="bulk-edit-toggle-btn"
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm',
                bulkEditMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-black text-white hover:bg-gray-800'
              )}
            >
              {bulkEditMode ? (
                <>
                  <X size={14} /> Cancel Bulk Edit
                </>
              ) : (
                <>
                  <Layers size={14} /> Bulk Edit
                </>
              )}
            </button>
          </div>
          <div className="md:hidden">
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-not-allowed border border-gray-200"
              title="Use desktop for bulk editing"
            >
              <Layers size={14} /> Bulk Edit (Desktop Only)
            </button>
          </div>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-[var(--bg-card)] px-3 py-2 rounded-full shadow-sm border border-[var(--border)]">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* ── Alert Banners ── */}
      <div className="mb-6">
        <AlertBanners products={products} onFilterChange={handleFilterChange} />
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === 'all'
              ? counts.all
              : tab.value === 'in_stock'
              ? counts.inStock
              : tab.value === 'low_stock'
              ? counts.lowStock
              : counts.outOfStock;

          return (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              id={`filter-tab-${tab.value}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border',
                stockFilter === tab.value
                  ? 'bg-[var(--text-primary)] text-[var(--bg-card)] border-[var(--text-primary)] shadow-lg'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
              )}
            >
              {tab.emoji && <span>{tab.emoji}</span>}
              {tab.label}
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[18px] text-center',
                  stockFilter === tab.value
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg)] text-[var(--text-muted)]'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Sort Bar ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              id="inventory-search"
              className="w-full bg-[var(--bg)] border-none rounded-lg pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Sort */}
          <div className="relative w-full sm:w-56">
            <ArrowUpDown
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={14}
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              id="inventory-sort"
              className="w-full bg-[var(--bg)] border-none rounded-lg pl-10 pr-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Inventory Table ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                <th className="px-5 py-5 sticky left-0 z-10 bg-[var(--bg)]">Product</th>
                <th className="px-5 py-5">Total Stock</th>
                <th className="px-5 py-5">Size Breakdown</th>
                <th className="px-5 py-5">Sales Count</th>
                <th className="px-5 py-5">Status</th>
                <th className="px-5 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : paginatedProducts.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center text-[var(--text-muted)] mb-4">
                          <Package size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">No products found</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )
                : paginatedProducts.map((product) => {
                    const badge = getStockBadge(product.stockStatus);
                    const rowHighlight = getRowHighlight(product);
                    const sizes = getProductSizes(product);

                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          'hover:bg-[var(--bg)]/60 transition-colors group',
                          rowHighlight
                        )}
                      >
                        {/* Product */}
                        <td className="px-5 py-4 sticky left-0 z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg)]/60 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)] md:shadow-none">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 relative bg-[var(--bg)] rounded border border-[var(--border)] overflow-hidden flex-shrink-0">
                              {product.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="text-[8px] text-[var(--text-muted)] text-center flex items-center justify-center h-full">
                                  NO IMG
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[160px]">
                                {product.name}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] capitalize">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Stock */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                            {product.totalStock}
                          </span>
                        </td>

                        {/* Size Breakdown */}
                        <td className="px-5 py-4">
                          {bulkEditMode ? (
                            <div className="flex items-center gap-1.5">
                              {sizes.map((size) => (
                                <div key={size} className="flex flex-col items-center">
                                  <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-0.5">
                                    {size}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={bulkEdits[product.id]?.[size] ?? product.stock[size] ?? 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (!isNaN(val) && val >= 0) {
                                        handleBulkValueChange(product.id, size, val);
                                      }
                                    }}
                                    className="w-12 h-8 text-center text-xs font-bold bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:ring-2 focus:ring-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {sizes.map((size) => {
                                const count = product.stock[size] ?? 0;
                                return (
                                  <div
                                    key={size}
                                    className={cn(
                                      'flex flex-col items-center px-2 py-1 rounded-md border text-center min-w-[36px]',
                                      count === 0
                                        ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                                        : count <= 10
                                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30'
                                        : 'bg-[var(--bg)] border-[var(--border)]'
                                    )}
                                  >
                                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">
                                      {size}
                                    </span>
                                    <span
                                      className={cn(
                                        'text-xs font-bold tabular-nums',
                                        count === 0
                                          ? 'text-red-500'
                                          : count <= 10
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-[var(--text-primary)]'
                                      )}
                                    >
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Sales Count */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                            {product.salesCount}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                              badge.classes
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {!bulkEditMode && (
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditModalProduct(product)}
                                className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] rounded-lg transition-all flex items-center gap-1.5"
                                title="Edit Stock"
                              >
                                <Edit3 size={13} />
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  setHistoryProduct({ id: product.id, name: product.name })
                                }
                                className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg)] rounded-lg transition-all flex items-center gap-1.5"
                                title="View History"
                              >
                                <History size={13} />
                                History
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-12 bg-[var(--bg)] animate-pulse rounded" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-[var(--bg)] animate-pulse rounded mb-1" />
                      <div className="h-3 w-16 bg-[var(--bg)]/50 animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))
            : paginatedProducts.length === 0
            ? (
              <div className="py-16 text-center">
                <Package size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
                <p className="text-sm text-[var(--text-muted)]">No products found</p>
              </div>
            )
            : paginatedProducts.map((product) => {
                const badge = getStockBadge(product.stockStatus);
                const isExpanded = expandedRowId === product.id;
                const sizes = getProductSizes(product);

                return (
                  <div
                    key={product.id}
                    className={cn(
                      'border-b border-[var(--border)]',
                      getRowHighlight(product)
                    )}
                  >
                    {/* Main row */}
                    <div className="p-4 flex items-center gap-3">
                      {/* Product thumbnail */}
                      <div className="w-10 h-14 relative bg-[var(--bg)] rounded border border-[var(--border)] overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-[8px] text-[var(--text-muted)] text-center flex items-center justify-center h-full">
                            N/A
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border',
                              badge.classes
                            )}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            Stock: {product.totalStock} · Sales: {product.salesCount}
                          </span>
                        </div>
                      </div>

                      {/* Expand / Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            setExpandedRowId(isExpanded ? null : product.id)
                          }
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <ChevronDown
                            size={16}
                            className={cn(
                              'transition-transform',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </button>
                        {/* Mobile action menu */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMobileActionId(
                                mobileActionId === product.id ? null : product.id
                              )
                            }
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {mobileActionId === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMobileActionId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 w-40 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setEditModalProduct(product);
                                    setMobileActionId(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg)] transition-all flex items-center gap-2"
                                >
                                  <Edit3 size={13} /> Edit Stock
                                </button>
                                <button
                                  onClick={() => {
                                    setHistoryProduct({
                                      id: product.id,
                                      name: product.name,
                                    });
                                    setMobileActionId(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg)] transition-all flex items-center gap-2 border-t border-[var(--border)]"
                                >
                                  <History size={13} /> View History
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded size breakdown */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => {
                            const count = product.stock[size] ?? 0;
                            return (
                              <div
                                key={size}
                                className={cn(
                                  'flex flex-col items-center px-3 py-2 rounded-lg border min-w-[48px]',
                                  count === 0
                                    ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30'
                                    : count <= 10
                                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30'
                                    : 'bg-[var(--bg)] border-[var(--border)]'
                                )}
                              >
                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">
                                  {size}
                                </span>
                                <span
                                  className={cn(
                                    'text-sm font-bold tabular-nums',
                                    count === 0
                                      ? 'text-red-500'
                                      : count <= 10
                                      ? 'text-amber-600'
                                      : 'text-[var(--text-primary)]'
                                  )}
                                >
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>

        {/* ── Table Footer: Pagination ── */}
        <div className="px-5 py-5 bg-[var(--bg)] border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {loading
              ? 'Loading...'
              : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredProducts.length
                )} of ${filteredProducts.length}`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <span key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-1 text-[var(--text-muted)] text-xs">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-xs font-bold transition-all',
                          currentPage === page
                            ? 'bg-[var(--text-primary)] text-[var(--bg-card)] shadow-lg'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]'
                        )}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bulk Edit Floating Save Bar ── */}
      {bulkEditMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] border-t border-[var(--border)] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-6 py-4">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">
                Bulk Edit Mode Active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkEditToggle}
                className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-xl hover:bg-[var(--bg)] transition-all text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSave}
                disabled={bulkSaving}
                className="px-6 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {bulkSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
