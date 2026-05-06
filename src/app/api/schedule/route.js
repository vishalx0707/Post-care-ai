import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

const VALID_TYPES = new Set(['medicine', 'exercise', 'sleep', 'appointment', 'custom']);
const VALID_STATUSES = new Set(['active', 'paused', 'completed', 'deleted']);

// GET — List schedules for authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'active';

    const snapshot = await getAdminDb().collection('schedules')
      .where('userId', '==', user.uid)
      .limit(100)
      .get();
    const schedules = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((schedule) => schedule.status === status)
      .filter((schedule) => !type || !VALID_TYPES.has(type) || schedule.type === type)
      .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
      .slice(0, 50);

    return NextResponse.json({ schedules });
  } catch (err) {
    logger.error('schedule_get_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create a new schedule
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const { title, type, time, frequency, reminderEnabled, createdBy } = body;

    if (!title?.trim() || !type || !time) {
      return NextResponse.json({ error: 'title, type, and time are required' }, { status: 400 });
    }

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid schedule type' }, { status: 400 });
    }

    const scheduleRef = getAdminDb().collection('schedules').doc();
    const schedule = {
      userId: user.uid,
      title: title.trim().slice(0, 200),
      type,
      time,
      frequency: frequency || 'daily',
      reminderEnabled: reminderEnabled !== false,
      createdBy: createdBy === 'ai' ? 'ai' : 'user',
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await scheduleRef.set(schedule);

    return NextResponse.json({ id: scheduleRef.id, ...schedule });
  } catch (err) {
    logger.error('schedule_post_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Update schedule status or fields
export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const { scheduleId, status, title, time, frequency, reminderEnabled } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 });
    }

    const scheduleRef = getAdminDb().collection('schedules').doc(scheduleId);
    const snapshot = await scheduleRef.get();

    if (!snapshot.exists || snapshot.data().userId !== user.uid) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const updates = { updatedAt: FieldValue.serverTimestamp() };

    if (status && VALID_STATUSES.has(status)) updates.status = status;
    if (title?.trim()) updates.title = title.trim().slice(0, 200);
    if (time) updates.time = time;
    if (frequency) updates.frequency = frequency;
    if (typeof reminderEnabled === 'boolean') updates.reminderEnabled = reminderEnabled;

    await scheduleRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('schedule_patch_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Soft delete a schedule
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const scheduleRef = getAdminDb().collection('schedules').doc(scheduleId);
    const snapshot = await scheduleRef.get();

    if (!snapshot.exists || snapshot.data().userId !== user.uid) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    await scheduleRef.update({
      status: 'deleted',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('schedule_delete_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
