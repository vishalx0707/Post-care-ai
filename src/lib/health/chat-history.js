function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

let optimisticMessageCounter = 0;

export function createClientMessageId(role = 'message') {
  optimisticMessageCounter += 1;
  const safeRole = String(role || 'message').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'message';
  const randomId = globalThis.crypto?.randomUUID?.();
  return ['client', safeRole, Date.now(), optimisticMessageCounter, randomId]
    .filter(Boolean)
    .join('-');
}

export function serializeChatMessage(docSnapshot, fallbackIndex = 0) {
  const data = typeof docSnapshot?.data === 'function' ? docSnapshot.data() : docSnapshot || {};
  const date = toDate(data.created_at || data.createdAt);

  return {
    id: docSnapshot?.id || data.id || `history-${fallbackIndex}`,
    role: data.role === 'user' ? 'user' : 'assistant',
    content: String(data.content || ''),
    createdAt: date ? date.toISOString() : null,
  };
}

function formatTime(value) {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function normalizeChatHistoryPayload(payload = {}) {
  const messages = Array.isArray(payload.messages) ? payload.messages : [];

  return {
    conversationId: payload.conversationId || null,
    messages: messages
      .map((message, index) => ({
        id: message.id || `history-${index}`,
        role: message.role === 'user' ? 'user' : 'assistant',
        content: String(message.content || '').trim(),
        time: formatTime(message.createdAt || message.created_at),
      }))
      .filter((message) => message.content),
  };
}
