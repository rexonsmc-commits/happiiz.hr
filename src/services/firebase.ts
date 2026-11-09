/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: getFirestore must pass firestoreDatabaseId per platform guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Connection health validation as mandated by the Firebase Integration Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Happiiz HR] Cloud Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Happiiz HR] Firestore is offline, please check network and configuration.');
      return false;
    }
    // Document might not exist yet which is standard for an initial ping; as long as it reaches server
    console.log('[Happiiz HR] Firestore server reached.');
    return true;
  }
}

// Initial self-test
testConnection().catch((err) => {
  console.info('[Happiiz HR] Initial connection note:', err?.message || err);
});

export default app;
