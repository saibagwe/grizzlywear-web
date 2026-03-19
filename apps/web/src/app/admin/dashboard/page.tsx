'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, Users, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeToAllOrders, type FirestoreOrder } from '@/lib/firestore/orderService';
import { subscribeToProducts } from '@/lib/firestore/productService';

function statusBadge(status: string) {
  switch (status) {
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'shipped': return 'bg-blue-100 text-blue-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = subscribeToAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    const unsubProducts = subscribeToProducts((prods) => setProductCount(prods.length));
    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp },
    { label: 'Total Orders', value: loading ? '—' : orders.length.toString(), icon: Package },
    { label: 'Products', value: loading ? '—' : productCount.toString(), icon: Users },
    { label: 'Pending Orders', value: loading ? '—' : pendingOrders.toString(), icon: AlertCircle, highlight: pendingOrders > 0 },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading live data...' : 'Live data from Firestore.'}
          </p>
        </div>
        <Link href="/admin/products/new" className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
          + Add Product
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cn(
              'bg-white border p-6 flex flex-col justify-between h-32 hover:border-black transition-colors',
              stat.highlight ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
            )}>
              <div className="flex justify-between items-start">
                <p className={cn('text-[10px] font-bold uppercase tracking-widest',  stat.highlight ? 'text-orange-500' : 'text-gray-400')}>{stat.label}</p>
                <Icon size={16} className={stat.highlight ? 'text-orange-400' : 'text-gray-400'} />
              </div>
              <p className={cn('text-2xl font-normal tracking-tight', stat.highlight ? 'text-orange-700' : 'text-gray-900')}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Revenue Overview</h2>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Analytics Chart (coming soon)</p>
          </div>
        </div>
        <div className="lg:col-span-1 bg-white border border-gray-200 p-6 h-[400px] flex flex-col items-center justify-center relative">
          <h2 className="absolute top-6 left-6 text-sm font-bold uppercase tracking-widest text-gray-900">Sales by Category</h2>
          <div className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/50 mt-12">
            <div className="w-32 h-32 rounded-full border-[16px] border-t-black border-r-gray-300 border-b-gray-200 border-l-gray-100 mb-6" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:underline underline-offset-4 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No orders yet. Orders will appear here as customers check out.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-black">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline underline-offset-4 font-mono text-xs">
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-gray-900">{order.customerName || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest', statusBadge(order.status))}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
