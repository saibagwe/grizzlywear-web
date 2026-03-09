import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: '₹0', change: '+0%', positive: true },
          { label: 'Total Orders', value: '0', change: '+0%', positive: true },
          { label: 'New Customers', value: '0', change: '+0%', positive: true },
          { label: 'Pending Orders', value: '0', change: '', positive: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            {stat.change && (
              <p className={`text-xs mt-1 ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} from last month
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-80 flex items-center justify-center">
          <p className="text-sm text-gray-400">Sales chart — Recharts integration in Phase 8</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-80 flex items-center justify-center">
          <p className="text-sm text-gray-400">Revenue by category — Recharts integration in Phase 8</p>
        </div>
      </div>

      {/* Recent orders placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
        <div className="text-center py-12 text-sm text-gray-400">
          No orders yet. Orders will appear here once the store is live.
        </div>
      </div>
    </div>
  );
}
