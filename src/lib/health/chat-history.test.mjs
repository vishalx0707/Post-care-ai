import test from 'node:test';
import assert from 'node:assert/strict';
import { createClientMessageId, normalizeChatHistoryPayload } from './chat-history.js';

test('normalizes saved chat history for the companion thread', () => {
  const history = normalizeChatHistoryPayload({
    conversationId: 'conv-123',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Can you check my medicine plan?',
        createdAt: '2026-05-06T03:30:00.000Z',
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Yes. Share the prescription details.',
        createdAt: '2026-05-06T03:31:00.000Z',
      },
    ],
  });

  assert.equal(history.conversationId, 'conv-123');
  assert.deepEqual(history.messages, [
    {
      id: 'm1',
      role: 'user',
      content: 'Can you check my medicine plan?',
      time: '9:00 AM',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'Yes. Share the prescription details.',
      time: '9:01 AM',
    },
  ]);
});

test('drops empty saved messages and falls back to generated ids', () => {
  const history = normalizeChatHistoryPayload({
    messages: [
      { role: 'assistant', content: '   ' },
      { role: 'model', content: 'Recovered answer' },
    ],
  });

  assert.deepEqual(history, {
    conversationId: null,
    messages: [
      {
        id: 'history-1',
        role: 'assistant',
        content: 'Recovered answer',
        time: '',
      },
    ],
  });
});

test('creates unique optimistic message ids in the same millisecond', () => {
  const originalNow = Date.now;
  Date.now = () => 1778034402644;

  try {
    const ids = [
      createClientMessageId('user'),
      createClientMessageId('assistant'),
      createClientMessageId('user'),
    ];

    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => id.startsWith('client-')));
  } finally {
    Date.now = originalNow;
  }
});
