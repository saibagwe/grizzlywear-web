'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration errors

  return (
    <div className="min-h-screen pt-24 pb-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-8 sm:mb-12 uppercase">Shopping Bag</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200">
            <p className="text-gray-400 mb-6 text-sm uppercase tracking-widest">Your bag is empty</p>
            <Link href="/shop" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] inline-block hover:bg-gray-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 md:gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-8">
              <div className="hidden md:grid grid-cols-6 gap-4 border-b border-black pb-4 mb-6 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                <div className="col-span-3">Product</div>
                <div className="col-span-1 text-center">Price</div>
                <div className="col-span-1 text-center">Quantity</div>
                <div className="col-span-1 text-right">Total</div>
              </div>

              <div className="space-y-6 md:space-y-0 text-sm">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="md:grid md:grid-cols-6 items-center gap-4 py-6 border-b border-gray-100 flex flex-col md:flex-row">
                    
                    {/* Product Column */}
                    <div className="col-span-3 flex gap-4 w-full md:w-auto">
                      <div className="relative w-24 h-32 flex-shrink-0 bg-gray-50">
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover mix-blend-multiply" />
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <Link href={`/shop/${item.product.slug}`} className="font-medium hover:underline underline-offset-4 mb-1">
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Size: {item.size}</p>
                        {/* {item.color && <p className="text-xs text-gray-500 uppercase tracking-widest hidden">Color: {item.color}</p>} */}
                        
                        <button 
                          onClick={() => removeItem(item.product.id, item.size)}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 flex items-center gap-1 mt-auto w-fit"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Price Column (Mobile Hide) */}
                    <div className="col-span-1 text-center hidden md:block">
                      ₹{item.product.price.toLocaleString('en-IN')}
                    </div>

                    {/* Quantity & Price (Mobile stacked) */}
                    <div className="col-span-1 flex md:justify-center items-center justify-between w-full md:w-auto mt-4 md:mt-0">
                      <div className="md:hidden text-sm">
                        ₹{item.product.price.toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center border border-gray-200 w-fit">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.size, Math.max(1, item.quantity - 1))}
                          className="px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          className="px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Total Column */}
                    <div className="col-span-1 text-right font-medium hidden md:block">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="lg:col-span-4 mt-12 lg:mt-0">
              <div className="bg-[#F9F9F9] p-8 lg:p-10 sticky top-28">
                <h2 className="text-lg font-medium uppercase tracking-widest border-b border-gray-200 pb-4 mb-6">Order Summary</h2>
                
                <div className="space-y-4 text-sm font-medium border-b border-gray-200 pb-6 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-normal">Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-normal">Shipping</span>
                    <span className="text-gray-400 font-normal text-xs uppercase tracking-widest">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-normal">Taxes</span>
                    <span className="text-gray-400 font-normal text-xs uppercase tracking-widest">Included</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-lg mb-8">
                  <span className="uppercase tracking-widest">Total</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <Link 
                  href="/checkout"
                  className="w-full bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-900 transition-all flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="mt-6 space-y-2">
                  <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">Secure encrypted checkout</p>
                  <div className="flex justify-center gap-2 grayscale opacity-50">
                    {/* Simulated payment badges */}
                    <div className="w-10 h-6 bg-gray-200 rounded-sm"></div>
                    <div className="w-10 h-6 bg-gray-200 rounded-sm"></div>
                    <div className="w-10 h-6 bg-gray-200 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
