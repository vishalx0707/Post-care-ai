import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfileMemoryCandidates, extractMemoryCandidates } from './memory-extractor.js';

test('extracts medicine, sleep, preference, and goal memories from a chat message', () => {
  const memories = extractMemoryCandidates(
    'I take Metformin 500mg after dinner. I usually sleep at 10 PM. I prefer calm reminders. My goal is better sleep.',
    'chat'
  );

  assert.deepEqual(
    memories.map((memory) => ({
      memoryType: memory.memoryType,
      value: memory.value,
      source: memory.source,
    })),
    [
      { memoryType: 'medicine', value: 'Metformin 500mg after dinner', source: 'chat' },
      { memoryType: 'sleep', value: 'Sleeps at 10:00 PM', source: 'chat' },
      { memoryType: 'preference', value: 'calm reminders', source: 'chat' },
      { memoryType: 'goal', value: 'better sleep', source: 'chat' },
    ]
  );
});

test('returns no memory candidates for unrelated conversation', () => {
  assert.deepEqual(extractMemoryCandidates('what is the weather like?', 'chat'), []);
});

test('builds memory candidates from onboarding profile fields', () => {
  const memories = buildProfileMemoryCandidates({
    sleepTime: '22:00',
    medicineRoutines: ['Metformin after dinner'],
    fitnessRoutines: ['Walk 20 minutes'],
    healthGoals: ['better sleep'],
  }, 'onboarding');

  assert.deepEqual(
    memories.map((memory) => ({
      memoryType: memory.memoryType,
      value: memory.value,
      source: memory.source,
    })),
    [
      { memoryType: 'sleep', value: 'Sleeps at 10:00 PM', source: 'onboarding' },
      { memoryType: 'medicine', value: 'Metformin after dinner', source: 'onboarding' },
      { memoryType: 'fitness', value: 'Walk 20 minutes', source: 'onboarding' },
      { memoryType: 'goal', value: 'better sleep', source: 'onboarding' },
    ]
  );
});
