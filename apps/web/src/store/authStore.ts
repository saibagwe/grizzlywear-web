import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;

  // Actions
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => () => void;
}

const MOCK_ADMIN_USER: AuthUser = {
  uid: 'mock-admin-123',
  email: 'admin@grizzlywear.in',
  displayName: 'Brian Ambrose',
  photoURL: null,
  isAdmin: true,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: MOCK_ADMIN_USER,
      loading: false,
      initialized: true,
      isAuthenticated: true,
      isAdmin: true,

      loginWithEmail: async () => {
        set({ user: MOCK_ADMIN_USER, isAuthenticated: true, isAdmin: true });
      },

      registerWithEmail: async () => {
        set({ user: MOCK_ADMIN_USER, isAuthenticated: true, isAdmin: true });
      },

      loginWithGoogle: async () => {
        set({ user: MOCK_ADMIN_USER, isAuthenticated: true, isAdmin: true });
      },

      logout: async () => {
        set({ user: null, isAuthenticated: false, isAdmin: false });
      },

      initialize: () => {
        // Mock initialization
        set({ user: MOCK_ADMIN_USER, initialized: true, isAuthenticated: true, isAdmin: true, loading: false });
        return () => {};
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
