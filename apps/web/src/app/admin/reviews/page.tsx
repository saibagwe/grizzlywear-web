"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  subscribeToAllReviews, 
  updateReviewStatus, 
  deleteReviewData, 
  type FirestoreReview 
} from '@/lib/firestore/reviewService';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<FirestoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllReviews(
      (data) => {
        setReviews(data);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        toast.error('Failed to load reviews');
      }
    );
    return () => unsub();
  }, []);

  const pendingCount = useMemo(() => reviews.filter(r => r.status === 'pending').length, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filter === 'all') return reviews;
    return reviews.filter(r => r.status === filter);
  }, [reviews, filter]);

  // Handlers
  const handleApprove = async (id: string) => {
    try {
      await updateReviewStatus(id, 'approved');
      toast.success('Review approved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateReviewStatus(id, 'rejected');
      toast.success('Review rejected successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject review');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReviewData(id);
      toast.success('Review deleted successfully');
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 -mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Reviews directory</h1>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] shadow-sm">{reviews.length} Total</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex space-x-2 mb-8 border-b border-[var(--border)]">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2",
              filter === tab 
                ? "border-black text-black dark:border-white dark:text-white" 
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-[9px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-secondary)]">
                <th className="px-6 py-5">Product & Customer</th>
                <th className="px-6 py-5">Rating</th>
                <th className="px-6 py-5 w-1/3">Review</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">Loading reviews...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <MessageSquare size={48} className="text-[var(--text-muted)] mb-4" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">No matching reviews</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map(review => (
                  <tr key={review.id} className="hover:bg-[var(--bg)]/60 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{review.productName}</span>
                        <span className="text-xs text-[var(--text-muted)]">{review.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex text-yellow-500">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={14} className={s <= review.rating ? "fill-current" : "text-gray-200 fill-current"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-normal">
                      <div className="flex flex-col max-w-sm">
                        <span className="text-sm font-bold text-[var(--text-primary)] mb-1">{review.title}</span>
                        <span className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{review.comment}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm",
                        review.status === 'approved' && "bg-green-100 text-green-800 border-green-200 border",
                        review.status === 'pending' && "bg-yellow-100 text-yellow-800 border-yellow-200 border",
                        review.status === 'rejected' && "bg-red-100 text-red-800 border-red-200 border"
                      )}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{formatDate(review.createdAt)}</span>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                       {review.status !== 'approved' && (
                         <button 
                           onClick={() => handleApprove(review.id)}
                           className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-block"
                           title="Approve"
                         >
                           <CheckCircle size={18} />
                         </button>
                       )}
                       {review.status !== 'rejected' && (
                         <button 
                           onClick={() => handleReject(review.id)}
                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                           title="Reject"
                         >
                           <XCircle size={18} />
                         </button>
                       )}
                       <button 
                         onClick={() => setDeleteConfirmId(review.id)}
                         className="p-2 text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                         title="Delete"
                       >
                         <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-[var(--bg)] border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Showing {filteredReviews.length} records
            </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden rounded-xl shadow-2xl relative z-10 w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Delete Review</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Are you sure you want to delete this review? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-[var(--bg)] border-t border-[var(--border)] flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors uppercase tracking-widest"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
