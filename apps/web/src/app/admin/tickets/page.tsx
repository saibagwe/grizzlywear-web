'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ArrowUpRight, 
  MessageSquare, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Inbox,
  Filter,
  ArrowRight,
  Copy,
  ExternalLink,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  subscribeToAllTickets,
  type FirestoreTicket,
  type TicketStatus,
} from '@/lib/firestore/ticketService';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: '' | TicketStatus; label: string; color: string }[] = [
  { value: '', label: 'All', color: 'bg-gray-100 text-gray-700' },
  { value: 'open', label: 'Open', color: 'bg-green-100 text-green-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-purple-100 text-purple-700' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-500' },
];

const CATEGORY_MAP: Record<string, string> = {
  'order-issue': 'Order Issue',
  'product-issue': 'Product Issue',
  'payment-issue': 'Payment Issue',
  'delivery-issue': 'Delivery Issue',
  'other': 'General Inquiry',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50">
      <div className="h-4 w-24 bg-gray-50 animate-pulse rounded mb-4" />
      <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      <td className="px-6 py-5"><div className="h-4 w-24 bg-gray-50 animate-pulse rounded" /></td>
      <td className="px-6 py-5"><div className="h-4 w-32 bg-gray-50 animate-pulse rounded mb-1.5" /><div className="h-3 w-20 bg-gray-50/50 animate-pulse rounded" /></td>
      <td className="px-6 py-5"><div className="h-4 w-40 bg-gray-50 animate-pulse rounded" /></td>
      <td className="px-6 py-5"><div className="h-5 w-16 bg-gray-50 animate-pulse rounded-full" /></td>
      <td className="px-6 py-5 text-right"><div className="h-8 w-10 bg-gray-50 animate-pulse rounded ml-auto" /></td>
    </tr>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<FirestoreTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | TicketStatus>('');

  useEffect(() => {
    const unsub = subscribeToAllTickets(
      (data) => {
        setTickets(data);
        setLoading(false);
      },
      (err) => {
        console.error('[AdminTickets] Firestore error:', err);
        setFetchError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch = !searchTerm || 
        t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = !statusFilter || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  }, [tickets]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Ticket ID copied');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#1A1A2E] tracking-tight">Support Desk</h1>
          <span className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 shadow-sm">{tickets.length} Inquiries</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A2E]">Monitoring Live Incidents</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : (
          <>
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-black hover:translate-y-[-2px] transition-transform">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Tickets</span>
                  <Inbox size={16} className="text-gray-400" />
               </div>
               <p className="text-3xl font-bold text-[#1A1A2E]">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-green-500 hover:translate-y-[-2px] transition-transform">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Open & New</span>
                  <AlertCircle size={16} className="text-green-500" />
               </div>
               <p className="text-3xl font-bold text-[#1A1A2E]">{stats.open}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-blue-500 hover:translate-y-[-2px] transition-transform">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">In Progress</span>
                  <Clock size={16} className="text-blue-500" />
               </div>
               <p className="text-3xl font-bold text-[#1A1A2E]">{stats.inProgress}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-l-4 border-purple-500 hover:translate-y-[-2px] transition-transform">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Resolved</span>
                  <CheckCircle2 size={16} className="text-purple-500" />
               </div>
               <p className="text-3xl font-bold text-[#1A1A2E]">{stats.resolved}</p>
            </div>
          </>
        )}
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
           <div className="relative w-full max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search by Ticket ID, name or subject..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-[#F8F9FA] border-none rounded-lg pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-black transition-all"
             />
           </div>
           <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">Filter By Status:</span>
              <div className="flex flex-wrap gap-2">
                 {STATUS_OPTIONS.map(opt => (
                   <button 
                     key={opt.value}
                     onClick={() => setStatusFilter(opt.value)}
                     className={cn(
                       "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                       statusFilter === opt.value
                         ? "bg-black text-white border-black shadow-lg" 
                         : "bg-white text-gray-500 border-gray-100 hover:border-black"
                     )}
                   >
                     {opt.label}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-100 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                <th className="px-6 py-5">Incident Reference</th>
                <th className="px-6 py-5">Citizen / Customer</th>
                <th className="px-6 py-5">Subject & Intent</th>
                <th className="px-6 py-5">Classification</th>
                <th className="px-6 py-5">Priority</th>
                <th className="px-6 py-5">State</th>
                <th className="px-6 py-5 text-right">Filed On</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />) : 
                filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-32 text-center text-gray-400">
                       <div className="flex flex-col items-center justify-center opacity-30">
                          <Inbox size={48} className="mb-4" />
                          <h3 className="text-sm font-bold uppercase tracking-widest">No matching inquiries</h3>
                       </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-[#F8F9FA]/60 transition-colors group">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1A1A2E]">{ticket.ticketId}</span>
                            <button onClick={() => copyToClipboard(ticket.ticketId)} className="p-1 text-gray-300 hover:text-black opacity-0 group-hover:opacity-100">
                               <Copy size={12} />
                            </button>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">
                                {ticket.customerName.charAt(0) || '?'}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#1A1A2E]">{ticket.customerName}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{ticket.customerEmail}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm text-gray-700 max-w-[240px] truncate font-medium">{ticket.subject}</p>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-100 px-3 py-1 rounded-full">{CATEGORY_MAP[ticket.category] || ticket.category}</span>
                       </td>
                       <td className="px-6 py-5">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                            ticket.priority === 'high' ? "bg-red-50 text-red-600" : ticket.priority === 'medium' ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-500"
                          )}>
                            {ticket.priority}
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <div className={cn(
                            "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            STATUS_OPTIONS.find(o => o.value === ticket.status)?.color || "bg-gray-50 text-gray-500 border-gray-100"
                          )}>
                             {ticket.status}
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(ticket.createdAt)}</span>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <Link href={`/admin/tickets/${ticket.id}`} className="p-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100 shadow-md inline-flex items-center gap-2">
                             Respond <ArrowRight size={12} />
                          </Link>
                       </td>
                    </tr>
                  ))
                )
               }
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-[#F8F9FA] border-t border-gray-50 flex items-center justify-between">
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
             Incidents Monitor: {filtered.length} active sessions
           </span>
        </div>
      </div>
    </div>
  );
}
