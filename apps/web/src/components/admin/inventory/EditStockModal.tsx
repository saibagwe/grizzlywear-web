'use client';

import { useState } from 'react';
import { X, Loader2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SizeStock } from '@/hooks/useInventory';

type EditStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId: string;
  currentStock: SizeStock;
  sizes: string[];
  onSave: (
    productId: string,
    productName: string,
    previousStock: SizeStock,
    newStock: SizeStock,
    changeType: 'restock' | 'manual_update',
    reason?: string
  ) => Promise<void>;
};

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function EditStockModal({
  isOpen,
  onClose,
  productName,
  productId,
  currentStock,
  sizes,
  onSave,
}: EditStockModalProps) {
  // Determine which sizes to show — use product sizes, falling back to standard sizes
  const availableSizes = sizes.length > 0 ? sizes : Object.keys(currentStock).length > 0 ? Object.keys(currentStock) : STANDARD_SIZES;

  const [stockValues, setStockValues] = useState<SizeStock>(() => {
    const initial: SizeStock = {};
    availableSizes.forEach((size) => {
      initial[size] = currentStock[size] ?? 0;
    });
    return initial;
  });
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [size: string]: string }>({});

  if (!isOpen) return null;

  const handleValueChange = (size: string, value: string) => {
    const num = parseInt(value, 10);
    if (value === '' || value === '-') {
      setStockValues((prev) => ({ ...prev, [size]: 0 }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[size];
        return next;
      });
      return;
    }
    if (isNaN(num) || num < 0) {
      setErrors((prev) => ({ ...prev, [size]: 'Cannot be negative' }));
      return;
    }
    setStockValues((prev) => ({ ...prev, [size]: num }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[size];
      return next;
    });
  };

  const handleIncrement = (size: string) => {
    setStockValues((prev) => ({ ...prev, [size]: (prev[size] ?? 0) + 1 }));
  };

  const handleDecrement = (size: string) => {
    setStockValues((prev) => {
      const current = prev[size] ?? 0;
      if (current <= 0) {
        setErrors((e) => ({ ...e, [size]: 'Cannot be negative' }));
        return prev;
      }
      setErrors((e) => {
        const next = { ...e };
        delete next[size];
        return next;
      });
      return { ...prev, [size]: current - 1 };
    });
  };

  const hasChanges = availableSizes.some(
    (size) => (stockValues[size] ?? 0) !== (currentStock[size] ?? 0)
  );

  const hasIncreases = availableSizes.some(
    (size) => (stockValues[size] ?? 0) > (currentStock[size] ?? 0)
  );

  const changeType: 'restock' | 'manual_update' = hasIncreases ? 'restock' : 'manual_update';

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) return;
    if (!hasChanges) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);
    try {
      await onSave(productId, productName, currentStock, stockValues, changeType, reason);
      toast.success('Stock updated successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const totalBefore = availableSizes.reduce((sum, s) => sum + (currentStock[s] ?? 0), 0);
  const totalAfter = availableSizes.reduce((sum, s) => sum + (stockValues[s] ?? 0), 0);
  const totalDiff = totalAfter - totalBefore;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div className="bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg relative z-10 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Edit Stock
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Size Stock Inputs */}
        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {availableSizes.map((size) => {
              const prev = currentStock[size] ?? 0;
              const curr = stockValues[size] ?? 0;
              const diff = curr - prev;
              const error = errors[size];

              return (
                <div key={size}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] w-10 text-center shrink-0">
                      {size}
                    </span>
                    <div className="flex items-center flex-1 bg-[var(--bg)] rounded-xl overflow-hidden border border-[var(--border)]">
                      <button
                        onClick={() => handleDecrement(size)}
                        className="px-3 py-3 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                        type="button"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={stockValues[size] ?? 0}
                        onChange={(e) => handleValueChange(size, e.target.value)}
                        className="flex-1 bg-transparent text-center text-sm font-bold text-[var(--text-primary)] focus:outline-none py-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => handleIncrement(size)}
                        className="px-3 py-3 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                        type="button"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {diff !== 0 && (
                      <span
                        className={cn(
                          'text-xs font-bold min-w-[40px] text-right tabular-nums',
                          diff > 0 ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 mt-1 ml-12 font-medium">{error}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Summary */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Total Stock
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                {totalAfter}
              </span>
              {totalDiff !== 0 && (
                <span
                  className={cn(
                    'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
                    totalDiff > 0
                      ? 'text-green-600 bg-green-100'
                      : 'text-red-600 bg-red-100'
                  )}
                >
                  {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                </span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-2">
              Reason / Note (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Restocking for season sale..."
              rows={2}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-black resize-none placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-5 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-card)]">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-[var(--border)] rounded-xl hover:bg-[var(--bg)] transition-all text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || Object.keys(errors).length > 0}
            className="flex-1 bg-black text-white py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
