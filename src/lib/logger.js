/**
 * Structured server-side logger for security events.
 *
 * Logs are written as JSON lines to stdout/stderr so they can be ingested
 * by any log aggregator (Vercel, Cloud Run, Datadog, etc.).
 *
 * Sensitive fields (tokens, keys, passwords) are automatically stripped.
 */

const SENSITIVE_KEYS = new Set([
  'authorization', 'cookie', 'token', 'password', 'secret',
  'private_key', 'privateKey', 'api_key', 'apiKey',
  'FIREBASE_SERVICE_ACCOUNT_JSON', 'GEMINI_API_KEY',
]);

/**
 * Recursively redact sensitive fields from an object.
 */
function redact(obj, depth = 0) {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (obj instanceof Error) {
    return { message: obj.message, name: obj.name, stack: obj.stack };
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redact(item, depth + 1));

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = redact(value, depth + 1);
    }
  }
  return cleaned;
}

function formatLog(level, event, data) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...redact(data),
  });
}

const logger = {
  /**
   * Log a security-relevant event (failed auth, suspicious payload, etc.)
   */
  security(event, data = {}) {
    console.warn(formatLog('SECURITY', event, data));
  },

  /**
   * Log an informational event.
   */
  info(event, data = {}) {
    console.log(formatLog('INFO', event, data));
  },

  /**
   * Log a warning.
   */
  warn(event, data = {}) {
    console.warn(formatLog('WARN', event, data));
  },

  /**
   * Log an error — automatically redacts sensitive fields from error objects.
   */
  error(event, data = {}) {
    console.error(formatLog('ERROR', event, data));
  },
};

export default logger;
