import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, getDocs, addDoc, deleteDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  return snap.data() as UserProfile;
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
