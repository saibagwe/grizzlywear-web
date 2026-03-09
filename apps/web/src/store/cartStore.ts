import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItemData {
  productId: string;
  name: string;
  imageUrl: string;
  variant: { sku: string; size: string; color: string; colorHex: string };
  price: number;
  comparePrice: number;
  quantity: number;
}

interface CartState {
  items: CartItemData[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItemData, 'quantity'>, quantity?: number) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.variant.sku === item.variant.sku);

        if (existing) {
          set({
            items: items.map((i) =>
              i.variant.sku === item.variant.sku
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity }] });
        }
      },

      removeItem: (sku) => {
        set({ items: get().items.filter((i) => i.variant.sku !== sku) });
      },

      updateQuantity: (sku, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sku);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variant.sku === sku ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),
      setCartOpen: (open) => set({ isOpen: open }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: 'grizzlywear-cart',
    }
  )
);
