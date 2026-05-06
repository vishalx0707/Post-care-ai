import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getFirebaseClientConfigErrorMessage,
  getMissingFirebaseClientConfigKeys,
} from './config.js';

const REQUIRED_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

function withFirebaseEnv(env, run) {
  const previous = new Map(REQUIRED_KEYS.map((key) => [key, process.env[key]]));

  try {
    for (const key of REQUIRED_KEYS) {
      delete process.env[key];
    }

    Object.assign(process.env, env);
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('reports the exact missing Firebase browser config keys', () => {
  withFirebaseEnv(
    {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'api-key',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'project-id',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'bucket',
    },
    () => {
      assert.deepEqual(getMissingFirebaseClientConfigKeys(), [
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_APP_ID',
      ]);
    }
  );
});

test('reports no missing Firebase browser config keys when required values exist', () => {
  withFirebaseEnv(
    {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'project.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'project-id',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'bucket',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'app-id',
    },
    () => {
      assert.deepEqual(getMissingFirebaseClientConfigKeys(), []);
    }
  );
});

test('builds an actionable Firebase browser config error message', () => {
  assert.equal(
    getFirebaseClientConfigErrorMessage([
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ]),
    'Firebase client config is not configured. Missing NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_APP_ID. Add these Firebase Web App NEXT_PUBLIC_* values to .env.local or your deployment environment, then restart the Next.js server.'
  );
});
