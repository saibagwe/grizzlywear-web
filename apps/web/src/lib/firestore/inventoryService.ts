import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type InventoryItem = {
  productId: string;
  productName: string;
  category: string;
  imageUrl: string;
  stock: Record<string, number>;
  totalStock: number;
  lowStockThreshold: number;
  lastUpdated?: any;
};

const COLLECTION_NAME = 'inventory';

export function subscribeToInventory(
  callback: (items: InventoryItem[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME));
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const items = snap.docs.map((d) => ({
      productId: d.id,
      ...d.data(),
    } as InventoryItem));
    callback(items);
  });
}

export async function getInventoryItem(productId: string): Promise<InventoryItem | null> {
  const ref = doc(db, COLLECTION_NAME, productId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { productId: snap.id, ...snap.data() } as InventoryItem;
  }
  return null;
}

export async function createInventoryItem(item: InventoryItem): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, item.productId);
  await setDoc(ref, {
    ...item,
    lastUpdated: serverTimestamp(),
  });
}

export async function updateInventoryStock(
  productId: string,
  stock: Record<string, number>
): Promise<void> {
  const totalStock = Object.values(stock).reduce((acc, curr) => acc + (curr || 0), 0);
  const ref = doc(db, COLLECTION_NAME, productId);
  await updateDoc(ref, {
    stock,
    totalStock,
    lastUpdated: serverTimestamp(),
  });
}

export async function syncInventoryWithProducts(products: any[]): Promise<void> {
  for (const product of products) {
    const existing = await getInventoryItem(product.id);
    if (!existing) {
      const newItem: InventoryItem = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        imageUrl: product.images?.[0] || '',
        stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
        totalStock: 0,
        lowStockThreshold: 10,
      };
      await createInventoryItem(newItem);
    }
  }
}
