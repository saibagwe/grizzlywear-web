/**
 * set-admin-role.mjs
 * One-time script: sets role = 'admin' on the admin@gmail.com Firestore user doc.
 *
 * Usage:
 *   node scripts/set-admin-role.mjs
 *
 * Pre-req: firebase-admin installed in backend, and GOOGLE_APPLICATION_CREDENTIALS
 * env var pointing to a service account JSON, OR run after `firebase login`.
 * The script uses the Firebase Auth REST API + firestore REST API via the
 * firebase-admin SDK initialised with application default credentials.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_EMAIL = 'admin@gmail.com';
const PROJECT_ID  = process.env.FIREBASE_PROJECT_ID || 'grizzlywear';

// ── Initialize Admin SDK ────────────────────────────────────────────────────
// Uses GOOGLE_APPLICATION_CREDENTIALS env var (service-account JSON) if set,
// otherwise falls back to Application Default Credentials (firebase CLI login).
if (!getApps().length) {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    initializeApp({
      credential: cert({
        projectId: PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Initialized with service account credentials.');
  } else {
    // Fall back to Application Default Credentials (gcloud / firebase login)
    initializeApp({ projectId: PROJECT_ID });
    console.log('✅ Initialized with Application Default Credentials.');
  }
}

const firebaseAuth = getAuth();
const db = getFirestore();

async function setAdminRole() {
  console.log(`\n🔍 Looking up user: ${ADMIN_EMAIL}`);

  // 1. Get UID from Firebase Auth
  let uid;
  try {
    const userRecord = await firebaseAuth.getUserByEmail(ADMIN_EMAIL);
    uid = userRecord.uid;
    console.log(`✅ Found user — UID: ${uid}`);
  } catch (err) {
    console.error(`❌ Could not find Firebase Auth user for ${ADMIN_EMAIL}`);
    console.error('   Make sure the user has signed up in your Firebase project first.');
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 2. Set role: 'admin' in Firestore /users/{uid}
  const userRef = db.collection('users').doc(uid);
  try {
    await userRef.set({ role: 'admin' }, { merge: true });
    console.log(`✅ Firestore /users/${uid} → role: 'admin' set successfully.`);
  } catch (err) {
    console.error('❌ Failed to write to Firestore:', err.message);
    process.exit(1);
  }

  // 3. (Optional) Set custom claim so token-based checks also work
  try {
    await firebaseAuth.setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Firebase Auth custom claim { admin: true } set on ${ADMIN_EMAIL}.`);
    console.log('   Note: the user must sign out and sign back in for the claim to take effect.');
  } catch (err) {
    console.warn('⚠️  Could not set custom claim (non-fatal):', err.message);
  }

  console.log('\n🎉 Done! admin@gmail.com now has full admin access.\n');
}

setAdminRole();
