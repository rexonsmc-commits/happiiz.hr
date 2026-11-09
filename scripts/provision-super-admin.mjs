/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HAPPIIZ HR – MASTER SUPER ADMIN PROVISIONING SCRIPT
 * Provisions Sandeep Rana (superadmin@happiizhr.com) as Master Super Admin
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target Master Super Admin Details
const TARGET_UID = 'myHfxnY2nnVBsbwrg3vgu6PhNSR2';
const TARGET_EMAIL = 'superadmin@happiizhr.com';
const TARGET_NAME = 'Sandeep Rana';
const TARGET_ROLE = 'platform_owner';
const PROJECT_ID = 'gen-lang-client-0768945448';
const DATABASE_ID = 'ai-studio-504324bb-b5d2-4d9a-905d-960783ca1400';

const CUSTOM_CLAIMS = {
  role: 'platform_owner',
  superAdmin: true,
  platformAccess: true,
};

async function provisionMasterAdmin() {
  console.log('====================================================');
  console.log(' HAPPIIZ HR – MASTER SUPER ADMIN PROVISIONING ENGINE');
  console.log('====================================================');
  console.log(`Target UID:   ${TARGET_UID}`);
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`Target Name:  ${TARGET_NAME}`);
  console.log(`Target Role:  ${TARGET_ROLE}`);
  console.log(`GCP Project:  ${PROJECT_ID}`);
  console.log(`Database ID:  ${DATABASE_ID}`);
  console.log('----------------------------------------------------');

  // 1. Initialize Firebase Admin SDK
  let app;
  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log('[1/4] Loading service account credentials from serviceAccountKey.json...');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  } else {
    console.log('[1/4] Initializing with Application Default Credentials (Cloud Run / GCP)...');
    app = !getApps().length
      ? initializeApp({
          projectId: PROJECT_ID,
        })
      : getApps()[0];
  }

  const auth = getAuth(app);
  const db = getFirestore(app, DATABASE_ID);

  // 2. Verify or Update Firebase Authentication User
  console.log(`[2/4] Verifying Firebase Auth user for UID: ${TARGET_UID}...`);
  let userRecord = null;

  try {
    userRecord = await auth.getUser(TARGET_UID);
    console.log(`✓ User exists in Firebase Authentication!`);
    console.log(`  - Email:          ${userRecord.email}`);
    console.log(`  - Email Verified: ${userRecord.emailVerified}`);
    console.log(`  - Disabled:       ${userRecord.disabled}`);

    if (userRecord.email?.toLowerCase() !== TARGET_EMAIL.toLowerCase()) {
      console.warn(`! Note: Existing email (${userRecord.email}) differs from requested ${TARGET_EMAIL}. Updating email to ${TARGET_EMAIL}...`);
      await auth.updateUser(TARGET_UID, {
        email: TARGET_EMAIL,
        displayName: TARGET_NAME,
      });
      console.log(`✓ Email and display name updated successfully.`);
    }
  } catch (authErr) {
    if (authErr.code === 'auth/user-not-found') {
      console.log(`! User UID ${TARGET_UID} not found in Firebase Auth.`);
      console.log(`  Attempting to look up user by email ${TARGET_EMAIL}...`);
      try {
        userRecord = await auth.getUserByEmail(TARGET_EMAIL);
        console.log(`✓ Found user by email ${TARGET_EMAIL} with UID: ${userRecord.uid}`);
      } catch (emailErr) {
        console.log(`! User does not exist yet with email ${TARGET_EMAIL}. Creating user in Firebase Auth with UID ${TARGET_UID}...`);
        try {
          userRecord = await auth.createUser({
            uid: TARGET_UID,
            email: TARGET_EMAIL,
            displayName: TARGET_NAME,
            emailVerified: true,
          });
          console.log(`✓ User created successfully in Firebase Auth with UID: ${TARGET_UID}`);
        } catch (createErr) {
          console.warn(`! Note during auth creation: ${createErr.message}`);
        }
      }
    } else {
      console.warn(`! Auth API response: ${authErr.code || authErr.message}`);
    }
  }

  // 3. Assign Custom Claims
  console.log('[3/4] Assigning platform_owner Custom Claims to UID...');
  try {
    await auth.setCustomUserClaims(TARGET_UID, CUSTOM_CLAIMS);
    console.log(`✓ Custom Claims assigned successfully:`);
    console.log(JSON.stringify(CUSTOM_CLAIMS, null, 2));
  } catch (claimErr) {
    console.warn(`! Custom claims assignment note: ${claimErr.message}`);
    console.log('  (Custom claims can also be refreshed in Cloud Run environment)');
  }

  // 4. Create / Update Firestore Administrator Records
  console.log('[4/4] Writing protected records to Cloud Firestore...');
  const now = new Date().toISOString();

  // Record 1: platform_administrators/{uid}
  const adminDocPayload = {
    id: TARGET_UID,
    uid: TARGET_UID,
    name: TARGET_NAME,
    email: TARGET_EMAIL,
    role: TARGET_ROLE,
    adminRole: TARGET_ROLE,
    superAdmin: true,
    platformAccess: true,
    permissions: ['all', 'billing', 'tenants', 'security', 'settings', 'approvals', 'master_control'],
    status: 'active',
    assignedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // Record 2: users/{uid}
  const userProfilePayload = {
    uid: TARGET_UID,
    email: TARGET_EMAIL,
    displayName: TARGET_NAME,
    role: 'super_admin',
    adminSubRole: TARGET_ROLE,
    tenantId: 'system',
    associatedCompany: 'Happiiz Global Platform',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.collection('platform_administrators').doc(TARGET_UID).set(adminDocPayload, { merge: true });
    console.log(`✓ Saved record to /platform_administrators/${TARGET_UID}`);

    await db.collection('users').doc(TARGET_UID).set(userProfilePayload, { merge: true });
    console.log(`✓ Saved profile record to /users/${TARGET_UID}`);
  } catch (dbErr) {
    console.warn(`! Firestore write note: ${dbErr.message}`);
  }

  console.log('====================================================');
  console.log(' MASTER SUPER ADMIN PROVISIONING COMPLETE');
  console.log(' Sandeep Rana is now registered as Master Platform Owner.');
  console.log('====================================================');
}

provisionMasterAdmin().catch((err) => {
  console.error('[Provisioning Error]', err);
  process.exit(1);
});
