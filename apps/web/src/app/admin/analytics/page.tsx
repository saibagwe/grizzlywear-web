'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
  CreditCard,
  Target,
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
  imageUrl?: string;
  productId?: string;
}

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  createdAt: any;
  items: OrderItem[];
  paymentMethod?: string;
}

interface UserDoc {
  id: string;
  createdAt: any;
}

// ─── COLORS ───────────────────────────────────────────────────────────────────

const COLORS = {
  black: 'var(--text-primary)',
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  shipped: '#A855F7',
  delivered: '#22C55E',
  cancelled: '#EF4444',
  muted: 'var(--text-muted)',
  border: 'var(--border)',
};

const CHART_COLORS = ['#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#EF4444', '#EC4899'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getDateFromTimestamp(ts: any): Date {
  if (!ts) return new Date(0);
  return ts?.toDate ? ts.toDate() : new Date(ts);
}

function formatCurrency(v: number) {
  return `₹${v.toLocaleString('en-IN')}`;
}

// ─── CUSTOM COMPONENTS ────────────────────────────────────────────────────────

function StatCard({ label, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110', bg)}>
          <Icon size={18} className={color} />
        </div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</h3>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums truncate">
        {value}
      </p>
      {subtitle && <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/60 mt-1">{subtitle}</p>}
    </div>
  );
}

function ChartWrapper({ title, subtitle, rightContent, children, className }: any) {
  return (
    <div className={cn('bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden flex flex-col', className)}>
      <div className="p-5 sm:p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg)]/30">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mt-1">{subtitle}</p>}
        </div>
        {rightContent}
      </div>
      <div className="p-4 sm:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = '' }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-2xl border border-white/10 text-xs">
        <p className="font-bold uppercase tracking-widest text-white/50 mb-1.5">{label}</p>
        {payload.map((item: any, i: number) => (
          <p key={i} className="font-bold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            {prefix}{item.value.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function RedesignedAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueRange, setRevenueRange] = useState<'6m' | 'year' | 'week' | 'month'>('6m');
  const [dailyOrderRange, setDailyOrderRange] = useState<'week' | 'month'>('month');

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc)));
    });
    return () => { unsubOrders(); unsubUsers(); };
  }, []);

  // ─── Analytics Metrics ───
  const metrics = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalRevenue = delivered.reduce((s, o) => s + o.total, 0);
    const nonCancelled = orders.filter(o => o.status !== 'cancelled');
    const avgOrderValue = nonCancelled.length > 0
      ? nonCancelled.reduce((s, o) => s + o.total, 0) / nonCancelled.length
      : 0;

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: users.length,
      avgOrderValue
    };
  }, [orders, users]);

  // ─── Chart 1: Monthly Revenue (Last 6 Months) ───
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const months: { label: string; month: number; year: number; total: number }[] = [];
    let monthsToFetch = 6;
    if (revenueRange === 'year') monthsToFetch = 12;
    if (revenueRange === '6m') monthsToFetch = 6;
    
    // Simple filter bypass for week/month for now to keep bar chart 6 months consistent label
    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        total: 0
      });
    }

    orders.filter(o => o.status === 'delivered').forEach(o => {
      const d = getDateFromTimestamp(o.createdAt);
      const match = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (match) match.total += o.total;
    });

    return months;
  }, [orders, revenueRange]);

  // ─── Chart 2: Top Selling Products (Horizontal Bar) ───
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; units: number }>();
    orders.filter(o => o.status === 'delivered').forEach(o => {
      o.items.forEach(item => {
        const id = item.productId || item.name;
        const cur = map.get(id) || { name: item.name, units: 0 };
        cur.units += item.quantity;
        map.set(id, cur);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)
      .reverse(); // For horizontal display ranking
  }, [orders]);

  // ─── Chart 3: Order Breakdown (Donut) ───
  const orderBreakdown = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    const total = orders.length || 1;
    return [
      { name: 'Pending', value: counts.pending, color: COLORS.pending, percentage: (counts.pending / total) * 100 },
      { name: 'Confirmed', value: counts.confirmed, color: COLORS.confirmed, percentage: (counts.confirmed / total) * 100 },
      { name: 'Shipped', value: counts.shipped, color: COLORS.shipped, percentage: (counts.shipped / total) * 100 },
      { name: 'Delivered', value: counts.delivered, color: COLORS.delivered, percentage: (counts.delivered / total) * 100 },
      { name: 'Cancelled', value: counts.cancelled, color: COLORS.cancelled, percentage: (counts.cancelled / total) * 100 },
    ].filter(v => v.value > 0);
  }, [orders]);

  // ─── Chart 4: Daily Orders (Current Month) ───
  const dailyOrders = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days: { day: number; count: number }[] = [];
    
    let startDay = 1;
    if (dailyOrderRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        // Simplified for bar chart labels 1-31
    }

    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, count: 0 });
    }

    orders.forEach(o => {
      const d = getDateFromTimestamp(o.createdAt);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const day = d.getDate();
        if (days[day-1]) days[day-1].count++;
      }
    });

    return days;
  }, [orders, dailyOrderRange]);

  // ─── Chart 5: New Customers (Last 6 Months) ───
  const newCustomers = useMemo(() => {
    const now = new Date();
    const months: { label: string; month: number; year: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0
      });
    }
    users.forEach(u => {
      if (!u.createdAt) return;
      const d = getDateFromTimestamp(u.createdAt);
      const match = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (match) match.count++;
    });
    return months;
  }, [users]);

  // ─── Chart 6: Payment Methods ───
  const paymentMethods = useMemo(() => {
    let cod = 0;
    let online = 0;
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      if (o.paymentMethod === 'cod') cod += o.total;
      else online += o.total;
    });
    const total = (cod + online) || 1;
    return [
      { name: 'COD', value: cod, color: COLORS.confirmed, percentage: (cod / total) * 100 },
      { name: 'Online', value: online, color: COLORS.black, percentage: (online / total) * 100 },
    ];
  }, [orders]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(metrics.totalRevenue)} subtitle="All delivered orders" icon={IndianRupee} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard label="Total Orders" value={metrics.totalOrders} subtitle="All time" icon={ShoppingBag} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard label="Total Customers" value={metrics.totalCustomers} subtitle="Registered users" icon={Users} color="text-purple-500" bg="bg-purple-500/10" />
        <StatCard label="Avg Order Value" value={formatCurrency(Math.round(metrics.avgOrderValue))} subtitle="Excl. cancelled" icon={TrendingUp} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      {/* ── Monthly Revenue Bar Chart ── */}
      <ChartWrapper 
        title="Revenue Overview" 
        subtitle={`Last ${revenueRange === 'year' ? '12' : '6'} Months • Monthly Revenue`}
        rightContent={
          <div className="flex bg-[#F0F0F0] p-1 rounded-lg gap-0.5">
            {['week', 'month', '6m', 'year'].map(r => (
              <button 
                key={r} 
                onClick={() => setRevenueRange(r as any)}
                className={cn(
                    'px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded transition-all',
                    revenueRange === r ? 'bg-white text-black shadow-sm' : 'text-[#94A3B8] hover:text-black'
                )}
              >
                {r === '6m' ? 'Last 6M' : r === 'year' ? 'This Year' : r === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={600} stroke="#94A3B8" dy={10} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={600} stroke="#94A3B8" tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="total" fill="#000000" radius={[6, 6, 0, 0]} barSize={40} label={{ position: 'top', formatter: (v: any) => formatCurrency(v), fontSize: 10, fill: '#000', fontWeight: 'bold' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

      {/* ── Top Products & Order Status ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartWrapper title="Top Selling Products" subtitle="Top 5 items by units sold">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight={600} stroke="#94A3B8" width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="units" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }}>
                    {topProducts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        <ChartWrapper title="Order Breakdown" subtitle={`${orders.length} Total Orders`}>
          <div className="h-[300px] flex flex-col items-center justify-center">
             <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={orderBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={6}
                        dataKey="value"
                        >
                        {orderBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-3 gap-x-4 gap-y-2 w-full mt-4">
                {orderBreakdown.map(o => (
                    <div key={o.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">{o.name}</span>
                        <span className="text-[10px] text-black font-bold ml-auto tabular-nums">{o.value}</span>
                    </div>
                ))}
             </div>
          </div>
        </ChartWrapper>
      </div>

      {/* ── Daily Orders Bar Chart ── */}
      <ChartWrapper 
        title="Daily Orders" 
        subtitle="Current month daily volume"
        rightContent={
            <div className="flex bg-[#F0F0F0] p-1 rounded-lg gap-0.5">
              {['week', 'month'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setDailyOrderRange(r as any)}
                  className={cn(
                      'px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded transition-all',
                      dailyOrderRange === r ? 'bg-white text-black shadow-sm' : 'text-[#94A3B8] hover:text-black'
                  )}
                >
                  {r === 'week' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          }
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyOrders} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={9} fontWeight={600} stroke="#94A3B8" />
              <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={600} stroke="#94A3B8" allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" fill={COLORS.pending} radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

      {/* ── New Customers & Payment Methods ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <ChartWrapper title="New Customers" subtitle="Last 6 months sign-ups">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newCustomers} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={600} stroke="#94A3B8" dy={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={600} stroke="#94A3B8" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" fill={COLORS.delivered} radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        <ChartWrapper title="Payment Methods" subtitle="Revenue split by method">
           <div className="h-[300px] flex flex-col items-center justify-center">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={10}
                        dataKey="value"
                        >
                        {paymentMethods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip prefix="₹" />} />
                    </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-8 w-full mt-4">
                 {paymentMethods.map(m => (
                    <div key={m.name} className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                            <span className="text-xs font-bold">{m.name}</span>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(m.value)}</p>
                        <p className="text-[10px] text-[#94A3B8] font-bold">{m.percentage.toFixed(1)}%</p>
                    </div>
                 ))}
              </div>
           </div>
        </ChartWrapper>
      </div>

    </div>
  );
}
