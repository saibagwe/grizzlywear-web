'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, ComposedChart, Line,
} from 'recharts';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Target,
  Package,
  TrendingUp as TrendingUpIcon,
  ChevronDown,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type GlobalRangeType = 'today' | 'week' | 'month' | '6m' | 'custom';
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
  userId: string;
}

interface UserDoc {
  id: string;
  createdAt: any;
}

// ─── CONSTANTS & COLORS ───────────────────────────────────────────────────────

const COLORS = {
  pending: '#F59E0B',   // Orange
  confirmed: '#3B82F6', // Blue
  shipped: '#A855F7',   // Purple
  delivered: '#22C55E', // Green
  cancelled: '#EF4444', // Red
  online: '#000000',    // Black
  cod: '#F59E0B',       // Orange
  newUsers: '#3B82F6',  // Blue
  activeUsers: '#22C55E', // Green
  muted: 'var(--text-muted)',
  border: 'var(--border)',
};

const CHART_PALETTE = ['#000000', '#F59E0B', '#3B82F6', '#A855F7', '#22C55E'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getDateFromTimestamp(ts: any): Date {
  if (!ts) return new Date(0);
  return ts?.toDate ? ts.toDate() : new Date(ts);
}

function formatCurrency(v: number) {
  return `₹${v.toLocaleString('en-IN')}`;
}

function getStartOfPeriod(type: GlobalRangeType, customStart?: Date): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  switch (type) {
    case 'today': return d;
    case 'week': {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      return new Date(d.setDate(diff));
    }
    case 'month': return new Date(d.getFullYear(), d.getMonth(), 1);
    case '6m': return new Date(d.getFullYear(), d.getMonth() - 5, 1);
    case 'custom': return customStart || d;
    default: return d;
  }
}

function getEndOfPeriod(type: GlobalRangeType, customEnd?: Date): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  switch (type) {
    case 'custom': return customEnd || d;
    default: return d;
  }
}

function getPreviousPeriodDates(type: GlobalRangeType, start: Date, end: Date): { prevStart: Date, prevEnd: Date } {
  const diff = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - diff - 1000); // subtract a tiny bit to be safe
  const prevEnd = new Date(start.getTime() - 1000);
  
  if (type === 'month') {
    const ps = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const pe = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
    return { prevStart: ps, prevEnd: pe };
  }
  if (type === '6m') {
    const ps = new Date(start.getFullYear(), start.getMonth() - 6, 1);
    const pe = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
    return { prevStart: ps, prevEnd: pe };
  }
  
  return { prevStart, prevEnd };
}

function getPeriodLabel(type: GlobalRangeType, start: Date, end: Date): string {
  const ms = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (type === 'today') return `${start.getDate()} ${ms[start.getMonth()]} • Daily`;
  if (type === 'week') return `${start.getDate()} ${ms[start.getMonth()]} - ${end.getDate()} ${ms[end.getMonth()]} • Daily`;
  if (type === 'month') return `${ms[start.getMonth()]} ${start.getFullYear()} • Monthly`;
  if (type === '6m') return `${ms[start.getMonth()]} - ${ms[end.getMonth()]} ${end.getFullYear()} • Monthly Trends`;
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function StatCard({ label, value, trend, isUp, icon: Icon, loading, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col gap-4 border border-[#f0f0f0] hover:scale-[1.02] transition-all group overflow-hidden relative">
      <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity text-black">
        <Icon size={120} />
      </div>
      <div className="flex justify-between items-start relative z-10">
        <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
          <Icon size={20} className={color} />
        </div>
        {!loading && (
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider tabular-nums',
            isUp ? 'bg-[#f0fdf4] text-emerald-600' : 'bg-rose-50 text-rose-600'
          )}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        {loading ? (
          <div className="h-9 w-32 bg-gray-100 animate-pulse rounded" />
        ) : (
          <p className="text-3xl font-bold text-[#1a1a1a] tracking-tight tabular-nums truncate">{value}</p>
        )}
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mt-1.5">{label}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, periodLabel, children, loading, isEmpty }: any) {
  return (
    <div className="bg-white border border-[#f0f0f0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-black">{title}</h3>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1.5">{subtitle}</p>
        </div>
        <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 uppercase tracking-wider">
          {periodLabel}
        </div>
      </div>
      <div className="h-[300px] w-full relative">
        {loading ? (
          <div className="h-full w-full bg-gray-50/50 animate-pulse rounded-xl flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-gray-300">
            <Search size={48} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No data for this period</p>
          </div>
        ) : children}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = '' }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md">
        <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-bold truncate">
              <span className="text-white/60 font-medium mr-2">{entry.name}:</span>
              {prefix}{entry.value.toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RedesignedAnalyticsPage() {
  const [rangeType, setRangeType] = useState<GlobalRangeType>('month');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Date Computations ───
  const { start, end, prevStart, prevEnd } = useMemo(() => {
    let s = getStartOfPeriod(rangeType, customRange.start ? new Date(customRange.start) : undefined);
    let e = getEndOfPeriod(rangeType, customRange.end ? new Date(customRange.end) : undefined);
    const { prevStart: ps, prevEnd: pe } = getPreviousPeriodDates(rangeType, s, e);
    return { start: s, end: e, prevStart: ps, prevEnd: pe };
  }, [rangeType, customRange]);

  const periodLabel = useMemo(() => getPeriodLabel(rangeType, start, end), [rangeType, start, end]);

  // ─── Fetch Data ───
  useEffect(() => {
    setLoading(true);
    // Fetch a wider range to accommodate trend comparison
    const qOrders = query(
      collection(db, 'orders'),
      where('createdAt', '>=', prevStart),
      where('createdAt', '<=', end)
    );
    const qUsers = query(
      collection(db, 'users'),
      where('createdAt', '>=', prevStart),
      where('createdAt', '<=', end)
    );

    let unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    let unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc)));
    });

    return () => { unsubOrders(); unsubUsers(); };
  }, [prevStart, end]);

  // ─── Data Filtering and Grouping ───
  const currentOrders = useMemo(() => orders.filter(o => {
    const d = getDateFromTimestamp(o.createdAt);
    return d >= start && d <= end;
  }), [orders, start, end]);

  const previousOrders = useMemo(() => orders.filter(o => {
    const d = getDateFromTimestamp(o.createdAt);
    return d >= prevStart && d <= prevEnd;
  }), [orders, prevStart, prevEnd]);

  const currentUsers = useMemo(() => users.filter(u => {
    const d = getDateFromTimestamp(u.createdAt);
    return d >= start && d <= end;
  }), [users, start, end]);

  const previousUsers = useMemo(() => users.filter(u => {
    const d = getDateFromTimestamp(u.createdAt);
    return d >= prevStart && d <= prevEnd;
  }), [users, prevStart, prevEnd]);

  // 1. Stats Calculation
  const stats = useMemo(() => {
    const del = (arr: Order[]) => arr.filter(o => o.status === 'delivered');
    const rev = (arr: Order[]) => del(arr).reduce((s, o) => s + (o.total || 0), 0);
    const countArr = (arr: any[]) => arr.length;
    const aov = (arr: Order[]) => {
      const nc = arr.filter(o => o.status !== 'cancelled');
      return nc.length ? nc.reduce((s, o) => s + (o.total || 0), 0) / nc.length : 0;
    };

    const cRev = rev(currentOrders);
    const pRev = rev(previousOrders);
    const cOrd = countArr(currentOrders);
    const pOrd = countArr(previousOrders);
    const cUsr = countArr(currentUsers);
    const pUsr = countArr(previousUsers); // "X new this period" trend
    const cAov = aov(currentOrders);
    const pAov = aov(previousOrders);

    const trend = (cur: number, pre: number) => {
      if (!pre) return cur ? 100 : 0;
      return Number(((cur - pre) / pre * 100).toFixed(1));
    };

    return {
      revenue: { val: cRev, trend: trend(cRev, pRev), up: cRev >= pRev },
      orders: { val: cOrd, trend: trend(cOrd, pOrd), up: cOrd >= pOrd },
      customers: { val: users.length, trend: cUsr, up: true }, // Show new ones as "X new"
      aov: { val: cAov, trend: trend(cAov, pAov), up: cAov >= pAov }
    };
  }, [currentOrders, previousOrders, currentUsers, previousUsers, users]);

  // 2. Revenue Chart Data
  const revenueChartData = useMemo(() => {
    const map = new Map<string, { label: string, revenue: number, orders: number }>();
    
    // Grouping strategy
    const getGroupKey = (d: Date) => {
      if (rangeType === 'today') return `${d.getHours()}:00`;
      if (rangeType === '6m') return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    // Initialize periods
    if (rangeType === 'today') {
      for(let i=0; i<24; i++) map.set(`${i}:00`, { label: `${i}:00`, revenue: 0, orders: 0 });
    } else if (rangeType === 'week' || rangeType === 'month' || rangeType === 'custom') {
      const it = new Date(start);
      while(it <= end) {
        const k = getGroupKey(it);
        map.set(k, { label: k, revenue: 0, orders: 0 });
        it.setDate(it.getDate() + 1);
      }
    } else if (rangeType === '6m') {
      for(let i=0; i<6; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const k = getGroupKey(d);
        map.set(k, { label: k, revenue: 0, orders: 0 });
      }
    }

    currentOrders.forEach(o => {
      const k = getGroupKey(getDateFromTimestamp(o.createdAt));
      const cur = map.get(k);
      if (cur) {
        if (o.status === 'delivered') cur.revenue += o.total;
        cur.orders += 1;
      }
    });

    return Array.from(map.values());
  }, [currentOrders, rangeType, start, end]);

  // 3. Order Statistics (Grouped Bar)
  const orderStatsData = useMemo(() => {
    const map = new Map<string, { label: string, pending: number, delivered: number, cancelled: number }>();
    const getGroupKey = (d: Date) => {
      if (rangeType === 'today') return `${d.getHours()}:00`;
      if (rangeType === '6m') return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    currentOrders.forEach(o => {
      const k = getGroupKey(getDateFromTimestamp(o.createdAt));
      let cur = map.get(k);
      if (!cur) {
        cur = { label: k, pending: 0, delivered: 0, cancelled: 0 };
        map.set(k, cur);
      }
      if (o.status === 'pending') cur.pending++;
      else if (o.status === 'delivered') cur.delivered++;
      else if (o.status === 'cancelled') cur.cancelled++;
    });

    return Array.from(map.values()).sort((a, b) => 0); // Need sorting actually link with revenue chart order
  }, [currentOrders, rangeType, start, end]);

  // 4. Order Breakdown (Donut)
  const orderBreakdownData = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    currentOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
    const total = currentOrders.length || 1;
    return [
      { name: 'Pending', value: counts.pending, color: COLORS.pending },
      { name: 'Confirmed', value: counts.confirmed, color: COLORS.confirmed },
      { name: 'Shipped', value: counts.shipped, color: COLORS.shipped },
      { name: 'Delivered', value: counts.delivered, color: COLORS.delivered },
      { name: 'Cancelled', value: counts.cancelled, color: COLORS.cancelled },
    ].filter(v => v.value > 0).map(v => ({...v, percentage: Math.round(v.value / total * 100)}));
  }, [currentOrders]);

  // 5. Product Performance
  const productPerformance = useMemo(() => {
    const productMap = new Map<string, { id: string, name: string, units: number, revenue: number }>();
    currentOrders.filter(o => o.status === 'delivered').forEach(order => {
      order.items?.forEach(item => {
        const id = item.productId || item.name;
        const cur = productMap.get(id) || { id, name: item.name, units: 0, revenue: 0 };
        cur.units += item.quantity;
        cur.revenue += item.price * item.quantity;
        productMap.set(id, cur);
      });
    });
    return Array.from(productMap.values()).sort((a, b) => b.units - a.units).slice(0, 5);
  }, [currentOrders]);

  // 6. Payment Method Breakdown
  const paymentMethodData = useMemo(() => {
    let codVal = 0, codCount = 0, onlineVal = 0, onlineCount = 0;
    currentOrders.forEach(o => {
      if (o.paymentMethod === 'cod') { codVal += o.total; codCount++; }
      else { onlineVal += o.total; onlineCount++; }
    });
    const totalRev = codVal + onlineVal || 1;
    const totalCount = codCount + onlineCount || 1;
    return [
      { name: 'COD', value: codVal, count: codCount, color: COLORS.cod, percentage: Math.round(codVal/totalRev*100) },
      { name: 'Online', value: onlineVal, count: onlineCount, color: COLORS.online, percentage: Math.round(onlineVal/totalRev*100) },
    ];
  }, [currentOrders]);

  // 7. Customer Growth
  const customerGrowthData = useMemo(() => {
    const map = new Map<string, { label: string, newUsers: number, activeUsers: Set<string> }>();
    const getGroupKey = (d: Date) => {
      if (rangeType === 'today') return `${d.getHours()}:00`;
      if (rangeType === '6m') return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    // Pre-fill labels
    revenueChartData.forEach(r => map.set(r.label, { label: r.label, newUsers: 0, activeUsers: new Set() }));

    currentUsers.forEach(u => {
      const k = getGroupKey(getDateFromTimestamp(u.createdAt));
      const cur = map.get(k);
      if (cur) cur.newUsers++;
    });

    currentOrders.forEach(o => {
      const k = getGroupKey(getDateFromTimestamp(o.createdAt));
      const cur = map.get(k);
      if (cur && o.userId) cur.activeUsers.add(o.userId);
    });

    return Array.from(map.values()).map(v => ({ label: v.label, newUsers: v.newUsers, activeCustomers: v.activeUsers.size }));
  }, [currentUsers, currentOrders, rangeType, revenueChartData]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* ── GLOBAL FILTER BAR ── */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-[#f0f0f0] p-2 rounded-2xl shadow-sm gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {(['today', 'week', 'month', '6m', 'custom'] as GlobalRangeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setRangeType(t)}
              className={cn(
                'flex-1 md:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap',
                rangeType === t ? 'bg-[#111111] text-white shadow-lg' : 'text-gray-500 hover:text-black hover:bg-white/50'
              )}
            >
              {t === '6m' ? 'Last 6 Months' : t === 'custom' ? 'Custom Range' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {rangeType === 'custom' && (
          <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 animate-in slide-in-from-right duration-300">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-gray-400">From</span>
              <input 
                type="date" 
                value={customRange.start} 
                onChange={(e) => setCustomRange(cur => ({...cur, start: e.target.value}))}
                className="bg-transparent text-xs font-bold outline-none"
              />
            </div>
            <div className="w-[1px] h-6 bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-gray-400">To</span>
              <input 
                type="date" 
                value={customRange.end} 
                onChange={(e) => setCustomRange(cur => ({...cur, end: e.target.value}))}
                className="bg-transparent text-xs font-bold outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── SUMMARY STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          label="Total Revenue" 
          value={formatCurrency(stats.revenue.val)} 
          trend={stats.revenue.trend} 
          isUp={stats.revenue.up} 
          icon={IndianRupee} 
          loading={loading}
          color="text-emerald-600"
        />
        <StatCard 
          label="Total Orders" 
          value={stats.orders.val} 
          trend={stats.orders.trend} 
          isUp={stats.orders.up} 
          icon={ShoppingBag} 
          loading={loading}
          color="text-blue-600"
        />
        <StatCard 
          label="Total Customers" 
          value={stats.customers.val} 
          trend={`${stats.customers.trend} new`} 
          isUp={true} 
          icon={Users} 
          loading={loading}
          color="text-purple-600"
        />
        <StatCard 
          label="Avg Order Value" 
          value={formatCurrency(Math.round(stats.aov.val))} 
          trend={stats.aov.trend} 
          isUp={stats.aov.up} 
          icon={Target} 
          loading={loading}
          color="text-amber-600"
        />
      </div>

      {/* ── REVENUE BAR CHART (Full Width) ── */}
      <ChartCard title="Revenue Overview" subtitle="Delivered orders revenue vs total order volume" periodLabel={periodLabel} loading={loading} isEmpty={revenueChartData.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={revenueChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#F97316" />
            <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: '#f8fafc' }} />
            <Bar yAxisId="left" dataKey="revenue" fill="#000000" radius={[6, 6, 0, 0]} barSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#F97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── ORDER STATISTICS & BREAKDOWN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Order Statistics" subtitle="Daily volume comparison by status" periodLabel={periodLabel} loading={loading} isEmpty={orderStatsData.length === 0}>
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatsData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" dy={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar dataKey="pending" fill={COLORS.pending} radius={[4, 4, 0, 0]} name="Pending" />
                <Bar dataKey="delivered" fill={COLORS.delivered} radius={[4, 4, 0, 0]} name="Delivered" />
                <Bar dataKey="cancelled" fill={COLORS.cancelled} radius={[4, 4, 0, 0]} name="Cancelled" />
              </BarChart>
           </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Breakdown" subtitle="Overall distribution by status" periodLabel={periodLabel} loading={loading} isEmpty={orderBreakdownData.length === 0}>
          <div className="flex flex-col sm:flex-row items-center justify-around h-full">
            <div className="h-[220px] w-[220px] relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold tracking-tight">{currentOrders.length}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderBreakdownData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {orderBreakdownData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 min-w-[140px]">
              {orderBreakdownData.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block">{item.value}</span>
                    <span className="text-[8px] font-bold text-gray-400">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── TOP PRODUCTS & PAYMENT METHODS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Top Selling Products" subtitle="By units sold — delivered orders only" periodLabel={periodLabel} loading={loading} isEmpty={productPerformance.length === 0}>
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...productPerformance].reverse()} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" width={100} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="units" radius={[0, 4, 4, 0]} barSize={16}>
                        {productPerformance.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div className="mt-4 border-t border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead>
                   <tr className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                     <th className="py-3 px-2">#</th>
                     <th className="py-3 px-2">Product</th>
                     <th className="py-3 px-2 text-center">Units</th>
                     <th className="py-3 px-2 text-right">Revenue</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {productPerformance.map((p, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-2 text-[10px] font-bold text-gray-400">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="py-2.5 px-2 text-[11px] font-bold text-black truncate max-w-[150px]">{p.name}</td>
                        <td className="py-2.5 px-2 text-[11px] font-bold text-center text-gray-500 tabular-nums">{p.units}</td>
                        <td className="py-2.5 px-2 text-[11px] font-bold text-right text-black tabular-nums">{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Payment Methods" subtitle="Revenue split by transaction type" periodLabel={periodLabel} loading={loading} isEmpty={paymentMethodData.every(v => v.value === 0)}>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-[220px] w-full relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold tracking-tight">{formatCurrency(stats.revenue.val)}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Total Rev</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                       {paymentMethodData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                 </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-12 mt-4 relative z-10">
               {paymentMethodData.map((item, i) => (
                 <div key={i} className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <p className="text-sm font-bold tracking-tight">{formatCurrency(item.value)}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tight">{item.count} items</span>
                       <span className="text-[9px] font-black text-black">{item.percentage}%</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── CUSTOMER GROWTH LINE CHART (Full Width) ── */}
      <ChartCard title="Customer Growth" subtitle="New registrations vs active shopping customers" periodLabel={periodLabel} loading={loading} isEmpty={customerGrowthData.length === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={customerGrowthData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.newUsers} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={COLORS.newUsers} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.activeUsers} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={COLORS.activeUsers} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" dy={10} />
            <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            <Area type="monotone" dataKey="newUsers" stroke={COLORS.newUsers} fillOpacity={1} fill="url(#gradNew)" strokeWidth={3} name="New Customers" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
            <Area type="monotone" dataKey="activeCustomers" stroke={COLORS.activeUsers} fillOpacity={1} fill="url(#gradActive)" strokeWidth={3} name="Active Customers" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}
