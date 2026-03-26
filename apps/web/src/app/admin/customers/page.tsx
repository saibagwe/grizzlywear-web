'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  IndianRupee, 
  ChevronRight,
  Users as UsersIcon,
  UserPlus,
  UserCheck,
  TrendingUp,
  ExternalLink,
  Search as SearchIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeToAllUsers, type UserProfile } from '@/lib/firestore/userService';
import { subscribeToAllOrders, type FirestoreOrder } from '@/lib/firestore/orderService';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)]/50">
      <div className="h-4 w-24 bg-[var(--bg)] animate-pulse rounded mb-4" />
      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[var(--bg)] animate-pulse" /><div className="space-y-2"><div className="h-4 w-32 bg-[var(--bg)] animate-pulse rounded" /><div className="h-3 w-20 bg-[var(--bg)]/50 animate-pulse rounded" /></div></div></td>
      <td className="px-6 py-5 cursor-default"><div className="h-4 w-40 bg-[var(--bg)] animate-pulse rounded mb-1" /><div className="h-3 w-24 bg-[var(--bg)]/50 animate-pulse rounded" /></td>
      <td className="px-6 py-5 text-center"><div className="h-6 w-12 bg-[var(--bg)] animate-pulse rounded-full mx-auto" /></td>
      <td className="px-6 py-5 text-right"><div className="h-4 w-20 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
      <td className="px-6 py-5 text-right"><div className="h-4 w-24 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
      <td className="px-6 py-5 text-right"><div className="h-8 w-10 bg-[var(--bg)] animate-pulse rounded ml-auto" /></td>
    </tr>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) setLoading(false);
    };

    const unsubUsers = subscribeToAllUsers((data) => {
      setUsers(data);
      markLoaded();
    }, () => { markLoaded(); });

    const unsubOrders = subscribeToAllOrders((data) => {
      setOrders(data);
      markLoaded();
    }, () => { markLoaded(); });

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  const userStats = useMemo(() => {
    const stats: Record<string, { orderCount: number; totalSpent: number }> = {};
    orders.forEach((order) => {
      if (!order.userId) return;
      if (!stats[order.userId]) stats[order.userId] = { orderCount: 0, totalSpent: 0 };
      stats[order.userId].orderCount += 1;
      stats[order.userId].totalSpent += order.total;
    });
    return stats;
  }, [orders]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const totalSpentAll = useMemo(() => orders.reduce((acc, o) => acc + o.total, 0), [orders]);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Customer Directory</h1>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] shadow-sm">{users.length} Registered</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : (
          <>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)]/50 group hover:translate-y-[-2px] transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total Users</span>
                <UsersIcon size={16} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{users.length}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)]/50 group hover:translate-y-[-2px] transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total Sales</span>
                <ShoppingBag size={16} className="text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{orders.length}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)]/50 group hover:translate-y-[-2px] transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total Value</span>
                <IndianRupee size={16} className="text-green-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">₹{totalSpentAll.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)]/50 group hover:translate-y-[-2px] transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Avg. Basket</span>
                <TrendingUp size={16} className="text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">₹{Math.round(totalSpentAll / (orders.length || 1)).toLocaleString('en-IN')}</p>
            </div>
          </>
        )}
      </div>

      {/* ── Search & Table ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
           <div className="relative w-full max-w-md">
             <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
             <input 
               type="text" 
               placeholder="Search by name, email or ID..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-[var(--bg)] border-none rounded-lg pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all"
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                <th className="px-6 py-5">Customer Instance</th>
                <th className="px-6 py-5">Engagement</th>
                <th className="px-6 py-5 text-center">Orders</th>
                <th className="px-6 py-5 text-right">Lifetime Spent</th>
                <th className="px-6 py-5 text-right">Join Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : 
               filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan={6} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <UsersIcon size={48} className="text-[var(--text-muted)] mb-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">No matching customers</h3>
                      </div>
                   </td>
                </tr>
               ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-[var(--bg)]/60 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm flex items-center justify-center text-[var(--text-primary)] font-bold text-xs uppercase shadow-inner">
                            {user.fullName.charAt(0) || <User size={14} />}
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--text-primary)]">{user.fullName || 'Anonymous'}</span>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">{user.uid.slice(0, 8)}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-medium">
                             <Mail size={12} className="text-gray-300" />
                             {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                               <Phone size={10} className="text-gray-300" />
                               {user.phone}
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="inline-flex items-center px-3 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-full text-[10px] font-bold text-[var(--text-secondary)] shadow-sm">
                          {userStats[user.uid]?.orderCount || 0} Orders
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <span className="text-sm font-bold text-[var(--text-primary)]">₹{(userStats[user.uid]?.totalSpent || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <Link 
                         href={`/admin/customers/${user.uid}`}
                         className="p-2 inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                       >
                         <ExternalLink size={16} />
                       </Link>
                    </td>
                  </tr>
                ))
               )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-[var(--bg)] border-t border-gray-50 flex items-center justify-between">
           <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
             Directory View: {filteredUsers.length} active records
           </span>
        </div>
      </div>
    </div>
  );
}
