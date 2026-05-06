import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

// GET — List medications for authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const snapshot = await getAdminDb().collection('medications')
      .where('userId', '==', user.uid)
      .limit(100)
      .get();

    const medications = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((medication) => medication.status === 'active')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 50);

    return NextResponse.json({ medications });
  } catch (err) {
    logger.error('medications_get_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Add a new medication / prescription
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const { name, dosage, frequency, instructions, times } = body;

    if (!name?.trim() || !dosage?.trim()) {
      return NextResponse.json({ error: 'name and dosage are required' }, { status: 400 });
    }

    const medRef = getAdminDb().collection('medications').doc();
    const medication = {
      userId: user.uid,
      name: name.trim().slice(0, 200),
      dosage: dosage.trim().slice(0, 100),
      description: body.description?.trim()?.slice(0, 500) || '',
      frequency: frequency || '1x Daily',
      instructions: instructions?.trim()?.slice(0, 300) || '',
      times: Array.isArray(times) ? times.slice(0, 10) : ['08:00'],
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await medRef.set(medication);

    return NextResponse.json({ id: medRef.id, ...medication });
  } catch (err) {
    logger.error('medications_post_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH — Update medication (mark as taken today, update fields)
export async function PATCH(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const body = await request.json().catch(() => ({}));
    const { medicationId, takenAt, status, name, dosage, frequency, instructions, times } = body;

    if (!medicationId) {
      return NextResponse.json({ error: 'medicationId is required' }, { status: 400 });
    }

    const medRef = getAdminDb().collection('medications').doc(medicationId);
    const snapshot = await medRef.get();

    if (!snapshot.exists || snapshot.data().userId !== user.uid) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    const updates = { updatedAt: FieldValue.serverTimestamp() };

    // Mark as taken — add to takenLog array
    if (takenAt) {
      updates.takenLog = FieldValue.arrayUnion({
        date: takenAt,
        timestamp: new Date().toISOString(),
      });
    }

    if (status === 'active' || status === 'paused' || status === 'deleted') {
      updates.status = status;
    }
    if (name?.trim()) updates.name = name.trim().slice(0, 200);
    if (dosage?.trim()) updates.dosage = dosage.trim().slice(0, 100);
    if (frequency) updates.frequency = frequency;
    if (instructions?.trim()) updates.instructions = instructions.trim().slice(0, 300);
    if (Array.isArray(times)) updates.times = times.slice(0, 10);

    await medRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('medications_patch_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Soft delete a medication
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const { searchParams } = new URL(request.url);
    const medicationId = searchParams.get('id');

    if (!medicationId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const medRef = getAdminDb().collection('medications').doc(medicationId);
    const snapshot = await medRef.get();

    if (!snapshot.exists || snapshot.data().userId !== user.uid) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    await medRef.update({
      status: 'deleted',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('medications_delete_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
