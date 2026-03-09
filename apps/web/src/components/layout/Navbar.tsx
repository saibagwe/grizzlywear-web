'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  LogOut,
} from 'lucide-react';

const navLinks = [
  { href: '/shop?category=new-arrivals', label: 'New Arrivals' },
  { href: '/shop?category=men', label: 'Men' },
  { href: '/shop?category=women', label: 'Women' },
  { href: '/shop?category=accessories', label: 'Accessories' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHomepage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Don't show navbar on admin pages — admin has its own layout
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isHomepage && !scrolled
            ? 'bg-transparent'
            : 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm',
        )}
      >
        <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className={cn('w-5 h-5', isHomepage && !scrolled ? 'text-white' : 'text-black')} />
              ) : (
                <Menu className={cn('w-5 h-5', isHomepage && !scrolled ? 'text-white' : 'text-black')} />
              )}
            </button>

            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'font-bold text-xl tracking-[0.3em] uppercase transition-colors',
                isHomepage && !scrolled ? 'text-white' : 'text-black'
              )}
            >
              GRIZZLYWEAR
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-xs tracking-[0.2em] uppercase font-medium transition-colors hover:opacity-70',
                    isHomepage && !scrolled ? 'text-white' : 'text-gray-800'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/search"
                className={cn(
                  'p-2 transition-colors hover:opacity-70',
                  isHomepage && !scrolled ? 'text-white' : 'text-black'
                )}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Link>

              {isAuthenticated && (
                <Link
                  href="/account/wishlist"
                  className={cn(
                    'p-2 transition-colors hover:opacity-70 hidden sm:block',
                    isHomepage && !scrolled ? 'text-white' : 'text-black'
                  )}
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              <button
                onClick={toggleCart}
                className={cn(
                  'p-2 relative transition-colors hover:opacity-70',
                  isHomepage && !scrolled ? 'text-white' : 'text-black'
                )}
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              <div className="relative">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={cn(
                        'p-2 transition-colors hover:opacity-70',
                        isHomepage && !scrolled ? 'text-white' : 'text-black'
                      )}
                      aria-label="User menu"
                    >
                      <User className="w-5 h-5" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.displayName || user?.email}
                          </p>
                        </div>
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Orders
                        </Link>
                        <Link
                          href="/account/wishlist"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Wishlist
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            useCartStore.getState().clearCart();
                            import('@/store/authStore').then((m) => m.useAuthStore.getState().logout());
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className={cn(
                      'p-2 transition-colors hover:opacity-70',
                      isHomepage && !scrolled ? 'text-white' : 'text-black'
                    )}
                    aria-label="Login"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 w-72 h-full bg-white shadow-2xl pt-20 px-6">
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm tracking-[0.2em] uppercase font-medium text-gray-800 hover:text-black"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="border-gray-200" />
              {!isAuthenticated ? (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-800 hover:text-black">
                    Login
                  </Link>
                  <Link href="/register" className="text-sm font-medium text-gray-800 hover:text-black">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/account" className="text-sm font-medium text-gray-800 hover:text-black">
                    My Account
                  </Link>
                  <Link href="/account/wishlist" className="text-sm font-medium text-gray-800 hover:text-black">
                    Wishlist
                  </Link>
                  <Link href="/track" className="text-sm font-medium text-gray-800 hover:text-black">
                    Track Order
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
