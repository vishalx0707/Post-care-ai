import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const SPLIT_SERVICE_ACCOUNT_KEYS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

export function getFirebaseAdminConfigState(env = process.env) {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return { configured: true, source: 'service-account-json', missingKeys: [] };
  }

  const missingSplitKeys = SPLIT_SERVICE_ACCOUNT_KEYS.filter((key) => !env[key]);

  if (missingSplitKeys.length === 0) {
    return { configured: true, source: 'split-service-account', missingKeys: [] };
  }

  return {
    configured: false,
    source: null,
    missingKeys: ['FIREBASE_SERVICE_ACCOUNT_JSON', ...missingSplitKeys],
  };
}

export function getFirebaseAdminConfigErrorMessage(
  state = getFirebaseAdminConfigState()
) {
  return `Firebase Admin config is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or all split service account keys: ${SPLIT_SERVICE_ACCOUNT_KEYS.join(', ')}. Missing: ${state.missingKeys.join(', ')}.`;
}

function createFirebaseAdminConfigError() {
  const err = new Error(getFirebaseAdminConfigErrorMessage());
  err.code = 'FIREBASE_ADMIN_CONFIG_MISSING';
  return err;
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

export function getFirebaseAdminApp() {
  if (getApps().length) return getApps()[0];

  const configState = getFirebaseAdminConfigState();

  if (!configState.configured) {
    throw createFirebaseAdminConfigError();
  }

  const serviceAccount = getServiceAccount();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket,
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}

export { FieldValue };
