'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Users,
  BarChart3,
  Star,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { subscribeToAllOrders } from '@/lib/firestore/orderService';
import { subscribeToAllTickets } from '@/lib/firestore/ticketService';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, showBadge: true },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare, showTicketBadge: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, loading, initialized } = useAuthStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [openTicketCount, setOpenTicketCount] = useState(0);

  // Protect Admin Routes (Client-side)
  useEffect(() => {
    if (initialized && !loading && !isAdmin) {
      router.replace('/');
    }
  }, [initialized, loading, isAdmin, router]);

  // Real-time pending badge
  useEffect(() => {
    const unsub = subscribeToAllOrders(
      (orders) => {
        setPendingCount(orders.filter((o) => o.status === 'pending').length);
      },
      () => { /* badge error — silently ignore */ }
    );
    return () => unsub();
  }, []);

  // Real-time open tickets badge
  useEffect(() => {
    const unsub = subscribeToAllTickets(
      (tickets) => {
        setOpenTicketCount(tickets.filter((t) => t.status === 'open' || t.status === 'in-progress').length);
      },
      () => { /* badge error — silently ignore */ }
    );
    return () => unsub();
  }, []);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-0">
      {/* Admin top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="font-bold text-sm tracking-[0.2em] uppercase"
            >
              GRIZZLYWEAR
            </Link>
            <span className="text-[10px] tracking-wider uppercase bg-black text-white px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <Link
                href="/admin/orders"
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
              >
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                {pendingCount} pending
              </Link>
            )}
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-black transition-colors"
            >
              View Store →
            </Link>
            <button
              onClick={() => {
                import('@/store/authStore').then((m) => m.useAuthStore.getState().logout());
              }}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 overflow-y-auto hidden lg:block">
          <nav className="py-4 px-3">
            <ul className="space-y-0.5">
              {adminNavItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </div>
                      {item.showBadge && pendingCount > 0 && (
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                          isActive ? 'bg-white text-black' : 'bg-orange-500 text-white'
                        )}>
                          {pendingCount}
                        </span>
                      )}
                      {(item as any).showTicketBadge && openTicketCount > 0 && (
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                          isActive ? 'bg-white text-black' : 'bg-green-500 text-white'
                        )}>
                          {openTicketCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-56 min-h-[calc(100vh-3.5rem)]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
