'use client';

import Link from 'next/link';
import { Search, Filter, ArrowUpRight } from 'lucide-react';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        {/* Filters/Search Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F9F9F9]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by order ID or customer name..." 
              className="w-full border border-gray-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white px-4 py-2 focus:outline-none focus:border-black w-full sm:w-auto">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50 hover:border-black transition-colors justify-center whitespace-nowrap">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F9F9F9] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_ORDERS.map((order) => {
                const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-black hover:underline underline-offset-4 flex items-center gap-1">
                        {order.id}
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{order.deliveryAddress.name}</p>
                      <p className="text-[10px] text-gray-500">{order.deliveryAddress?.name.toLowerCase().replace(/ /g, '.')}@example.com</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{itemCount} items</td>
                    <td className="px-6 py-4">
                      <select 
                        defaultValue={order.status.toLowerCase()}
                        className={cn(
                          "appearance-none bg-transparent border-b border-dashed font-bold uppercase tracking-widest text-[10px] py-1 cursor-pointer focus:outline-none focus:border-black",
                          order.status.toLowerCase() === 'delivered' ? "text-green-700 border-green-200" :
                          order.status.toLowerCase() === 'shipped' ? "text-blue-700 border-blue-200" :
                          order.status.toLowerCase() === 'processing' ? "text-yellow-700 border-yellow-200" :
                          "text-gray-700 border-gray-300"
                        )}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-900 text-right font-medium">₹{order.total.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-gray-200 bg-[#F9F9F9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
          <span>Showing 1 to {MOCK_ORDERS.length} of {MOCK_ORDERS.length} orders</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors" disabled>Prev</button>
            <button className="px-4 py-2 border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
