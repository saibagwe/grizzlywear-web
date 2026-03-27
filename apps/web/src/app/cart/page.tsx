'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCartStore } from '@/store/cartStore';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const DISCOUNT_CODES: Record<string, { type: 'percent' | 'flat'; value: number }> = {
  'GRIZZ10': { type: 'percent', value: 10 },
  'SHIP99':  { type: 'flat',    value: 99 },
  'FIRST15': { type: 'percent', value: 15 },
};

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const { setCartSnapshot, setPricing } = useCheckoutStore();

  const [inputCode, setInputCode] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate pricing
  const shippingCharge = subtotal > 0 && subtotal < 5000 ? 99 : 0;
  
  // Recalculate discount if cart changes
  useEffect(() => {
    if (discountCode) {
      applyDiscountLogic(discountCode, subtotal);
    }
  }, [subtotal, discountCode]);

  const applyDiscountLogic = (code: string, currentSubtotal: number) => {
    const rule = DISCOUNT_CODES[code];
    if (!rule) {
      setDiscount(0);
      return;
    }
    if (rule.type === 'percent') {
      setDiscount(Math.round(currentSubtotal * rule.value / 100));
    } else {
      setDiscount(rule.value);
    }
  };

  const handleApplyDiscount = () => {
    const code = inputCode.trim().toUpperCase();
    if (DISCOUNT_CODES[code]) {
      setDiscountCode(code);
      applyDiscountLogic(code, subtotal);
      setInputCode('');
    } else {
      alert('Invalid discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscount(0);
  };

  const total = Math.max(0, subtotal + shippingCharge - discount);

  const handleProceedToCheckout = () => {
    // 1. Snapshot items
    const snapshotItems = items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      size: item.size,
      color: item.product.colors?.[0]?.name || 'Default',
      quantity: item.quantity,
      price: item.product.price,
      imageUrl: item.product.images[0]
    }));
    setCartSnapshot(snapshotItems);
    // 2. Set pricing
    setPricing({
      subtotal,
      shippingCharge,
      discount,
      discountCode,
      total,
    });
    // 3. Navigate
    router.push('/checkout');
  };

  const handleIncrement = async (productId: string, size: string, currentQty: number) => {
    const key = `${productId}-${size}`;
    setUpdatingItems(prev => ({ ...prev, [key]: true }));
    
    try {
      const productSnap = await getDoc(doc(db, 'products', productId));
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const currentStock = productData.stock?.[size] ?? 0;
        
        if (currentQty >= currentStock) {
          toast.warning(`Only ${currentStock} units available in size ${size}`);
          setUpdatingItems(prev => ({ ...prev, [key]: false }));
          return;
        }
        
        await updateQuantity(productId, size, currentQty + 1);
      }
    } catch (error) {
      console.error('Increment error:', error);
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [key]: false }));
    }
  };

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
                          onClick={() => handleIncrement(item.product.id, item.size, item.quantity)}
                          disabled={updatingItems[`${item.product.id}-${item.size}`]}
                          className="px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {updatingItems[`${item.product.id}-${item.size}`] ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Plus size={14} />
                          )}
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
                    <span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}</span>
                  </div>
                  
                  {/* Discount Code Input */}
                  <div className="pt-2">
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Discount code" 
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-black focus:ring-0 uppercase placeholder:normal-case font-bold"
                      />
                      <button 
                        onClick={handleApplyDiscount}
                        className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {discountCode && discount > 0 ? (
                      <div className="flex justify-between items-center text-green-600 bg-green-50 px-3 py-2 border border-green-100">
                        <span className="font-bold flex items-center gap-2">
                          {discountCode} <button onClick={handleRemoveDiscount}><Trash2 size={12} className="hover:text-black" /></button>
                        </span>
                        <span>-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Try GRIZZ10, FIRST15, or SHIP99</p>
                    )}
                  </div>

                  <div className="flex justify-between pt-2">
                    <span className="text-gray-500 font-normal">Taxes</span>
                    <span className="text-gray-400 font-normal text-xs uppercase tracking-widest">Included</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-lg mb-8">
                  <span className="uppercase tracking-widest">Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                
                <button 
                  onClick={handleProceedToCheckout}
                  className="w-full bg-black text-white px-8 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-900 transition-all flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

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
