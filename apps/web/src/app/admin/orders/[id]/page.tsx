'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  MapPin,
  Mail,
  Phone,
  Package,
  CreditCard,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  type FirestoreOrder,
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/firestore/orderService';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'unpaid', 'refunded'];

function statusBadgeClass(status: string) {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function paymentBadgeClass(status: string) {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'refunded': return 'bg-blue-100 text-blue-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [selectedPayment, setSelectedPayment] = useState<PaymentStatus>('unpaid');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrderById(id).then((data) => {
      if (!data) {
        setNotFound(true);
      } else {
        setOrder(data);
        setSelectedStatus(data.status);
        setSelectedPayment(data.paymentStatus);
      }
      setLoading(false);
    });
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === order.status) return;
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(order.id, selectedStatus);
      setOrder((prev) => prev ? { ...prev, status: selectedStatus } : prev);
      toast.success(`Order status updated to "${selectedStatus}".`);
    } catch {
      toast.error('Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!order || selectedPayment === order.paymentStatus) return;
    setUpdatingPayment(true);
    try {
      await updatePaymentStatus(order.id, selectedPayment);
      setOrder((prev) => prev ? { ...prev, paymentStatus: selectedPayment } : prev);
      toast.success(`Payment status updated to "${selectedPayment}".`);
    } catch {
      toast.error('Failed to update payment status.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-light uppercase tracking-widest text-[var(--text-muted)] mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-xs font-bold uppercase tracking-widest underline underline-offset-4">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const itemTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="w-10 h-10 flex items-center justify-center border border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight font-mono">{order.orderId}</h1>
              <span className={cn('inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest', statusBadgeClass(order.status))}>
                {order.status}
              </span>
              <span className={cn('inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest', paymentBadgeClass(order.paymentStatus))}>
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 hover:bg-[var(--bg)] transition-colors"
        >
          <Printer size={14} /> Print
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8 flex flex-col-reverse gap-8">

        {/* ── Main Column ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Items */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 border border-[var(--border)]">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mt-1">
                          Size: {item.size} • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-right whitespace-nowrap">₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex justify-between items-end mt-auto pt-2">
                      <p className="text-xs text-[var(--text-secondary)] font-medium">Unit price</p>
                      <p className="font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-[#F9F9F9] p-6 border-t border-[var(--border)] space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="font-medium">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Shipping</span>
                <span className="font-medium">
                  {order.shipping === 0 ? <span className="text-green-600 font-bold text-xs uppercase">Free</span> : `₹${order.shipping.toLocaleString('en-IN')}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-[var(--border)] pt-3 mt-3">
                <span className="text-sm font-bold uppercase tracking-widest">Total</span>
                <span className="text-xl font-medium text-[var(--text-primary)]">₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-4">
              Update Order Status
            </h2>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    'px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors',
                    selectedStatus === s
                      ? 'bg-black text-white border-black'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-black'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus || selectedStatus === order.status}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {updatingStatus ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {updatingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </div>

          {/* Update Payment Status */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-4">
              Update Payment Status
            </h2>
            <div className="flex gap-2">
              {PAYMENT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedPayment(s)}
                  className={cn(
                    'px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors',
                    selectedPayment === s
                      ? 'bg-black text-white border-black'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-black'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={handleUpdatePayment}
              disabled={updatingPayment || selectedPayment === order.paymentStatus}
              className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              {updatingPayment ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {updatingPayment ? 'Updating...' : 'Update Payment'}
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Customer */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Customer</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{order.customerName || '—'}</p>
                  <p className="text-blue-600 hover:underline cursor-pointer text-xs mt-0.5">{order.customerEmail || '—'}</p>
                </div>
              </div>
              {order.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                  <p className="text-[var(--text-secondary)]">{order.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Shipping Address</h2>
            <div className="flex items-start gap-3 text-sm">
              <MapPin size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div className="text-[var(--text-secondary)] space-y-0.5">
                <p className="font-medium text-[var(--text-primary)]">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="pt-1 text-xs">Phone: {order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 pt-4 border-t border-gray-50">
              <Package size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Standard Delivery</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Payment</h2>
            <div className="flex items-start gap-3 text-sm">
              <CreditCard size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-[var(--text-primary)] capitalize">
                  {order.paymentMethod === 'razorpay' ? 'Online (Razorpay)' : order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                </p>
                <span className={cn('inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', paymentBadgeClass(order.paymentStatus))}>
                  {order.paymentStatus}
                </span>
                {order.razorpayPaymentId && (
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-1">ID: {order.razorpayPaymentId}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
