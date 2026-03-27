import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
  type QueryDocumentSnapshot,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/firestore/notificationService';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
};

export type ShippingAddress = {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone?: string;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'cancelled';

export type PaymentDetails = {
  transactionId: string | null;
  gateway: string;
  method: string;
  amount: number;
  paidAt?: unknown;
  status: string;
};

export type FirestoreOrder = {
  id: string; // Firestore document ID
  orderId: string; // Human-readable GW-XXXXXXXX
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  paymentDetails?: PaymentDetails | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrderInput = Omit<FirestoreOrder, 'id' | 'createdAt' | 'updatedAt'>;

export function getAvailableStatuses(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case 'pending':
      return ['pending', 'confirmed', 'cancelled'];
    case 'confirmed':
      return ['confirmed', 'shipped', 'cancelled'];
    case 'shipped':
      return ['shipped', 'delivered'];
    case 'delivered':
      return ['delivered'];
    case 'cancelled':
      return ['cancelled'];
    default:
      return [currentStatus];
  }
}

export function derivePaymentStatus(status: string, paymentMethod: string, currentPaymentStatus?: string): PaymentStatus {
  const isOnline = paymentMethod === 'online' || paymentMethod === 'razorpay' || paymentMethod === 'card' || paymentMethod === 'upi';
  
  if (!isOnline) { // COD
    if (status === 'delivered') return 'paid';
    if (status === 'cancelled') return 'cancelled';
    return 'pending';
  } else { // Online
    if (status === 'cancelled') {
      return (currentPaymentStatus === 'paid' || currentPaymentStatus === 'paid_online') ? 'refunded' : 'cancelled';
    }
    if (status === 'pending') {
      return (currentPaymentStatus === 'paid' || currentPaymentStatus === 'paid_online') ? 'paid' : 'pending';
    }
    return 'paid'; // confirmed, shipped, delivered are all paid
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function docToOrder(id: string, data: DocumentData): FirestoreOrder {
  // Support both old razorpayService shape and new shape
  const addr = data.shippingAddress || data.deliveryAddress || {};
  const pricing = data.pricing || {};

  return {
    id,
    orderId: data.orderId ?? id,
    userId: data.userId ?? '',
    customerName: data.customerName || addr.name || '',
    customerEmail: data.customerEmail || '',
    customerPhone: data.customerPhone || addr.phone || '',
    items: (data.items ?? []).map((item: any) => ({
      productId: item.productId ?? '',
      name: item.name ?? '',
      image: item.image || item.imageUrl || '',
      price: item.price ?? 0,
      quantity: item.quantity ?? 1,
      size: item.size ?? '',
    })),
    subtotal: data.subtotal ?? pricing.subtotal ?? 0,
    shipping: data.shipping ?? pricing.shippingCharge ?? 0,
    discount: data.discount ?? pricing.discount ?? 0,
    total: data.total ?? pricing.total ?? 0,
    status: data.status === 'processing' ? 'confirmed' : (data.status ?? 'pending'),
    paymentMethod: data.paymentMethod ?? data.payment?.method ?? 'cod',
    paymentStatus: (() => {
      let pm = data.paymentMethod ?? data.payment?.method ?? 'cod';
      let stat = data.status === 'processing' ? 'confirmed' : (data.status ?? 'pending');
      return derivePaymentStatus(stat, pm, data.paymentStatus);
    })(),
    shippingAddress: {
      name: addr.name ?? '',
      address: addr.address || addr.line1 || '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      pincode: addr.pincode ?? '',
      country: addr.country ?? 'India',
      phone: addr.phone ?? '',
    },
    paymentDetails: data.paymentDetails ?? null,
    razorpayPaymentId: data.razorpayPaymentId ?? data.payment?.razorpayPaymentId ?? null,
    razorpayOrderId: data.razorpayOrderId ?? data.payment?.razorpayOrderId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────

export async function createOrder(data: OrderInput): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────

export async function getOrderById(id: string): Promise<FirestoreOrder | null> {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) return null;
  return docToOrder(snap.id, snap.data());
}

/**
 * Fetch a single order by its human-readable orderId field (e.g. GW-12345678).
 * Used by the confirmation page on refresh when sessionStorage is gone.
 */
export async function getOrderByOrderId(orderId: string): Promise<FirestoreOrder | null> {
  const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return docToOrder(d.id, d.data());
}

// ─── REAL-TIME SINGLE ORDER BY orderId ────────────────────────────────────────

/**
 * Subscribe to a single order in real-time by its human-readable orderId field (e.g. GW-12345678).
 * Calls callback with the order whenever it changes, or null if not found.
 */
export function subscribeToOrderByOrderId(
  orderId: string,
  callback: (order: FirestoreOrder | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'orders'), where('orderId', '==', orderId));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
      } else {
        const d = snap.docs[0];
        callback(docToOrder(d.id, d.data()));
      }
    },
    (err) => {
      console.error('[subscribeToOrderByOrderId] Firestore error:', err.code, err.message);
      onError?.(err);
    }
  );
}

// ─── GET ALL ORDERS (one-time) ────────────────────────────────────────────────

export async function getAllOrders(): Promise<FirestoreOrder[]> {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToOrder(d.id, d.data()));
}

// ─── GET ORDERS FOR A USER (one-time) ────────────────────────────────────────

export async function getOrdersByUser(userId: string): Promise<FirestoreOrder[]> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToOrder(d.id, d.data()));
}

// ─── REAL-TIME ALL ORDERS (capped to last 50) ────────────────────────────────

export const ORDERS_PAGE_SIZE = 50;

/**
 * Subscribe to the most recent `ORDERS_PAGE_SIZE` orders, newest first.
 * Firestore serves from local IndexedDB cache immediately on repeat visits,
 * then reconciles with the server in the background.
 */
export function subscribeToAllOrders(
  callback: (orders: FirestoreOrder[], lastDoc: QueryDocumentSnapshot | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(ORDERS_PAGE_SIZE)
  );
  return onSnapshot(
    q,
    (snap) => {
      const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      callback(
        snap.docs.map((d) => docToOrder(d.id, d.data())),
        last as QueryDocumentSnapshot | null
      );
    },
    (err) => {
      console.error('[subscribeToAllOrders] Firestore error:', err.code, err.message);
      onError?.(err);
    }
  );
}

/**
 * Fetch the next page of orders starting after `cursor`.
 * Returns a new unsubscribe function for the additional page.
 */
export function subscribeToMoreOrders(
  cursor: QueryDocumentSnapshot,
  callback: (orders: FirestoreOrder[], lastDoc: QueryDocumentSnapshot | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    startAfter(cursor),
    limit(ORDERS_PAGE_SIZE)
  );
  return onSnapshot(
    q,
    (snap) => {
      const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      callback(
        snap.docs.map((d) => docToOrder(d.id, d.data())),
        last as QueryDocumentSnapshot | null
      );
    },
    (err) => {
      console.error('[subscribeToMoreOrders] Firestore error:', err.code, err.message);
      onError?.(err);
    }
  );
}

export function subscribeToFilteredOrders(
  filters: { startDate?: Date; endDate?: Date },
  callback: (orders: FirestoreOrder[], lastDoc: QueryDocumentSnapshot | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let qConstraints: any[] = [];
  
  if (filters.startDate) {
    qConstraints.push(where('createdAt', '>=', filters.startDate));
  }
  if (filters.endDate) {
    qConstraints.push(where('createdAt', '<=', filters.endDate));
  }
  
  qConstraints.push(orderBy('createdAt', 'desc'));
  qConstraints.push(limit(ORDERS_PAGE_SIZE));

  const q = query(collection(db, 'orders'), ...qConstraints);
  return onSnapshot(
    q,
    (snap) => {
      const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      callback(
        snap.docs.map((d) => docToOrder(d.id, d.data())),
        last as QueryDocumentSnapshot | null
      );
    },
    (err) => {
      console.error('[subscribeToFilteredOrders] Firestore error:', err.code, err.message);
      onError?.(err);
    }
  );
}

export function subscribeToMoreFilteredOrders(
  filters: { startDate?: Date; endDate?: Date },
  cursor: QueryDocumentSnapshot,
  callback: (orders: FirestoreOrder[], lastDoc: QueryDocumentSnapshot | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let qConstraints: any[] = [];
  
  if (filters.startDate) {
    qConstraints.push(where('createdAt', '>=', filters.startDate));
  }
  if (filters.endDate) {
    qConstraints.push(where('createdAt', '<=', filters.endDate));
  }
  
  qConstraints.push(orderBy('createdAt', 'desc'));
  qConstraints.push(startAfter(cursor));
  qConstraints.push(limit(ORDERS_PAGE_SIZE));

  const q = query(collection(db, 'orders'), ...qConstraints);
  return onSnapshot(
    q,
    (snap) => {
      const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      callback(
        snap.docs.map((d) => docToOrder(d.id, d.data())),
        last as QueryDocumentSnapshot | null
      );
    },
    (err) => {
      console.error('[subscribeToMoreFilteredOrders] Firestore error:', err.code, err.message);
      onError?.(err);
    }
  );
}

// ─── REAL-TIME USER ORDERS ────────────────────────────────────────────────────

export function subscribeToUserOrders(
  userId: string,
  callback: (orders: FirestoreOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => docToOrder(d.id, d.data())));
    },
    (err) => {
      console.error('[subscribeToUserOrders] Firestore error:', err.message);
      // If composite index is missing, Firestore throws an error with a link.
      // Fall back to returning empty and surface the error.
      onError?.(err);
    }
  );
}

// ─── UPDATE ORDER STATUS ──────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) throw new Error('Order not found');
  const currentData = snap.data();
  const currentStatus = currentData.status === 'processing' ? 'confirmed' : (currentData.status as OrderStatus);
  
  const allowed = getAvailableStatuses(currentStatus);
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
  }

  const paymentMethod = currentData.paymentMethod ?? currentData.payment?.method ?? 'cod';
  const newPaymentStatus = derivePaymentStatus(status, paymentMethod, currentData.paymentStatus);

  const modifications: any = {
    status,
    paymentStatus: newPaymentStatus,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'orders', id), modifications);
}

// ─── CANCEL ORDER (USER) ──────────────────────────────────────────────────────

export async function cancelOrder(id: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Read the order document
    const orderRef = doc(db, 'orders', id);
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found');
    const currentData = orderSnap.data();
    const currentStatus = currentData.status === 'processing' ? 'confirmed' : (currentData.status as OrderStatus);

    if (currentStatus !== 'pending' && currentStatus !== 'confirmed') {
      throw new Error('Order cannot be cancelled at this stage.');
    }

    // NOTE: Stock restoration is intentionally NOT done here on the client.
    // Firestore rules only allow admins to write to the products collection,
    // so writing to products inside a client-side transaction causes
    // "Insufficient permissions" and rolls back the entire transaction
    // (including the order status update). Stock restoration is handled
    // server-side by the onOrderCancelled Cloud Function which runs with
    // Firebase Admin privileges.

    // 2. Update order status to cancelled
    const paymentMethod = currentData.paymentMethod ?? currentData.payment?.method ?? 'cod';
    const newPaymentStatus = derivePaymentStatus('cancelled', paymentMethod, currentData.paymentStatus);

    transaction.update(orderRef, {
      status: 'cancelled',
      paymentStatus: newPaymentStatus,
      updatedAt: serverTimestamp(),
    });
  });

  // Fetch order data for notification (outside transaction for best-effort)
  const snap = await getDoc(doc(db, 'orders', id));
  const orderData = snap.exists() ? snap.data() : null;
  const customerName = orderData?.customerName || 'A customer';

  // Fire admin cancellation notification (best-effort)
  createNotification({
    type: 'cancellation',
    category: 'orders',
    title: 'Order Cancelled',
    message: `${customerName} cancelled order #${orderData?.orderId || id}`,
    referenceId: orderData?.orderId || id,
    referenceUrl: `/admin/orders/${id}`,
    triggeredBy: {
      userId: orderData?.userId || '',
      userName: customerName,
      userEmail: orderData?.customerEmail || '',
    },
  }).catch(() => { /* silently ignore */ });
}
