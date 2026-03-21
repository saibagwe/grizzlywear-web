'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToAllTickets,
  type FirestoreTicket,
  type TicketStatus,
} from '@/lib/firestore/ticketService';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: '' | TicketStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'open':        return 'bg-green-100 text-green-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'resolved':    return 'bg-purple-100 text-purple-800';
    case 'closed':      return 'bg-gray-100 text-gray-600';
    default:            return 'bg-gray-100 text-gray-700';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'high':   return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low':    return 'bg-gray-100 text-gray-600';
    default:       return 'bg-gray-100 text-gray-600';
  }
}

function categoryLabel(c: string) {
  switch (c) {
    case 'order-issue':    return 'Order Issue';
    case 'product-issue':  return 'Product Issue';
    case 'payment-issue':  return 'Payment Issue';
    case 'delivery-issue': return 'Delivery Issue';
    case 'other':          return 'Other';
    default:               return c;
  }
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-6 py-4"><div className="h-3.5 w-24 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4">
        <div className="h-3.5 w-32 bg-gray-200 animate-pulse rounded mb-1.5" />
        <div className="h-2.5 w-24 bg-gray-100 animate-pulse rounded" />
      </td>
      <td className="px-6 py-4"><div className="h-3.5 w-40 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-3.5 w-20 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-5 w-14 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4"><div className="h-3.5 w-20 bg-gray-200 animate-pulse rounded" /></td>
      <td className="px-6 py-4 text-right"><div className="h-3.5 w-10 bg-gray-200 animate-pulse rounded ml-auto" /></td>
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

export default function AdminTicketsPage() {
  const [tickets, setTickets]           = useState<FirestoreTicket[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | TicketStatus>('');

  // ── Real-time subscription ──
  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => setLoading(false), 10_000);

    const unsub = subscribeToAllTickets(
      (data) => {
        clearTimeout(timeoutId);
        setTickets(data);
        setFetchError(null);
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error('[AdminTickets] Firestore error:', err);
        setFetchError(`Firestore error (${(err as any).code ?? 'unknown'}): ${err.message}`);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
  }, []);

  // ── Filtered tickets ──
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  // ── Stats ──
  const openCount       = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in-progress').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Loading tickets…'
              : fetchError
              ? 'Error loading tickets'
              : `${tickets.length} total tickets — live real-time`}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {!loading && fetchError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to load tickets</p>
            <p className="text-xs text-red-600 mt-0.5 font-mono">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? (
          [1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total Tickets</span>
              </div>
              <p className="text-2xl font-light tracking-tight">{tickets.length}</p>
            </div>
            <div className={cn('border p-5', openCount > 0 ? 'bg-green-50/30 border-green-200' : 'bg-white border-gray-200')}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className={openCount > 0 ? 'text-green-400' : 'text-gray-400'} />
                <span className={cn('text-[10px] font-bold uppercase tracking-widest', openCount > 0 ? 'text-green-600' : 'text-gray-500')}>Open</span>
              </div>
              <p className={cn('text-2xl font-light tracking-tight', openCount > 0 ? 'text-green-700' : '')}>{openCount}</p>
            </div>
            <div className={cn('border p-5', inProgressCount > 0 ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-gray-200')}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className={inProgressCount > 0 ? 'text-blue-400' : 'text-gray-400'} />
                <span className={cn('text-[10px] font-bold uppercase tracking-widest', inProgressCount > 0 ? 'text-blue-600' : 'text-gray-500')}>In Progress</span>
              </div>
              <p className={cn('text-2xl font-light tracking-tight', inProgressCount > 0 ? 'text-blue-700' : '')}>{inProgressCount}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Showing</span>
              </div>
              <p className="text-2xl font-light tracking-tight">{filtered.length}</p>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#F9F9F9]">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search tickets, customers…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value as '' | TicketStatus)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors',
                  statusFilter === opt.value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                )}
              >
                {opt.label}
                {opt.value === 'open' && openCount > 0 && !loading && (
                  <span className="ml-1.5 bg-green-500 text-white rounded-full px-1.5 text-[9px]">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-24 text-center">
                    <p className="text-gray-400 font-light uppercase tracking-widest text-sm mb-1">
                      {searchTerm || statusFilter ? 'No results found' : 'No Tickets Yet'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {searchTerm || statusFilter
                        ? 'Try a different search or filter.'
                        : 'Support tickets will appear here as customers submit them.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="font-medium text-black hover:underline underline-offset-4 flex items-center gap-1 font-mono text-xs"
                      >
                        {ticket.ticketId}
                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 max-w-[160px] truncate">{ticket.customerName || '—'}</p>
                      <p className="text-[10px] text-gray-500 max-w-[160px] truncate">{ticket.customerEmail || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[200px] truncate text-gray-800">{ticket.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{categoryLabel(ticket.category)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', priorityColor(ticket.priority))}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', statusColor(ticket.status))}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(ticket.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-[#F9F9F9] flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${tickets.length} tickets`}
          </p>
        </div>
      </div>
    </div>
  );
}
