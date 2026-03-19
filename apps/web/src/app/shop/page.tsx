'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Heart, X, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';
import { subscribeToProducts, type FirestoreProduct } from '@/lib/firestore/productService';

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category') || 'All';

  const [activeCategory, setActiveCategory] = useState(
    initialCategory === 'new-arrivals' ? 'New Arrivals' :
    initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1)
  );

  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Featured');

  const { wishlistedIds, toggleFavorite: toggleWishlist } = useWishlistStore();
  const gridRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firestore products in real time
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Keep category in sync with URL changes
  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat === 'new-arrivals') setActiveCategory('New Arrivals');
    else if (cat === 'men') setActiveCategory('Men');
    else if (cat === 'women') setActiveCategory('Women');
    else if (cat === 'accessories') setActiveCategory('Accessories');
    else setActiveCategory('All');
  }, [searchParams]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory === 'New Arrivals') {
      result = result.filter(p => p.isNew);
    } else if (activeCategory === 'Men') {
      result = result.filter(p => p.category === 'men');
    } else if (activeCategory === 'Women') {
      result = result.filter(p => p.category === 'women');
    } else if (activeCategory === 'Accessories') {
      result = result.filter(p => p.category === 'accessories');
    }

    if (selectedSizes.length > 0) {
      result = result.filter(p => {
        if (!p.sizes) return false;
        return p.sizes.some(s => selectedSizes.includes(s));
      });
    }

    switch (sortBy) {
      case 'Price: Low to High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'Discounted':
        result = result.filter(p => p.comparePrice !== undefined);
        break;
      default: // Featured
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [products, activeCategory, selectedSizes, sortBy]);

  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.product-card');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
        );
      }
    }
  }, [filteredProducts]);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-3 uppercase">Stock</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">
            Premium fashion for the fearless.{!loading && ` ${products.length} total products.`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-10">

              {/* Category Filter */}
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase font-bold text-gray-900 mb-6">Category</h3>
                <div className="flex flex-col gap-4">
                  {['All', 'New Arrivals', 'Men', 'Women', 'Accessories'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "flex justify-between items-center text-sm font-medium transition-all group",
                        activeCategory === cat ? "text-black translate-x-1" : "text-gray-400 hover:text-black hover:translate-x-1"
                      )}
                    >
                      <span className="uppercase tracking-widest">{cat}</span>
                      {activeCategory === cat && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div>
                <h3 className="text-xs tracking-[0.2em] uppercase font-bold text-gray-900 mb-6 flex justify-between items-center">
                  Size
                  {selectedSizes.length > 0 && (
                    <button
                      onClick={() => setSelectedSizes([])}
                      className="text-[10px] text-gray-400 hover:text-black font-normal underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={cn(
                        "h-10 border text-xs font-medium transition-all",
                        selectedSizes.includes(size)
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100 min-h-[40px]">

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500 uppercase tracking-widest hidden lg:block mr-2">Filters:</span>
                {selectedSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors"
                  >
                    {size} <X size={12} className="ml-1" />
                  </button>
                ))}
                {selectedSizes.length === 0 && <span className="text-xs text-gray-400 italic">None selected</span>}
              </div>

              <div className="flex items-center gap-4 sm:ml-auto shrink-0">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                  {loading ? '...' : `${filteredProducts.length} Results`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-widest">Sort</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-bold uppercase tracking-widest border-none bg-transparent focus:ring-0 cursor-pointer p-0 pr-4"
                  >
                    <option>Featured</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Discounted</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                  <p className="text-xs uppercase tracking-widest text-gray-400">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
                {filteredProducts.map((product) => {
                  const isWishlisted = wishlistedIds.includes(product.id);
                  return (
                    <div key={product.id} className="product-card group relative block">

                      {/* Image Asset Wrapper */}
                      <Link href={`/shop/${product.slug}`} className="block relative aspect-[3/4] bg-[#F5F5F5] mb-4 overflow-hidden">
                        {product.images[0] && (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}
                        {product.images[1] && (
                          <Image
                            src={product.images[1] || product.images[0]}
                            alt={`${product.name} alternate`}
                            fill
                            className="object-cover absolute inset-0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105 ease-out"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                          {product.isNew && (
                            <span className="bg-white px-2 py-1 text-[9px] font-bold tracking-widest uppercase shadow-sm">New</span>
                          )}
                          {product.comparePrice && (
                            <span className="bg-red-600 text-white px-2 py-1 text-[9px] font-bold tracking-widest uppercase shadow-sm">Sale</span>
                          )}
                        </div>
                      </Link>

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product.id);
                        }}
                        className={cn(
                          "absolute top-3 right-3 p-2 z-20 rounded-full bg-white/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-sm",
                          isWishlisted ? "opacity-100" : ""
                        )}
                      >
                        <Heart size={16} className={cn("transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900")} />
                      </button>

                      {/* Info Text */}
                      <Link href={`/shop/${product.slug}`} className="block">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4 decoration-1">{product.name}</h3>
                            <p className="text-xs text-gray-500 tracking-wider uppercase">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">₹{product.price.toLocaleString('en-IN')}</p>
                            {product.comparePrice && (
                              <p className="text-xs text-gray-400 line-through">₹{product.comparePrice.toLocaleString('en-IN')}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-gray-100">
                <p className="text-2xl font-light uppercase tracking-widest mb-4">No Products Found</p>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {products.length === 0
                    ? 'No products have been added to the store yet.'
                    : 'Try adjusting your filters or search terms.'}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={() => { setActiveCategory('All'); setSelectedSizes([]); }}
                    className="bg-black text-white px-8 py-4 text-xs tracking-widest uppercase font-bold hover:bg-gray-800 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}

            {!loading && filteredProducts.length > 0 && (
              <div className="mt-20 flex justify-center">
                <button className="border border-black px-12 py-4 text-xs tracking-[0.2em] uppercase font-bold hover:bg-black hover:text-white transition-all duration-300">
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
