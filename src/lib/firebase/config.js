const REQUIRED_FIREBASE_CLIENT_CONFIG = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', 'apiKey'],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'projectId'],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', 'appId'],
];

export function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

function formatMissingKeys(keys) {
  if (keys.length === 1) return keys[0];
  if (keys.length === 2) return `${keys[0]} and ${keys[1]}`;
  return `${keys.slice(0, -1).join(', ')}, and ${keys[keys.length - 1]}`;
}

export function getMissingFirebaseClientConfigKeys(config = getFirebaseConfig()) {
  return REQUIRED_FIREBASE_CLIENT_CONFIG
    .filter(([, configKey]) => !config[configKey])
    .map(([envKey]) => envKey);
}

export function getFirebaseClientConfigErrorMessage(
  missingKeys = getMissingFirebaseClientConfigKeys()
) {
  const missing = missingKeys.length
    ? ` Missing ${formatMissingKeys(missingKeys)}.`
    : '';

  return `Firebase client config is not configured.${missing} Add these Firebase Web App NEXT_PUBLIC_* values to .env.local or your deployment environment, then restart the Next.js server.`;
}

export function hasFirebaseConfig() {
  return getMissingFirebaseClientConfigKeys().length === 0;
}
