import test from 'node:test';
import assert from 'node:assert/strict';
import { getCompanionMenuLabel } from './sidebar-nav.js';

test('uses the saved companion name in menu labels', () => {
  assert.equal(getCompanionMenuLabel('Sarah'), 'Sarah');
});

test('falls back to AI Companion when no custom name is saved', () => {
  assert.equal(getCompanionMenuLabel(''), 'AI Companion');
  assert.equal(getCompanionMenuLabel(null), 'AI Companion');
});
