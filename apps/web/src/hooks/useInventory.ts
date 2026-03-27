'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SizeStock = { [size: string]: number };

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type InventoryProduct = {
  id: string;
  name: string;
  category: string;
  images: string[];
  sizes: string[];
  stock: SizeStock;
  totalStock: number;
  stockStatus: StockStatus;
  salesCount: number;
  updatedAt?: any;
  createdAt?: any;
};

export type StockHistoryEntry = {
  id: string;
  logId: string;
  productId: string;
  productName: string;
  changedBy: 'admin' | 'system';
  adminId: string;
  changeType: 'restock' | 'order_deducted' | 'order_restored' | 'manual_update';
  previousStock: SizeStock;
  newStock: SizeStock;
  difference: { [size: string]: number };
  orderId?: string;
  reason?: string;
  createdAt: any;
};

export type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'stock_high'
  | 'stock_low'
  | 'sales_high'
  | 'updated_recent';

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function computeStockStatus(stock: SizeStock): StockStatus {
  const values = Object.values(stock);
  if (values.length === 0) return 'out_of_stock';
  const allZero = values.every((v) => v === 0);
  if (allZero) return 'out_of_stock';
  const anyLow = values.some((v) => v >= 0 && v <= 10);
  if (anyLow) return 'low_stock';
  return 'in_stock';
}

export function computeTotalStock(stock: SizeStock): number {
  return Object.values(stock).reduce((sum, v) => sum + (v || 0), 0);
}

function docToInventoryProduct(id: string, data: DocumentData): InventoryProduct {
  const stockData = data.stock ?? {};
  let stock: SizeStock = {};

  if (typeof stockData === 'object' && stockData !== null && typeof stockData !== 'number') {
    stock = stockData as SizeStock;
  } else if (typeof stockData === 'number') {
    // Legacy: single number stock — distribute evenly to known sizes
    stock = { 'One Size': stockData };
  }

  const totalStock = computeTotalStock(stock);
  const stockStatus = computeStockStatus(stock);

  return {
    id,
    name: data.name ?? '',
    category: data.category ?? '',
    images: data.images ?? [],
    sizes: data.sizes ?? [],
    stock,
    totalStock,
    stockStatus,
    salesCount: data.salesCount ?? 0,
    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
  };
}

// ─── MAIN HOOK ────────────────────────────────────────────────────────────────

export function useInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const { firebaseUser } = useAuthStore();

  // Real-time subscription to products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map((d) => docToInventoryProduct(d.id, d.data()));
      setProducts(prods);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Counts
  const counts = useMemo(() => {
    const all = products.length;
    const inStock = products.filter((p) => p.stockStatus === 'in_stock').length;
    const lowStock = products.filter((p) => p.stockStatus === 'low_stock').length;
    const outOfStock = products.filter((p) => p.stockStatus === 'out_of_stock').length;
    return { all, inStock, lowStock, outOfStock };
  }, [products]);

  // Filtered + searched + sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by stock status
    if (stockFilter !== 'all') {
      result = result.filter((p) => p.stockStatus === stockFilter);
    }

    // Search by name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }

    // Sort
    switch (sortOption) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'stock_high':
        result.sort((a, b) => b.totalStock - a.totalStock);
        break;
      case 'stock_low':
        result.sort((a, b) => a.totalStock - b.totalStock);
        break;
      case 'sales_high':
        result.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case 'updated_recent':
        result.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() ?? new Date(0);
          const bTime = b.updatedAt?.toDate?.() ?? new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
        break;
    }

    return result;
  }, [products, stockFilter, searchTerm, sortOption]);

  // Update stock for a single product
  const updateStock = useCallback(
    async (
      productId: string,
      productName: string,
      previousStock: SizeStock,
      newStock: SizeStock,
      changeType: 'restock' | 'manual_update',
      reason?: string
    ) => {
      const newStockStatus = computeStockStatus(newStock);
      const newTotalStock = computeTotalStock(newStock);

      // Calculate difference
      const allSizes = new Set([...Object.keys(previousStock), ...Object.keys(newStock)]);
      const difference: { [size: string]: number } = {};
      allSizes.forEach((size) => {
        difference[size] = (newStock[size] ?? 0) - (previousStock[size] ?? 0);
      });

      // Update product with merge: true
      const productRef = doc(db, 'products', productId);
      await setDoc(
        productRef,
        {
          stock: newStock,
          stockStatus: newStockStatus,
          totalStock: newTotalStock,
          inStock: newTotalStock > 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Write stock history log
      const logId = `${productId}_${Date.now()}`;
      await addDoc(collection(db, 'stockHistory'), {
        logId,
        productId,
        productName,
        changedBy: 'admin',
        adminId: firebaseUser?.uid ?? 'unknown',
        changeType,
        previousStock,
        newStock,
        difference,
        reason: reason || '',
        createdAt: serverTimestamp(),
      });
    },
    [firebaseUser]
  );

  // Bulk update stock for multiple products
  const bulkUpdateStock = useCallback(
    async (
      updates: Array<{
        productId: string;
        productName: string;
        previousStock: SizeStock;
        newStock: SizeStock;
      }>
    ) => {
      const batch = writeBatch(db);
      const historyEntries: Array<{
        logId: string;
        productId: string;
        productName: string;
        previousStock: SizeStock;
        newStock: SizeStock;
        difference: { [size: string]: number };
      }> = [];

      for (const update of updates) {
        const newStockStatus = computeStockStatus(update.newStock);
        const newTotalStock = computeTotalStock(update.newStock);

        const allSizes = new Set([
          ...Object.keys(update.previousStock),
          ...Object.keys(update.newStock),
        ]);
        const difference: { [size: string]: number } = {};
        allSizes.forEach((size) => {
          difference[size] = (update.newStock[size] ?? 0) - (update.previousStock[size] ?? 0);
        });

        const productRef = doc(db, 'products', update.productId);
        batch.set(
          productRef,
          {
            stock: update.newStock,
            stockStatus: newStockStatus,
            totalStock: newTotalStock,
            inStock: newTotalStock > 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        historyEntries.push({
          logId: `${update.productId}_${Date.now()}`,
          productId: update.productId,
          productName: update.productName,
          previousStock: update.previousStock,
          newStock: update.newStock,
          difference,
        });
      }

      await batch.commit();

      // Write history entries (outside batch for potentially large sets)
      const histBatch = writeBatch(db);
      for (const entry of historyEntries) {
        const histRef = doc(collection(db, 'stockHistory'));
        histBatch.set(histRef, {
          ...entry,
          changedBy: 'admin',
          adminId: firebaseUser?.uid ?? 'unknown',
          changeType: 'manual_update',
          reason: 'Bulk update',
          createdAt: serverTimestamp(),
        });
      }
      await histBatch.commit();

      return updates.length;
    },
    [firebaseUser]
  );

  return {
    products,
    filteredProducts,
    loading,
    counts,
    searchTerm,
    setSearchTerm,
    sortOption,
    setSortOption,
    stockFilter,
    setStockFilter,
    updateStock,
    bulkUpdateStock,
  };
}

// ─── STOCK HISTORY HOOK ───────────────────────────────────────────────────────

export function useStockHistory(productId: string) {
  const [entries, setEntries] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setEntries([]);
    setLastDoc(null);

    const q = query(
      collection(db, 'stockHistory'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as StockHistoryEntry[];
      setEntries(data);
      setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return () => unsub();
  }, [productId]);

  const loadMore = useCallback(async () => {
    if (!lastDoc || !productId) return;

    const q = query(
      collection(db, 'stockHistory'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as StockHistoryEntry[];

    setEntries((prev) => [...prev, ...data]);
    setLastDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
    setHasMore(snap.docs.length === PAGE_SIZE);
  }, [lastDoc, productId]);

  return { entries, loading, hasMore, loadMore };
}

// ─── SALES COUNT HOOK ─────────────────────────────────────────────────────────

export function useSalesCount(productId: string, existingSalesCount?: number) {
  const [salesCount, setSalesCount] = useState(existingSalesCount ?? 0);

  useEffect(() => {
    if (existingSalesCount !== undefined && existingSalesCount > 0) {
      setSalesCount(existingSalesCount);
      return;
    }

    // Calculate from delivered orders if salesCount not stored on product
    const q = query(collection(db, 'orders'), where('status', '==', 'delivered'));
    getDocs(q).then((snap) => {
      let count = 0;
      snap.docs.forEach((d) => {
        const items = d.data().items ?? [];
        items.forEach((item: any) => {
          if (item.productId === productId) {
            count += item.quantity ?? 1;
          }
        });
      });
      setSalesCount(count);
    }).catch(() => {
      // silently ignore
    });
  }, [productId, existingSalesCount]);

  return salesCount;
}
