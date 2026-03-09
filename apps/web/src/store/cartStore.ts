import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/mock-data';

export type CartItem = {
  product: Product;
  size: string;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed (accessed via store.getState() or directly inside components using hooks)
  totalItems: number;
  subtotal: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      subtotal: 0,

      addItem: (product, size, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.product.id === product.id && item.size === size
          );

          const newItems = [...state.items];
          if (existingItemIndex >= 0) {
            newItems[existingItemIndex].quantity += quantity;
          } else {
            newItems.push({ product, size, quantity });
          }

          const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
          const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

          return { items: newItems, totalItems, subtotal };
        });
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

      updateQuantity: (productId, size, quantity) => {
        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.product.id === productId && item.size === size) {
              return { ...item, quantity: Math.max(1, quantity) }; // Minimum 1
            }
            return item;
          });

          const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
          const subtotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

          return { items: newItems, totalItems, subtotal };
        });
      },

      clearCart: () => set({ items: [], totalItems: 0, subtotal: 0 }),
    }),
    {
      name: 'grizzlywear-cart',
    }
  )
);
