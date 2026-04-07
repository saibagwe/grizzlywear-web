'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heart, Star, ChevronLeft, ChevronRight, Share2, X, Loader2, CheckCircle, Info, Camera, ImageIcon, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

import { subscribeToProducts, getProductBySlug, type FirestoreProduct } from '@/lib/firestore/productService';
import {
  submitReview,
  subscribeToProductReviews,
  subscribeToUserProductReview,
  updateUserReview,
  uploadReviewImages,
  type FirestoreReview,
} from '@/lib/firestore/reviewService';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import TryOnModal from '@/components/ui/TryOnModal';
import SizeAdvisorModal from '@/components/ui/SizeAdvisorModal';
import { getSizeMeasurements, saveSizeMeasurements } from '@/lib/firestore/userService';
import type { SizeMeasurements } from '@/lib/sizeRecommendation';

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
  const [userReview, setUserReview] = useState<FirestoreReview | null>(null);

  // State
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'sizes' | null>(null);
  const [reviewsShown, setReviewsShown] = useState(4);
  const [sizeError, setSizeError] = useState(false);
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({});
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [sizeAdvisorOpen, setSizeAdvisorOpen] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState<SizeMeasurements | null>(null);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [editingReview, setEditingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

  // Subscribe to user's own review for this product
  useEffect(() => {
    if (!product || !user) {
      setUserReview(null);
      return;
    }
    const unsub = subscribeToUserProductReview(user.uid, product.id, (review) => {
      setUserReview(review);
    });
    return () => unsub();
  }, [product, user]);

  useEffect(() => {
    if (!user) return;
    getSizeMeasurements(user.uid)
      .then(m => { if (m) setSavedMeasurements(m); })
      .catch(() => {});
  }, [user]);

  const isWishlisted = product ? wishlistedIds.includes(product.id) : false;

  const avgRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length 
    : 0;

  // Format reviewer name as "First L."
  const formatReviewerName = (name: string) => {
    if (!name) return 'Customer';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  // Render half-star-capable star display
  const renderStars = (rating: number, size: number = 14) => {
    return [1, 2, 3, 4, 5].map(s => {
      const filled = s <= Math.floor(rating);
      const halfFilled = !filled && s === Math.ceil(rating) && rating % 1 >= 0.25;
      return (
        <span key={s} className="relative inline-block" style={{ width: size, height: size }}>
          {/* Empty star background */}
          <Star size={size} className="absolute inset-0 text-gray-200 fill-current" />
          {/* Full or half fill */}
          {(filled || halfFilled) && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: filled ? '100%' : '50%' }}
            >
              <Star size={size} className="text-amber-400 fill-current" />
            </span>
          )}
        </span>
      );
    });
  };

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalAllowed = 3 - reviewImages.length;
    const newFiles = files.slice(0, totalAllowed);
    if (files.length > totalAllowed) {
      toast.warning(`Maximum 3 photos allowed. Only ${totalAllowed} were added.`);
    }

    setReviewImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReviewImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so selecting the same file again works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeReviewImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const startEditReview = () => {
    if (!userReview) return;
    setReviewRating(userReview.rating);
    setReviewTitle(userReview.title);
    setReviewComment(userReview.comment);
    setEditingReview(true);
    setReviewImages([]);
    setReviewImagePreviews([]);
  };

  const cancelEditReview = () => {
    setEditingReview(false);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewImages([]);
    setReviewImagePreviews([]);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    if (reviewComment.length < 10) {
      toast.error('Review comment must be at least 10 characters.');
      return;
    }
    setSubmittingReview(true);
    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (reviewImages.length > 0) {
        imageUrls = await uploadReviewImages(user.uid, product.id, reviewImages);
      }

      if (editingReview && userReview?.id) {
        // Update existing pending review
        await updateUserReview(userReview.id, {
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
          ...(imageUrls.length > 0 ? { images: [...(userReview.images || []), ...imageUrls] } : {}),
        });
        toast.success('Your review has been updated and is pending approval.');
      } else {
        // Submit new review
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
          ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
        });
        toast.success('Your review has been submitted and is pending approval.');
      }

      setEditingReview(false);
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      setReviewImages([]);
      setReviewImagePreviews([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleTryOn = () => {
    if (!initialized) return;
    if (!user) {
      toast.error('Please log in to use the Try-On feature');
      return;
    }
    setTryOnOpen(true);
  };

  const handleSaveMeasurements = async (m: SizeMeasurements) => {
    if (!user) return;
    try {
      await saveSizeMeasurements(user.uid, m);
      setSavedMeasurements(m);
    } catch {
      // silently fail — size selection still works without saving
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
                  <button
                    onClick={() => setSizeAdvisorOpen(true)}
                    className="text-xs text-gray-500 uppercase tracking-widest hover:text-black border-b border-gray-300 hover:border-black pb-0.5 transition-colors ml-4"
                  >
                    📐 Find My Size
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

            {/* Try On Me */}
            <button
              onClick={handleTryOn}
              className="w-full border border-black text-black py-4 text-xs tracking-widest uppercase font-medium hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center gap-2 mb-4"
            >
              ✨ Try On Me
            </button>

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

      {/* ═══════════════════ REVIEWS SECTION ═══════════════════ */}
      <div id="reviews" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-100 mt-12">
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-12">Customer Reviews</h2>

        {/* ── Rating Summary ── */}
        <div className="flex flex-col lg:flex-row gap-12 mb-16">
          {/* Left: Average Rating */}
          <div className="flex flex-col items-center lg:items-start gap-3 lg:min-w-[200px]">
            <span className="text-6xl font-extralight tracking-tight text-gray-900">
              {approvedReviews.length > 0 ? avgRating.toFixed(1) : '—'}
            </span>
            <div className="flex gap-0.5">
              {renderStars(approvedReviews.length > 0 ? avgRating : 0, 22)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {approvedReviews.length > 0
                ? `Based on ${approvedReviews.length} review${approvedReviews.length !== 1 ? 's' : ''}`
                : 'No reviews yet'}
            </p>
          </div>

          {/* Right: Rating Breakdown Bars */}
          <div className="flex-1 max-w-lg space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = approvedReviews.filter(r => r.rating === star).length;
              const percentage = approvedReviews.length > 0 ? Math.round((count / approvedReviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm group">
                  <span className="w-10 flex items-center gap-1 font-medium text-gray-600 shrink-0">
                    {star}
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-gray-400 text-xs shrink-0">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Review Cards ── */}
        {approvedReviews.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-gray-100">
            <Star size={32} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {approvedReviews.slice(0, reviewsShown).map((review) => {
              const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
              const displayName = formatReviewerName(review.userName || review.customerName || 'Customer');
              return (
                <div
                  key={review.id}
                  className="border border-gray-100 bg-white p-6 sm:p-8 mb-4 hover:shadow-sm transition-shadow duration-300"
                >
                  {/* Header: Name + Stars + Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar initial */}
                      <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {(review.userName || review.customerName || 'C')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{displayName}</span>
                          {review.verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full font-bold border border-green-100">
                              <CheckCircle size={10} /> Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex gap-0.5">{renderStars(review.rating, 13)}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold sm:text-right">
                      {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Title + Comment */}
                  <h4 className="font-bold text-base mb-2 text-gray-900">{review.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mb-4">{review.comment}</p>

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {review.images.map((img: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setLightboxImage(img)}
                          className="relative w-20 h-20 shrink-0 border border-gray-200 rounded-md overflow-hidden hover:opacity-80 transition-opacity focus:ring-2 focus:ring-black focus:ring-offset-1"
                        >
                          <Image src={img} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="80px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More Button */}
            {reviewsShown < approvedReviews.length && (
              <div className="pt-8 flex justify-center">
                <button
                  onClick={() => setReviewsShown(prev => prev + 4)}
                  className="border border-gray-300 px-8 py-3.5 text-xs uppercase tracking-[0.15em] font-bold hover:border-black hover:bg-black hover:text-white transition-all duration-300"
                >
                  Load More Reviews
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Write / Edit Review Section ── */}
        <div className="mt-16 pt-12 border-t border-gray-100">
          {!initialized ? null : !user ? (
            /* Not logged in */
            <div className="text-center py-10 bg-gray-50 border border-gray-100">
              <p className="text-gray-500 text-sm mb-4">Please log in to write a review.</p>
              <Link
                href="/login"
                className="inline-block border border-black px-8 py-3 text-xs tracking-widest uppercase font-bold hover:bg-black hover:text-white transition-colors"
              >
                Log In
              </Link>
            </div>
          ) : userReview && !editingReview ? (
            /* User already has a review — show it */
            <div className="bg-gray-50 border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Your Review</h3>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full",
                    userReview.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-100' :
                    userReview.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-red-50 text-red-700 border border-red-100'
                  )}>
                    {userReview.status}
                  </span>
                  {userReview.status === 'pending' && (
                    <button
                      onClick={startEditReview}
                      className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-gray-500 hover:text-black transition-colors"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">{renderStars(userReview.rating, 16)}</div>
              <h4 className="font-bold text-base mb-2">{userReview.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{userReview.comment}</p>
              {userReview.images && userReview.images.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {userReview.images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setLightboxImage(img)}
                      className="relative w-16 h-16 shrink-0 border border-gray-200 rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <Image src={img} alt={`Your review photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Write / Edit Review Form */
            <div className="max-w-2xl">
              <h3 className="text-2xl font-light tracking-tight mb-8">
                {editingReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                {/* Star rating selector */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-3 text-gray-900">Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setReviewRating(s)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={cn(
                            "transition-colors duration-150",
                            s <= (hoverRating || reviewRating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200"
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-sm text-gray-500 self-center">
                      {(hoverRating || reviewRating) === 1 && 'Poor'}
                      {(hoverRating || reviewRating) === 2 && 'Fair'}
                      {(hoverRating || reviewRating) === 3 && 'Good'}
                      {(hoverRating || reviewRating) === 4 && 'Very Good'}
                      {(hoverRating || reviewRating) === 5 && 'Excellent'}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-gray-900">Review Title *</label>
                  <input
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    type="text"
                    maxLength={100}
                    className="w-full border border-gray-200 p-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="Summarize your experience"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-2 text-gray-900">Your Review *</label>
                  <textarea
                    required
                    minLength={10}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-200 p-3.5 text-sm focus:outline-none focus:border-black resize-none transition-colors"
                    placeholder="Tell us what you liked or disliked (min 10 characters)"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 text-right">{reviewComment.length} / 10 min characters</p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] font-bold mb-3 text-gray-900">Photos (Optional, max 3)</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {reviewImagePreviews.map((preview, i) => (
                      <div key={i} className="relative w-20 h-20 border border-gray-200 rounded-md overflow-hidden group">
                        <Image src={preview} alt={`Upload preview ${i + 1}`} fill className="object-cover" sizes="80px" />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {reviewImages.length < 3 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center gap-1 hover:border-gray-400 transition-colors"
                      >
                        <Camera size={18} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium">Add</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {editingReview && (
                    <button
                      type="button"
                      onClick={cancelEditReview}
                      className="flex-1 sm:flex-none border border-gray-300 px-8 py-4 text-xs uppercase tracking-widest font-bold hover:border-black transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    disabled={submittingReview}
                    type="submit"
                    className="flex-1 sm:flex-none bg-black text-white font-bold uppercase tracking-widest text-xs px-10 py-4 hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingReview && <Loader2 size={14} className="animate-spin" />}
                    {submittingReview ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ YOU MIGHT ALSO LIKE ═══════════════════ */}
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

      {/* ═══════════════════ IMAGE LIGHTBOX ═══════════════════ */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-white" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image
              src={lightboxImage}
              alt="Review image fullscreen"
              fill
              className="object-contain"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
      <TryOnModal
        isOpen={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        productImage={product.images[0]}
        productName={product.name}
      />
      <SizeAdvisorModal
        isOpen={sizeAdvisorOpen}
        onClose={() => setSizeAdvisorOpen(false)}
        availableSizes={product.sizes ?? []}
        onSizeSelect={(size) => {
          setSelectedSize(size);
          setSizeError(false);
        }}
        savedMeasurements={savedMeasurements}
        onSaveMeasurements={handleSaveMeasurements}
        isLoggedIn={!!user}
      />
    </div>
  );
}
