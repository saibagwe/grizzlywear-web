'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';

import { useAuth } from '@/hooks/useAuth';
import { getOrderByOrderId } from '@/lib/firestore/orderService';

export default function OrderConfirmationPage() {
  const params = useParams();
  const rawOrderId = params?.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

  const { firebaseUser } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const checkRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError(true);
        setLoading(false);
        return;
      }

      // Check sessionStorage first (immediate post-purchase data)
      const lastOrderStr = sessionStorage.getItem('lastOrder');
      if (lastOrderStr) {
        try {
          const parsed = JSON.parse(lastOrderStr);
          if (parsed.orderId === orderId) {
            setOrder(parsed);
            setLoading(false);
            triggerConfetti();
            return;
          }
        } catch {
          // Ignore parse errors, fallback to Firebase
        }
      }

      // Fallback: fetch from top-level /orders collection by human-readable orderId
      if (firebaseUser) {
        try {
          const firestoreOrder = await getOrderByOrderId(orderId);

          if (firestoreOrder) {
            const addr = firestoreOrder.shippingAddress;
            const fOrder = {
              orderId: firestoreOrder.orderId,
              items: firestoreOrder.items.map((i) => ({
                ...i,
                imageUrl: i.image,
              })),
              pricing: {
                subtotal: firestoreOrder.subtotal,
                shippingCharge: firestoreOrder.shipping,
                discount: firestoreOrder.discount,
                total: firestoreOrder.total,
              },
              deliveryAddress: {
                name: addr.name,
                line1: addr.address,
                city: addr.city,
                state: addr.state,
                pincode: addr.pincode,
                phone: addr.phone || '',
              },
              payment: {
                method: firestoreOrder.paymentMethod,
                razorpayPaymentId: firestoreOrder.razorpayPaymentId || null,
              },
              estimatedDelivery: 'within 5-7 business days',
            };

            setOrder(fOrder);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching order:', err);
        }
      }

      setError(true);
      setLoading(false);
    }

    loadOrder();
  }, [orderId, firebaseUser]);

  // GSAP animation for the checkmark
  useEffect(() => {
    if (!loading && !error && checkRef.current) {
      const path = checkRef.current.querySelector('path');
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, { strokeDashoffset: 0, duration: 1, ease: 'power2.out', delay: 0.2 });
      }

      // Sonar effect
      const rings = document.querySelectorAll('.radar-ring');
      if (rings.length > 0) {
        gsap.fromTo(rings, 
          { scale: 1, opacity: 0.6 },
          { scale: 2.5, opacity: 0, duration: 1.5, stagger: 0.4, repeat: -1, ease: 'power1.out', delay: 0.5 }
        );
      }
    }
  }, [loading, error]);

  const triggerConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#000000', '#333333', '#666666']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#000000', '#333333', '#666666']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="w-48 h-6 bg-gray-200 mb-2"></div>
          <div className="w-32 h-4 bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-white text-center">
        <h1 className="text-2xl font-light tracking-tight mb-4 uppercase">Order Placed</h1>
        <p className="text-gray-500 mb-8">Your order was placed successfully, but we could not load the details right now.</p>
        <div className="flex justify-center gap-4">
          <Link href="/account/orders" className="border border-black px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors">
            View My Orders
          </Link>
          <Link href="/shop" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-white">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
        
        {/* Header Success Message */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative isolate w-16 h-16 flex items-center justify-center">
              {/* Sonar Rings */}
              <div className="radar-ring absolute w-16 h-16 rounded-full border border-black opacity-0 -z-10 pointer-events-none" />
              <div className="radar-ring absolute w-16 h-16 rounded-full border border-black opacity-0 -z-10 pointer-events-none" />
              
              <svg ref={checkRef} className="relative z-10 bg-white rounded-full" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="31" stroke="black" strokeWidth="2" />
                <path d="M18 33L27 42L46 22" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-2 uppercase">Order Confirmed</h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs">Thank you for shopping with Grizzlywear.</p>
        </div>

        {/* Order Meta Info */}
        <div className="bg-[#F9F9F9] border border-gray-200 p-6 md:p-8 mb-8 flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Order ID</p>
            <p className="font-mono text-sm">{order.orderId}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Payment Method</p>
            <p className="text-sm capitalize">{order.payment.method === 'razorpay' ? 'Paid Online' : 'Cash on Delivery'}</p>
            {order.payment.razorpayPaymentId && (
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {order.payment.razorpayPaymentId}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Estimated Delivery</p>
            <p className="text-sm font-medium">{order.estimatedDelivery}</p>
          </div>
        </div>

        {/* Items Ordered */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-4 mb-6">Items Ordered</h2>
          <div className="space-y-6">
            {order.items.map((item: any) => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 border border-gray-200">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium uppercase tracking-widest mb-1">{item.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Size: {item.size} • Color: {item.color} • Qty: {item.quantity}</p>
                  <p className="text-sm font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layout split for Mobile/Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Pricing */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-4 mb-4">Pricing Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{order.pricing.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{order.pricing.shippingCharge === 0 ? 'FREE' : `₹${order.pricing.shippingCharge.toLocaleString('en-IN')}`}</span>
              </div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.pricing.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3 font-bold text-lg">
                <span className="uppercase tracking-widest text-sm">Total</span>
                <span>₹{order.pricing.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-4 mb-4">Delivering To</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-black">{order.deliveryAddress.name}</p>
              <p>{order.deliveryAddress.line1}</p>
              {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
              <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}</p>
              <p className="pt-2">Phone: {order.deliveryAddress.phone}</p>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-200 pt-8">
          <button className="flex-1 border border-black hover:bg-gray-50 transition-colors px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Truck size={16} /> Track Order
          </button>
          <Link href="/shop" className="flex-1 bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group">
            <Package size={16} /> Continue Shopping
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}
