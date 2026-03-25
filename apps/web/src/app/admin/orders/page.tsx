'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowUpRight, 
  TrendingUp, 
  ShoppingCart, 
  IndianRupee, 
  Clock, 
  ChevronDown, 
  AlertCircle,
  Copy,
  Calendar,
  CheckCircle2,
  Package,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { type QueryDocumentSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import {
  subscribeToAllOrders,
  subscribeToMoreOrders,
  subscribeToFilteredOrders,
  subscribeToMoreFilteredOrders,
  updateOrderStatus,
  getAvailableStatuses,
  ORDERS_PAGE_SIZE,
  type FirestoreOrder,
  type OrderStatus,
} from '@/lib/firestore/orderService';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: '' | OrderStatus; label: string; color: string }[] = [
  { value: '', label: 'All', color: 'bg-gray-100 text-gray-700' },
  { value: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

const QUICK_FILTERS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'This Week', type: 'week' as const },
  { label: 'This Month', type: 'month' as const },
  { label: 'All', type: 'all' as const },
];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

function formatDate(ts: any): { date: string, time: string } {
  if (!ts) return { date: '—', time: '—' };
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };
}

// ─── SKELETON LOADERS ──────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-[var(--border)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[var(--bg)] animate-pulse" />
        <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
      </div>
      <div className="h-8 w-24 bg-[var(--bg)] animate-pulse rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]/50">
      <td className="px-6 py-5"><div className="h-4 w-24 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-6 py-5">
        <div className="h-4 w-32 bg-[var(--bg)] animate-pulse rounded mb-2" />
        <div className="h-3 w-24 bg-[var(--bg)]/50 animate-pulse rounded" />
      </td>
      <td className="px-6 py-5">
        <div className="h-4 w-20 bg-[var(--bg)] animate-pulse rounded mb-1" />
        <div className="h-3 w-16 bg-[var(--bg)]/50 animate-pulse rounded" />
      </td>
      <td className="px-6 py-5"><div className="h-10 w-10 bg-[var(--bg)] animate-pulse rounded" /></td>
      <td className="px-6 py-5"><div className="h-6 w-16 bg-[var(--bg)] animate-pulse rounded-full" /></td>
      <td className="px-6 py-5"><div className="h-6 w-20 bg-[var(--bg)] animate-pulse rounded-full" /></td>
      <td className="px-6 py-5 text-right"><div className="h-4 w-16 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
      <td className="px-6 py-5 text-right"><div className="h-8 w-20 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
    </tr>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Date Filtering
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  // Pagination
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [moreOrders, setMoreOrders] = useState<FirestoreOrder[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const moreUnsubRef = useRef<(() => void) | null>(null);

  // Initial Subscription
  useEffect(() => {
    setLoading(true);
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (fromDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
    }
    if (toDate) {
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const unsub = subscribeToFilteredOrders(
      { startDate, endDate },
      (data, last) => {
        setOrders(data);
        setMoreOrders([]);
        setLastDoc(last);
        setHasMore(data.length === ORDERS_PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        setFetchError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [fromDate, toDate]);

  const handleLoadMore = () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (fromDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
    }
    if (toDate) {
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }

    if (moreUnsubRef.current) moreUnsubRef.current();
    moreUnsubRef.current = subscribeToMoreFilteredOrders(
      { startDate, endDate },
      lastDoc, 
      (data, last) => {
        setMoreOrders(prev => [...prev, ...data]);
        setLastDoc(last);
        setHasMore(data.length === ORDERS_PAGE_SIZE);
        setLoadingMore(false);
      }, 
      () => setLoadingMore(false)
    );
  };

  const allOrders = useMemo(() => {
    const seen = new Set(orders.map(o => o.id));
    return [...orders, ...moreOrders.filter(o => !seen.has(o.id))];
  }, [orders, moreOrders]);

  const filtered = useMemo(() => {
    let result = allOrders;

    // Search
    if (searchTerm) {
      result = result.filter(o => 
        o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter);
    }

    // Dates (handled natively by firestore query but keeping this guard just in case)
    if (fromDate || toDate) {
      result = result.filter(o => {
        const createdAt = (o as any).createdAt;
        const orderDate = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
        if (fromDate && orderDate < new Date(fromDate)) return false;
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
        return true;
      });
    }

    return result;
  }, [allOrders, searchTerm, statusFilter, fromDate, toDate]);

  // Quick Filter Logic
  const handleQuickFilter = (filter: typeof QUICK_FILTERS[0]) => {
    if (activeQuickFilter === filter.label && filter.type !== 'all') {
      setActiveQuickFilter(null);
      setFromDate('');
      setToDate('');
      return;
    }

    setActiveQuickFilter(filter.label);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const toDateString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (filter.type === 'all') {
      setFromDate('');
      setToDate('');
    } else if (filter.days === 0) {
      setFromDate(toDateString(today));
      setToDate(toDateString(today));
    } else if (filter.days === 1) { // yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      setFromDate(toDateString(yesterday));
      setToDate(toDateString(yesterday));
    } else if (filter.type === 'week') {
      // Monday to Sunday of the current week
      const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + distanceToMonday);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      setFromDate(toDateString(startOfWeek));
      setToDate(toDateString(endOfWeek));
    } else if (filter.type === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFromDate(toDateString(start));
      setToDate(toDateString(end));
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Order ID copied');
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const delivered = allOrders.filter(o => o.status === 'delivered').length;
    const revenue = allOrders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0);
    return { total, pending, delivered, revenue };
  }, [allOrders]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Orders Management</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Monitor and process your store's sales records</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] px-4 py-2 rounded-full shadow-sm border border-[var(--border)]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Live Updates Active</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? [1, 2, 3, 4].map(i => <SkeletonStat key={i} />) : (
          <>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-black hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-[var(--text-primary)]">
                  <Package size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Total Orders</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.total}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-orange-500 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <Clock size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Pending</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.pending}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-green-500 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <IndianRupee size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">₹{stats.revenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8_rgba(0,0,0,0.08)] border-l-4 border-blue-500 hover:translate-y-[-2px] transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Delivered</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.delivered}</p>
            </div>
          </>
        )}
      </div>

      {/* ── Filters Section ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input 
                type="text" 
                placeholder="Search Order ID, name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg)] border-none rounded-lg pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-40">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[var(--bg)] border-none rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <span className="text-[var(--text-muted)] text-xs font-bold">TO</span>
              <div className="relative flex-1 sm:w-40">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[var(--bg)] border-none rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 border-t border-gray-50 pt-6">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[var(--text-muted)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-2">Quick:</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map(q => (
                <button 
                  key={q.label}
                  onClick={() => handleQuickFilter(q)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                    activeQuickFilter === q.label 
                      ? "bg-black text-white border-black shadow-lg" 
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-black"
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[var(--text-muted)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mr-2">Status:</span>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                    statusFilter === opt.value
                      ? "bg-black text-white border-black shadow-lg" 
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-black"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto mobile-card-table bg-[var(--bg)] md:bg-transparent">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                <th className="px-6 py-5">Order ID</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Date & Time</th>
                <th className="px-6 py-5">Items</th>
                <th className="px-6 py-5">Payment</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : 
               filtered.length === 0 ? (
                 <tr>
                   <td colSpan={8} className="py-32 text-center">
                     <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[var(--bg)] rounded-full flex items-center justify-center text-gray-300 mb-4">
                          <ShoppingCart size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">No orders found</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your filters or search terms</p>
                     </div>
                   </td>
                 </tr>
               ) : (
                filtered.map((order) => {
                  const { date, time } = formatDate(order.createdAt);
                  const isUpdating = updatingId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-[var(--bg)]/60 transition-colors group">
                      <td className="px-6 py-5" data-label="Order ID">
                        <div className="flex items-center justify-end md:justify-start gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{order.orderId}</span>
                          <button 
                            onClick={() => copyToClipboard(order.orderId)}
                            className="p-1 hover:bg-[var(--bg-card)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5" data-label="Customer">
                        <div className="flex flex-col text-right md:text-left">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{order.customerName}</span>
                          <span className="text-[11px] text-[var(--text-muted)] font-medium">{order.customerEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5" data-label="Date & Time">
                        <div className="flex flex-col text-right md:text-left">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{date}</span>
                          <span className="text-[11px] text-[var(--text-muted)] font-medium uppercase">{time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5" data-label="Items">
                        <div className="flex items-center justify-end md:justify-start -space-x-3 overflow-hidden">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="relative w-8 h-10 bg-gray-100 border-2 border-white rounded-sm overflow-hidden flex-shrink-0">
                              {(item as any).imageUrl ? (
                                <Image src={(item as any).imageUrl} alt={item.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">P</div>
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="relative w-8 h-10 bg-black text-white text-[10px] flex items-center justify-center border-2 border-white rounded-sm font-bold flex-shrink-0">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5" data-label="Payment">
                        <div className="flex flex-col gap-1 items-end md:items-start">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                            ['paid'].includes(order.paymentStatus) ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5" data-label="Status">
                        <select 
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={cn(
                            "appearance-none px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer focus:outline-none border-none shadow-sm transition-all min-w-[120px] text-center",
                            STATUS_OPTIONS.find(opt => opt.value === order.status)?.color || "bg-gray-100 text-gray-700"
                          )}
                        >
                          {STATUS_OPTIONS.filter(o => o.value && getAvailableStatuses(order.status).includes(o.value as OrderStatus)).map(opt => (
                            <option key={opt.value} value={opt.value} className="text-[var(--text-primary)] bg-[var(--bg-card)]">{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right" data-label="Total">
                        <span className="text-sm font-bold text-[var(--text-primary)]">₹{order.total.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-5 text-right" data-label="Action">
                        <Link 
                          href={`/admin/orders/${order.id}`}
                          className="px-6 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all md:opacity-0 md:group-hover:opacity-100 shadow-md w-full md:w-auto text-center block md:inline-block"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ── */}
        <div className="px-6 py-6 bg-[var(--bg)] border-t border-gray-50 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {loading ? 'Processing...' : `Showing ${filtered.length} of ${allOrders.length} records`}
          </span>
          {hasMore && !loading && (
            <button 
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] hover:bg-[var(--bg)] transition-all shadow-sm"
            >
              {loadingMore ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={14} />}
              Load More Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Filter({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
