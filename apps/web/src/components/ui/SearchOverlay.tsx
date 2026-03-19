'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { subscribeToProducts, type FirestoreProduct } from '@/lib/firestore/productService';
import { Search, X } from 'lucide-react';

const trendingSearches = ['Oversized Tees', 'Hoodies', 'Wide Leg', 'Caps', 'New Arrivals', "Women's Basics"];

export default function SearchOverlay() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to products for search
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => setAllProducts(prods));
    return () => unsub();
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Autofocus
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isSearchOpen]);

  // ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    if (isSearchOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isSearchOpen, setSearchOpen]);

  const results = debouncedQuery.trim()
    ? allProducts.filter((p: FirestoreProduct) => {
        const q = debouncedQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q)) ||
          (p.subcategory ?? '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const navigate = useCallback((path: string) => {
    setSearchOpen(false);
    router.push(path);
  }, [setSearchOpen, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/[0.96]" onClick={() => setSearchOpen(false)}>
      <div className="max-w-[800px] mx-auto px-4 pt-24 sm:pt-32" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={() => setSearchOpen(false)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors" aria-label="Close search">
          <X className="w-6 h-6" />
        </button>

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative mb-12">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, styles, categories..."
            className="w-full bg-transparent border-b border-white/30 text-white text-xl sm:text-2xl font-light pl-8 pb-4 focus:outline-none focus:border-white placeholder:text-white/30 transition-colors"
          />
        </form>

        {/* Results */}
        {!debouncedQuery.trim() ? (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Trending Searches</p>
            <div className="flex flex-wrap gap-3">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 border border-white/20 text-sm text-white/70 hover:text-white hover:border-white transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest mb-6">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/shop/${product.slug}`)}
                  className="flex-shrink-0 flex items-center gap-3 p-3 border border-white/10 hover:border-white/30 transition-colors group"
                >
                  <div className="w-16 h-16 bg-gray-800 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm text-white truncate max-w-[160px]">{product.name}</p>
                    <p className="text-xs text-white/50">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate(`/shop?search=${encodeURIComponent(query.trim())}`)}
              className="mt-6 text-xs text-white/50 uppercase tracking-widest hover:text-white transition-colors"
            >
              View all {results.length} results →
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/50 text-sm mb-3">No products found for &ldquo;{debouncedQuery}&rdquo;</p>
            <p className="text-xs text-white/30">Try: Oversized, Hoodies, Joggers, Caps</p>
          </div>
        )}
      </div>
    </div>
  );
}
