import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAuthSuccessState,
  getAuthErrorMessage,
} from './auth-flow.js';

test('signup without a session asks the user to confirm email instead of redirecting', () => {
  const state = getAuthSuccessState({
    mode: 'signup',
    hasSession: false,
    onboardingCompleted: false,
  });

  assert.deepEqual(state, {
    redirectTo: null,
    notice:
      'Check your email to confirm your account before signing in.',
  });
});

test('signin with completed onboarding goes to dashboard', () => {
  const state = getAuthSuccessState({
    mode: 'signin',
    hasSession: true,
    onboardingCompleted: true,
  });

  assert.equal(state.redirectTo, '/dashboard');
  assert.equal(state.notice, '');
});

test('signin without completed onboarding goes to onboarding', () => {
  const state = getAuthSuccessState({
    mode: 'signin',
    hasSession: true,
    onboardingCompleted: false,
  });

  assert.equal(state.redirectTo, '/onboarding');
  assert.equal(state.notice, '');
});

test('email confirmation errors get a guided message', () => {
  assert.equal(
    getAuthErrorMessage('Email not confirmed'),
    'Check your email and confirm your account before signing in.'
  );
});

test('email rate limit errors tell the user what to do next', () => {
  assert.equal(
    getAuthErrorMessage('email rate limit exceeded'),
    'Too many signup emails were requested. Please wait a few minutes, then check your inbox or try signing in.'
  );
});

test('Firebase browser config errors tell the user how to fix login setup', () => {
  assert.equal(
    getAuthErrorMessage('Firebase client config is not configured'),
    'Login is not configured yet. Add the Firebase Web App NEXT_PUBLIC_* values to .env.local or your deployment environment, then restart the Next.js server.'
  );
});

test('disabled Firebase auth providers explain the console setting to enable', () => {
  assert.equal(
    getAuthErrorMessage('auth/operation-not-allowed'),
    'This sign-in method is not enabled yet. Enable it in Firebase Authentication, then try again.'
  );
});

test('blocked Google popup errors explain the browser action', () => {
  assert.equal(
    getAuthErrorMessage('auth/popup-blocked'),
    'Your browser blocked the Google sign-in popup. Allow popups for this site, then try again.'
  );
});
