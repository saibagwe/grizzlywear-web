'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const product = {
    name: 'Oversized Onyx Hoodie',
    price: '₹3,499',
    description: 'The definitive heavyweight hoodie. Crafted from 450gsm premium French terry cotton. Features an extreme drop shoulder, cropped body, and oversized hood for the perfect boxy silhouette. Pre-shrunk and garment dyed for a vintage wash effect.',
    details: [
      '100% Premium Cotton (450gsm)',
      'Oversized / Boxy Fit',
      'Dropped Shoulders',
      'Kangaroo Pocket',
      'Made in India',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    images: [
      'https://images.unsplash.com/photo-1556821840-0f3bdc42323f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop', // mock back
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop', // mock detail
    ]
  };

  return (
    <div className="min-h-screen pt-20 pb-20 bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-black">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-black">Shop</Link>
            <span>/</span>
            <span className="text-black font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
          
          {/* Images Section */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 mb-10 lg:mb-0 sticky top-28">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 w-full sm:w-20 flex-shrink-0">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-[3/4] w-20 sm:w-full flex-shrink-0 border-2 transition-colors ${activeImage === i ? 'border-black' : 'border-transparent'}`}
                >
                  <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="relative aspect-[3/4] w-full bg-gray-100 cursor-zoom-in group">
              <Image 
                src={product.images[activeImage]} 
                alt={product.name} 
                fill 
                priority
                className="object-cover" 
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:pt-4">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-4">{product.name}</h1>
            <p className="text-xl font-medium mb-8">{product.price}</p>

            <div className="mb-8">
              <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* Sizes */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest font-medium">Select Size</h3>
                <button className="text-xs text-gray-500 underline underline-offset-4 hover:text-black">Size Guide</button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 border text-sm transition-all ${
                      selectedSize === size 
                        ? 'border-black bg-black text-white font-medium' 
                        : 'border-gray-200 hover:border-black text-gray-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && <p className="text-xs text-red-500 mt-2 opacity-0 -translate-y-1 transition-all" id="size-error">Please select a size.</p>}
            </div>

            {/* Add to Cart */}
            <div className="flex gap-4 mb-12">
              <div className="w-24 border border-black flex items-center justify-between px-4">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-xl font-light">-</button>
                <span className="text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-xl font-light">+</button>
              </div>
              <button 
                onClick={() => {
                  if(!selectedSize) {
                    document.getElementById('size-error')?.classList.remove('opacity-0', '-translate-y-1');
                  } else {
                    alert('Added to cart! (Mock)');
                  }
                }}
                className="flex-1 bg-black text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-gray-900 transition-colors"
              >
                Add to Bag
              </button>
            </div>

            {/* Accordions (Mock) */}
            <div className="border-t border-gray-200">
              <div className="py-5 border-b border-gray-200 cursor-pointer group flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-medium group-hover:text-gray-600">Details & Material</span>
                <span className="text-xl font-light">+</span>
              </div>
              <div className="py-5 border-b border-gray-200 cursor-pointer group flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest font-medium group-hover:text-gray-600">Shipping & Returns</span>
                <span className="text-xl font-light">+</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
