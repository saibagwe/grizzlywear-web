import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_WISHLIST_IDS } from '@/lib/mock-data';

interface WishlistState {
  wishlistedIds: string[];
  
  // Actions
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      // Initialize with mock data for the prototype
      wishlistedIds: [...MOCK_WISHLIST_IDS],

      addToWishlist: (productId) => 
        set((state) => ({
          wishlistedIds: state.wishlistedIds.includes(productId) 
            ? state.wishlistedIds 
            : [...state.wishlistedIds, productId]
        })),

      removeFromWishlist: (productId) =>
        set((state) => ({
          wishlistedIds: state.wishlistedIds.filter(id => id !== productId)
        })),

      toggleFavorite: (productId) =>
        set((state) => {
          const isFavorited = state.wishlistedIds.includes(productId);
          return {
            wishlistedIds: isFavorited
              ? state.wishlistedIds.filter(id => id !== productId)
              : [...state.wishlistedIds, productId]
          };
        }),
    }),
    {
      name: 'grizzlywear-wishlist',
    }
  )
);
