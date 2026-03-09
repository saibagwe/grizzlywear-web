'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Heart, Star, ChevronLeft, ChevronRight, Share2, X } from 'lucide-react';
import { toast } from 'sonner';

import { MOCK_PRODUCTS, MOCK_REVIEWS, type Review } from '@/lib/mock-data';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = MOCK_PRODUCTS.find(p => p.slug === params.slug) || MOCK_PRODUCTS[0]; // fallback for mock
  
  if (!product) {
    notFound();
  }

  // State
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'sizes' | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  // Stores
  const addItem = useCartStore(s => s.addItem);
  const { wishlistedIds, toggleFavorite: toggleWishlist } = useWishlistStore();
  const isWishlisted = wishlistedIds.includes(product.id);

  // Derived Review Data
  const productReviews: Review[] = (MOCK_REVIEWS as unknown as Record<string, Review[]>)[product.id] || [];
  const REVIEWS_PER_PAGE = 3;
  const totalReviewPages = Math.ceil(productReviews.length / REVIEWS_PER_PAGE);
  const displayedReviews = productReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);
  
  const avgRating = productReviews.length > 0
    ? (productReviews.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0) / productReviews.length).toFixed(1)
    : '5.0';

  // Related Products
  const relatedProducts = useMemo(() => {
    return MOCK_PRODUCTS
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  // Handlers
  const handleAddToCart = () => {
    if (!selectedSize && product.sizes) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    addItem(
      product,
      selectedSize || 'OS',
      quantity
    );

    toast.success('Added to cart', {
      description: `${quantity}x ${product.name} (${selectedSize || 'OS'})`,
      action: {
        label: 'View Cart',
        onClick: () => window.location.href = '/cart'
      }
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Grizzlywear`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied to clipboard');
    }
  };

  const toggleTab = (tab: 'details' | 'shipping' | 'sizes') => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div className="min-h-screen pt-20 pb-20 bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
            <span>/</span>
            <Link href={`/shop?category=${product.category.toLowerCase()}`} className="hover:text-black transition-colors">{product.category}</Link>
            <span>/</span>
            <span className="text-black font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
          
          {/* Images Section */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 mb-10 lg:mb-0 lg:sticky lg:top-28">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 w-full sm:w-20 flex-shrink-0 hide-scrollbar">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative aspect-[3/4] w-20 sm:w-full flex-shrink-0 border transition-all duration-300",
                    activeImage === i ? "border-black scale-100" : "border-transparent opacity-60 hover:opacity-100 scale-95 hover:scale-100"
                  )}
                >
                  <Image src={img} alt={`${product.name} view ${i+1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="relative aspect-[3/4] w-full bg-gray-100">
              <Image 
                src={product.images[activeImage]} 
                alt={product.name} 
                fill 
                priority
                className="object-cover" 
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              
              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.isNew && <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase shadow-sm">New</span>}
                {product.comparePrice && <span className="bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase shadow-sm">Sale</span>}
              </div>

              {/* Actions Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button onClick={handleShare} className="bg-white/80 backdrop-blur-md p-3 rounded-full hover:bg-white shadow-sm transition-colors" aria-label="Share">
                  <Share2 size={18} className="text-gray-800" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:pt-4">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-2 pr-4">{product.name}</h1>
                <div className="flex items-center gap-4 text-sm mt-3">
                  <div className="flex items-center text-yellow-500">
                    <Star size={14} className="fill-current" />
                    <span className="ml-1.5 font-medium text-black">{avgRating}</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <a href="#reviews" className="text-gray-500 hover:text-black underline underline-offset-4 decoration-gray-300">
                    {productReviews.length} Reviews
                  </a>
                </div>
              </div>
              <button 
                onClick={() => toggleWishlist(product.id)}
                className="p-3 border border-gray-200 rounded-full hover:border-black transition-colors shrink-0"
              >
                <Heart size={20} className={cn("transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900")} />
              </button>
            </div>

            <div className="flex items-baseline gap-4 mb-8">
              <p className="text-2xl font-medium tracking-tight">₹{product.price.toLocaleString('en-IN')}</p>
              {product.comparePrice && (
                <p className="text-lg text-gray-400 line-through">₹{product.comparePrice.toLocaleString('en-IN')}</p>
              )}
            </div>

            <div className="mb-10 text-sm leading-relaxed text-gray-600">
              <p>{product.description}</p>
            </div>

            <hr className="border-gray-100 mb-8" />

            {/* Sizes */}
            {product.sizes && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-900">Select Size</h3>
                  <button onClick={() => toggleTab('sizes')} className="text-xs text-gray-500 uppercase tracking-widest hover:text-black border-b border-gray-300 hover:border-black pb-0.5 transition-colors">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      className={cn(
                        "h-14 border text-xs font-bold tracking-widest transition-all",
                        selectedSize === size 
                          ? "border-black bg-black text-white" 
                          : "border-gray-200 hover:border-black text-gray-800 focus:outline-none"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && <p className="text-xs text-red-500 mt-3 font-medium flex items-center gap-1.5"><X size={14}/> Please select a size to continue.</p>}
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              <div className="h-14 border border-black flex items-center justify-between px-6 sm:w-1/3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-xl font-light hover:text-gray-500 transition-colors w-8 text-center">-</button>
                <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-xl font-light hover:text-gray-500 transition-colors w-8 text-center">+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                className="h-14 flex-1 bg-black text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
              >
                Add to Cart
              </button>
            </div>

            {/* Accordions */}
            <div className="border-t border-gray-200">
              
              {/* Details Tab */}
              <div className="border-b border-gray-200">
                <button onClick={() => toggleTab('details')} className="w-full py-6 flex justify-between items-center group">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-900 group-hover:text-gray-500 transition-colors">Details & Materials</span>
                  <span className="text-xl font-light">{activeTab === 'details' ? '−' : '+'}</span>
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", activeTab === 'details' ? "max-h-96 pb-6" : "max-h-0")}>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li>{product.material}</li>
                    <li>{product.fit}</li>
                    {product.features.map((feature: string, idx: number) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Shipping Tab */}
              <div className="border-b border-gray-200">
                <button onClick={() => toggleTab('shipping')} className="w-full py-6 flex justify-between items-center group">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-900 group-hover:text-gray-500 transition-colors">Shipping & Returns</span>
                  <span className="text-xl font-light">{activeTab === 'shipping' ? '−' : '+'}</span>
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", activeTab === 'shipping' ? "max-h-96 pb-6" : "max-h-0")}>
                  <div className="text-sm text-gray-600 space-y-4">
                    <p><strong>Free Shipping:</strong> On all orders over ₹999 within India.</p>
                    <p><strong>Standard Delivery:</strong> 3-5 business days.</p>
                    <p><strong>Returns:</strong> 7-day hassle-free returns. Item must be in original condition with tags attached.</p>
                  </div>
                </div>
              </div>

              {/* Size Guide Tab */}
              <div className="border-b border-gray-200">
                <button onClick={() => toggleTab('sizes')} className="w-full py-6 flex justify-between items-center group">
                  <span className="text-xs uppercase tracking-widest font-bold text-gray-900 group-hover:text-gray-500 transition-colors">Size Guide</span>
                  <span className="text-xl font-light">{activeTab === 'sizes' ? '−' : '+'}</span>
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", activeTab === 'sizes' ? "max-h-96 pb-6" : "max-h-0")}>
                  <div className="text-sm text-gray-600">
                    <p className="mb-4">Model is 6&apos;1&quot; wearing size L.</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs tracking-widest uppercase">
                            <th className="py-2 font-medium">Size</th>
                            <th className="py-2 font-medium">Chest (in)</th>
                            <th className="py-2 font-medium">Length (in)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100"><td className="py-2">S</td><td className="py-2">42</td><td className="py-2">28</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-2">M</td><td className="py-2">44</td><td className="py-2">29</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-2">L</td><td className="py-2">46</td><td className="py-2">30</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-2">XL</td><td className="py-2">48</td><td className="py-2">31</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div id="reviews" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-100 mt-12">
        <div className="flex flex-col md:flex-row items-start justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-light tracking-tight mb-2">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              <div className="flex text-black">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={18} className={s <= Math.round(Number(avgRating)) ? "fill-current" : "text-gray-200 fill-current"} />
                ))}
              </div>
              <span className="text-lg font-medium">{avgRating} out of 5</span>
              <span className="text-sm text-gray-500">Based on {productReviews.length} reviews</span>
            </div>
          </div>
          <button 
            onClick={() => setShowReviewModal(true)}
            className="border border-black px-8 py-4 text-xs tracking-widest uppercase font-bold hover:bg-black hover:text-white transition-colors"
          >
            Write a Review
          </button>
        </div>

        {productReviews.length > 0 ? (
          <div className="space-y-8">
            {displayedReviews.map((r: { id: string; rating: number; userName: string; date: string; title: string; body: string }) => (
              <div key={r.id} className="border-b border-gray-100 pb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex text-black mb-2">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className={s <= r.rating ? "fill-current" : "text-gray-200 fill-current"} />)}
                    </div>
                    <p className="font-medium text-sm">{r.userName}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{r.date}</p>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">Verified Buyer</div>
                </div>
                <h4 className="font-bold text-sm mb-2">{r.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
              </div>
            ))}
            
            {/* Pagination */}
            {totalReviewPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <button 
                  disabled={reviewPage === 1} 
                  onClick={() => setReviewPage(p => p - 1)}
                  className="p-2 border rounded-full disabled:opacity-30 hover:bg-gray-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest">Page {reviewPage} of {totalReviewPages}</span>
                <button 
                  disabled={reviewPage === totalReviewPages} 
                  onClick={() => setReviewPage(p => p + 1)}
                  className="p-2 border rounded-full disabled:opacity-30 hover:bg-gray-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>

      {/* YOU MIGHT ALSO LIKE */}
      {relatedProducts.length > 0 && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-100">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-light tracking-tight">You Might Also Like</h2>
            <Link href={`/shop?category=${product.category.toLowerCase()}`} className="text-xs tracking-[0.2em] uppercase font-bold text-gray-500 hover:text-black border-b border-transparent hover:border-black pb-0.5 transition-colors hidden sm:block">
              Shop All
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(p => (
              <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
                <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden relative">
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{p.name}</h3>
                <p className="text-sm text-gray-500">₹{p.price.toLocaleString('en-IN')}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Review Modal Override for Prototype */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="bg-white w-full max-w-lg p-8 relative z-10">
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            <h3 className="text-2xl font-light mb-6">Write a Review</h3>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Review submitted for moderation.'); setShowReviewModal(false); }} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Rating</label>
                <div className="flex text-gray-300">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={24} className="cursor-pointer hover:text-black hover:fill-current transition-colors" />)}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Title</label>
                <input required type="text" className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-black" placeholder="Summarize your experience" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Review</label>
                <textarea required rows={4} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-black resize-none" placeholder="Tell us what you liked or disliked"></textarea>
              </div>
              <button type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest text-xs py-4 hover:bg-gray-800 transition-colors">Submit Review</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
