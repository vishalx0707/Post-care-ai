import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { buildProfileMemoryCandidates } from '@/lib/health/memory-extractor';
import { saveMemoryCandidates } from '@/lib/health/memory-store';
import logger from '@/lib/logger';

const ALLOWED_PROFILE_FIELDS = new Set([
  'displayName', 'age', 'dateOfBirth', 'height', 'weight',
  'aiCompanionName', 'sleepTime', 'medicineRoutines', 'fitnessRoutines',
  'healthGoals', 'timezone', 'onboarding_completed',
]);

function sanitizeProfile(body) {
  const clean = {};
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_PROFILE_FIELDS.has(key) && value !== undefined) {
      // Basic sanitization
      if (typeof value === 'string') {
        clean[key] = value.trim().slice(0, 500);
      } else if (typeof value === 'number') {
        clean[key] = value;
      } else if (typeof value === 'boolean') {
        clean[key] = value;
      } else if (Array.isArray(value)) {
        clean[key] = value.slice(0, 20).map((v) =>
          typeof v === 'string' ? v.trim().slice(0, 200) : v
        );
      }
    }
  }
  return clean;
}

function toProfileResponse(snapshot) {
  const data = snapshot.exists ? snapshot.data() : {};

  return {
    exists: snapshot.exists,
    email: data?.email || '',
    full_name: data?.full_name || '',
    displayName: data?.displayName || data?.full_name || '',
    age: data?.age || null,
    age_group: data?.age_group || null,
    dateOfBirth: data?.dateOfBirth || null,
    height: data?.height || null,
    weight: data?.weight || null,
    aiCompanionName: data?.aiCompanionName || 'AI Companion',
    timezone: data?.timezone || null,
    sleepTime: data?.sleepTime || null,
    medicineRoutines: data?.medicineRoutines || [],
    fitnessRoutines: data?.fitnessRoutines || [],
    healthGoals: data?.healthGoals || [],
    onboarding_completed: Boolean(data?.onboarding_completed),
  };
}

// GET — Fetch user profile
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const snapshot = await getAdminDb().collection('users').doc(user.uid).get();
    return NextResponse.json(toProfileResponse(snapshot));
  } catch (err) {
    logger.error('profile_get_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create or initialize profile (login/signup)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const fullName = body.fullName || user.name || '';
    const profileRef = getAdminDb().collection('users').doc(user.uid);
    const snapshot = await profileRef.get();

    await profileRef.set(
      {
        email: user.email || body.email || '',
        updatedAt: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
        ...(fullName ? { full_name: fullName } : {}),
        ...(snapshot.exists
          ? {}
          : {
              full_name: fullName,
              displayName: fullName,
              aiCompanionName: 'AI Companion',
              onboarding_completed: false,
              createdAt: FieldValue.serverTimestamp(),
              created_at: FieldValue.serverTimestamp(),
            }),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('profile_post_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Update profile fields (onboarding, settings)
export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const cleanFields = sanitizeProfile(body);

    if (Object.keys(cleanFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    // Legacy support: age_group from old onboarding
    if (body.ageGroup) {
      cleanFields.age_group = body.ageGroup;
    }

    await getAdminDb().collection('users').doc(user.uid).set(
      {
        ...cleanFields,
        updatedAt: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await saveMemoryCandidates(
      getAdminDb(),
      user.uid,
      buildProfileMemoryCandidates(
        cleanFields,
        body.onboarding_completed ? 'onboarding' : 'settings'
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('profile_patch_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
