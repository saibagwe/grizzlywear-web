import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type FirestoreProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  discount?: number;
  description: string;
  shortDescription: string;
  category: 'men' | 'women';
  subcategory: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  material: string;
  fit: string;
  careInstructions: string[];
  features: string[];
  stock: number | { [key: string]: number };
  totalStock: number;
  isFeatured: boolean;
  isNew: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ProductInput = Omit<FirestoreProduct, 'id' | 'createdAt' | 'updatedAt' | 'totalStock'>;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function docToProduct(id: string, data: DocumentData): FirestoreProduct {
  const stockData = data.stock ?? 0;
  let totalStock = 0;
  if (typeof stockData === 'number') {
    totalStock = stockData;
  } else if (typeof stockData === 'object' && stockData !== null) {
    totalStock = Object.values(stockData as Record<string, number>).reduce((acc, curr) => acc + (curr || 0), 0);
  }

  return {
    id,
    name: data.name ?? '',
    slug: data.slug ?? id,
    price: data.price ?? 0,
    comparePrice: data.comparePrice,
    discount: data.discount,
    description: data.description ?? '',
    shortDescription: data.shortDescription ?? '',
    category: data.category ?? 'men',
    subcategory: data.subcategory ?? '',
    images: data.images ?? [],
    sizes: data.sizes ?? [],
    colors: data.colors ?? [],
    material: data.material ?? '',
    fit: data.fit ?? '',
    careInstructions: data.careInstructions ?? [],
    features: data.features ?? [],
    stock: stockData,
    totalStock,
    isFeatured: data.isFeatured ?? false,
    isNew: data.isNew ?? false,
    inStock: data.inStock ?? (totalStock > 0),
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    tags: data.tags ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function syncProductEmbedding(
  productId: string,
  product: Partial<ProductInput> & { name?: string; slug?: string; price?: number }
): Promise<void> {
  const payload = {
    productId,
    name: product.name ?? '',
    slug: product.slug ?? productId,
    price: Number(product.price ?? 0),
    comparePrice: Number(product.comparePrice ?? 0),
    category: String(product.category ?? ''),
    subcategory: String(product.subcategory ?? ''),
    description: String(product.description ?? ''),
    shortDescription: String(product.shortDescription ?? ''),
    material: String(product.material ?? ''),
    fit: String(product.fit ?? ''),
    sizes: product.sizes ?? [],
    features: product.features ?? [],
    tags: product.tags ?? [],
    careInstructions: product.careInstructions ?? [],
    images: product.images ?? [],
    inStock: product.inStock ?? true,
    isFeatured: product.isFeatured ?? false,
    isNew: product.isNew ?? false,
  };

  const response = await fetch(`${AI_SERVICE_URL}/ai/embed-product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding sync failed (${response.status}): ${errorText}`);
  }
}

// ─── REAL-TIME LISTENER ───────────────────────────────────────────────────────

/**
 * Subscribe to all products in real time.
 * Returns an unsubscribe function.
 */
export function subscribeToProducts(
  callback: (products: FirestoreProduct[]) => void
): Unsubscribe {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const products = snap.docs.map((d) => docToProduct(d.id, d.data()));
    callback(products);
  });
}

/**
 * Subscribe to featured products only.
 */
export function subscribeToFeaturedProducts(
  callback: (products: FirestoreProduct[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'products'),
    where('isFeatured', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const products = snap.docs.map((d) => docToProduct(d.id, d.data()));
    callback(products);
  });
}

/**
 * Subscribe to new arrival products.
 */
export function subscribeToNewArrivals(
  callback: (products: FirestoreProduct[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'products'),
    where('isNew', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const products = snap.docs.map((d) => docToProduct(d.id, d.data()));
    callback(products);
  });
}

/**
 * Subscribe to products filtered by category.
 */
export function subscribeToProductsByCategory(
  category: string,
  callback: (products: FirestoreProduct[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'products'),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const products = snap.docs.map((d) => docToProduct(d.id, d.data()));
    callback(products);
  });
}

// ─── ONE-TIME READS ───────────────────────────────────────────────────────────

/**
 * Fetch all products once (no real-time).
 */
export async function getProducts(): Promise<FirestoreProduct[]> {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToProduct(d.id, d.data()));
}

/**
 * Fetch a single product by its Firestore document ID.
 */
export async function getProductById(id: string): Promise<FirestoreProduct | null> {
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  return docToProduct(snap.id, snap.data());
}

/**
 * Fetch a single product by slug field.
 */
export async function getProductBySlug(slug: string): Promise<FirestoreProduct | null> {
  const q = query(collection(db, 'products'), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return docToProduct(d.id, d.data());
}

// ─── WRITE OPERATIONS ─────────────────────────────────────────────────────────

/**
 * Create a new product. Returns the new document ID.
 */
export async function createProduct(data: ProductInput): Promise<string> {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await syncProductEmbedding(ref.id, data);
  } catch (error) {
    console.error('Create succeeded but embedding sync failed:', error);
  }

  return ref.id;
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  id: string,
  data: Partial<ProductInput>
): Promise<void> {
  const ref = doc(db, 'products', id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  try {
    const updatedSnap = await getDoc(ref);
    if (updatedSnap.exists()) {
      const fullProduct = docToProduct(updatedSnap.id, updatedSnap.data());
      await syncProductEmbedding(id, fullProduct);
    }
  } catch (error) {
    console.error('Update succeeded but embedding sync failed:', error);
  }
}

/**
 * Delete a product by ID.
 */
export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

// Images are uploaded directly via Cloudinary's CldUploadWidget in the browser.
// The resulting secure_url strings are stored in Firestore's images[] array.
