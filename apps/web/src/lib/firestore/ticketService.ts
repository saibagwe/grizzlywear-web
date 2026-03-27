import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/firestore/notificationService';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type TicketCategory =
  | 'order-issue'
  | 'product-issue'
  | 'payment-issue'
  | 'delivery-issue'
  | 'other';

export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high';

export type TicketMessage = {
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  text: string;
  createdAt: unknown;
};

export type FirestoreTicket = {
  id: string;
  ticketId: string;          // Human-readable TKT-XXXXX
  userId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: TicketCategory;
  description: string;
  orderId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  messages: TicketMessage[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type TicketInput = Omit<FirestoreTicket, 'id' | 'createdAt' | 'updatedAt'>;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function docToTicket(id: string, data: DocumentData): FirestoreTicket {
  return {
    id,
    ticketId: data.ticketId ?? id,
    userId: data.userId ?? '',
    customerName: data.customerName ?? '',
    customerEmail: data.customerEmail ?? '',
    subject: data.subject ?? '',
    category: data.category ?? 'other',
    description: data.description ?? '',
    orderId: data.orderId ?? '',
    status: data.status ?? 'open',
    priority: data.priority ?? 'medium',
    messages: (data.messages ?? []).map((m: any) => ({
      senderId: m.senderId ?? '',
      senderName: m.senderName ?? '',
      senderRole: m.senderRole ?? 'customer',
      text: m.text ?? '',
      createdAt: m.createdAt,
    })),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Generate a human-readable ticket ID like TKT-83A4F
 */
function generateTicketId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TKT-${id}`;
}

// ─── CREATE TICKET ───────────────────────────────────────────────────────────

export async function createTicket(
  data: Omit<TicketInput, 'ticketId' | 'status' | 'priority' | 'messages'>
): Promise<string> {
  const ticketId = generateTicketId();
  const docRef = await addDoc(collection(db, 'tickets'), {
    ...data,
    ticketId,
    status: 'open' as TicketStatus,
    priority: 'medium' as TicketPriority,
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Fire admin notification for new ticket (best-effort)
  createNotification({
    type: 'ticket',
    category: 'tickets',
    title: 'New Support Ticket',
    message: `${data.customerName || 'A user'} raised a new ticket: ${data.subject || 'No subject'}`,
    referenceId: ticketId,
    referenceUrl: `/admin/tickets/${docRef.id}`,
    triggeredBy: {
      userId: data.userId || '',
      userName: data.customerName || '',
      userEmail: data.customerEmail || '',
    },
  }).catch(() => { /* silently ignore */ });

  return ticketId;
}

// ─── GET SINGLE TICKET ──────────────────────────────────────────────────────

export async function getTicketById(id: string): Promise<FirestoreTicket | null> {
  const snap = await getDoc(doc(db, 'tickets', id));
  if (!snap.exists()) return null;
  return docToTicket(snap.id, snap.data());
}

// ─── REAL-TIME SINGLE TICKET ─────────────────────────────────────────────────

export function subscribeToTicket(
  id: string,
  callback: (ticket: FirestoreTicket | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'tickets', id),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback(docToTicket(snap.id, snap.data()));
      }
    },
    (err) => {
      console.error('[subscribeToTicket] Firestore error:', err);
      onError?.(err);
    }
  );
}

// ─── REAL-TIME USER TICKETS ──────────────────────────────────────────────────

export function subscribeToUserTickets(
  userId: string,
  callback: (tickets: FirestoreTicket[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'tickets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => docToTicket(d.id, d.data())));
    },
    (err) => {
      console.error('[subscribeToUserTickets] Firestore error:', err);
      onError?.(err);
    }
  );
}

// ─── REAL-TIME ALL TICKETS (admin) ───────────────────────────────────────────

export function subscribeToAllTickets(
  callback: (tickets: FirestoreTicket[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'tickets'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => docToTicket(d.id, d.data())));
    },
    (err) => {
      console.error('[subscribeToAllTickets] Firestore error:', err);
      onError?.(err);
    }
  );
}

// ─── ADD MESSAGE TO TICKET ───────────────────────────────────────────────────

export async function addTicketMessage(
  ticketDocId: string,
  message: Omit<TicketMessage, 'createdAt'>
): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketDocId);
  const snap = await getDoc(ticketRef);
  if (!snap.exists()) throw new Error('Ticket not found');

  const currentMessages = snap.data().messages ?? [];
  const newMessage: TicketMessage = {
    ...message,
    createdAt: new Date().toISOString(),
  };

  await updateDoc(ticketRef, {
    messages: [...currentMessages, newMessage],
    updatedAt: serverTimestamp(),
  });

  // Fire admin notification for customer replies only (best-effort)
  if (message.senderRole === 'customer') {
    const ticketData = snap.data();
    createNotification({
      type: 'ticket',
      category: 'tickets',
      title: 'Ticket Reply',
      message: `${message.senderName || 'A user'} replied to ticket #${ticketData.ticketId || ticketDocId}`,
      referenceId: ticketData.ticketId || ticketDocId,
      referenceUrl: `/admin/tickets/${ticketDocId}`,
      triggeredBy: {
        userId: message.senderId || '',
        userName: message.senderName || '',
        userEmail: ticketData.customerEmail || '',
      },
    }).catch(() => { /* silently ignore */ });
  }
}

// ─── UPDATE TICKET STATUS ────────────────────────────────────────────────────

export async function updateTicketStatus(
  ticketDocId: string,
  status: TicketStatus
): Promise<void> {
  await updateDoc(doc(db, 'tickets', ticketDocId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ─── UPDATE TICKET PRIORITY ─────────────────────────────────────────────────

export async function updateTicketPriority(
  ticketDocId: string,
  priority: TicketPriority
): Promise<void> {
  await updateDoc(doc(db, 'tickets', ticketDocId), {
    priority,
    updatedAt: serverTimestamp(),
  });
}
