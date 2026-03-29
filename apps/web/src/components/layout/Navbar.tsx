'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Search, ShoppingBag, User, Menu, X, Heart, LogOut, Camera } from 'lucide-react';

const navLinks = [
  { href: '/shop?category=men', label: 'Men' },
  { href: '/shop?category=women', label: 'Women' },
  { href: '/shop?category=accessories', label: 'Accessories' },
  { href: '/shop?category=new-arrivals', label: 'New Arrivals' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  const totalItems = useCartStore((s) => s.totalItems); // Not a function anymore
  const wishlistCount = useWishlistStore((s) => s.wishlistedIds.length);
  const { isMobileMenuOpen, toggleMobileMenu, closeAllModals, toggleSearch } = useUIStore();

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHomepage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeAllModals();
    setUserMenuOpen(false);
  }, [pathname, closeAllModals]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isHomepage && !scrolled
            ? 'bg-transparent'
            : 'bg-black/90 backdrop-blur-md border-b border-white/10 shadow-sm',
        )}
      >
        <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 -ml-2 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'font-bold text-xl tracking-[0.3em] uppercase transition-colors text-white flex items-center gap-3',
              )}
            >
              <Image src="https://res.cloudinary.com/dstmv07tf/image/upload/v1773157679/logo1_be0zr0.png" alt="Grizzlywear" width={40} height={40} className="object-contain" priority />
              <span className="hidden sm:inline-block">GRIZZLY</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-8">
              <Link href="/shop" className="text-xs tracking-[0.2em] uppercase font-medium transition-colors hover:opacity-70 text-white">Shop</Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs tracking-[0.2em] uppercase font-medium transition-colors hover:opacity-70 text-gray-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-3 sm:gap-4 text-white">
              <Link
                href="/visual-search"
                className="p-2 transition-colors hover:opacity-70 text-white"
                aria-label="Visual Search"
              >
                <Camera className="w-5 h-5" />
              </Link>
              <button
                onClick={toggleSearch}
                className="p-2 transition-colors hover:opacity-70"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                href="/account/wishlist"
                className="p-2 relative transition-colors hover:opacity-70"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-0 w-3.5 h-3.5 bg-red-600 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="p-2 relative transition-colors hover:opacity-70"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-0 w-3.5 h-3.5 bg-white text-black text-[9px] flex items-center justify-center rounded-full font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>

              <div className="relative hidden sm:block">
                {loading ? (
                  <div className="p-2 transition-colors opacity-50 cursor-wait" aria-label="Loading session">
                    <User className="w-5 h-5 animate-pulse" />
                  </div>
                ) : isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="p-2 transition-colors hover:opacity-70 flex items-center gap-2"
                      aria-label="User menu"
                    >
                      <User className="w-5 h-5" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-black border border-white/20 rounded-none shadow-xl py-2 z-50">
                        <Link href="/account" className="block px-4 py-3 text-xs tracking-widest uppercase text-white hover:bg-white hover:text-black transition-colors">
                          My Account
                        </Link>
                        <Link href="/account/orders" className="block px-4 py-3 text-xs tracking-widest uppercase text-gray-300 hover:bg-white hover:text-black transition-colors">
                          Orders
                        </Link>
                        {isAdmin && (
                          <Link href="/admin/dashboard" className="block px-4 py-3 text-xs tracking-widest uppercase text-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold transition-colors">
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            useCartStore.getState().clearCart();
                            import('@/store/authStore').then((m) => m.useAuthStore.getState().logout());
                          }}
                          className="w-full text-left px-4 py-3 text-xs tracking-widest uppercase text-red-500 hover:bg-red-500 hover:text-black flex items-center gap-2 transition-colors border-t border-white/10 mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login" className="p-2 transition-colors hover:opacity-70">
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAllModals} />
          <div className="absolute top-0 left-0 w-[85vw] max-w-[320px] h-full bg-black border-r border-white/10 shadow-2xl pt-24 px-8 flex flex-col">
            <Link href="/" onClick={closeAllModals} className="font-bold text-2xl tracking-[0.3em] uppercase text-white mb-12">
              GRIZZLY
            </Link>
            <div className="flex flex-col gap-6 font-medium tracking-[0.2em] uppercase text-sm">
              <Link href="/shop" className="text-white">Shop All</Link>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-gray-400 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
              
              <hr className="border-white/20 my-4" />
              
              {loading ? (
                <div className="text-gray-500 animate-pulse">Checking session...</div>
              ) : !isAuthenticated ? (
                <>
                  <Link href="/login" className="text-white hover:text-gray-300">Login</Link>
                  <Link href="/register" className="text-gray-400 hover:text-gray-300">Register</Link>
                </>
              ) : (
                <>
                  <Link href="/account" className="text-white hover:text-gray-300 flex items-center gap-2"><User size={16}/> My Account</Link>
                  <Link href="/account/orders" className="text-gray-400 hover:text-white">Orders</Link>
                  <button onClick={() => { import('@/store/authStore').then((m) => m.useAuthStore.getState().logout()); closeAllModals(); }} className="text-red-500 text-left hover:text-red-400 mt-4">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
