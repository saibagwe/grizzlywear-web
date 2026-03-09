'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
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

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
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
