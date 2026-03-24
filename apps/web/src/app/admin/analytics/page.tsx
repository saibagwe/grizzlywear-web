'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import Image from 'next/image';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryId?: string;
  imageUrl?: string;
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

const COLORS = {
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F59E0B',
  purple: '#A855F7',
  red: '#EF4444',
  teal: '#14B8A6',
};

const STATUS_COLORS = {
  pending: COLORS.orange,
  confirmed: COLORS.blue,
  shipped: COLORS.purple,
  delivered: COLORS.green,
  cancelled: COLORS.red,
};

function SkeletonLoader({ height = '300px' }: { height?: string }) {
  return (
    <div className="w-full bg-[var(--bg-hover)] animate-pulse rounded-lg" style={{ height }} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] animate-pulse" />
        <div className="h-4 w-24 bg-[var(--bg-hover)] animate-pulse rounded" />
      </div>
      <div className="h-8 w-32 bg-[var(--bg-hover)] animate-pulse rounded mt-2" />
    </div>
  );
}

type DateRange = '7d' | '30d' | '3m' | 'all';

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Fetch Data
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

  // Filter Data by Date Range
  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
    if (dateRange === '3m') cutoff.setMonth(now.getMonth() - 3);

    return orders.filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return d >= cutoff;
    });
  }, [orders, dateRange]);

  const filteredUsers = useMemo(() => {
    if (dateRange === 'all') return users;
    
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
    if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
    if (dateRange === '3m') cutoff.setMonth(now.getMonth() - 3);

    return users.filter(u => {
      // Assuming users have a createdAt field, if not, we use all users for now
      if (!u.createdAt) return true;
      const d = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return d >= cutoff;
    });
  }, [users, dateRange]);

  // Analytics Calculations
  const totalRevenue = filteredOrders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (o.total || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const totalCustomers = filteredUsers.length; // From filtered users if we track creation date, else all.

  // Charts Data Prep
  const revenueOverTime = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(dateStr, (map.get(dateStr) || 0) + (o.total || 0));
    });
    // Sort logic simplified for display order - assuming mostly sequential if we just map keys
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount })).reverse();
  }, [filteredOrders]);

  const ordersOverTime = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).reverse();
  }, [filteredOrders]);

  const newCustomersOverTime = useMemo(() => {
    const map = new Map<string, number>();
    filteredUsers.forEach(u => {
      if (!u.createdAt) return;
      const d = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).reverse();
  }, [filteredUsers]);

  const orderStatusBreakdown = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    filteredOrders.forEach(o => {
      let st = o.status;
      if ((st as any) === 'processing') st = 'confirmed';
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return Object.entries(counts).filter(([_, count]) => count > 0).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS]
    }));
  }, [filteredOrders]);

  const categoryRevenue = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.filter(o => o.status !== 'cancelled').forEach(order => {
      order.items?.forEach(item => {
        const cat = item.categoryId || 'Uncategorized';
        // Approximate revenue from this item
        const itemRev = (item.price || 0) * (item.quantity || 1);
        map.set(cat, (map.get(cat) || 0) + itemRev);
      });
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { units: number, revenue: number, name: string, image?: string }>();
    filteredOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      order.items?.forEach(item => {
        const id = item.id;
        const current = map.get(id) || { units: 0, revenue: 0, name: item.name, image: item.imageUrl };
        const quantity = item.quantity || 1;
        current.units += quantity;
        current.revenue += (item.price || 0) * quantity;
        map.set(id, current);
      });
    });
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [filteredOrders]);

  const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-[var(--border)] p-3 rounded-lg shadow-xl">
          <p className="text-[var(--text-secondary)] text-xs mb-1 font-mono">{label}</p>
          <p className="text-[var(--text-primary)] font-bold text-sm">
            {prefix}{Number(payload[0].value).toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics & Reports</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Real-time insights across your entire store
          </p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-lg">
          {(['7d', '30d', '3m', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dateRange === range 
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : 
               range === '30d' ? 'Last 30 Days' : 
               range === '3m' ? 'Last 3 Months' : 'All Time'}
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

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <IndianRupee size={18} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total Revenue</h3>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total Orders</h3>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                {totalOrdersCount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <TrendingUp size={18} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Avg. Order Value</h3>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                ₹{Math.round(averageOrderValue).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl hover:bg-[var(--bg-hover)] transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total Customers</h3>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                {totalCustomers.toLocaleString('en-IN')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Over Time */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Revenue Over Time</h3>
          {loading ? <SkeletonLoader /> : (
            <div className="h-[300px] w-full">
              {revenueOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueOverTime} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                    />
                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={COLORS.green} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: COLORS.green }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </div>

        {/* Orders Over Time */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Orders Count Over Time</h3>
          {loading ? <SkeletonLoader /> : (
            <div className="h-[300px] w-full">
               {ordersOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                    <Bar 
                      dataKey="count" 
                      fill={COLORS.blue} 
                      radius={[4, 4, 0, 0]} 
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
               ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Order Status Breakdown</h3>
          {loading ? <SkeletonLoader /> : (
            <div className="h-[300px] w-full flex relative">
              {orderStatusBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {orderStatusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1A1A', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', padding: '8px 12px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Custom Legend */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3">
                    {orderStatusBreakdown.map((stat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-xs text-[var(--text-secondary)]">{stat.name}</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] ml-2">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                 <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </div>

        {/* Revenue by Category (Horizontal Bar) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Revenue by Category</h3>
          {loading ? <SkeletonLoader /> : (
            <div className="h-[300px] w-full">
              {categoryRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRevenue} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis 
                      type="number"
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: 'var(--bg-hover)' }} />
                    <Bar 
                      dataKey="value" 
                      fill={COLORS.purple} 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </div>

        {/* Top Selling Products List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl lg:col-span-1">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Top Selling Products</h3>
          {loading ? (
             <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--bg-hover)] animate-pulse rounded-md" />
                    <div className="flex-1 space-y-2">
                       <div className="h-4 w-32 bg-[var(--bg-hover)] animate-pulse rounded" />
                       <div className="h-3 w-16 bg-[var(--bg-hover)] animate-pulse rounded" />
                    </div>
                  </div>
                ))}
             </div>
          ) : (
            <div className="space-y-4">
               {topProducts.length > 0 ? topProducts.map((p, i) => (
                 <div key={p.id} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                    <span className="text-[var(--text-muted)] font-mono text-xs w-4">{i + 1}</span>
                    <div className="w-10 h-10 bg-[var(--bg)] rounded-md border border-[var(--border)] overflow-hidden relative flex-shrink-0">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)]">Img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-[var(--text-primary)] truncate">{p.name || 'Unknown Product'}</p>
                       <p className="text-xs text-[var(--text-secondary)] mt-0.5">{p.units} units sold</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-[var(--text-primary)]">₹{p.revenue.toLocaleString('en-IN')}</p>
                    </div>
                 </div>
               )) : (
                 <div className="py-8 flex text-center justify-center text-[var(--text-muted)] text-sm">No products sold yet</div>
               )}
            </div>
          )}
        </div>

        {/* New Customers Over Time */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-xl lg:col-span-1">
           <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">New Customers Over Time</h3>
           {loading ? <SkeletonLoader height="250px" /> : (
            <div className="h-[250px] w-full">
               {newCustomersOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={newCustomersOverTime} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="var(--text-muted)" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.orange} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCustomers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
               ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">No data available</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
