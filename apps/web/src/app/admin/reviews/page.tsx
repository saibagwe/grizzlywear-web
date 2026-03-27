"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  MessageSquare,
  AlertCircle,
  Eye,
  X,
  BadgeCheck
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewReview, setViewReview] = useState<FirestoreReview | null>(null);

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
    let result = reviews;
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (ratingFilter !== 'all') {
      result = result.filter(r => r.rating === ratingFilter);
    }
    return result;
  }, [reviews, statusFilter, ratingFilter]);

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

  const handleDelete = async (id: string, images?: string[]) => {
    try {
      await deleteReviewData(id, images || []);
      toast.success('Review deleted successfully');
      setDeleteConfirmId(null);
      if (viewReview && viewReview.id === id) setViewReview(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-12 pt-4 px-1 sm:px-0">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Reviews directory</h1>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] shadow-sm">{reviews.length} Total</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
          >
            <option value="all">All Ratings</option>
            <option value={5}>5★</option>
            <option value={4}>4★</option>
            <option value={3}>3★</option>
            <option value={2}>2★</option>
            <option value={1}>1★</option>
          </select>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex space-x-2 mb-8 border-b border-[var(--border)]">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={cn(
              "px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2",
              statusFilter === tab 
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
                <th className="px-6 py-5 sticky left-0 z-10 bg-[var(--bg)]">Product & Customer</th>
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
                  <tr key={review.id} className="hover:bg-[var(--bg)]/60 transition-colors group">
                    <td className="px-6 py-5 sticky left-0 z-10 bg-[var(--bg-card)] group-hover:bg-[var(--bg)]/60 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.05)] md:shadow-none">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{review.productName || 'Product'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-[var(--text-muted)]">{review.userName || review.customerName}</span>
                          {review.verified && <span title="Verified Purchase"><BadgeCheck size={12} className="text-blue-500" /></span>}
                        </div>
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
                       <button 
                         onClick={() => setViewReview(review)}
                         className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                         title="View Details"
                       >
                         <Eye size={18} />
                       </button>
                       {review.status !== 'approved' && (
                         <button 
                           onClick={() => handleApprove(review.id as string)}
                           className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-block"
                           title="Approve"
                         >
                           <CheckCircle size={18} />
                         </button>
                       )}
                       {review.status !== 'rejected' && (
                         <button 
                           onClick={() => handleReject(review.id as string)}
                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                           title="Reject"
                         >
                           <XCircle size={18} />
                         </button>
                       )}
                       <button 
                         onClick={() => setDeleteConfirmId(review.id as string)}
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

      {/* Review Detail Modal */}
      {viewReview && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewReview(null)} />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden rounded-t-2xl sm:rounded-xl shadow-2xl relative z-10 w-full sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-20">
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Review Details</h3>
              <button onClick={() => setViewReview(null)} className="p-2 hover:bg-[var(--bg)] rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">Product</p>
                  <p className="font-medium text-[var(--text-primary)]">{viewReview.productName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">Customer</p>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-[var(--text-primary)]">{viewReview.userName || viewReview.customerName}</p>
                    {viewReview.verified && <span title="Verified Purchase"><BadgeCheck size={14} className="text-blue-500" /></span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">Status</p>
                  <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-gray-100 text-gray-800">{viewReview.status}</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-1">Date</p>
                  <p className="font-medium text-[var(--text-primary)]">{formatDate(viewReview.createdAt)}</p>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <div className="flex text-yellow-500 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={20} className={s <= viewReview.rating ? "fill-current" : "text-gray-200 fill-current"} />
                  ))}
                </div>
                <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">{viewReview.title}</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{viewReview.comment}</p>
              </div>

              {viewReview.images && viewReview.images.length > 0 && (
                <div className="border-t border-[var(--border)] pt-6">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-3">Attached Images</p>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {viewReview.images.map((img, i) => (
                      <div key={i} className="relative w-32 h-32 flex-shrink-0 border border-[var(--border)] overflow-hidden rounded-lg">
                        <Image src={img} alt={`Review Image ${i+1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden rounded-t-2xl sm:rounded-xl shadow-2xl relative z-10 w-full sm:max-w-sm animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
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
                onClick={() => handleDelete(deleteConfirmId, reviews.find(r => r.id === deleteConfirmId)?.images)}
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
