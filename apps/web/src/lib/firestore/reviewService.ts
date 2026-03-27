import { db, storage } from '@/lib/firebase';
import { createNotification } from '@/lib/firestore/notificationService';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface FirestoreReview {
  id?: string;
  reviewId?: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  status: ReviewStatus;
  createdAt: any;
  updatedAt: any;
  // Preserving properties from previous structure if any components use it temporarily
  productName?: string;
  customerName?: string;
  customerEmail?: string;
}

export const REVIEWS_COLLECTION = 'reviews';

async function checkIfVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('userId', '==', userId),
    where('status', '==', 'delivered')
  );
  const snap = await getDocs(q);
  // Iterate through delivered orders to see if the productId is in items
  for (const oDoc of snap.docs) {
    const orderData = oDoc.data();
    if (orderData.items && Array.isArray(orderData.items)) {
      if (orderData.items.some((item: any) => item.id === productId || item.productId === productId)) {
        return true;
      }
    }
  }
  return false;
}

// --- SUBMIT REVIEW ---
export async function submitReview(data: Omit<FirestoreReview, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'verified' | 'reviewId'>): Promise<void> {
  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  
  // Check if review already exists for this user and product
  const q = query(
    reviewsRef,
    where('productId', '==', data.productId),
    where('userId', '==', data.userId)
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error('You have already submitted a review for this product.');
  }

  const verified = await checkIfVerifiedPurchase(data.userId, data.productId);

  const newDocRef = doc(collection(db, REVIEWS_COLLECTION));
  await setDoc(newDocRef, {
    ...data,
    reviewId: newDocRef.id,
    verified,
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Fire admin notification for new review (best-effort)
  // Fetch product name for the notification message
  let productName = data.productName || 'a product';
  try {
    const productSnap = await getDoc(doc(db, 'products', data.productId));
    if (productSnap.exists()) {
      productName = productSnap.data()?.name || productName;
    }
  } catch { /* best effort */ }

  createNotification({
    type: 'review',
    category: 'reviews',
    title: 'New Review Submitted',
    message: `${data.userName || 'A user'} submitted a ${data.rating}★ review for ${productName} — pending approval`,
    referenceId: newDocRef.id,
    referenceUrl: `/admin/reviews/${newDocRef.id}`,
    triggeredBy: {
      userId: data.userId || '',
      userName: data.userName || '',
      userEmail: data.customerEmail || '',
    },
  }).catch(() => { /* silently ignore */ });
}

// --- UPDATE OWN REVIEW ---
export async function updateUserReview(reviewId: string, data: Partial<FirestoreReview>): Promise<void> {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  const reviewDoc = await getDoc(reviewRef);
  if (reviewDoc.exists() && reviewDoc.data().status === 'pending') {
    await updateDoc(reviewRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  } else {
    throw new Error('You can only edit pending reviews.');
  }
}

// --- GET OWN REVIEWS ---
export function subscribeToUserReviews(
  userId: string,
  onUpdate: (reviews: FirestoreReview[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreReview[];
      onUpdate(reviews);
    },
    (err) => {
      console.error("Error fetching user reviews:", err);
      if (onError) onError(err);
    }
  );
}

// --- ADMIN: ALL REVIEWS ---
export function subscribeToAllReviews(
  onUpdate: (reviews: FirestoreReview[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, REVIEWS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreReview[];
      onUpdate(reviews);
    },
    (err) => {
      console.error("Error fetching reviews:", err);
      if (onError) onError(err);
    }
  );
}

// --- PRODUCT PAGE: APPROVED REVIEWS ---
export function subscribeToProductReviews(
  productId: string,
  onUpdate: (reviews: FirestoreReview[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('productId', '==', productId),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreReview[];
      onUpdate(reviews);
    },
    (err) => {
      console.error("Error fetching product reviews:", err);
      if (onError) onError(err);
    }
  );
}

// --- ADMIN: UPDATE / DELETE ---
export async function updateReviewStatus(reviewId: string, status: ReviewStatus): Promise<void> {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await updateDoc(reviewRef, { status, updatedAt: Timestamp.now() });
}

export async function deleteReviewData(reviewId: string, images?: string[]): Promise<void> {
  if (images && images.length > 0) {
    for (const bgImg of images) {
      if (!bgImg) continue;
      try {
        const imageRef = ref(storage, bgImg);
        await deleteObject(imageRef);
      } catch (err) {
        console.warn("Error deleting review image:", err);
      }
    }
  }
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await deleteDoc(reviewRef);
}

// --- USER PRODUCT REVIEW ---
export function subscribeToUserProductReview(
  userId: string,
  productId: string,
  onUpdate: (review: FirestoreReview | null) => void
) {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('userId', '==', userId),
    where('productId', '==', productId)
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      onUpdate(null);
    } else {
      const doc = snapshot.docs[0];
      onUpdate({ id: doc.id, ...doc.data() } as FirestoreReview);
    }
  });
}

import { uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadReviewImages(userId: string, productId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const filename = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `reviews/${userId}/${productId}/${filename}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    urls.push(url);
  }
  return urls;
}
