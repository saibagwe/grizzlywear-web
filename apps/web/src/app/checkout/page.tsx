'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CreditCard, MapPin, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import { MOCK_ADDRESSES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  createRazorpayOrder,
  openRazorpayCheckout,
  saveOrderToFirestore,
  type OrderPayload,
  type DeliveryAddress,
} from '@/lib/payment/razorpayService';

type CheckoutStep = 'address' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  const { firebaseUser, profile } = useAuth();
  const { clearCart } = useCartStore();
  const checkoutStore = useCheckoutStore();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  
  // Step 1: Address
  const [selectedAddressId, setSelectedAddressId] = useState(MOCK_ADDRESSES[0].id);
  const selectedAddressData = MOCK_ADDRESSES.find(a => a.id === selectedAddressId) as DeliveryAddress;

  // Step 2: Shipping Method (UI only, shipping cost is locked from Cart snapshot)
  const [shippingMethod, setShippingMethod] = useState('standard');

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<'idle' | 'connecting' | 'waking' | 'confirming'>('idle');
  const [criticalError, setCriticalError] = useState<{ message: string; paymentId?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Protect route if checkout snapshot is empty
  if (mounted && checkoutStore.cartSnapshot.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white text-center">
        <h1 className="text-2xl font-light tracking-tight mb-4 uppercase">Checkout Unavailable</h1>
        <p className="text-gray-500 mb-8">Your session expired or cart is empty.</p>
        <Link href="/shop" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] inline-block hover:bg-gray-800 transition-colors">
          Return to Shop
        </Link>
      </div>
    );
  }

  if (!mounted) return null;

  const buildOrderPayload = (): OrderPayload => ({
    cartItems: checkoutStore.cartSnapshot,
    deliveryAddress: selectedAddressData,
    subtotal: checkoutStore.subtotal,
    shippingCharge: checkoutStore.shippingCharge,
    discount: checkoutStore.discount,
    total: checkoutStore.total,
    discountCode: checkoutStore.discountCode,
  });

  const generateEstimatedDelivery = () => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const finalizeOrder = (orderId: string, payMethod: 'razorpay' | 'cod', paymentId: string | null) => {
    sessionStorage.setItem('lastOrder', JSON.stringify({
      orderId,
      items: checkoutStore.cartSnapshot,
      pricing: {
        subtotal: checkoutStore.subtotal,
        shippingCharge: checkoutStore.shippingCharge,
        discount: checkoutStore.discount,
        total: checkoutStore.total,
      },
      deliveryAddress: selectedAddressData,
      payment: {
        method: payMethod,
        razorpayPaymentId: paymentId,
      },
      estimatedDelivery: generateEstimatedDelivery(),
    }));

    clearCart();
    checkoutStore.reset();
    router.push(`/orders/confirmation/${orderId}`);
  };

  const handlePayment = async () => {
    if (!firebaseUser) {
      toast.error('You must be logged in to place an order.');
      return;
    }

    setIsProcessing(true);
    const payload = buildOrderPayload();

    if (paymentMethod === 'cod') {
      try {
        setPaymentPhase('confirming');
        const orderId = await saveOrderToFirestore(firebaseUser.uid, payload, {}, 'cod');
        finalizeOrder(orderId, 'cod', null);
      } catch (err: any) {
        toast.error('Failed to create COD order. Please try again.');
        setIsProcessing(false);
        setPaymentPhase('idle');
      }
      return;
    }

    // RAZORPAY FLOW
    setPaymentPhase('connecting');
    let razorpayOrder;

    // Simulate "waking server" state if it takes > 5s
    const slowServerTimer = setTimeout(() => {
      setPaymentPhase('waking');
    }, 5000);

    try {
      razorpayOrder = await createRazorpayOrder(checkoutStore.total);
      clearTimeout(slowServerTimer);
    } catch (err: any) {
      clearTimeout(slowServerTimer);
      toast.error(err.message || 'Unable to connect to payment server. Please try again.');
      setIsProcessing(false);
      setPaymentPhase('idle');
      return;
    }

    // Open Razorpay Checkout Modal
    const userDetails = {
      name: profile?.fullName || firebaseUser.displayName || 'Customer',
      email: profile?.email || firebaseUser.email || '',
      phone: profile?.phone || '',
    };

    openRazorpayCheckout(
      razorpayOrder,
      userDetails,
      async (response) => {
        // SUCCESS HANDLER
        try {
          setPaymentPhase('confirming');
          const orderId = await saveOrderToFirestore(firebaseUser.uid, payload, response, 'razorpay');
          finalizeOrder(orderId, 'razorpay', response.razorpay_payment_id);
        } catch (saveErr) {
          // CRITICAL: Payment succeeded, but Firestore save failed
          setCriticalError({
            message: 'Payment received but order confirmation failed. Please contact support@grizzlywear.in with your Payment ID.',
            paymentId: response.razorpay_payment_id
          });
          setIsProcessing(false);
          setPaymentPhase('idle');
        }
      },
      () => {
        // ON DISMISS HANDLER
        toast('Payment cancelled. Your cart is still saved.');
        setIsProcessing(false);
        setPaymentPhase('idle');
      }
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#F9F9F9] relative">
      
      {/* ── Confirming Order Overlay ── */}
      {paymentPhase === 'confirming' && (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 animate-spin mb-6" />
          <h2 className="text-2xl font-light tracking-widest uppercase mb-2">Confirming your order...</h2>
          <p className="text-sm text-gray-400">Please do not close or refresh this tab</p>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-8 sm:mb-12 uppercase">Checkout</h1>

        {criticalError && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 text-red-800 flex items-start gap-4">
            <AlertTriangle className="text-red-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2 text-red-900">⚠️ Critical Error</h3>
              <p className="text-sm mb-2">{criticalError.message}</p>
              <p className="text-xs font-mono bg-white p-2 border border-red-100 table">
                Payment ID: {criticalError.paymentId}
              </p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-12 flex flex-col-reverse">
          {/* Checkout Steps */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Address */}
            <div className={cn("bg-white border p-6 transition-all", currentStep === 'address' ? "border-black shadow-sm" : "border-gray-200 opacity-70")}>
              <div 
                className={cn("flex items-center justify-between", !isProcessing && "cursor-pointer")}
                onClick={() => { if (!isProcessing) setCurrentStep('address'); }}
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
                        className={cn("block border p-4 cursor-pointer transition-colors relative", selectedAddressId === addr.id ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}
                      >
                        <input 
                          type="radio" 
                          name="address" 
                          value={addr.id} 
                          checked={selectedAddressId === addr.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
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
                       (Adding new addresses is done in Account settings)
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
                className={cn("flex items-center justify-between", (!isProcessing && currentStep !== 'address') ? "cursor-pointer" : "opacity-50 cursor-not-allowed")}
                onClick={() => { if (!isProcessing && currentStep !== 'address') setCurrentStep('shipping'); }}
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
                    <label className={cn("flex items-center justify-between border p-4 cursor-pointer transition-colors border-black bg-gray-50")}>
                      <div className="flex items-center gap-4">
                        <input type="radio" readOnly checked className="accent-black" />
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest">Standard Shipping</p>
                          <p className="text-xs text-gray-500 mt-1">Delivery in 4-6 business days</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">{checkoutStore.shippingCharge === 0 ? 'FREE' : `₹${checkoutStore.shippingCharge}`}</span>
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
                className={cn("flex items-center justify-between", (!isProcessing && currentStep === 'payment') ? "cursor-pointer" : "cursor-not-allowed")}
                onClick={() => { if (!isProcessing && currentStep === 'payment') setCurrentStep('payment'); }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", currentStep === 'payment' ? "bg-black text-white" : "bg-gray-100 text-gray-400")}>3</div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Payment</h2>
                </div>
              </div>

              {currentStep === 'payment' && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  
                  <fieldset disabled={isProcessing} className="space-y-4">
                    <label className={cn("flex items-center gap-4 border p-4 cursor-pointer transition-colors", paymentMethod === 'razorpay' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="accent-black" />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest">Pay Online</p>
                          <p className="text-xs text-gray-500 mt-1">UPI · Cards · Net Banking (Powered by Razorpay)</p>
                        </div>
                        <CreditCard className="text-gray-400" size={20} />
                      </div>
                    </label>

                    <label className={cn("flex items-center gap-4 border p-4 cursor-pointer transition-colors", paymentMethod === 'cod' ? "border-black bg-gray-50" : "border-gray-200 hover:border-black")}>
                      <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-black" />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-widest">Cash on Delivery</p>
                        <p className="text-xs text-gray-500 mt-1">Pay when your order arrives</p>
                      </div>
                    </label>
                  </fieldset>

                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => setCurrentStep('shipping')}
                      disabled={isProcessing}
                      className="w-1/3 border border-gray-200 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-2/3 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {paymentPhase === 'connecting' ? 'Connecting to payment server...' : 
                           paymentPhase === 'waking' ? 'Still connecting... (server waking up)' : 
                           'Processing...'}
                        </>
                      ) : (
                        paymentMethod === 'razorpay' ? `PAY ₹${checkoutStore.total.toLocaleString('en-IN')} SECURELY →` : 'CONFIRM ORDER →'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 mb-8 lg:mb-0">
            <div className="bg-white border border-gray-200 p-6 lg:p-8 lg:sticky lg:top-28">
              <h2 className="text-lg font-medium uppercase tracking-widest border-b border-gray-100 pb-4 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {checkoutStore.cartSnapshot.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 border border-gray-200">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-widest line-clamp-1 mb-1">{item.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Size: {item.size} | Qty: {item.quantity}</p>
                      <p className="text-sm font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{checkoutStore.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">
                    {checkoutStore.shippingCharge === 0 ? <span className="text-green-600 uppercase text-[10px] tracking-widest font-bold">Free</span> : `₹${checkoutStore.shippingCharge.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {checkoutStore.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({checkoutStore.discountCode})</span>
                    <span className="font-bold">-₹{checkoutStore.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-end border-t border-black pt-4">
                <div>
                  <span className="text-sm font-bold uppercase tracking-widest block mb-1">Total</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Including ₹0 in taxes</span>
                </div>
                <span className="text-xl font-medium">₹{checkoutStore.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
