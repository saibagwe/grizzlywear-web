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
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { createNotification } from '@/lib/firestore/notificationService';

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
 * Validates stock of all items in the payload before payment to avoid payment issues.
 * Throws an error if any item is out of stock.
 */
export async function validateStockBeforePayment(cartItems: CartItem[]) {
  for (const item of cartItems) {
    const pDoc = await getDoc(doc(db, 'products', item.productId));
    if (!pDoc.exists()) {
      throw new Error(`Product not found: ${item.name}`);
    }
    const pData = pDoc.data();
    let currentStock = 0;
    
    if (typeof pData.stock === 'object' && pData.stock !== null) {
      currentStock = pData.stock[item.size] || 0;
    } else {
      currentStock = Number(pData.stock || 0);
    }
    
    if (currentStock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.name}${item.size ? ` (Size: ${item.size})` : ''}. Available: ${currentStock}`);
    }
  }
}

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
 * Step 3: Save the completed order directly to Firestore /orders collection.
 * Returns the human-readable order ID (GW-XXXXXXXX).
 *
 * IMPORTANT: Stock decrement is intentionally NOT done here on the client.
 * The Firestore rules only allow admins to write to the products collection,
 * so any client-side attempt to decrement stock inside a transaction causes
 * an "Insufficient permissions" error that rolls back the entire transaction
 * (including the order creation). Stock is decremented server-side by the
 * Cloud Function `onOrderCreated` which runs with Firebase Admin privileges.
 */
export async function saveOrderToFirestore(
  uid: string,
  payload: OrderPayload,
  paymentResponse: Partial<RazorpayPaymentResponse>,
  method: 'razorpay' | 'cod',
  userInfo?: { name?: string; email?: string; phone?: string }
): Promise<string> {
  if (!uid) {
    throw new Error('User must be authenticated to place an order.');
  }

  // Generate a human-readable order ID GW-XXXXXXXX
  const orderId = `GW-${Date.now().toString().slice(-8)}`;

  const addr = payload.deliveryAddress;

  const orderData = {
    orderId,
    userId: uid,
    customerName: userInfo?.name || addr.name || '',
    customerEmail: userInfo?.email || '',
    customerPhone: userInfo?.phone || addr.phone || '',
    items: payload.cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      image: item.imageUrl,
    })),
    shippingAddress: {
      name: addr.name,
      address: addr.line1 + (addr.line2 ? `, ${addr.line2}` : ''),
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: 'India',
      phone: addr.phone || userInfo?.phone || '',
    },
    // Keep deliveryAddress for backward compatibility with confirmation page
    deliveryAddress: addr,
    subtotal: payload.subtotal,
    shipping: payload.shippingCharge,
    discount: payload.discount,
    total: payload.total,
    pricing: {
      subtotal: payload.subtotal,
      shippingCharge: payload.shippingCharge,
      discount: payload.discount,
      discountCode: payload.discountCode || null,
      total: payload.total,
    },
    paymentMethod: method,
    paymentStatus: method === 'razorpay' ? 'paid' : 'unpaid',
    payment: {
      method,
      status: method === 'razorpay' ? 'paid' : 'unpaid',
      razorpayPaymentId: paymentResponse.razorpay_payment_id || null,
      razorpayOrderId: paymentResponse.razorpay_order_id || null,
      razorpaySignature: paymentResponse.razorpay_signature || null,
    },
    // Feature 9: paymentDetails object
    paymentDetails: method === 'razorpay' ? {
      transactionId: paymentResponse.razorpay_payment_id || null,
      gateway: 'Razorpay',
      method: 'Online',
      amount: payload.total,
      paidAt: serverTimestamp(),
      status: 'paid',
    } : null,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Write only the order document — client has permission for this.
  // Stock decrement is handled server-side by the onOrderCreated Cloud Function.
  await addDoc(collection(db, 'orders'), orderData);

  // Fire admin notification (best-effort — do not block order confirmation)
  createNotification({
    type: 'order',
    category: 'orders',
    title: 'New Order Placed',
    message: `${userInfo?.name || 'A customer'} placed a new order #${orderId} worth ₹${payload.total}`,
    referenceId: orderId,
    referenceUrl: `/admin/orders/${orderId}`,
    triggeredBy: {
      userId: uid,
      userName: userInfo?.name || '',
      userEmail: userInfo?.email || '',
    },
  }).catch(() => { /* silently ignore */ });

  // Payment received notification for online payments
  if (method === 'razorpay') {
    createNotification({
      type: 'order',
      category: 'orders',
      title: 'Payment Received',
      message: `Payment of ₹${payload.total} received for order #${orderId}`,
      referenceId: `payment-${orderId}`,
      referenceUrl: `/admin/orders/${orderId}`,
      triggeredBy: {
        userId: uid,
        userName: userInfo?.name || '',
        userEmail: userInfo?.email || '',
      },
    }).catch(() => { /* silently ignore */ });
  }

  return orderId;
}
