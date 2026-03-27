import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
  getDocs,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'order'
  | 'cancellation'
  | 'review'
  | 'ticket'
  | 'user'
  | 'stock';

export type NotificationCategory = 'orders' | 'reviews' | 'tickets' | 'users';

export type AdminNotification = {
  id: string;
  notificationId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  referenceId: string;
  referenceUrl: string;
  triggeredBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  read: boolean;
  createdAt?: unknown;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Maps old-format and new-format notification documents to the AdminNotification type.
 * Backward-compatible with existing notifications that use the old schema.
 */
function docToNotification(id: string, data: DocumentData): AdminNotification {
  // Map old type field to new type + category
  const oldTypeMap: Record<string, { type: NotificationType; category: NotificationCategory }> = {
    new_order: { type: 'order', category: 'orders' },
    order_cancelled: { type: 'cancellation', category: 'orders' },
    new_user: { type: 'user', category: 'users' },
    profile_updated: { type: 'user', category: 'users' },
  };

  const mapped = oldTypeMap[data.type];

  return {
    id,
    notificationId: data.notificationId ?? id,
    type: mapped?.type ?? (data.type as NotificationType) ?? 'order',
    category: mapped?.category ?? (data.category as NotificationCategory) ?? 'orders',
    title: data.title ?? data.message?.split(' — ')?.[0] ?? '',
    message: data.message ?? '',
    referenceId: data.referenceId ?? data.orderId ?? data.userId ?? '',
    referenceUrl: data.referenceUrl ?? data.linkTo ?? '',
    triggeredBy: data.triggeredBy ?? {
      userId: data.userId ?? '',
      userName: '',
      userEmail: '',
    },
    read: data.read ?? false,
    createdAt: data.createdAt,
  };
}

// ─── CREATE NOTIFICATION (client-side) ────────────────────────────────────────

/**
 * Writes a notification document to Firestore from the client.
 * Used when Cloud Functions are not available (no Blaze plan).
 * When you upgrade to Blaze, these calls can be removed and Cloud Functions
 * in functions/src/index.ts will handle notification creation server-side.
 */
export async function createNotification(data: {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  referenceId: string;
  referenceUrl: string;
  triggeredBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
}): Promise<string> {
  const ref = await addDoc(collection(db, 'notifications'), {
    notificationId: '', // will be set after creation
    type: data.type,
    category: data.category,
    title: data.title,
    message: data.message,
    referenceId: data.referenceId,
    referenceUrl: data.referenceUrl,
    triggeredBy: data.triggeredBy,
    read: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── SUBSCRIBE TO NOTIFICATIONS (realtime, all) ─────────────────────────

export function subscribeToNotifications(
  callback: (notifications: AdminNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
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

// ─── SUBSCRIBE TO NOTIFICATIONS BY CATEGORY ──────────────────────────────────

export function subscribeToNotificationsByCategory(
  category: NotificationCategory,
  callback: (notifications: AdminNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => docToNotification(d.id, d.data())));
    },
    (err) => {
      console.error('[subscribeToNotificationsByCategory] Firestore error:', err);
      onError?.(err);
    }
  );
}

// ─── SUBSCRIBE TO UNREAD COUNT ────────────────────────────────────────────────

export function subscribeToUnreadCount(
  callback: (count: number) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('read', '==', false)
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.size);
    },
    (err) => {
      console.error('[subscribeToUnreadCount] Firestore error:', err);
      onError?.(err);
    }
  );
}

// ─── SUBSCRIBE TO UNREAD COUNTS BY CATEGORY ──────────────────────────────────

export function subscribeToUnreadCountsByCategory(
  callback: (counts: Record<NotificationCategory, number>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('read', '==', false)
  );
  return onSnapshot(
    q,
    (snap) => {
      const counts: Record<NotificationCategory, number> = {
        orders: 0,
        reviews: 0,
        tickets: 0,
        users: 0,
      };
      snap.docs.forEach((d) => {
        const cat = (d.data().category as NotificationCategory) || 'orders';
        if (counts[cat] !== undefined) {
          counts[cat]++;
        }
      });
      callback(counts);
    },
    (err) => {
      console.error('[subscribeToUnreadCountsByCategory] Firestore error:', err);
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

// ─── CLEAR ALL READ NOTIFICATIONS ─────────────────────────────────────────────

/**
 * Permanently deletes all READ notifications from Firestore.
 * Unread notifications are preserved.
 */
export async function clearAllReadNotifications(): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('read', '==', true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  // Firestore batch operations have a limit of 500 per batch
  const batchSize = 500;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + batchSize);
    chunk.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  }
}
