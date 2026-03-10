'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { Heart, ShoppingCart, X, Share2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { wishlistedIds, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const wishlistProducts = MOCK_PRODUCTS.filter((p) => wishlistedIds.includes(p.id));

  const handleAddToCart = (productId: string) => {
    const size = selectedSizes[productId];
    if (!size) {
      toast.error('Please select a size');
      return;
    }
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    addItem(product, size, 1);
    removeFromWishlist(productId);
    toast.success('Added to cart');
  };

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId);
    toast('Removed from wishlist');
  };

  const handleShareWishlist = () => {
    navigator.clipboard.writeText('https://grizzlywear.in/wishlist/share/user123');
    toast.success('Wishlist link copied! 🔗');
  };

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center py-20">
          <Heart className="w-20 h-20 mx-auto mb-6 text-gray-200 stroke-1" />
          <h1 className="text-2xl font-light uppercase tracking-tight mb-3">Your wishlist is empty</h1>
          <p className="text-sm text-gray-500 mb-8">Save the pieces you love and come back to them anytime.</p>
          <Link href="/shop" className="inline-block bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light uppercase tracking-tight mb-2">My Wishlist</h1>
            <p className="text-sm text-gray-500">{wishlistProducts.length} item{wishlistProducts.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button onClick={handleShareWishlist} className="flex items-center gap-2 border border-black px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share Wishlist
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => (
            <div key={product.id} className="border border-gray-100 group">
              {/* Image */}
              <Link href={`/shop/${product.slug}`} className="block aspect-square overflow-hidden bg-gray-50 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {product.discount && (
                  <span className="absolute top-3 left-3 bg-black text-white text-[10px] px-2 py-1 uppercase tracking-widest">-{product.discount}%</span>
                )}
              </Link>

              {/* Info */}
              <div className="p-4 space-y-3">
                <Link href={`/shop/${product.slug}`}>
                  <h3 className="text-sm font-medium hover:underline">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.comparePrice && (
                    <span className="text-xs text-gray-400 line-through">₹{product.comparePrice.toLocaleString('en-IN')}</span>
                  )}
                </div>

                {/* Size selector */}
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSizes({ ...selectedSizes, [product.id]: size })}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${selectedSizes[product.id] === size ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button onClick={() => handleAddToCart(product.id)} className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-800 transition-colors">
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                  <button onClick={() => handleRemove(product.id)} className="w-full flex items-center justify-center gap-2 border border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] hover:border-black transition-colors text-gray-600">
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Move All to Cart */}
        {wishlistProducts.length >= 2 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                const missing = wishlistProducts.filter((p) => !selectedSizes[p.id]);
                if (missing.length > 0) {
                  toast.error('Please select sizes for all items before moving to cart');
                  return;
                }
                wishlistProducts.forEach((p) => handleAddToCart(p.id));
              }}
              className="inline-flex items-center gap-2 border border-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Move All to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
