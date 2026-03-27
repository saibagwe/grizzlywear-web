'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heart, Star, ChevronLeft, ChevronRight, Share2, X, Loader2, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

import { subscribeToProducts, getProductBySlug, type FirestoreProduct } from '@/lib/firestore/productService';
import { submitReview, subscribeToProductReviews, type FirestoreReview } from '@/lib/firestore/reviewService';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

// We need to map Firestore product to the shape the cart expects.
// The cart was built for the old Product type; we use a compatible subset.
type CartProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
  sizes: string[];
  category: string;
  slug: string;
};

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<FirestoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<FirestoreReview[]>([]);

  // State
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'sizes' | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({});

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Stores
  const addItem = useCartStore(s => s.addItem);
  const { wishlistedIds, toggleFavorite: toggleWishlist } = useWishlistStore();
  const { user, initialized } = useAuthStore();

  // Fetch product by slug
  useEffect(() => {
    setLoading(true);
    getProductBySlug(params.slug).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [params.slug]);

  // Real-time stock monitor
  useEffect(() => {
    if (!product?.id) return;

    const productRef = doc(db, 'products', product.id);
    const unsub = onSnapshot(productRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const stock = data.stock || {};
        setSizeStock(stock);

        // Auto-deselect if current size goes out of stock
        if (selectedSize && (stock[selectedSize] ?? 0) === 0) {
          setSelectedSize(null);
          toast.warning(`Size ${selectedSize} is now out of stock. Please select another size.`);
        }
      }
    });

    return () => unsub();
  }, [product?.id, selectedSize]);

  // Subscribe to all products for "You Might Also Like"
  useEffect(() => {
    const unsub = subscribeToProducts((prods) => setAllProducts(prods));
    return () => unsub();
  }, []);

  // Fetch approved reviews
  useEffect(() => {
    if (!product) return;
    const unsub = subscribeToProductReviews(product.id, (revs) => {
      setApprovedReviews(revs);
    });
    return () => unsub();
  }, [product]);

  const isWishlisted = product ? wishlistedIds.includes(product.id) : false;

  // Reviews — Firestore reviews collection would be a future enhancement.
  // For now, show empty state gracefully.
  const REVIEWS_PER_PAGE = 3;
  const totalReviewPages = Math.ceil(approvedReviews.length / REVIEWS_PER_PAGE);

  const avgRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length 
    : 0;

  // Related Products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, allProducts]);

  const allOutOfStock = useMemo(() => {
    if (!product || !product.sizes || product.sizes.length === 0) return false;
    return product.sizes.every(size => (sizeStock[size] ?? 0) === 0);
  }, [product, sizeStock]);



  // Handlers
  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    // Cast to CartProduct shape
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      sizes: product.sizes,
      category: product.category,
      slug: product.slug,
      // Add remaining fields with safe defaults for cart compatibility
      comparePrice: product.comparePrice,
      description: product.description,
      shortDescription: product.shortDescription,
      subcategory: product.subcategory,
      colors: product.colors,
      material: product.material,
      fit: product.fit,
      careInstructions: product.careInstructions,
      features: product.features,
      rating: product.rating,
      reviewCount: product.reviewCount,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      inStock: product.inStock,
      tags: product.tags,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addItem(cartProduct as any, selectedSize || 'OS', quantity);

    toast.success('Added to cart', {
      description: `${quantity}x ${product.name} (${selectedSize || 'OS'})`,
      action: {
        label: 'View Cart',
        onClick: () => window.location.href = '/cart'
      }
    });
  };

  const handleShare = async () => {
    if (!product) return;
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    setSubmittingReview(true);
    try {
      await submitReview({
        productId: product.id,
        productName: product.name,
        userId: user.uid,
        userName: user.displayName || 'Customer',
        customerName: user.displayName || 'Customer',
        customerEmail: user.email || '',
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      toast.success('Your review has been submitted and is pending approval');
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-20 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-gray-400" />
          <p className="text-xs uppercase tracking-widest text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    notFound();
  }

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
                  <Image src={img} alt={`${product.name} view ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="relative aspect-[3/4] w-full bg-gray-100">
              {product.images[activeImage] && (
                <Image
                  src={product.images[activeImage]}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}

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
                    <span className="ml-1.5 font-medium text-black">{avgRating > 0 ? avgRating.toFixed(1) : '5.0'}</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <a href="#reviews" className="text-gray-500 hover:text-black underline underline-offset-4 decoration-gray-300">
                    {approvedReviews.length} Reviews
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
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gray-900">Select Size</h3>
                  <button onClick={() => toggleTab('sizes')} className="text-xs text-gray-500 uppercase tracking-widest hover:text-black border-b border-gray-300 hover:border-black pb-0.5 transition-colors">
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {product.sizes.map((size) => {
                    const isAvailable = (sizeStock[size] ?? 0) > 0;
                    return (
                      <button
                        key={size}
                        disabled={!isAvailable}
                        onClick={() => { setSelectedSize(size); setSizeError(false); }}
                        title={!isAvailable ? `Not available in size ${size}` : ''}
                        className={cn(
                          "relative h-14 border text-xs font-bold tracking-widest transition-all overflow-hidden flex flex-col items-center justify-center",
                          selectedSize === size
                            ? "border-black bg-black text-white"
                            : isAvailable 
                              ? "border-gray-200 hover:border-black text-gray-800"
                              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60"
                        )}
                      >
                        <span className={cn(isAvailable ? "" : "line-through")}>{size}</span>
                        {!isAvailable && (
                          <span className="text-[9px] font-bold text-red-400 mt-0.5">N/A</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {sizeError && !allOutOfStock && <p className="text-xs text-red-500 mt-3 font-medium flex items-center gap-1.5"><X size={14} /> Please select a size to continue.</p>}
                
                {allOutOfStock && (
                  <div className="mt-6 flex items-center gap-3 bg-red-50 border border-red-100 p-4">
                    <Info className="text-red-500" size={18} />
                    <p className="text-xs font-bold uppercase tracking-widest text-red-900">This product is currently out of stock in all sizes</p>
                  </div>
                )}
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14">
              {!allOutOfStock && (
                <div className="h-14 border border-black flex items-center justify-between px-6 sm:w-1/3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-xl font-light hover:text-gray-500 transition-colors w-8 text-center">-</button>
                  <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-xl font-light hover:text-gray-500 transition-colors w-8 text-center">+</button>
                </div>
              )}
              <button
                disabled={allOutOfStock}
                onClick={handleAddToCart}
                className={cn(
                  "h-14 flex-1 text-xs uppercase tracking-[0.2em] font-bold transition-colors active:scale-[0.98]",
                  allOutOfStock 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-black text-white hover:bg-gray-800"
                )}
              >
                {allOutOfStock ? 'Currently Out of Stock' : 'Add to Cart'}
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
                    {product.material && <li>{product.material}</li>}
                    {product.fit && <li>{product.fit}</li>}
                    {(product.features ?? []).map((feature: string, idx: number) => (
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
        <div className="flex flex-col lg:flex-row items-start justify-between mb-12 gap-10">
          <div className="flex-1 w-full lg:max-w-md">
            <h2 className="text-3xl font-light tracking-tight mb-6">Customer Reviews</h2>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={28} className={s <= Math.round(avgRating > 0 ? avgRating : 5) ? "fill-current" : "text-gray-200 fill-current"} />
                ))}
              </div>
              <span className="text-3xl font-light">{avgRating > 0 ? avgRating.toFixed(1) : '5.0'} <span className="text-lg text-[var(--text-muted)]">out of 5</span></span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-8">Based on {approvedReviews.length} reviews</p>

            {/* Rating Breakdown Bar */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(star => {
                const count = approvedReviews.filter(r => r.rating === star).length;
                const percentage = approvedReviews.length > 0 ? Math.round((count / approvedReviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-8 font-medium text-[var(--text-secondary)]">{star} <Star size={12} className="inline fill-current -mt-0.5" /></span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-10 text-right text-[var(--text-muted)] text-xs">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            {initialized && user ? (
              <button
                onClick={() => setShowReviewModal(true)}
                className="border border-black px-8 py-4 text-xs tracking-widest uppercase font-bold hover:bg-black hover:text-white transition-colors"
              >
                Write a Review
              </button>
            ) : (
              <p className="text-sm text-gray-500">Please login to leave a review.</p>
            )}
          </div>
        </div>

        {approvedReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {approvedReviews.slice(0, reviewPage * 5).map((review) => {
              const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
              return (
                <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} className={s <= review.rating ? "fill-current" : "text-gray-200 fill-current"} />
                      ))}
                    </div>
                    {/* User and verify badge */}
                    <div className="flex items-center gap-2 text-xs">
                      <strong className="text-gray-900">{review.userName || review.customerName || 'Customer'}</strong>
                      {review.verified && (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle size={10} /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-lg mb-2 text-black">{review.title}</h4>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                  
                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                     <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                       {review.images.map((img: string, i: number) => (
                         <a key={i} href={img} target="_blank" rel="noreferrer" className="relative w-20 h-20 shrink-0 border border-gray-200 rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                           <Image src={img} alt="Review attachment" fill className="object-cover" />
                         </a>
                       ))}
                     </div>
                  )}

                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              );
            })}
            
            {reviewPage * 5 < approvedReviews.length && (
              <div className="pt-6 flex justify-center">
                <button 
                  onClick={() => setReviewPage(prev => prev + 1)}
                  className="border border-gray-300 px-6 py-3 text-xs uppercase tracking-widest font-bold hover:border-black transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
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
                  {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 50vw, 25vw" />}
                </div>
                <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">{p.name}</h3>
                <p className="text-sm text-gray-500">₹{p.price.toLocaleString('en-IN')}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
          <div className="bg-white w-full max-w-lg p-8 relative z-10">
            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            <h3 className="text-2xl font-light mb-6">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Rating</label>
                <div className="flex text-yellow-500">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={24} 
                      onClick={() => setReviewRating(s)}
                      className={cn("cursor-pointer transition-colors", s <= reviewRating ? "fill-current" : "text-gray-200 fill-current")} 
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Title</label>
                <input required value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} type="text" className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-black" placeholder="Summarize your experience" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Review</label>
                <textarea required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-black resize-none" placeholder="Tell us what you liked or disliked"></textarea>
              </div>
              <button disabled={submittingReview} type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest text-xs py-4 hover:bg-gray-800 transition-colors disabled:opacity-50">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
