import type { Metadata } from 'next';
import Link from 'next/link';
import { Package, TrendingUp, Users, AlertCircle, ArrowRight } from 'lucide-react';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Grizzlywear',
};

export default function AdminDashboardPage() {
  
  // Calculate mock stats
  const totalRevenue = MOCK_ORDERS.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = MOCK_ORDERS.length;
  const pendingOrders = MOCK_ORDERS.filter(o => o.status === 'pending' || o.status === 'packed').length;
  
  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: '+12.5%', positive: true, icon: TrendingUp },
    { label: 'Total Orders', value: totalOrders.toString(), change: '+5.2%', positive: true, icon: Package },
    { label: 'New Customers', value: '142', change: '+18.1%', positive: true, icon: Users },
    { label: 'Pending Orders', value: pendingOrders.toString(), change: '', positive: true, icon: AlertCircle },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, Admin. Here&apos;s a summary of your store&apos;s performance.</p>
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
            <div key={stat.label} className="bg-white border border-gray-200 p-6 flex flex-col justify-between h-32 hover:border-black transition-colors">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <Icon size={16} className="text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-normal tracking-tight text-gray-900">{stat.value}</p>
                {stat.change && (
                  <span className={cn("text-xs font-medium", stat.positive ? 'text-green-500' : 'text-red-500')}>
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 p-6 h-[400px] flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-center mb-6 z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Revenue Overview</h2>
            <select className="text-xs border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-black">
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/50 relative z-10 transition-colors group-hover:bg-gray-50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Recharts Analytics (Phase 8)</p>
          </div>
        </div>
        
        <div className="lg:col-span-1 bg-white border border-gray-200 p-6 h-[400px] flex flex-col items-center justify-center relative group">
           <h2 className="absolute top-6 left-6 text-sm font-bold uppercase tracking-widest text-gray-900">Sales by Category</h2>
           <div className="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/50 mt-12 transition-colors group-hover:bg-gray-50">
             {/* Mock Donut Chart CSS Graphic */}
             <div className="w-32 h-32 rounded-full border-[16px] border-t-black border-r-gray-300 border-b-gray-200 border-l-gray-100 mb-6"></div>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recharts Config Pending</p>
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
              {MOCK_ORDERS.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-black">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline underline-offset-4">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-gray-900">{order.deliveryAddress.name}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                      order.status.toLowerCase() === 'delivered' ? "bg-green-100 text-green-800" :
                      (order.status.toLowerCase() === 'packed' || order.status.toLowerCase() === 'shipped') ? "bg-blue-100 text-blue-800" :
                      order.status.toLowerCase() === 'cancelled' ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    )}>
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
      </div>
    </div>
  );
}
