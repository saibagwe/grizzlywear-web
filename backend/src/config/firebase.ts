import admin from 'firebase-admin';
import { env } from './env.js';

let firebaseApp: admin.app.App | null = null;

export function initFirebaseAdmin(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️  Firebase Admin credentials not configured. Auth will not work.');
    // Initialize without credentials for development
    firebaseApp = admin.initializeApp({
      projectId: 'grizzlywear-dev',
    });
    return firebaseApp;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  console.log('✅ Firebase Admin initialized');
  return firebaseApp;
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    initFirebaseAdmin();
  }
  return admin.auth();
}
