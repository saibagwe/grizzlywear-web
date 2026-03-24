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
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { subscribeToAllOrders } from '@/lib/firestore/orderService';
import { subscribeToAllTickets } from '@/lib/firestore/ticketService';
import { subscribeToInventory } from '@/lib/firestore/inventoryService';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, showBadge: true },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse, showLowStockBadge: true },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/tickets', label: 'Tickets', icon: MessageSquare, showTicketBadge: true },
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
  const [lowStockCount, setLowStockCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initial Responsive State
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Theme Persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('adminTheme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (themeLoaded) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('adminTheme', theme);
    }
  }, [theme, themeLoaded]);

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

  // Real-time low stock badge
  useEffect(() => {
    const unsub = subscribeToInventory((items) => {
      const lowStock = items.filter((item) => item.totalStock < item.lowStockThreshold);
      setLowStockCount(lowStock.length);
    });
    return () => unsub();
  }, []);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] pt-0 transition-colors">
      {/* Admin top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-card)] border-b border-[var(--border)] h-14 transition-colors">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/admin/dashboard"
              className="font-bold text-sm tracking-[0.2em] uppercase hidden sm:block"
            >
              GRIZZLYWEAR
            </Link>
            <span className="text-[10px] tracking-wider uppercase bg-black text-white px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {pendingCount > 0 && (
              <Link
                href="/admin/orders"
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
              >
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                {pendingCount} pending
              </Link>
            )}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              href="/"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              View Store →
            </Link>
            <button
              onClick={() => {
                import('@/store/authStore').then((m) => m.useAuthStore.getState().logout());
              }}
              className="p-2 text-[var(--text-secondary)] hover:text-red-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 top-14 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed left-0 top-14 bottom-0 bg-[var(--bg-card)] border-r border-[var(--border)] overflow-y-auto transition-all z-40 duration-300 group overflow-x-hidden",
            isSidebarOpen ? "w-56 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-16"
          )}
        >
          <nav className="py-4 px-2 sm:px-3">
            <ul className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={!isSidebarOpen ? item.label : undefined}
                      onClick={() => {
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={cn(
                        'flex items-center rounded-lg text-sm transition-colors overflow-hidden',
                        isSidebarOpen ? 'px-3 py-2.5 justify-between' : 'px-0 py-2.5 justify-center',
                        isActive
                          ? 'bg-[var(--text-primary)] text-[var(--bg-card)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className={cn(
                          "whitespace-nowrap transition-all duration-300 font-medium",
                          isSidebarOpen ? "w-auto opacity-100 ml-3" : "w-0 opacity-0 ml-0 inline-block h-5"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {item.showBadge && pendingCount > 0 && (
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-opacity duration-200',
                          isActive ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'bg-orange-500 text-white',
                          !isSidebarOpen && "hidden"
                        )}>
                          {pendingCount}
                        </span>
                      )}
                      {(item as any).showTicketBadge && openTicketCount > 0 && (
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-opacity duration-200',
                          isActive ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'bg-green-500 text-white',
                          !isSidebarOpen && "hidden"
                        )}>
                          {openTicketCount}
                        </span>
                      )}
                      {(item as any).showLowStockBadge && lowStockCount > 0 && (
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-opacity duration-200',
                          isActive ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'bg-red-500 text-white',
                          !isSidebarOpen && "hidden"
                        )}>
                          {lowStockCount}
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
        <main className={cn(
          "flex-1 min-h-[calc(100vh-3.5rem)] transition-all duration-300 w-full overflow-hidden",
          isSidebarOpen ? "lg:ml-56 md:ml-56" : "lg:ml-16 ml-0"
        )}>
          <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto max-w-none 2xl:max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
