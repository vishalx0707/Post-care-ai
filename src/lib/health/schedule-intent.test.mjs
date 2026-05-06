import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScheduleConfirmationText,
  buildScheduleCreatedText,
  extractScheduleIntent,
  isAffirmativeScheduleConfirmation,
  isScheduleRequestMissingTime,
} from './schedule-intent.js';

test('extracts a clear medicine schedule request with normalized time', () => {
  const intent = extractScheduleIntent('I should take this medicine at 10 AM');

  assert.deepEqual(intent, {
    title: 'Take medicine',
    type: 'medicine',
    time: '10:00',
    displayTime: '10:00 AM',
    frequency: 'daily',
    reminderEnabled: true,
    createdBy: 'ai',
  });
});

test('extracts mixed medicine and exercise requests as custom schedules', () => {
  const intent = extractScheduleIntent('I should do this exercise and take this medicine at 10:30 PM every day');

  assert.equal(intent.type, 'custom');
  assert.equal(intent.title, 'Exercise and medicine');
  assert.equal(intent.time, '22:30');
  assert.equal(intent.displayTime, '10:30 PM');
  assert.equal(intent.frequency, 'daily');
});

test('extracts plural and misspelled schedule generation requests', () => {
  const pluralIntent = extractScheduleIntent('Can you generate schedules for my medicine at 8 PM?');
  const misspelledIntent = extractScheduleIntent('please make a scedule for walking at 6:15 am');

  assert.equal(pluralIntent.type, 'medicine');
  assert.equal(pluralIntent.title, 'Take medicine');
  assert.equal(pluralIntent.time, '20:00');
  assert.equal(pluralIntent.displayTime, '8:00 PM');

  assert.equal(misspelledIntent.type, 'exercise');
  assert.equal(misspelledIntent.title, 'Exercise routine');
  assert.equal(misspelledIntent.time, '06:15');
  assert.equal(misspelledIntent.displayTime, '6:15 AM');
});

test('ignores schedule-like text when time is unclear', () => {
  assert.equal(extractScheduleIntent('remind me about medicine later'), null);
});

test('recognizes schedule generation requests that need a time first', () => {
  assert.equal(isScheduleRequestMissingTime('can you generate scedules for me'), true);
  assert.equal(isScheduleRequestMissingTime('make a medicine schedule'), true);
  assert.equal(isScheduleRequestMissingTime('can you generate schedules for my medicine at 8 PM'), false);
  assert.equal(isScheduleRequestMissingTime('what should I eat today'), false);
});

test('recognizes short affirmative confirmations', () => {
  assert.equal(isAffirmativeScheduleConfirmation('yes please'), true);
  assert.equal(isAffirmativeScheduleConfirmation('sure, create it'), true);
  assert.equal(isAffirmativeScheduleConfirmation('not now'), false);
});

test('builds personal schedule confirmation and completion messages', () => {
  const intent = extractScheduleIntent('remind me to sleep at 10 PM');

  assert.equal(
    buildScheduleConfirmationText(intent, { displayName: 'Vishal' }),
    'Got it, Vishal. Do you want me to make a schedule for Sleep routine at 10:00 PM?'
  );
  assert.equal(
    buildScheduleCreatedText(intent, { displayName: 'Vishal' }),
    'Done, Vishal. I created a Sleep routine reminder for 10:00 PM.'
  );
});
