'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CreditCard, MapPin, CheckCircle2 } from 'lucide-react';

import { useCartStore } from '@/store/cartStore';
import { MOCK_ADDRESSES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type CheckoutStep = 'address' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, subtotal, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  
  // Form States
  const [selectedAddress, setSelectedAddress] = useState(MOCK_ADDRESSES[0].id);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Protect route if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white text-center">
        <h1 className="text-2xl font-light tracking-tight mb-4 uppercase">Checkout Unavailable</h1>
        <p className="text-gray-500 mb-8">Your cart is empty. Please add items before checking out.</p>
        <Link href="/shop" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] inline-block hover:bg-gray-800 transition-colors">
          Return to Shop
        </Link>
      </div>
    );
  }

  const shippingCost = shippingMethod === 'express' ? 150 : 0;
  const total = subtotal + shippingCost;

  const handlePlaceOrder = () => {
    toast.success('Order placed successfully! (Mock)');
    clearCart();
    // Simulate routing to success page (not built yet, but we'll mock it)
    router.push('/checkout/success');
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#F9F9F9]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-8 sm:mb-12 uppercase">Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-12 flex flex-col-reverse">
          {/* Checkout Steps */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Address */}
            <div className={cn("bg-white border p-6 transition-all", currentStep === 'address' ? "border-black shadow-sm" : "border-gray-200 opacity-70")}>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setCurrentStep('address')}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", currentStep === 'address' ? "bg-black text-white" : "bg-gray-100 text-gray-400")}>1</div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Delivery Address</h2>
                </div>
                {currentStep !== 'address' && <CheckCircle2 className="text-black" size={20} />}
              </div>

              {currentStep === 'address' && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-4">
                    {MOCK_ADDRESSES.map(addr => (
                      <label 
                        key={addr.id} 
                        className={cn("block border p-4 cursor-pointer transition-colors relative", selectedAddress === addr.id ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}
                      >
                        <input 
                          type="radio" 
                          name="address" 
                          value={addr.id} 
                          checked={selectedAddress === addr.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="mr-3 accent-black absolute top-5 right-4"
                        />
                        <div className="flex items-center gap-2 mb-2 pr-8">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-xs font-bold uppercase tracking-widest">{addr.label}</span>
                        </div>
                        <div className="text-sm text-gray-600 block w-full space-y-1">
                          <p className="font-medium text-black">{addr.name}</p>
                          <p>{addr.line1}</p>
                          {addr.line2 && <p>{addr.line2}</p>}
                          <p>{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="pt-2 text-xs">Phone: {addr.phone}</p>
                        </div>
                      </label>
                    ))}

                    <button className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:underline underline-offset-4 mt-2">
                      + Add New Address
                    </button>
                  </div>

                  <button 
                    onClick={() => setCurrentStep('shipping')}
                    className="mt-8 w-full bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
                  >
                    Continue to Shipping
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Shipping */}
            <div className={cn("bg-white border p-6 transition-all", currentStep === 'shipping' ? "border-black shadow-sm" : "border-gray-200", currentStep === 'payment' && "opacity-70")}>
              <div 
                className={cn("flex items-center justify-between", currentStep !== 'address' ? "cursor-pointer" : "opacity-50 cursor-not-allowed")}
                onClick={() => { if (currentStep !== 'address') setCurrentStep('shipping'); }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", currentStep === 'shipping' ? "bg-black text-white" : "bg-gray-100 text-gray-400")}>2</div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Shipping Method</h2>
                </div>
                {currentStep === 'payment' && <CheckCircle2 className="text-black" size={20} />}
              </div>

              {currentStep === 'shipping' && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-4">
                    <label className={cn("flex items-center justify-between border p-4 cursor-pointer transition-colors", shippingMethod === 'standard' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <div className="flex items-center gap-4">
                        <input 
                          type="radio" 
                          name="shipping" 
                          value="standard" 
                          checked={shippingMethod === 'standard'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest">Standard Shipping</p>
                          <p className="text-xs text-gray-500 mt-1">Delivery in 4-6 business days</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">Free</span>
                    </label>

                    <label className={cn("flex items-center justify-between border p-4 cursor-pointer transition-colors", shippingMethod === 'express' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <div className="flex items-center gap-4">
                        <input 
                          type="radio" 
                          name="shipping" 
                          value="express" 
                          checked={shippingMethod === 'express'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="accent-black"
                        />
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest text-black flex items-center gap-2">
                            Express Shipping 
                            <span className="bg-black text-white text-[9px] px-1.5 py-0.5 ml-1">FAST</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Delivery in 1-2 business days</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">₹150</span>
                    </label>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => setCurrentStep('address')}
                      className="w-1/3 border border-gray-200 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setCurrentStep('payment')}
                      className="w-2/3 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div className={cn("bg-white border p-6 transition-all", currentStep === 'payment' ? "border-black shadow-sm" : "border-gray-200 opacity-50")}>
              <div 
                className={cn("flex items-center justify-between", currentStep === 'payment' ? "cursor-pointer" : "cursor-not-allowed")}
                onClick={() => { if (currentStep === 'payment') setCurrentStep('payment'); }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", currentStep === 'payment' ? "bg-black text-white" : "bg-gray-100 text-gray-400")}>3</div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Payment</h2>
                </div>
              </div>

              {currentStep === 'payment' && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-blue-50 border border-blue-100 p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Prototype Mode:</strong> Payment gateway (Razorpay) is bypassed. Click &quot;Pay Securely&quot; to simulate order completion.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className={cn("flex items-center gap-4 border p-4 cursor-pointer transition-colors", paymentMethod === 'upi' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-black" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest">UPI ID / QR Code</p>
                        <p className="text-xs text-gray-500 mt-1">Google Pay, PhonePe, Paytm, or generic UPI</p>
                      </div>
                    </label>

                    <label className={cn("flex items-center gap-4 border p-4 cursor-pointer transition-colors", paymentMethod === 'card' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-black" />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest">Credit / Debit Card</p>
                          <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, RuPay, Amex</p>
                        </div>
                        <CreditCard className="text-gray-400" size={20} />
                      </div>
                    </label>

                    <label className={cn("flex items-center gap-4 border p-4 cursor-pointer transition-colors", paymentMethod === 'cod' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-black" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest">Cash on Delivery</p>
                        <p className="text-xs text-gray-500 mt-1">Pay when your order arrives</p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => setCurrentStep('shipping')}
                      className="w-1/3 border border-gray-200 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handlePlaceOrder}
                      className="w-2/3 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      Pay Securely ₹{total.toLocaleString('en-IN')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 mb-8 lg:mb-0">
            <div className="bg-white border border-gray-200 p-6 lg:p-8 lg:sticky lg:top-28">
              <h2 className="text-lg font-medium uppercase tracking-widest border-b border-gray-100 pb-4 mb-6">In Your Bag</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 border border-gray-200">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-widest line-clamp-1 mb-1">{item.product.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Size: {item.size} | Qty: {item.quantity}</p>
                      <p className="text-sm font-medium">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? <span className="text-green-600 uppercase text-[10px] tracking-widest font-bold">Free</span> : `₹${shippingCost.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {/* Discount input (mock) */}
                <div className="pt-2">
                  <div className="flex items-center border border-gray-200 overflow-hidden">
                    <input type="text" placeholder="Gift card or discount code" className="flex-1 px-4 py-2 text-sm bg-[#F9F9F9] focus:outline-none focus:bg-white transition-colors" />
                    <button className="bg-gray-100 hover:bg-gray-200 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors">Apply</button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-black pt-4">
                <div>
                  <span className="text-sm font-bold uppercase tracking-widest block mb-1">Total</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Including ₹0 in taxes</span>
                </div>
                <span className="text-xl font-medium">₹{total.toLocaleString('en-IN')}</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
