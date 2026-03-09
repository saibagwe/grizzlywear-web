import { create } from 'zustand';

interface UIState {
  isSearchOpen: boolean;
  isChatOpen: boolean;
  isMobileMenuOpen: boolean;
  
  // Actions
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
  
  toggleChat: () => void;
  setChatOpen: (isOpen: boolean) => void;
  
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  
  closeAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isChatOpen: false,
  isMobileMenuOpen: false,

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen, isMobileMenuOpen: false })),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen, isSearchOpen: false })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

  closeAllModals: () => set({ isSearchOpen: false, isMobileMenuOpen: false }),
}));
