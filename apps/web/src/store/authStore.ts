import { create } from 'zustand';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getUserProfile,
  createUserProfile,
  type UserProfile,
} from '@/lib/firestore/userService';
import Cookies from 'js-cookie';

const COOKIE_NAME = 'firebase-auth-token';
const googleProvider = new GoogleAuthProvider();

interface AuthState {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;

  // Backwards-compat: expose `user` for components that still reference it
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; isAdmin: boolean } | null;

  // Actions
  initialize: () => () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function userToCompat(user: User | null, isAdmin: boolean) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin,
  };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  firebaseUser: null,
  profile: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  initialized: false,
  user: null,

  initialize: () => {
    // Cookie sync — keep cookie fresh on token changes
    const unsubToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        Cookies.set(COOKIE_NAME, token, { expires: 7, secure: location.protocol === 'https:', sameSite: 'strict' });
      } else {
        Cookies.remove(COOKIE_NAME);
      }
    });

    // Auth state listener
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check admin claim
        let isAdmin = false;
        try {
          const tokenResult = await user.getIdTokenResult();
          isAdmin = tokenResult.claims.admin === true;
        } catch {
          // no-op
        }

        // Fetch or create Firestore profile
        let profile: UserProfile | null = null;
        try {
          profile = await getUserProfile(user.uid);
          if (!profile) {
            const newProfile: Partial<UserProfile> = {
              email: user.email ?? '',
              fullName: user.displayName ?? '',
              phone: '',
              dateOfBirth: '',
              gender: '',
            };
            await createUserProfile(user.uid, newProfile);
            profile = await getUserProfile(user.uid);
          }
        } catch {
          // Firestore may fail if rules not set yet — graceful fallback
          profile = {
            fullName: user.displayName ?? '',
            email: user.email ?? '',
            phone: '',
            dateOfBirth: '',
            gender: '',
          };
        }

        set({
          firebaseUser: user,
          profile,
          isAuthenticated: true,
          isAdmin,
          loading: false,
          initialized: true,
          user: userToCompat(user, isAdmin),
        });
      } else {
        set({
          firebaseUser: null,
          profile: null,
          isAuthenticated: false,
          isAdmin: false,
          loading: false,
          initialized: true,
          user: null,
        });
      }
    });

    return () => {
      unsubToken();
      unsubAuth();
    };
  },

  loginWithEmail: async (email, password) => {
    set({ loading: true });
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the rest
  },

  registerWithEmail: async (email, password, name) => {
    set({ loading: true });
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Create Firestore profile
    await createUserProfile(cred.user.uid, {
      email: cred.user.email ?? '',
      fullName: name,
      phone: '',
      dateOfBirth: '',
      gender: '',
    });
    // onAuthStateChanged will fire and load profile
  },

  loginWithGoogle: async () => {
    set({ loading: true });
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged will handle profile creation
  },

  logout: async () => {
    await signOut(auth);
    Cookies.remove(COOKIE_NAME);
    set({
      firebaseUser: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    });
  },

  refreshProfile: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      set({ profile });
    } catch {
      // no-op
    }
  },
}));
