'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Package,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { subscribeToAllOrders, type FirestoreOrder } from '@/lib/firestore/orderService';
import { subscribeToProducts } from '@/lib/firestore/productService';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

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

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ─── REVENUE COMPUTATION ──────────────────────────────────────────────────────

function computeRevenueStats(orders: FirestoreOrder[]) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  let totalRevenue = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let totalOrders = orders.length;
  let pendingCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let confirmedCount = 0;
  let shippedCount = 0;

  for (const order of orders) {
    const orderDate = order.createdAt
      ? (order.createdAt as any)?.toDate
        ? (order.createdAt as any).toDate()
        : new Date(order.createdAt as any)
      : null;

    switch (order.status) {
      case 'pending': pendingCount++; break;
      case 'delivered': deliveredCount++; break;
      case 'cancelled': cancelledCount++; break;
      case 'confirmed': confirmedCount++; break;
      case 'shipped': shippedCount++; break;
    }

    if (order.status === 'delivered') {
      totalRevenue += order.total;
    }

    if (orderDate && order.status === 'delivered') {
      if (orderDate >= thisMonthStart) {
        revenueThisMonth += order.total;
      }
      if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
        revenueLastMonth += order.total;
      }
    }
  }

  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const averageOrderValue = nonCancelledOrders.length > 0
    ? nonCancelledOrders.reduce((s, o) => s + o.total, 0) / nonCancelledOrders.length
    : 0;

  const revenueChange = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : revenueThisMonth > 0 ? 100 : 0;

  return {
    totalRevenue, revenueThisMonth, revenueLastMonth, revenueChange,
    totalOrders, pendingCount, deliveredCount, cancelledCount, confirmedCount, shippedCount,
    averageOrderValue,
  };
}

// ─── DAILY REVENUE CHART DATA ─────────────────────────────────────────────────

function computeDailyRevenue(orders: FirestoreOrder[]) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Initialize all days
  const dailyMap = new Map<number, number>();
  for (let i = 1; i <= daysInMonth; i++) dailyMap.set(i, 0);

  orders.forEach(order => {
    if (order.status === 'cancelled') return;
    const d = order.createdAt
      ? (order.createdAt as any)?.toDate
        ? (order.createdAt as any).toDate()
        : new Date(order.createdAt as any)
      : null;
    if (d && d >= thisMonthStart && d.getMonth() === now.getMonth()) {
      const day = d.getDate();
      dailyMap.set(day, (dailyMap.get(day) || 0) + order.total);
    }
  });

  return Array.from(dailyMap.entries())
    .map(([day, amount]) => ({
      day: `${day}`,
      date: `${now.toLocaleDateString('en-US', { month: 'short' })} ${day}`,
      amount,
    }))
    .filter(d => parseInt(d.day) <= now.getDate() + 1); // Show up to today + 1
}

// ─── ORDER STATUS DONUT DATA ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  shipped: '#A855F7',
  delivered: '#22C55E',
  cancelled: '#EF4444',
};

function computeStatusDonut(stats: ReturnType<typeof computeRevenueStats>) {
  return [
    { name: 'Pending', value: stats.pendingCount, color: STATUS_COLORS.pending },
    { name: 'Confirmed', value: stats.confirmedCount, color: STATUS_COLORS.confirmed },
    { name: 'Shipped', value: stats.shippedCount, color: STATUS_COLORS.shipped },
    { name: 'Delivered', value: stats.deliveredCount, color: STATUS_COLORS.delivered },
    { name: 'Cancelled', value: stats.cancelledCount, color: STATUS_COLORS.cancelled },
  ].filter(d => d.value > 0);
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-gray-700/50 text-sm">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-base">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
}

// ─── STATUS ICON COMPONENT ────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending': return <Clock size={14} className="text-orange-500" />;
    case 'confirmed': return <CheckCircle2 size={14} className="text-blue-500" />;
    case 'shipped': return <Truck size={14} className="text-purple-500" />;
    case 'delivered': return <CheckCircle2 size={14} className="text-green-500" />;
    case 'cancelled': return <XCircle size={14} className="text-red-500" />;
    default: return <Clock size={14} />;
  }
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = subscribeToAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    const unsubProducts = subscribeToProducts((prods) => setProductCount(prods.length));
    return () => { unsubOrders(); unsubProducts(); };
  }, []);

  const stats = useMemo(() => computeRevenueStats(orders), [orders]);
  const dailyRevenue = useMemo(() => computeDailyRevenue(orders), [orders]);
  const statusDonut = useMemo(() => computeStatusDonut(stats), [stats]);
  const recentOrders = orders.slice(0, 5);
  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ─── Top Selling Products ───
  const topSellingProducts = useMemo(() => {
    const productMap = new Map<string, { id: string; name: string; image: string; units: number; revenue: number }>();
    
    orders.filter(o => o.status === 'delivered').forEach(order => {
      order.items.forEach(item => {
        const current = productMap.get(item.productId) || {
          id: item.productId,
          name: item.name,
          image: item.image,
          units: 0,
          revenue: 0
        };
        current.units += item.quantity;
        current.revenue += item.price * item.quantity;
        productMap.set(item.productId, current);
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [orders]);

  // Stat card definitions
  const statCards = [
    {
      label: 'Total Revenue',
      sublabel: 'Delivered orders',
      value: loading ? '—' : formatCurrencyFull(stats.totalRevenue),
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'This Month',
      sublabel: (() => {
        if (loading) return '';
        if (stats.revenueChange === 0 && stats.revenueThisMonth === 0) return 'No delivered orders';
        const sign = stats.revenueChange >= 0 ? '+' : '';
        return `${sign}${stats.revenueChange.toFixed(1)}% vs last month`;
      })(),
      value: loading ? '—' : formatCurrencyFull(stats.revenueThisMonth),
      icon: TrendingUp,
      iconColor: stats.revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500',
      iconBg: stats.revenueChange >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      trendUp: stats.revenueChange >= 0,
    },
    {
      label: 'Avg. Order Value',
      sublabel: 'Excl. cancelled',
      value: loading ? '—' : formatCurrencyFull(Math.round(stats.averageOrderValue)),
      icon: ShoppingCart,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
    },
    {
      label: 'Total Orders',
      sublabel: `${stats.pendingCount} pending`,
      value: loading ? '—' : stats.totalOrders.toString(),
      icon: Package,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      highlight: stats.pendingCount > 0,
    },
    {
      label: 'Delivered',
      sublabel: 'Completed',
      value: loading ? '—' : stats.deliveredCount.toString(),
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Products',
      sublabel: 'In catalogue',
      value: loading ? '—' : productCount.toString(),
      icon: BarChart3,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? 'Loading live data...' : 'Live data from Firestore — computed on the fly.'}
          </p>
        </div>
        <Link href="/admin/products/new" className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shrink-0">
          + Add Product
        </Link>
      </div>

      {/* ── Revenue Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cn(
              'bg-[var(--bg-card)] border border-[var(--border)] p-4 sm:p-5 flex flex-col gap-3 rounded-xl',
              'hover:border-[var(--text-muted)]/30 transition-all duration-200 group',
              (stat as any).highlight && 'ring-1 ring-orange-200/50'
            )}>
              <div className="flex items-center justify-between">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', stat.iconBg)}>
                  <Icon size={18} className={stat.iconColor} />
                </div>
                {(stat as any).trendUp !== undefined && (
                  <div className={cn('flex items-center gap-0.5', (stat as any).trendUp ? 'text-emerald-500' : 'text-red-500')}>
                    {(stat as any).trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1 truncate">{stat.label}</p>
              </div>
              {stat.sublabel && (
                <p className={cn(
                  'text-[10px] font-semibold uppercase tracking-widest truncate',
                  (stat as any).highlight ? 'text-orange-500' : 'text-[var(--text-muted)]/60'
                )}>{stat.sublabel}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-5 sm:p-6 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Revenue Overview</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mt-1">{currentMonthName} • Daily</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">Last month:</span>
                <span className="font-bold text-[var(--text-primary)]">{loading ? '—' : formatCurrencyFull(stats.revenueLastMonth)}</span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="h-[280px] sm:h-[320px] w-full bg-[var(--bg-hover)] animate-pulse rounded-lg" />
            ) : dailyRevenue.length > 0 ? (
              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="var(--text-muted)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="var(--text-muted)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                      width={55}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#22C55E"
                      strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#22C55E' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] sm:h-[320px] flex items-center justify-center text-[var(--text-muted)] text-sm">
                No revenue data for this month
              </div>
            )}
          </div>
        </div>

        {/* Order Status Donut */}
        <div className="lg:col-span-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[var(--border)]">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Order Status</h2>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mt-1">{stats.totalOrders} Total Orders</p>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="h-[200px] w-full bg-[var(--bg-hover)] animate-pulse rounded-lg" />
            ) : statusDonut.length > 0 ? (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDonut}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusDonut.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4">
                  {statusDonut.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-[var(--text-secondary)] truncate">{item.name}</span>
                      <span className="text-[11px] font-bold text-[var(--text-primary)] ml-auto tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[var(--text-muted)] text-sm">
                No orders yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Most Bought Items ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-[var(--border)] bg-[var(--bg)]/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Most Bought Items</h2>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mt-1">Based on delivered orders</p>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-[var(--bg-hover)] rounded-lg" />
                  <div className="flex-1 h-4 bg-[var(--bg-hover)] rounded" />
                </div>
              ))}
            </div>
          ) : topSellingProducts.length > 0 ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--bg)]/50 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4 w-16">Rank</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4 text-center">Total Units Sold</th>
                  <th className="px-6 py-4 text-right">Total Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                {topSellingProducts.map((p, index) => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-[var(--bg-hover)]/40 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/admin/products`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--bg)] rounded border border-[var(--border)] overflow-hidden relative shrink-0">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><Package size={14} /></div>
                          )}
                        </div>
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">{p.name || 'Unknown Product'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--bg-hover)] text-[var(--text-primary)] font-bold text-xs tabular-nums">
                        {p.units} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[var(--text-primary)] tabular-nums">
                      ₹{p.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sales data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Status Breakdown Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Pending', count: stats.pendingCount, color: 'text-amber-600', bg: 'bg-amber-500/10', borderColor: 'border-amber-200', icon: Clock },
          { label: 'Confirmed', count: stats.confirmedCount, color: 'text-blue-600', bg: 'bg-blue-500/10', borderColor: 'border-blue-200', icon: CheckCircle2 },
          { label: 'Shipped', count: stats.shippedCount, color: 'text-violet-600', bg: 'bg-violet-500/10', borderColor: 'border-violet-200', icon: Truck },
          { label: 'Delivered', count: stats.deliveredCount, color: 'text-emerald-600', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-200', icon: CheckCircle2 },
          { label: 'Cancelled', count: stats.cancelledCount, color: 'text-red-600', bg: 'bg-red-500/10', borderColor: 'border-red-200', icon: XCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={cn(
              'bg-[var(--bg-card)] border border-[var(--border)] p-3 sm:p-4 rounded-xl text-center transition-all hover:shadow-sm',
              item.count > 0 && item.label === 'Pending' && 'animate-pulse-subtle'
            )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', item.bg)}>
                <Icon size={16} className={item.color} />
              </div>
              <p className={cn('text-xl sm:text-2xl font-bold tabular-nums', item.color)}>
                {loading ? '—' : item.count}
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Recent Orders ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline underline-offset-4 flex items-center gap-1 shrink-0">
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders yet. Orders will appear here as customers check out.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--bg)]/50 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline underline-offset-4 font-mono text-xs">
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">{order.customerName || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full', statusBadge(order.status))}>
                          <StatusIcon status={order.status} />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[var(--text-primary)] tabular-nums">
                        ₹{order.total.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-[var(--border)]/50">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="block p-4 hover:bg-[var(--bg)]/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{order.orderId}</span>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full', statusBadge(order.status))}>
                      <StatusIcon status={order.status} />
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">{order.customerName || '—'}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <p className="font-bold text-[var(--text-primary)] tabular-nums">₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
