'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
  X,
  Bell,
  UserPlus,
  XCircle,
  UserCog,
  CheckCheck,
} from 'lucide-react';
import { subscribeToAllOrders } from '@/lib/firestore/orderService';
import { subscribeToAllTickets } from '@/lib/firestore/ticketService';
import { subscribeToInventory } from '@/lib/firestore/inventoryService';
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AdminNotification,
} from '@/lib/firestore/notificationService';

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

  // Notification bell state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

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

  // Real-time notifications
  useEffect(() => {
    const unsub = subscribeToNotifications(
      (data) => setNotifications(data),
      () => { /* silently ignore */ }
    );
    return () => unsub();
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    if (showNotifPanel) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifPanel]);

  function notifIcon(type: string) {
    switch (type) {
      case 'new_order': return <ShoppingCart size={14} />;
      case 'order_cancelled': return <XCircle size={14} />;
      case 'new_user': return <UserPlus size={14} />;
      case 'profile_updated': return <UserCog size={14} />;
      default: return <Bell size={14} />;
    }
  }

  function notifColor(type: string) {
    switch (type) {
      case 'new_order': return 'bg-green-100 text-green-700';
      case 'order_cancelled': return 'bg-red-100 text-red-700';
      case 'new_user': return 'bg-blue-100 text-blue-700';
      case 'profile_updated': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  function formatNotifTime(ts: any): string {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

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

            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 animate-in zoom-in duration-200">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Panel */}
              {showNotifPanel && (
                <>
                  {/* Mobile backdrop */}
                  <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setShowNotifPanel(false)} />
                  <div className={cn(
                    "bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl overflow-hidden z-50",
                    // Mobile: fixed bottom sheet
                    "fixed inset-x-0 bottom-0 top-auto rounded-t-2xl max-h-[80vh]",
                    // Desktop: absolute dropdown
                    "sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] sm:max-h-[520px] sm:rounded-xl",
                    "animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-top-2 duration-200"
                  )}>
                    {/* Drag handle for mobile */}
                    <div className="flex justify-center py-2 sm:hidden">
                      <div className="w-10 h-1 bg-[var(--text-muted)]/30 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            await markAllNotificationsRead();
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--bg-hover)]"
                        >
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-[60vh] sm:max-h-[420px] divide-y divide-[var(--border)]/30">
                      {notifications.length === 0 ? (
                        <div className="py-16 text-center">
                          <Bell size={32} className="mx-auto text-[var(--text-muted)] mb-3 opacity-20" />
                          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <button
                            key={n.id}
                            onClick={async () => {
                              if (!n.read) await markNotificationRead(n.id);
                              if (n.linkTo) {
                                setShowNotifPanel(false);
                                window.location.href = n.linkTo;
                              }
                            }}
                            className={cn(
                              'w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-[var(--bg-hover)] transition-colors',
                              !n.read && 'bg-[var(--bg)]/60'
                            )}
                          >
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', notifColor(n.type))}>
                              {notifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
                                {n.message}
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 uppercase tracking-widest">{formatNotifTime(n.createdAt)}</p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2 animate-pulse" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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
