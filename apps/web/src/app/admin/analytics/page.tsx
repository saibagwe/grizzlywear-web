'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryId?: string;
  imageUrl?: string;
  productId?: string;
}

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: any;
  items: OrderItem[];
}

interface UserDoc {
  id: string;
  createdAt: any;
}

interface ProductDoc {
  id: string;
  name: string;
  price: number;
}

// ─── COLORS ───────────────────────────────────────────────────────────────────

const PALETTE = {
  emerald: '#22C55E',
  blue: '#3B82F6',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  red: '#EF4444',
  teal: '#14B8A6',
  indigo: '#6366F1',
  pink: '#EC4899',
  sky: '#0EA5E9',
  orange: '#F97316',
};

const STATUS_COLORS: Record<string, string> = {
  pending: PALETTE.amber,
  confirmed: PALETTE.blue,
  shipped: PALETTE.violet,
  delivered: PALETTE.emerald,
  cancelled: PALETTE.red,
};

const CHART_BAR_COLORS = [PALETTE.emerald, PALETTE.blue, PALETTE.violet, PALETTE.amber, PALETTE.teal];

// ─── SKELETON LOADERS ─────────────────────────────────────────────────────────

function SkeletonLoader({ height = '300px' }: { height?: string }) {
  return (
    <div className="w-full bg-[var(--bg-hover)] animate-pulse rounded-lg" style={{ height }} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-xl flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] animate-pulse" />
        <div className="h-4 w-20 bg-[var(--bg-hover)] animate-pulse rounded" />
      </div>
      <div className="h-8 w-28 bg-[var(--bg-hover)] animate-pulse rounded mt-1" />
    </div>
  );
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────

function getDateFromTimestamp(ts: any): Date {
  if (!ts) return new Date(0);
  return ts?.toDate ? ts.toDate() : new Date(ts);
}

type DateRange = '7d' | '30d' | '3m' | 'all';

// ─── CUSTOM TOOLTIPS ──────────────────────────────────────────────────────────

function PremiumTooltip({ active, payload, label, prefix = '' }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/30 backdrop-blur-sm">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</p>
        {payload.map((item: any, i: number) => (
          <p key={i} className="font-bold text-sm" style={{ color: item.color || '#fff' }}>
            {prefix}{Number(item.value).toLocaleString('en-IN')}
            {item.name && payload.length > 1 && (
              <span className="text-gray-400 text-[10px] ml-2 font-normal">{item.name}</span>
            )}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function PieTooltipRenderer({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/30">
        <p className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{payload[0].name}</span>
        </p>
        <p className="font-bold text-lg">{payload[0].value}</p>
      </div>
    );
  }
  return null;
}

// ─── CHART CARD WRAPPER ───────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden', className)}>
      <div className="p-5 sm:p-6 border-b border-[var(--border)]">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mt-1">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // ─── Fetch Data ───
  useEffect(() => {
    let unsubOrders: () => void;
    let unsubUsers: () => void;
    let unsubProducts: () => void;

    try {
      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(data);
        setLoading(false);
      }, (err) => {
        console.error("Orders fetch error:", err);
        setError("Failed to fetch orders data.");
        setLoading(false);
      });

      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserDoc));
        setUsers(data);
      }, (err) => {
        console.error("Users fetch error:", err);
        setError("Failed to fetch users data.");
      });

      unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductDoc));
        setProducts(data);
      }, (err) => {
        console.error("Products fetch error:", err);
        setError("Failed to fetch products data.");
      });
    } catch (err) {
      setError("Failed to initialize database listeners");
      setLoading(false);
    }

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubUsers) unsubUsers();
      if (unsubProducts) unsubProducts();
    };
  }, []);

  // ─── Filtered Data ───
  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
    if (dateRange === '3m') cutoff.setMonth(now.getMonth() - 3);
    return orders.filter(o => getDateFromTimestamp(o.createdAt) >= cutoff);
  }, [orders, dateRange]);

  const filteredUsers = useMemo(() => {
    if (dateRange === 'all') return users;
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
    if (dateRange === '3m') cutoff.setMonth(now.getMonth() - 3);
    return users.filter(u => {
      if (!u.createdAt) return true;
      return getDateFromTimestamp(u.createdAt) >= cutoff;
    });
  }, [users, dateRange]);

  // ─── Metrics ───
  const totalRevenue = filteredOrders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.total || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const averageOrderValue = totalOrdersCount > 0
    ? filteredOrders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0) / filteredOrders.filter(o => o.status !== 'cancelled').length
    : 0;
  const totalCustomers = filteredUsers.length;

  // ─── CHART 1 — Revenue Over Time (Line) ───
  const revenueOverTime = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      const d = getDateFromTimestamp(o.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(dateStr, (map.get(dateStr) || 0) + (o.total || 0));
    });
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount })).reverse();
  }, [filteredOrders]);

  // ─── CHART 2 — Orders Over Time (Bar) ───
  const ordersOverTime = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const d = getDateFromTimestamp(o.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).reverse();
  }, [filteredOrders]);

  // ─── CHART 3 — Order Status Breakdown (Donut) ───
  const orderStatusBreakdown = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    filteredOrders.forEach(o => {
      let st = o.status;
      if ((st as any) === 'processing') st = 'confirmed';
      if (counts[st] !== undefined) counts[st]++;
    });
    return Object.entries(counts).filter(([_, count]) => count > 0).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS],
    }));
  }, [filteredOrders]);

  // ─── CHART 4 — Monthly Revenue Comparison (last 6 months) ───
  const monthlyRevenueComparison = useMemo(() => {
    const now = new Date();
    const months: { label: string; month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    return months.map(m => {
      const revenue = orders
        .filter(o => o.status !== 'cancelled')
        .filter(o => {
          const d = getDateFromTimestamp(o.createdAt);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const orderCount = orders.filter(o => {
        const d = getDateFromTimestamp(o.createdAt);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      }).length;

      return { month: m.label, revenue, orders: orderCount };
    });
  }, [orders]);

  // ─── CHART 5 — Top 5 Selling Products (Bar) ───
  const topProductsByQty = useMemo(() => {
    const map = new Map<string, { name: string; units: number; revenue: number; image?: string }>();
    filteredOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      order.items?.forEach(item => {
        const key = item.productId || item.id || item.name;
        const current = map.get(key) || { name: item.name, units: 0, revenue: 0, image: item.imageUrl };
        const qty = item.quantity || 1;
        current.units += qty;
        current.revenue += (item.price || 0) * qty;
        if (!current.name && item.name) current.name = item.name;
        map.set(key, current);
      });
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [filteredOrders]);

  // ─── CHART 6 — New Customers Over Time (Line) ───
  const newCustomersOverTime = useMemo(() => {
    const map = new Map<string, number>();
    filteredUsers.forEach(u => {
      if (!u.createdAt) return;
      const d = getDateFromTimestamp(u.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).reverse();
  }, [filteredUsers]);

  // ─── CHART 7 — Revenue Trend (12 months) Area ───
  const revenueTrend12Months = useMemo(() => {
    const now = new Date();
    const months: { label: string; month: number; year: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    return months.map(m => {
      const revenue = orders
        .filter(o => o.status !== 'cancelled')
        .filter(o => {
          const d = getDateFromTimestamp(o.createdAt);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
      return { month: m.label, revenue };
    });
  }, [orders]);

  // ─── CHART 8 — Revenue by Category (Horizontal Bar) ───
  const categoryRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(order => {
      order.items?.forEach(item => {
        const cat = item.categoryId || 'Uncategorized';
        const itemRev = (item.price || 0) * (item.quantity || 1);
        map.set(cat, (map.get(cat) || 0) + itemRev);
      });
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredOrders]);

  // ─── Common chart axis/grid props ───
  const commonAxisProps = {
    stroke: 'var(--text-muted)',
    fontSize: 10,
    tickLine: false as const,
    axisLine: false as const,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics & Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Real-time insights across your entire store
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-lg gap-0.5">
          {(['7d', '30d', '3m', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all',
                dateRange === range
                  ? 'bg-[var(--text-primary)] text-[var(--bg-card)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              )}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '3m' ? '3 Months' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            {[
              { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Orders', value: totalOrdersCount.toLocaleString('en-IN'), icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Avg. Order Value', value: `₹${Math.round(averageOrderValue).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { label: 'Total Customers', value: totalCustomers.toLocaleString('en-IN'), icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-xl hover:border-[var(--text-muted)]/30 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', card.bg)}>
                      <Icon size={18} className={card.color} />
                    </div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{card.label}</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── CHARTS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* 1. Revenue Over Time — Area Chart */}
        <ChartCard title="Revenue Over Time" subtitle="Daily non-cancelled order revenue">
          {loading ? <SkeletonLoader /> : (
            <div className="h-[280px] sm:h-[320px] w-full">
              {revenueOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE.emerald} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={PALETTE.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" {...commonAxisProps} dy={8} interval="preserveStartEnd" />
                    <YAxis {...commonAxisProps} tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} width={55} />
                    <Tooltip content={<PremiumTooltip prefix="₹" />} />
                    <Area type="monotone" dataKey="amount" stroke={PALETTE.emerald} strokeWidth={2.5} fill="url(#areaGradGreen)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: PALETTE.emerald }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </ChartCard>

        {/* 2. Orders Over Time — Bar Chart */}
        <ChartCard title="Orders Count Over Time" subtitle="All orders by day">
          {loading ? <SkeletonLoader /> : (
            <div className="h-[280px] sm:h-[320px] w-full">
              {ordersOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE.blue} stopOpacity={1} />
                        <stop offset="100%" stopColor={PALETTE.blue} stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" {...commonAxisProps} dy={8} interval="preserveStartEnd" />
                    <YAxis {...commonAxisProps} allowDecimals={false} width={35} />
                    <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'var(--bg-hover)', opacity: 0.5 }} />
                    <Bar dataKey="count" fill="url(#barGradBlue)" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </ChartCard>

        {/* 3. Order Status Breakdown — Donut */}
        <ChartCard title="Order Status Breakdown" subtitle="Distribution by status">
          {loading ? <SkeletonLoader /> : (
            <div className="h-[280px] sm:h-[320px] w-full">
              {orderStatusBreakdown.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-6">
                  <div className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {orderStatusBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltipRenderer />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-3 sm:gap-2.5 flex-wrap justify-center">
                    {orderStatusBreakdown.map((stat) => (
                      <div key={stat.name} className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                        <span className="text-xs text-[var(--text-secondary)] min-w-[70px]">{stat.name}</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </ChartCard>

        {/* 4. Monthly Revenue Comparison — Bar Chart (last 6 months) */}
        <ChartCard title="Monthly Revenue Comparison" subtitle="Last 6 months">
          {loading ? <SkeletonLoader /> : (
            <div className="h-[280px] sm:h-[320px] w-full">
              {monthlyRevenueComparison.some(m => m.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradViolet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE.violet} stopOpacity={1} />
                        <stop offset="100%" stopColor={PALETTE.indigo} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" {...commonAxisProps} dy={8} />
                    <YAxis {...commonAxisProps} tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} width={55} />
                    <Tooltip content={<PremiumTooltip prefix="₹" />} cursor={{ fill: 'var(--bg-hover)', opacity: 0.5 }} />
                    <Bar dataKey="revenue" fill="url(#barGradViolet)" radius={[8, 8, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No revenue data yet</div>
              )}
            </div>
          )}
        </ChartCard>

        {/* 5. Top 5 Selling Products — Horizontal Bar */}
        <ChartCard title="Top 5 Selling Products" subtitle="By units sold">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-hover)] animate-pulse rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 bg-[var(--bg-hover)] animate-pulse rounded" />
                    <div className="h-3 w-20 bg-[var(--bg-hover)] animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : topProductsByQty.length > 0 ? (
            <div className="space-y-3">
              {topProductsByQty.map((p, i) => {
                const maxUnits = topProductsByQty[0]?.units || 1;
                const barWidth = (p.units / maxUnits) * 100;
                return (
                  <div key={p.id} className="flex items-center gap-3 group py-2">
                    <span className="text-[var(--text-muted)] font-mono text-xs w-5 text-right tabular-nums">{i + 1}</span>
                    <div className="w-10 h-10 bg-[var(--bg)] rounded-lg border border-[var(--border)] overflow-hidden relative flex-shrink-0">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={14} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{p.name || 'Unknown Product'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${CHART_BAR_COLORS[i] || PALETTE.blue}, ${CHART_BAR_COLORS[i] || PALETTE.blue}99)` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest tabular-nums shrink-0">{p.units} units</span>
                      </div>
                    </div>
                    <div className="text-right pl-2 shrink-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">₹{p.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex text-center justify-center text-[var(--text-muted)] text-sm">No products sold yet</div>
          )}
        </ChartCard>

        {/* 6. Revenue by Category — Horizontal Bar */}
        <ChartCard title="Revenue by Category" subtitle="Top categories by revenue">
          {loading ? <SkeletonLoader /> : (
            <div className="h-[280px] sm:h-[320px] w-full">
              {categoryRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRevenue} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradTeal" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={PALETTE.teal} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={PALETTE.teal} stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" {...commonAxisProps} tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                    <YAxis dataKey="name" type="category" {...commonAxisProps} width={90} />
                    <Tooltip content={<PremiumTooltip prefix="₹" />} cursor={{ fill: 'var(--bg-hover)', opacity: 0.5 }} />
                    <Bar dataKey="value" fill="url(#barGradTeal)" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </ChartCard>

        {/* 7. Revenue Trend — Area Chart (12 months) — Full Width */}
        <ChartCard title="Revenue Trend" subtitle="Last 12 months" className="lg:col-span-2">
          {loading ? <SkeletonLoader height="280px" /> : (
            <div className="h-[250px] sm:h-[300px] w-full">
              {revenueTrend12Months.some(m => m.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend12Months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradIndigo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE.indigo} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={PALETTE.indigo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" {...commonAxisProps} dy={8} />
                    <YAxis {...commonAxisProps} tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} width={55} />
                    <Tooltip content={<PremiumTooltip prefix="₹" />} />
                    <Area type="monotone" dataKey="revenue" stroke={PALETTE.indigo} strokeWidth={2.5} fill="url(#areaGradIndigo)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: PALETTE.indigo }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No revenue data yet</div>
              )}
            </div>
          )}
        </ChartCard>

        {/* 8. New Customers Over Time — Line Chart */}
        <ChartCard title="New Customers Over Time" subtitle="Sign-ups by day" className="lg:col-span-2">
          {loading ? <SkeletonLoader height="250px" /> : (
            <div className="h-[220px] sm:h-[260px] w-full">
              {newCustomersOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={newCustomersOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={PALETTE.amber} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={PALETTE.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" {...commonAxisProps} dy={8} interval="preserveStartEnd" />
                    <YAxis {...commonAxisProps} allowDecimals={false} width={30} />
                    <Tooltip content={<PremiumTooltip />} />
                    <Area type="monotone" dataKey="count" stroke={PALETTE.amber} strokeWidth={2.5} fill="url(#areaGradAmber)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: PALETTE.amber }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No customer data yet</div>
              )}
            </div>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
