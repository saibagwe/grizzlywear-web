'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  ChevronRight,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToUserProfile,
  subscribeToUserAddresses,
  type UserProfile,
  type FirestoreAddress,
} from '@/lib/firestore/userService';
import { subscribeToUserOrders, type FirestoreOrder } from '@/lib/firestore/orderService';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFullDateTime(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass, trend }: any) {
  return (
    <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        <div className={cn('p-2.5 rounded-lg border', colorClass)}>
          <Icon size={18} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold tabular-nums tracking-tight mb-1">{value}</span>
        {trend && (
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-600">
            <TrendingUp size={10} /> {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 border-b last:border-0 border-gray-50">
      <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-lg text-gray-400 shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params?.id as string;

  const [customer, setCustomer] = useState<(UserProfile & { uid: string }) | null>(null);
  const [addresses, setAddresses] = useState<FirestoreAddress[]>([]);
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time subscriptions ──
  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const unsubProfile = subscribeToUserProfile(
      uid,
      (data) => {
        setCustomer(data);
        if (!data) setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubAddresses = subscribeToUserAddresses(
      uid,
      (data) => {
        setAddresses(data);
      }
    );

    const unsubOrders = subscribeToUserOrders(uid, (data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubAddresses();
      unsubOrders();
    };
  }, [uid]);

  // ── Stats ──
  const totalSpent = useMemo(() => orders.reduce((acc, o) => acc + o.total, 0), [orders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 size={32} className="text-gray-200 animate-spin" />
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-300">Loading customer details...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-24 space-y-6">
        <div className="p-6 bg-red-50 inline-block rounded-full">
          <ShieldX size={48} className="text-red-300" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Customer not found</h2>
          <p className="text-gray-500 mt-2">The requested customer document does not exist in Firestore.</p>
        </div>
        <Link 
          href="/admin/customers" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} /> Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-4">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} /> Back to Customer List
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 flex items-center justify-center rounded-2xl text-white font-bold text-xl uppercase shadow-lg shadow-black/5">
              {customer.fullName.charAt(0) || <User size={24} />}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{customer.fullName || 'Anonymous'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">ID: {customer.uid}</p>
                <div className="h-1 w-1 bg-gray-200 rounded-full" />
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-[0.1em] border border-green-100 rounded-full">
                  <ShieldCheck size={10} /> Active Member
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Orders"
          value={orders.length}
          icon={ShoppingBag}
          colorClass="bg-blue-50 text-blue-600 border-blue-100"
          trend={`${orders.length > 0 ? 'Since join' : 'No activity'}`}
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={CreditCard}
          colorClass="bg-green-50 text-green-600 border-green-100"
          trend="Lifetime Value"
        />
        <StatCard
          label="Average Order"
          value={formatCurrency(orders.length > 0 ? totalSpent / orders.length : 0)}
          icon={DollarSign}
          colorClass="bg-purple-50 text-purple-600 border-purple-100"
        />
        <StatCard
          label="Member Status"
          value={orders.length > 5 ? 'VIP' : 'Normal'}
          icon={TrendingUp}
          colorClass="bg-orange-50 text-orange-600 border-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-8">
          {/* Account Details */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Account Information</h3>
            </div>
            <div className="p-6">
              <DetailRow label="Full Name" value={customer.fullName} icon={User} />
              <DetailRow label="Email Address" value={customer.email} icon={Mail} />
              <DetailRow label="Phone Number" value={customer.phone} icon={Phone} />
              <DetailRow label="Date of Birth" value={customer.dateOfBirth} icon={Calendar} />
              <DetailRow label="Member Since" value={formatDate(customer.createdAt)} icon={Clock} />
              <DetailRow label="Last Profile Sync" value={formatFullDateTime(customer.updatedAt)} icon={TrendingUp} />
            </div>
          </section>

          {/* Activity Placeholder / Note */}
          <div className="p-6 bg-gray-900 rounded-2xl text-white shadow-xl shadow-gray-200 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Internal Note</h4>
              <p className="text-sm font-light text-gray-200 leading-relaxed italic">
                &quot;High value customer frequently ordering during seasonal sales. Prefers express delivery.&quot;
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors duration-700 rotate-12">
              <User size={120} />
            </div>
          </div>
        </div>

        {/* Right Column: Addresses & Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Saved Addresses */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Saved Delivery Addresses ({addresses.length})</h3>
            </div>
            <div className="p-6">
              {addresses.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <MapPin size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">No addresses saved</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="relative group p-4 bg-white border border-gray-100 rounded-xl hover:border-black transition-all hover:shadow-md">
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-black text-white text-[8px] font-bold uppercase tracking-widest rounded">DEFAULT</span>
                      )}
                      <div className="mb-3 p-2 bg-gray-50 inline-block rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                        <MapPin size={16} />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-widest mb-2">{addr.label || 'Home'}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">{addr.name}</p>
                        <p>{addr.line1}</p>
                        {addr.line2 && <p>{addr.line2}</p>}
                        <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-xs text-gray-400 pt-1 flex items-center gap-1.5 pt-2">
                          <Phone size={10} /> {addr.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Orders Overview */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recent Transactions</h3>
              <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:underline">View All Orders</Link>
            </div>
            <div className="p-0">
              {orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400">
                  <ShoppingBag size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">No orders placed yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">Order ID</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">Amount</th>
                        <th className="px-6 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <Link href={`/admin/orders/${order.id}`} className="text-xs font-mono font-bold text-gray-800 hover:underline">{order.orderId}</Link>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                          <td className="px-6 py-4 text-xs font-semibold tabular-nums text-gray-900">{formatCurrency(order.total)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              'inline-flex px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full border',
                              order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                              order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-blue-50 text-blue-700 border-blue-100'
                            )}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
