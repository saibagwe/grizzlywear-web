'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const {
    user,
    firebaseUser,
    profile,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    initialize,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return {
    user,
    firebaseUser,
    profile,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
  };
}
