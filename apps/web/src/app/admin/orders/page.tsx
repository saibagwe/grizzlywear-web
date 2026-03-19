'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, TrendingUp, ShoppingCart, IndianRupee, Clock, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type QueryDocumentSnapshot } from 'firebase/firestore';
import {
  subscribeToAllOrders,
  subscribeToMoreOrders,
  updateOrderStatus,
  ORDERS_PAGE_SIZE,
  type FirestoreOrder,
  type OrderStatus,
} from '@/lib/firestore/orderService';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: '' | OrderStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ─── HELPER FUNTIONS ──────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'delivered':   return 'bg-green-100 text-green-800';
    case 'shipped':     return 'bg-blue-100 text-blue-800';
    case 'processing':  return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':   return 'bg-red-100 text-red-800';
    default:            return 'bg-gray-100 text-gray-700';
  }
}

function paymentColor(status: string) {
  switch (status) {
    case 'paid':     return 'text-green-700 bg-green-50';
    case 'refunded': return 'text-blue-700 bg-blue-50';
    default:         return 'text-yellow-700 bg-yellow-50';
  }
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── SKELETON ROW ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-6 py-4"><div className="h-3.5 w-28 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4">
        <div className="h-3, w-32 bg-gray-200 animate-pulse rounded mb-1.5" />
        <div className="h-2.5 w-24 bg-gray-100 animate-pulse rounded" />
      </td>
      <td className="px-6 py-4"><div className="h-3 w-20 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-3 w-12 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4 text-right"><div className="h-3 w-16 bg-gray-200 animate-pulse rounded ml-auto" /></td>
      <td className="px-6 py-4 text-right"><div className="h-3 w-10 bg-gray-200 animate-pulse rounded ml-auto" /></td>
    </tr>
  );
}

function SkeletonStat() {
  return (
    <div className="bg-white border border-gray-200 p-5">
      <div className="h-3 w-20 bg-gray-200 animate-pulse rounded mb-3" />
      <div className="h-7 w-24 bg-gray-200 animate-pulse rounded" />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders]             = useState<FirestoreOrder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('');
  const [updatingId, setUpdatingId]     = useState<string | null>(null);

  // Pagination
  const [lastDoc, setLastDoc]           = useState<QueryDocumentSnapshot | null>(null);
  const [moreOrders, setMoreOrders]     = useState<FirestoreOrder[]>([]);
  const [lastMoreDoc, setLastMoreDoc]   = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const moreUnsubRef                    = useRef<(() => void) | null>(null);
  const timeoutRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ── Initial real-time subscription (first 50) ──
  useEffect(() => {
    setFetchError(null);
    setLoading(true);

    // Safety net: if Firestore hasn't responded in 10 s, stop the skeleton.
    timeoutRef.current = setTimeout(() => {
      console.warn('[AdminOrders] 10 s timeout — stopping skeleton.');
      setLoading(false);
    }, 10_000);

    const unsub = subscribeToAllOrders(
      (data, last) => {
        clearLoadingTimeout();
        console.log('[AdminOrders] snapshot received, count:', data.length);
        setOrders(data);
        setLastDoc(last);
        setHasMore(data.length === ORDERS_PAGE_SIZE);
        setFetchError(null);
        setLoading(false);
      },
      (err) => {
        clearLoadingTimeout();
        console.error('[AdminOrders] Firestore error:', err);
        setFetchError(`Firestore error (${(err as any).code ?? 'unknown'}): ${err.message}`);
        setLoading(false);
      }
    );

    return () => {
      clearLoadingTimeout();
      unsub();
    };
  }, [clearLoadingTimeout]);

  // ── Load more ──
  const handleLoadMore = () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);

    // Unsubscribe previous "more" listener
    if (moreUnsubRef.current) moreUnsubRef.current();

    const unsub = subscribeToMoreOrders(
      lastDoc,
      (data, last) => {
        setMoreOrders((prev) => {
          // Merge: remove old entries from this cursor, append new
          const existingIds = new Set(prev.map((o) => o.id));
          const merged = [...prev, ...data.filter((o) => !existingIds.has(o.id))];
          return merged;
        });
        setLastMoreDoc(last);
        setHasMore(data.length === ORDERS_PAGE_SIZE);
        setLoadingMore(false);
      },
      (err) => {
        console.error('[AdminOrders] load-more error:', err);
        toast.error(`Failed to load more orders: ${err.message}`);
        setLoadingMore(false);
      }
    );
    moreUnsubRef.current = unsub;
  };

  // Cleanup more-listener on unmount
  useEffect(() => () => { if (moreUnsubRef.current) moreUnsubRef.current(); }, []);

  // ── Combined list ──
  const allOrders = useMemo(() => {
    const seen = new Set(orders.map((o) => o.id));
    return [...orders, ...moreOrders.filter((o) => !seen.has(o.id))];
  }, [orders, moreOrders]);

  // ── Filtered view ──
  const filtered = useMemo(() => {
    return allOrders.filter((o) => {
      const matchSearch =
        !searchTerm ||
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allOrders, searchTerm, statusFilter]);

  // ── Summary stats ──
  const totalRevenue  = allOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const pendingCount  = allOrders.filter((o) => o.status === 'pending').length;

  // ── Inline status update ──
  const handleStatusChange = async (order: FirestoreOrder, newStatus: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success(`Order ${order.orderId} → ${newStatus}`);
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Loading orders…'
              : fetchError
              ? 'Error loading orders'
              : `${allOrders.length} orders — live real-time`}
          </p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {!loading && fetchError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load orders</p>
            <p className="text-xs text-red-600 mt-0.5 font-mono">{fetchError}</p>
            <p className="text-xs text-red-500 mt-1">
              Check Firestore rules, indexes, and your network connection.
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Orders</span>
              </div>
              <p className="text-2xl font-light tracking-tight">{allOrders.length}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Revenue</span>
              </div>
              <p className="text-2xl font-light tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className={cn('border p-5', pendingCount > 0 ? 'bg-orange-50/30 border-orange-200' : 'bg-white border-gray-200')}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className={pendingCount > 0 ? 'text-orange-400' : 'text-gray-400'} />
                <span className={cn('text-[10px] font-bold uppercase tracking-widest', pendingCount > 0 ? 'text-orange-600' : 'text-gray-500')}>Pending</span>
              </div>
              <p className={cn('text-2xl font-light tracking-tight', pendingCount > 0 ? 'text-orange-700' : '')}>{pendingCount}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Showing</span>
              </div>
              <p className="text-2xl font-light tracking-tight">{filtered.length}</p>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200">
        {/* ── Filters ── */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#F9F9F9]">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search orders, customers…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value as '' | OrderStatus)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors',
                  statusFilter === opt.value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                )}
              >
                {opt.label}
                {opt.value === 'pending' && pendingCount > 0 && !loading && (
                  <span className="ml-1.5 bg-orange-500 text-white rounded-full px-1.5 text-[9px]">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                // ── Skeleton rows ──
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-24 text-center">
                    <p className="text-gray-400 font-light uppercase tracking-widest text-sm mb-1">
                      {searchTerm || statusFilter ? 'No results found' : 'No Orders Yet'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {searchTerm || statusFilter
                        ? 'Try a different search or filter.'
                        : 'Orders will appear here in real-time as customers check out.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
                  const isUpdating = updatingId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-black hover:underline underline-offset-4 flex items-center gap-1 font-mono text-xs"
                        >
                          {order.orderId}
                          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 max-w-[160px] truncate">{order.customerName || '—'}</p>
                        <p className="text-[10px] text-gray-500 max-w-[160px] truncate">{order.customerEmail || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-gray-600">{itemCount} item{itemCount !== 1 ? 's' : ''}</td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', paymentColor(order.paymentStatus))}>
                          {order.paymentStatus}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                          {order.paymentMethod === 'razorpay' ? 'Online' : order.paymentMethod}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {isUpdating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Saving…</span>
                          </div>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                            className={cn(
                              'appearance-none bg-transparent border px-2 py-1 text-[10px] font-bold uppercase tracking-widest cursor-pointer focus:outline-none',
                              statusColor(order.status)
                            )}
                          >
                            {STATUS_OPTIONS.filter((o) => o.value !== '').map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900 text-right font-medium">
                        ₹{order.total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer: Load More + Count ── */}
        <div className="p-4 border-t border-gray-200 bg-[#F9F9F9] flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${allOrders.length} orders`}
          </p>
          {!loading && hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-gray-200 bg-white hover:border-black transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronDown size={14} />
              )}
              {loadingMore ? 'Loading…' : 'Load More Orders'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
