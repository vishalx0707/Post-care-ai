import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getFirebaseClientConfigErrorMessage,
  getFirebaseConfig,
  hasFirebaseConfig,
} from './config';

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) {
    throw new Error(getFirebaseClientConfigErrorMessage());
  }

  return getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorageClient() {
  return getStorage(getFirebaseApp());
}
