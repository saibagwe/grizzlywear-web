'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import {
  subscribeToTicket,
  addTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
  type FirestoreTicket,
  type TicketStatus,
  type TicketPriority,
} from '@/lib/firestore/ticketService';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'open':        return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'resolved':    return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'closed':      return 'bg-gray-100 text-[var(--text-secondary)] border-[var(--border)]';
    default:            return 'bg-gray-100 text-gray-700 border-[var(--border)]';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'high':   return 'bg-red-100 text-red-700 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':    return 'bg-gray-100 text-[var(--text-secondary)] border-[var(--border)]';
    default:       return 'bg-gray-100 text-[var(--text-secondary)] border-[var(--border)]';
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

function formatDateTime(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-gray-200 animate-pulse rounded', className)} />;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminTicketDetailPage() {
  const params = useParams();
  const ticketDocId = params?.id as string;
  const { firebaseUser, profile } = useAuthStore();

  const [ticket, setTicket] = useState<FirestoreTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Real-time ticket subscription ──
  useEffect(() => {
    if (!ticketDocId) return;
    setLoading(true);
    const unsub = subscribeToTicket(
      ticketDocId,
      (data) => {
        setTicket(data);
        setLoading(false);
      },
      (err) => {
        console.error('[AdminTicketDetail] Firestore error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [ticketDocId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  // ── Send reply ──
  const handleSendReply = async () => {
    if (!reply.trim() || !ticket || !firebaseUser) return;
    setSending(true);
    try {
      await addTicketMessage(ticket.id, {
        senderId: firebaseUser.uid,
        senderName: profile?.fullName || firebaseUser.displayName || 'Admin',
        senderRole: 'admin',
        text: reply.trim(),
      });
      setReply('');
      toast.success('Reply sent');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  // ── Status change ──
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(ticket.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Priority change ──
  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    setUpdatingPriority(true);
    try {
      await updateTicketPriority(ticket.id, newPriority);
      toast.success(`Priority updated to ${newPriority}`);
    } catch {
      toast.error('Failed to update priority');
    } finally {
      setUpdatingPriority(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-full mb-3" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-24">
        <p className="text-[var(--text-muted)] font-light uppercase tracking-widest text-sm mb-1">Ticket not found</p>
        <Link href="/admin/tickets" className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          ← Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
      >
        <ArrowLeft size={14} /> All Tickets
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <span className="font-mono">{ticket.ticketId}</span>
            <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border', statusColor(ticket.status))}>
              {ticket.status}
            </span>
            <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border', priorityColor(ticket.priority))}>
              {ticket.priority}
            </span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Description + Conversation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Original Description</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Conversation */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[#F9F9F9]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Conversation ({ticket.messages.length} {ticket.messages.length === 1 ? 'message' : 'messages'})
              </h3>
            </div>

            <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
              {ticket.messages.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] text-sm py-8">No messages yet. Send the first reply below.</p>
              ) : (
                ticket.messages.map((msg, idx) => (
                  <div key={idx} className={cn('flex gap-3', msg.senderRole === 'admin' ? 'flex-row-reverse' : '')}>
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                      msg.senderRole === 'admin' ? 'bg-black text-white' : 'bg-gray-200 text-[var(--text-secondary)]'
                    )}>
                      {msg.senderRole === 'admin' ? <Shield size={14} /> : <User size={14} />}
                    </div>
                    <div className={cn('flex-1 max-w-[80%]', msg.senderRole === 'admin' ? 'text-right' : '')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-xs font-bold', msg.senderRole === 'admin' ? 'text-[var(--text-primary)]' : 'text-gray-700')}>
                          {msg.senderName}
                        </span>
                        <span className={cn(
                          'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5',
                          msg.senderRole === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-[var(--text-secondary)]'
                        )}>
                          {msg.senderRole}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div className={cn(
                        'p-3 text-sm whitespace-pre-wrap leading-relaxed',
                        msg.senderRole === 'admin'
                          ? 'bg-black text-white'
                          : 'bg-[#F9F9F9] border border-[var(--border)] text-gray-800'
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[#F9F9F9]">
              <div className="flex gap-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="flex-1 border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSendReply();
                    }
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !reply.trim()}
                  className="self-end bg-black text-white px-4 py-3 hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Press Ctrl+Enter to send</p>
            </div>
          </div>
        </div>

        {/* Sidebar: Ticket Info + Controls */}
        <div className="space-y-4">
          {/* Ticket Info */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Ticket Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Customer</dt>
                <dd className="font-medium">{ticket.customerName}</dd>
                <dd className="text-xs text-[var(--text-secondary)]">{ticket.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Category</dt>
                <dd className="font-medium">{categoryLabel(ticket.category)}</dd>
              </div>
              {ticket.orderId && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Order ID</dt>
                  <dd className="font-medium font-mono">{ticket.orderId}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Created</dt>
                <dd className="font-medium">{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Updated</dt>
                <dd className="font-medium">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
            </div>
          </div>

          {/* Status Control */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Update Status</h3>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              disabled={updatingStatus}
              className={cn(
                'w-full border px-3 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none transition-colors cursor-pointer',
                statusColor(ticket.status),
                updatingStatus && 'opacity-50 cursor-wait'
              )}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            {updatingStatus && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Updating…
              </p>
            )}
          </div>

          {/* Priority Control */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Update Priority</h3>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
              disabled={updatingPriority}
              className={cn(
                'w-full border px-3 py-2.5 text-xs font-bold uppercase tracking-widest focus:outline-none transition-colors cursor-pointer',
                priorityColor(ticket.priority),
                updatingPriority && 'opacity-50 cursor-wait'
              )}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {updatingPriority && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Updating…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
