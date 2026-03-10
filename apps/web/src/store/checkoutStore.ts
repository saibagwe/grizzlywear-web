import { create } from 'zustand';
import { type CartItem, type DeliveryAddress } from '@/lib/payment/razorpayService';

type CheckoutStore = {
  // Step 1
  selectedAddress: DeliveryAddress | null;
  setSelectedAddress: (addr: DeliveryAddress) => void;

  // Step 2
  cartSnapshot: CartItem[];
  setCartSnapshot: (items: CartItem[]) => void;

  // Pricing
  subtotal: number;
  shippingCharge: number;
  discount: number;
  discountCode: string;
  total: number;
  setPricing: (p: { subtotal: number; shippingCharge: number; discount: number; discountCode: string; total: number }) => void;

  // Reset
  reset: () => void;
};

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  selectedAddress: null,
  setSelectedAddress: (addr) => set({ selectedAddress: addr }),

  cartSnapshot: [],
  setCartSnapshot: (items) => set({ cartSnapshot: items }),

  subtotal: 0,
  shippingCharge: 0,
  discount: 0,
  discountCode: '',
  total: 0,
  setPricing: (p) => set({ ...p }),

  reset: () =>
    set({
      selectedAddress: null,
      cartSnapshot: [],
      subtotal: 0,
      shippingCharge: 0,
      discount: 0,
      discountCode: '',
      total: 0,
    }),
}));
