'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, loading, initialized, initialize } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
  };
}
