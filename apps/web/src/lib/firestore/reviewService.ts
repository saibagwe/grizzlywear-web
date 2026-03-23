import { db } from '@/lib/firebase';
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
  getDocs,
  Timestamp
} from 'firebase/firestore';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface FirestoreReview {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  status: ReviewStatus;
  createdAt: any;
}

export const REVIEWS_COLLECTION = 'reviews';

// --- SUBMIT REVIEW ---
export async function submitReview(data: Omit<FirestoreReview, 'id' | 'createdAt' | 'status'>): Promise<void> {
  // Check if review already exists for this user and product
  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  const q = query(
    reviewsRef,
    where('productId', '==', data.productId),
    where('userId', '==', data.userId)
  );
  
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error('You have already submitted a review for this product.');
  }

  // Create new review
  await addDoc(reviewsRef, {
    ...data,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
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
  await updateDoc(reviewRef, { status });
}

export async function deleteReviewData(reviewId: string): Promise<void> {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await deleteDoc(reviewRef);
}
