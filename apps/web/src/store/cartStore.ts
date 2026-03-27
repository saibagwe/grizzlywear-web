import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/mock-data';

export type CartItem = {
  product: Product;
  size: string;
  quantity: number;
};

import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (product: Product, size: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  
  // Computed (accessed via store.getState() or directly inside components using hooks)
  totalItems: number;
  subtotal: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,

      addItem: async (product, size, quantity = 1) => {
        try {
          // Fetch current stock from Firestore
          const productRef = doc(db, 'products', product.id);
          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            throw new Error('Product not found');
          }

          const productData = productSnap.data();
          const currentStock = productData.stock?.[size] ?? 0;

          // If stock is 0 — block completely
          if (currentStock === 0) {
            toast.error(`Sorry, this item in size ${size} is currently unavailable`);
            return;
          }

          // Check if item already in cart
          const existingItem = get().items.find(
            (item) => item.product.id === product.id && item.size === size
          );
          const currentInCart = existingItem?.quantity || 0;
          const totalRequested = currentInCart + quantity;

          let finalInCart = totalRequested;
          let stockWarning = null;

          if (totalRequested > currentStock) {
            finalInCart = currentStock; // cap at max available
            if (currentInCart >= currentStock) {
              stockWarning = `You already have the maximum available stock (${currentStock}) in your bag.`;
            } else {
              stockWarning = `Only ${currentStock} units available in size ${size} — quantity adjusted to ${currentStock}`;
            }
          }

          if (stockWarning) {
            toast.warning(stockWarning);
          }

          if (finalInCart === currentInCart) return; // Nothing changed

          set((state) => {
            const existingItemIndex = state.items.findIndex(
              (item) => item.product.id === product.id && item.size === size
            );

            const newItems = [...state.items];
            if (existingItemIndex >= 0) {
              newItems[existingItemIndex].quantity = finalInCart;
            } else {
              newItems.push({ product, size, quantity: finalInCart });
            }

            const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
            const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

            return { items: newItems, totalItems, subtotal };
          });
          
          if (!stockWarning) {
            toast.success('Added to bag');
          }
        } catch (error: any) {
          console.error('Add to cart error:', error.message);
          toast.error(error.message);
        }
      },

      removeItem: (productId, size) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => !(item.product.id === productId && item.size === size)
          );
          
          const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
          const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

          return { items: newItems, totalItems, subtotal };
        });
      },

      updateQuantity: async (productId, size, quantity) => {
        try {
          if (quantity < 1) return;

          // Fetch current stock from Firestore
          const productRef = doc(db, 'products', productId);
          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            throw new Error('Product not found');
          }

          const productData = productSnap.data();
          const currentStock = productData.stock?.[size] ?? 0;

          let finalQuantity = quantity;
          if (currentStock < quantity) {
            finalQuantity = currentStock;
            toast.warning(`Only ${currentStock} units available in size ${size} — quantity adjusted to ${currentStock}`);
          }

          set((state) => {
            const newItems = state.items.map((item) => {
              if (item.product.id === productId && item.size === size) {
                return { ...item, quantity: finalQuantity };
              }
              return item;
            });

            const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
            const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

            return { items: newItems, totalItems, subtotal };
          });
        } catch (error: any) {
          console.error('Update quantity error:', error.message);
          toast.error(error.message);
        }
      },

      clearCart: () => set({ items: [], totalItems: 0, subtotal: 0 }),
    }),
    {
      name: 'grizzlywear-cart',
    }
  )
);
