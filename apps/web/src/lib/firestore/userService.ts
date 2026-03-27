import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, getDocs, addDoc, deleteDoc, query, orderBy, onSnapshot,
  type Unsubscribe, type QuerySnapshot, type DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/firestore/notificationService';

// ─── USER PROFILE ─────────────────────────────────────────────

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/**
 * Fetch user profile from Firestore.
 * Returns null if document doesn't exist yet (new user).
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as (UserProfile & { uid: string });
}

/**
 * Subscribe to all users in real-time.
 */
export function subscribeToAllUsers(
  onUpdate: (users: (UserProfile & { uid: string })[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap: QuerySnapshot) => {
      const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as (UserProfile & { uid: string })));
      onUpdate(users);
    },
    (err: Error) => {
      console.error('[subscribeToAllUsers] Firestore error:', err);
      onError?.(err);
    }
  );
}

/**
 * Subscribe to a single user profile in real-time.
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (user: (UserProfile & { uid: string }) | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = doc(db, 'users', uid);
  return onSnapshot(
    ref,
    (snap: DocumentSnapshot) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ uid: snap.id, ...snap.data() } as (UserProfile & { uid: string }));
      }
    },
    (err: Error) => {
      console.error('[subscribeToUserProfile] Firestore error:', err);
      onError?.(err);
    }
  );
}

/**
 * Create or merge a user profile document.
 * Called on first login.
 */
export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Fire admin notification for new user (best-effort)
  createNotification({
    type: 'user',
    category: 'users',
    title: 'New User Registered',
    message: `New user signed up: ${data.fullName || 'Unknown'} (${data.email || ''})`,
    referenceId: uid,
    referenceUrl: `/admin/customers/${uid}`,
    triggeredBy: {
      userId: uid,
      userName: data.fullName || '',
      userEmail: data.email || '',
    },
  }).catch(() => { /* silently ignore */ });
}

/**
 * Update specific fields of the user profile.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // Profile update notification handled server-side.
}

// ─── ADDRESSES ────────────────────────────────────────────────

export type FirestoreAddress = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/**
 * Fetch all addresses for a user, ordered by createdAt ascending.
 */
export async function getAddresses(uid: string): Promise<FirestoreAddress[]> {
  const ref = collection(db, 'users', uid, 'addresses');
  const q = query(ref, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreAddress));
}

/**
 * Subscribe to a user's addresses in real-time.
 */
export function subscribeToUserAddresses(
  uid: string,
  onUpdate: (addresses: FirestoreAddress[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = collection(db, 'users', uid, 'addresses');
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap: QuerySnapshot) => {
      const addresses = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreAddress));
      onUpdate(addresses);
    },
    (err: Error) => {
      console.error('[subscribeToUserAddresses] Firestore error:', err);
      onError?.(err);
    }
  );
}

/**
 * Add a new address. Returns the new document ID.
 * If isDefault is true, unsets all existing defaults first.
 */
export async function addAddress(
  uid: string,
  data: Omit<FirestoreAddress, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (data.isDefault) {
    await unsetAllDefaults(uid);
  }
  const ref = collection(db, 'users', uid, 'addresses');
  const newDoc = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return newDoc.id;
}

/**
 * Update an existing address by document ID.
 */
export async function updateAddress(
  uid: string,
  addressId: string,
  data: Partial<Omit<FirestoreAddress, 'id' | 'createdAt'>>
): Promise<void> {
  if (data.isDefault) {
    await unsetAllDefaults(uid);
  }
  const ref = doc(db, 'users', uid, 'addresses', addressId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an address by document ID.
 */
export async function deleteAddress(uid: string, addressId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'addresses', addressId);
  await deleteDoc(ref);
}

/**
 * Set one address as default and unset all others.
 */
export async function setDefaultAddress(uid: string, addressId: string): Promise<void> {
  await unsetAllDefaults(uid);
  const ref = doc(db, 'users', uid, 'addresses', addressId);
  await updateDoc(ref, { isDefault: true, updatedAt: serverTimestamp() });
}

/**
 * Internal helper — unset isDefault on all addresses.
 */
async function unsetAllDefaults(uid: string): Promise<void> {
  const addresses = await getAddresses(uid);
  const updates = addresses
    .filter((a) => a.isDefault)
    .map((a) =>
      updateDoc(
        doc(db, 'users', uid, 'addresses', a.id),
        { isDefault: false, updatedAt: serverTimestamp() }
      )
    );
  await Promise.all(updates);
}
