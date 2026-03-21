'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Loader2, User, Mail, Phone, Calendar, ShoppingBag, DollarSign, ChevronRight } from 'lucide-react';
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Real-time subscriptions ──
  useEffect(() => {
    const unsubUsers = subscribeToAllUsers(
      (data) => {
        setUsers(data);
        setLoadingUsers(false);
      },
      () => setLoadingUsers(false)
    );

    const unsubOrders = subscribeToAllOrders(
      (data) => {
        setOrders(data);
        setLoadingOrders(false);
      },
      () => setLoadingOrders(false)
    );

    return () => {
      unsubUsers();
      unsubOrders();
    };
  }, []);

  // ── Calculate user stats from orders ──
  const userStats = useMemo(() => {
    const stats: Record<string, { orderCount: number; totalSpent: number }> = {};
    orders.forEach((order) => {
      const uid = order.userId;
      if (!uid) return;
      if (!stats[uid]) {
        stats[uid] = { orderCount: 0, totalSpent: 0 };
      }
      stats[uid].orderCount += 1;
      stats[uid].totalSpent += order.total;
    });
    return stats;
  }, [orders]);

  // ── Filtering ──
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all registered account holders.</p>
        </div>
        <div className="flex items-center gap-6 bg-white border border-gray-200 px-6 py-4 rounded-xl shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Registered</span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">
              {loadingUsers ? '—' : users.length}
            </span>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="p-2.5 bg-gray-50 rounded-lg">
            <User size={20} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black transition-colors rounded-lg"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Customer Info</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Orders</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Joined</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers || loadingOrders ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 w-8 bg-gray-100 rounded mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-20 bg-gray-100 rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 w-24 bg-gray-100 rounded ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-16 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Users size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 text-sm">No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 flex items-center justify-center rounded-full text-gray-500 font-bold text-xs uppercase">
                          {user.fullName.charAt(0) || <User size={14} />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors">{user.fullName || 'Anonymous User'}</div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">ID: {user.uid.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail size={12} className="text-gray-300" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone size={12} className="text-gray-300" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded text-xs font-semibold text-gray-700 border border-gray-100">
                        <ShoppingBag size={12} className="text-gray-400" />
                        {userStats[user.uid]?.orderCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">
                        {formatCurrency(userStats[user.uid]?.totalSpent || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-xs text-gray-500">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/customers/${user.uid}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black border border-transparent hover:border-gray-200 rounded bg-transparent hover:bg-white transition-all shadow-none hover:shadow-sm"
                      >
                        Details <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
