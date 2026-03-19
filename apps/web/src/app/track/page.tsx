'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Package, Search, Truck, MapPin, CheckCircle2, XCircle, Clock, ShoppingBag, CreditCard, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  subscribeToOrderByOrderId,
  type FirestoreOrder,
  type OrderStatus,
} from '@/lib/firestore/orderService';

// ─── Timeline step definitions ───────────────────────────────────────────────

const STEPS: { key: OrderStatus | 'placed'; label: string }[] = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

function getCompletedIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
      return 0; // only "Order Placed" completed
    case 'processing':
      return 1;
    case 'shipped':
      return 2;
    case 'delivered':
      return 3;
    default:
      return -1;
  }
}

function statusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'Pending' },
    processing: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', label: 'Processing' },
    shipped: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', label: 'In Transit' },
    delivered: { bg: 'bg-green-50 border-green-100', text: 'text-green-700', label: 'Delivered' },
    cancelled: { bg: 'bg-red-50 border-red-100', text: 'text-red-600', label: 'Cancelled' },
  };
  return map[status] || map.pending;
}

function formatDate(ts: unknown): string {
  if (!ts) return '—';
  try {
    const d = typeof (ts as any)?.toDate === 'function' ? (ts as any).toDate() : new Date(ts as any);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatDateTime(ts: unknown): string {
  if (!ts) return '—';
  try {
    const d = typeof (ts as any)?.toDate === 'function' ? (ts as any).toDate() : new Date(ts as any);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const autoFetchedRef = useRef(false);

  // ── Cleanup subscription on unmount ──
  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  // ── Auto-fill from URL ?orderId=xxx ──
  useEffect(() => {
    const urlOrderId = searchParams.get('orderId');
    if (urlOrderId && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      setOrderId(urlOrderId);
      startTracking(urlOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function startTracking(id: string) {
    const trimmed = id.trim();
    if (!trimmed) {
      toast.error('Please enter an Order ID.');
      return;
    }

    // Cleanup previous subscription
    unsubRef.current?.();
    setIsSearching(true);
    setHasSearched(false);
    setOrder(null);
    setNotFound(false);

    const unsub = subscribeToOrderByOrderId(
      trimmed,
      (fetchedOrder) => {
        setIsSearching(false);
        setHasSearched(true);
        if (fetchedOrder) {
          setOrder(fetchedOrder);
          setNotFound(false);
        } else {
          setOrder(null);
          setNotFound(true);
        }
      },
      () => {
        setIsSearching(false);
        setHasSearched(true);
        setNotFound(true);
        toast.error('Failed to fetch order. Please try again.');
      }
    );
    unsubRef.current = unsub;
  }

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    startTracking(orderId);
  };

  const handleReset = () => {
    unsubRef.current?.();
    setHasSearched(false);
    setOrder(null);
    setNotFound(false);
    setOrderId('');
    autoFetchedRef.current = false;
  };

  const badge = order ? statusBadge(order.status) : null;
  const completedIdx = order ? getCompletedIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#F9F9F9]">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-4 uppercase text-center">Track Your Order</h1>
        <p className="text-gray-500 text-sm text-center mb-12 max-w-md mx-auto">
          Enter your order number below to see the current status of your shipment.
        </p>

        {/* ── Search Form (always visible) ── */}
        <div className="bg-white border border-gray-200 p-8 sm:p-12 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <form onSubmit={handleTrack} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Order Number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. GW-12345678"
                  className="w-full border border-gray-200 pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-black transition-colors"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Track Package <Search size={16} /></>
              )}
            </button>
          </form>
        </div>

        {/* ── Loading state ── */}
        {isSearching && (
          <div className="text-center py-12 animate-in fade-in duration-300">
            <span className="inline-block w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></span>
            <p className="text-sm text-gray-500">Looking up your order...</p>
          </div>
        )}

        {/* ── Not Found ── */}
        {hasSearched && notFound && !isSearching && (
          <div className="bg-white border border-gray-200 p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium mb-2">Order not found</h2>
            <p className="text-sm text-gray-500 mb-6">Please check your Order ID and try again.</p>
            <button
              onClick={handleReset}
              className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:underline underline-offset-4"
            >
              Try Another Order
            </button>
          </div>
        )}

        {/* ── Order Found ── */}
        {hasSearched && order && !isSearching && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* Header Status */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 opacity-5 pointer-events-none">
                {isCancelled ? <XCircle size={200} /> : <Truck size={200} />}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-2 uppercase">
                    {isCancelled ? 'Cancelled' : badge?.label}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Order {order.orderId} • Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className={cn(
                  'px-4 py-2 text-xs font-bold uppercase tracking-widest border flex items-center gap-2',
                  isCancelled
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : `${badge?.bg} ${badge?.text}`
                )}>
                  {isCancelled ? <XCircle size={14} /> : order.status === 'delivered' ? <CheckCircle2 size={14} /> : <Truck size={14} />}
                  {isCancelled ? 'Cancelled' : badge?.label}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {isCancelled ? (
              <div className="bg-white border border-red-200 p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-8">Order Status</h3>
                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100">
                  <XCircle size={28} className="text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-red-600">Order Cancelled</p>
                    <p className="text-xs text-red-500 mt-1">This order has been cancelled. If you have questions, please contact support.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-8">Tracking Timeline</h3>

                <div className="relative border-l border-gray-200 ml-4 space-y-10 pb-4">
                  {STEPS.map((step, idx) => {
                    const isCompleted = idx <= completedIdx;
                    const isCurrent = idx === completedIdx;
                    return (
                      <div key={step.key} className="relative pl-8">
                        <span className={cn(
                          'absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white',
                          isCompleted ? 'bg-black text-white' : 'bg-gray-200 text-transparent',
                          isCurrent && 'bg-blue-500 text-white'
                        )}>
                          {isCompleted && !isCurrent ? <CheckCircle2 size={12} strokeWidth={3} /> : null}
                          {isCurrent ? (
                            step.key === 'shipped' ? <Truck size={10} strokeWidth={3} /> :
                            step.key === 'delivered' ? <CheckCircle2 size={10} strokeWidth={3} /> :
                            <Clock size={10} strokeWidth={3} />
                          ) : null}
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className={cn(
                              'text-sm font-bold uppercase tracking-widest transition-colors',
                              isCompleted ? 'text-gray-900' : 'text-gray-400'
                            )}>{step.label}</p>
                            {isCurrent && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                                <MapPin size={12} /> Current status
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 text-left sm:text-right">
                            {isCompleted ? (
                              <p>{isCurrent ? formatDateTime(order.updatedAt || order.createdAt) : formatDate(order.createdAt)}</p>
                            ) : (
                              <p>Pending</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white border border-gray-200 p-6 sm:p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                <ShoppingBag size={16} /> Items ({order.items.length})
              </h3>
              <div className="space-y-6">
                {order.items.map((item, idx) => (
                  <div key={`${order.id}-item-${idx}`} className="flex gap-4">
                    <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0 border border-gray-200">
                      {item.image
                        ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">IMG</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                        {item.size && `Size: ${item.size} | `}Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-2">₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address + Order Summary side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipping Address */}
              <div className="bg-white border border-gray-200 p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                  <MapPin size={16} /> Shipping Address
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-black">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && <p className="pt-2">Phone: {order.shippingAddress.phone}</p>}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-gray-200 p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6 flex items-center gap-2">
                  <CreditCard size={16} /> Order Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium">{order.shipping > 0 ? `₹${order.shipping.toLocaleString('en-IN')}` : 'Free'}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>−₹{order.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                    <span className="font-bold uppercase tracking-widest text-xs">Total</span>
                    <span className="font-bold">₹{order.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium uppercase text-xs tracking-widest">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className="text-center pt-4">
              <button
                onClick={handleReset}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:underline underline-offset-4"
              >
                Track Another Order
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
