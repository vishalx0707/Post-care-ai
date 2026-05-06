import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

const VALID_TONES = new Set(['friendly', 'calm', 'funny', 'supportive']);

const DEFAULT_SETTINGS = {
  autoScheduleEnabled: false,
  askBeforeCreatingReminder: true,
  voiceEnabled: true,
  notificationsEnabled: true,
  tone: 'friendly',
};

// GET — Fetch AI settings
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const snapshot = await getAdminDb().collection('aiSettings').doc(user.uid).get();
    const data = snapshot.exists ? snapshot.data() : {};

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...data });
  } catch (err) {
    logger.error('settings_get_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Update AI settings
export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const updates = { updatedAt: FieldValue.serverTimestamp() };

    if (typeof body.autoScheduleEnabled === 'boolean') {
      updates.autoScheduleEnabled = body.autoScheduleEnabled;
    }
    if (typeof body.askBeforeCreatingReminder === 'boolean') {
      updates.askBeforeCreatingReminder = body.askBeforeCreatingReminder;
    }
    if (typeof body.voiceEnabled === 'boolean') {
      updates.voiceEnabled = body.voiceEnabled;
    }
    if (typeof body.notificationsEnabled === 'boolean') {
      updates.notificationsEnabled = body.notificationsEnabled;
    }
    if (body.tone && VALID_TONES.has(body.tone)) {
      updates.tone = body.tone;
    }

    await getAdminDb().collection('aiSettings').doc(user.uid).set(updates, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('settings_patch_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
