import { getAdminAuth } from './admin';
import logger from '@/lib/logger';

/**
 * Extract non-sensitive request metadata for logging.
 */
function requestMeta(request) {
  return {
    method: request.method,
    url: request.url,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

export async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!token) {
    logger.security('auth_missing_token', requestMeta(request));
    return null;
  }

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch (err) {
    logger.security('auth_invalid_token', {
      ...requestMeta(request),
      reason: err.code || err.message || 'unknown',
    });
    return null;
  }
}

export function unauthorizedJson() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

