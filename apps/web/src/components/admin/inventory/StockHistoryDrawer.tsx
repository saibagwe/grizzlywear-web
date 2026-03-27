'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, ChevronDown, Clock, Package, RotateCcw, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockHistory, type StockHistoryEntry } from '@/hooks/useInventory';

type StockHistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
};

function getChangeTypeConfig(changeType: string) {
  switch (changeType) {
    case 'restock':
      return { icon: Package, label: 'Restocked', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    case 'order_deducted':
      return { icon: Package, label: 'Order Deducted', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    case 'order_restored':
      return { icon: RotateCcw, label: 'Order Restored', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    case 'manual_update':
      return { icon: Pencil, label: 'Manual Update', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    default:
      return { icon: Clock, label: changeType, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
  }
}

function formatHistoryTime(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StockHistoryDrawer({
  isOpen,
  onClose,
  productId,
  productName,
}: StockHistoryDrawerProps) {
  const { entries, loading, hasMore, loadMore } = useStockHistory(isOpen ? productId : '');
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed z-[100] bg-[var(--bg-card)] shadow-2xl overflow-hidden flex flex-col',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 top-auto max-h-[85vh] rounded-t-2xl',
          // Desktop: side drawer
          'lg:inset-y-0 lg:right-0 lg:left-auto lg:top-0 lg:bottom-0 lg:max-h-full lg:w-[480px] lg:rounded-none lg:rounded-l-2xl',
          'animate-in slide-in-from-bottom lg:slide-in-from-right duration-300'
        )}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center py-2 lg:hidden">
          <div className="w-10 h-1 bg-[var(--text-muted)]/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] shrink-0">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
              Stock History
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 bg-[var(--bg)] rounded-full flex items-center justify-center text-[var(--text-muted)] mb-4">
                <Clock size={24} />
              </div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">
                No history yet
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-6 bottom-6 w-px bg-[var(--border)]" />

              <div className="space-y-6">
                {entries.map((entry) => {
                  const config = getChangeTypeConfig(entry.changeType);
                  const Icon = config.icon;
                  const allSizes = new Set([
                    ...Object.keys(entry.previousStock ?? {}),
                    ...Object.keys(entry.newStock ?? {}),
                  ]);

                  return (
                    <div key={entry.id} className="relative flex gap-4 group">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-[var(--bg-card)]',
                          config.bg
                        )}
                      >
                        <Icon size={14} className={config.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
                              config.bg,
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-medium shrink-0">
                            {formatHistoryTime(entry.createdAt)}
                          </span>
                        </div>

                        {/* Size changes table */}
                        <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] overflow-hidden">
                          <div className="grid grid-cols-4 gap-px bg-[var(--border)]">
                            <div className="bg-[var(--bg)] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                              Size
                            </div>
                            <div className="bg-[var(--bg)] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">
                              Before
                            </div>
                            <div className="bg-[var(--bg)] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">
                              After
                            </div>
                            <div className="bg-[var(--bg)] px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">
                              Diff
                            </div>
                            {Array.from(allSizes).map((size) => {
                              const prev = (entry.previousStock ?? {})[size] ?? 0;
                              const next = (entry.newStock ?? {})[size] ?? 0;
                              const diff = next - prev;
                              if (diff === 0) return null;

                              return [
                                <div
                                  key={`${size}-label`}
                                  className="bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-primary)]"
                                >
                                  {size}
                                </div>,
                                <div
                                  key={`${size}-prev`}
                                  className="bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-secondary)] text-center tabular-nums"
                                >
                                  {prev}
                                </div>,
                                <div
                                  key={`${size}-next`}
                                  className="bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] text-center tabular-nums"
                                >
                                  {next}
                                </div>,
                                <div
                                  key={`${size}-diff`}
                                  className={cn(
                                    'bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-center tabular-nums',
                                    diff > 0 ? 'text-green-500' : 'text-red-500'
                                  )}
                                >
                                  {diff > 0 ? `+${diff}` : diff}
                                </div>,
                              ];
                            })}
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">
                            By:{' '}
                            <span className="text-[var(--text-secondary)] font-bold capitalize">
                              {entry.changedBy === 'admin' ? 'Admin' : 'System'}
                            </span>
                          </span>
                          {entry.reason && (
                            <span className="text-[10px] text-[var(--text-muted)] italic">
                              "{entry.reason}"
                            </span>
                          )}
                          {entry.orderId && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              Order: {entry.orderId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
