import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getFirebaseAdminConfigErrorMessage,
  getFirebaseAdminConfigState,
  getFirebaseAdminApp,
} from './admin.js';

const ADMIN_KEYS = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

function withAdminEnv(env, run) {
  const previous = new Map(ADMIN_KEYS.map((key) => [key, process.env[key]]));

  for (const key of ADMIN_KEYS) {
    delete process.env[key];
  }

  Object.assign(process.env, env);

  try {
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

test('Firebase Admin config fails closed when server credentials are missing', () => {
  withAdminEnv({}, () => {
    const state = getFirebaseAdminConfigState();

    assert.equal(state.configured, false);
    assert.match(getFirebaseAdminConfigErrorMessage(state), /FIREBASE_SERVICE_ACCOUNT_JSON/);
    assert.match(getFirebaseAdminConfigErrorMessage(state), /FIREBASE_PRIVATE_KEY/);
    assert.throws(
      () => getFirebaseAdminApp(),
      (err) =>
        err.code === 'FIREBASE_ADMIN_CONFIG_MISSING' &&
        err.message.includes('Firebase Admin config is not configured')
    );
  });
});

test('Firebase Admin config accepts a service account JSON secret', () => {
  withAdminEnv(
    {
      FIREBASE_SERVICE_ACCOUNT_JSON: '{"project_id":"demo","client_email":"demo@example.com","private_key":"key"}',
    },
    () => {
      assert.equal(getFirebaseAdminConfigState().configured, true);
    }
  );
});

test('Firebase Admin config accepts split service account secrets', () => {
  withAdminEnv(
    {
      FIREBASE_PROJECT_ID: 'demo',
      FIREBASE_CLIENT_EMAIL: 'demo@example.com',
      FIREBASE_PRIVATE_KEY: 'key',
    },
    () => {
      assert.equal(getFirebaseAdminConfigState().configured, true);
    }
  );
});
