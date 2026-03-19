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
  type QueryDocumentSnapshot,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';

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
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrderInput = Omit<FirestoreOrder, 'id' | 'createdAt' | 'updatedAt'>;

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
    status: data.status ?? 'pending',
    paymentMethod: data.paymentMethod ?? data.payment?.method ?? 'cod',
    paymentStatus: data.paymentStatus ?? (data.payment?.status === 'paid' ? 'paid' : 'unpaid'),
    shippingAddress: {
      name: addr.name ?? '',
      address: addr.address || addr.line1 || '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      pincode: addr.pincode ?? '',
      country: addr.country ?? 'India',
      phone: addr.phone ?? '',
    },
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

// ─── REAL-TIME USER ORDERS ────────────────────────────────────────────────────

export function subscribeToUserOrders(
  userId: string,
  callback: (orders: FirestoreOrder[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => docToOrder(d.id, d.data())));
  });
}

// ─── UPDATE ORDER STATUS ──────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  await updateDoc(doc(db, 'orders', id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ─── UPDATE PAYMENT STATUS ────────────────────────────────────────────────────

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  await updateDoc(doc(db, 'orders', id), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}
