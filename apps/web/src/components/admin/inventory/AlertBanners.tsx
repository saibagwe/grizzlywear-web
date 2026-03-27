'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, XCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { InventoryProduct, StockFilter } from '@/hooks/useInventory';

type AlertBannersProps = {
  products: InventoryProduct[];
  onFilterChange: (filter: StockFilter) => void;
};

export default function AlertBanners({ products, onFilterChange }: AlertBannersProps) {
  const [lowStockDismissed, setLowStockDismissed] = useState(false);
  const [outOfStockDismissed, setOutOfStockDismissed] = useState(false);
  const [lowStockCollapsed, setLowStockCollapsed] = useState(true);
  const [outOfStockCollapsed, setOutOfStockCollapsed] = useState(true);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockStatus === 'low_stock'),
    [products]
  );
  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stockStatus === 'out_of_stock'),
    [products]
  );

  return (
    <div className="space-y-3">
      {/* Low Stock Banner */}
      {lowStockProducts.length > 0 && !lowStockDismissed && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl overflow-hidden transition-all">
          <div className="flex items-center justify-between px-5 py-3.5">
            <button
              onClick={() => {
                onFilterChange('low_stock');
              }}
              className="flex items-center gap-3 text-left flex-1 min-w-0"
            >
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                  ⚠️ {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} have low stock
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                  Click to filter low stock products
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => setLowStockCollapsed(!lowStockCollapsed)}
                className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-amber-600 transition-all"
              >
                {lowStockCollapsed ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronUp size={14} />
                )}
              </button>
              <button
                onClick={() => setLowStockDismissed(true)}
                className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-amber-600 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Expanded list */}
          {!lowStockCollapsed && (
            <div className="px-5 pb-4 border-t border-amber-200/50 dark:border-amber-800/20 pt-3">
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((p) => {
                  const lowSizes = Object.entries(p.stock)
                    .filter(([, v]) => v >= 0 && v <= 10)
                    .map(([size, count]) => `${size}: ${count}`);
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-xs text-amber-800 dark:text-amber-300 font-medium truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono shrink-0 ml-3">
                        {lowSizes.join(', ')}
                      </span>
                    </div>
                  );
                })}
                {lowStockProducts.length > 5 && (
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                    +{lowStockProducts.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Out of Stock Banner */}
      {outOfStockProducts.length > 0 && !outOfStockDismissed && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl overflow-hidden transition-all">
          <div className="flex items-center justify-between px-5 py-3.5">
            <button
              onClick={() => {
                onFilterChange('out_of_stock');
              }}
              className="flex items-center gap-3 text-left flex-1 min-w-0"
            >
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
                <XCircle size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-widest">
                  🔴 {outOfStockProducts.length} product{outOfStockProducts.length !== 1 ? 's' : ''} completely out of stock
                </p>
                <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-medium">
                  Click to filter out of stock products
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => setOutOfStockCollapsed(!outOfStockCollapsed)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-all"
              >
                {outOfStockCollapsed ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronUp size={14} />
                )}
              </button>
              <button
                onClick={() => setOutOfStockDismissed(true)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Expanded list */}
          {!outOfStockCollapsed && (
            <div className="px-5 pb-4 border-t border-red-200/50 dark:border-red-800/20 pt-3">
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-xs text-red-800 dark:text-red-300 font-medium truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest shrink-0 ml-3">
                      All sizes = 0
                    </span>
                  </div>
                ))}
                {outOfStockProducts.length > 5 && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                    +{outOfStockProducts.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
