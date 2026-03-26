import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
  serverTimestamp,
  getDocs,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type NotificationType = 'new_order' | 'order_cancelled' | 'new_user' | 'profile_updated';

export type AdminNotification = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  linkTo?: string; // e.g. /admin/orders/abc123
  orderId?: string; // human-readable order ID if applicable
  userId?: string;
  createdAt?: unknown;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function docToNotification(id: string, data: DocumentData): AdminNotification {
  return {
    id,
    type: data.type ?? 'new_order',
    message: data.message ?? '',
    read: data.read ?? false,
    linkTo: data.linkTo ?? undefined,
    orderId: data.orderId ?? undefined,
    userId: data.userId ?? undefined,
    createdAt: data.createdAt,
  };
}

// ─── CREATE NOTIFICATION ──────────────────────────────────────────────────────

export async function createNotification(data: {
  type: NotificationType;
  message: string;
  linkTo?: string;
  orderId?: string;
  userId?: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'notifications'), {
    type: data.type,
    message: data.message,
    read: false,
    linkTo: data.linkTo ?? null,
    orderId: data.orderId ?? null,
    userId: data.userId ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── SUBSCRIBE TO NOTIFICATIONS (latest 50, realtime) ─────────────────────────

export function subscribeToNotifications(
  callback: (notifications: AdminNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => docToNotification(d.id, d.data())));
    },
    (err) => {
      console.error('[subscribeToNotifications] Firestore error:', err);
      onError?.(err);
    }
  );
}

// ─── MARK SINGLE AS READ ──────────────────────────────────────────────────────

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────

export async function markAllNotificationsRead(): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}
