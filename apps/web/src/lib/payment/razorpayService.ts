/**
 * RAZORPAY TEST MODE — HOW TO TEST
 *
 * Test Cards:
 *   Success:  4111 1111 1111 1111  Expiry: any future date  CVV: any 3 digits
 *   Failure:  4000 0000 0000 0002  (card declined)
 *
 * Test UPI:
 *   Success:  success@razorpay
 *   Failure:  failure@razorpay
 *
 * Test Net Banking: select any bank → use test credentials shown on the page
 *
 * After a test payment:
 *   1. Check Razorpay Dashboard (test mode): https://dashboard.razorpay.com/app/payments
 *   2. Check Firebase Console → Firestore → orders collection
 *   3. Check /account/orders on the site
 *
 * The Render server (online-food-ordering-system-ffv5.onrender.com) may take
 * 30–50 seconds to respond on first request if it has spun down (free tier cold start).
 * Show a loading state for at least 60 seconds before timing out.
 */

import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL!;

export type CartItem = {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  imageUrl: string;
};

export type DeliveryAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type OrderPayload = {
  cartItems: CartItem[];
  deliveryAddress: DeliveryAddress;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  discountCode?: string;
};

/**
 * Step 1: Call the Render server to create a Razorpay order.
 * Returns the Razorpay order object ({ id, amount, currency, ... }).
 */
export async function createRazorpayOrder(totalInRupees: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout for cold starts

  try {
    const response = await fetch(`${ORDER_API_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalInRupees }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Payment server is taking too long to respond. Please try again.');
    }
    throw error;
  }
}

/**
 * Step 2: Open the Razorpay checkout modal.
 */
export function openRazorpayCheckout(
  razorpayOrder: { id: string; amount: number; currency: string },
  userDetails: { name: string; email: string; phone: string },
  onSuccess: (response: RazorpayPaymentResponse) => void,
  onDismiss?: () => void
) {
  const options: RazorpayOptions = {
    key: RAZORPAY_KEY,
    amount: razorpayOrder.amount, // already in paise from server
    currency: razorpayOrder.currency,
    order_id: razorpayOrder.id,
    name: 'Grizzlywear',
    description: 'Fashion Order',
    image: '/logo.svg',
    handler: onSuccess,
    prefill: {
      name: userDetails.name || 'Customer',
      email: userDetails.email || '',
      contact: userDetails.phone.replace(/^\+?91?/, ''), // Strip +91 for Razorpay
    },
    notes: {
      source: 'grizzlywear_web',
    },
    theme: {
      color: '#000000',
    },
    modal: {
      ondismiss: onDismiss,
    },
  };

  const strWindow = window as any;
  if (!strWindow.Razorpay) {
    console.error('Razorpay SDK not loaded');
    if (onDismiss) onDismiss();
    return;
  }

  const rzp = new strWindow.Razorpay(options);
  rzp.open();
}

/**
 * Step 3: Save the completed order to Firestore.
 */
export async function saveOrderToFirestore(
  uid: string,
  payload: OrderPayload,
  paymentResponse: Partial<RazorpayPaymentResponse>,
  method: 'razorpay' | 'cod'
) {
  // Generate a human-readable order ID GW-XXXXXXXX
  const orderId = `GW-${Date.now().toString().slice(-8)}`;

  const orderData = {
    orderId,
    userId: uid,
    items: payload.cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.imageUrl,
    })),
    deliveryAddress: payload.deliveryAddress,
    pricing: {
      subtotal: payload.subtotal,
      shippingCharge: payload.shippingCharge,
      discount: payload.discount,
      discountCode: payload.discountCode || null,
      total: payload.total,
    },
    payment: {
      method,
      status: 'paid', // for both COD and Razorpay for now
      razorpayPaymentId: paymentResponse.razorpay_payment_id || null,
      razorpayOrderId: paymentResponse.razorpay_order_id || null,
      razorpaySignature: paymentResponse.razorpay_signature || null,
      paidAt: serverTimestamp(),
    },
    status: 'confirmed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Save to global /orders collection
  const globalRef = doc(collection(db, 'orders'));
  const firestoreId = globalRef.id;

  // Save to user's sub-collection with same document ID
  const userRef = doc(db, 'users', uid, 'orders', firestoreId);

  const { setDoc } = await import('firebase/firestore');
  
  const savePromise = Promise.all([
    setDoc(globalRef, orderData),
    setDoc(userRef, orderData),
  ]);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Firestore saving timed out. Please check your network or Firestore rules.')), 8000);
  });

  await Promise.race([savePromise, timeoutPromise]);

  return orderId;
}
