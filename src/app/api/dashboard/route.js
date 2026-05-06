import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { getAdminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

const COLLECTION_QUERY_LIMIT = 100;
const DASHBOARD_LIST_LIMIT = 20;

function serializeValue(value) {
  if (!value) return value;

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }

  return value;
}

function serializeDocData(data) {
  return serializeValue(data);
}

function timestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function collectionDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  };
}

function isNotDeleted(item) {
  return item.status !== 'deleted' && !item.deletedAt;
}

function isActive(item) {
  return isNotDeleted(item) && (!item.status || item.status === 'active');
}

function parseTimeToMinutes(value) {
  if (!value || typeof value !== 'string') return null;

  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const suffix = match[3]?.toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return null;
  }

  if (suffix === 'PM' && hours < 12) hours += 12;
  if (suffix === 'AM' && hours === 12) hours = 0;
  if (!suffix && hours > 23) return null;

  return hours * 60 + minutes;
}

function compareByTime(a, b) {
  const aMinutes = parseTimeToMinutes(a.time) ?? Number.MAX_SAFE_INTEGER;
  const bMinutes = parseTimeToMinutes(b.time) ?? Number.MAX_SAFE_INTEGER;

  if (aMinutes !== bMinutes) return aMinutes - bMinutes;
  return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''));
}

function medicationTimes(medication) {
  if (Array.isArray(medication.times) && medication.times.length > 0) {
    return medication.times.filter(Boolean);
  }

  if (medication.time) return [medication.time];
  if (medication.scheduleTime) return [medication.scheduleTime];

  return [];
}

function minutesUntil(time, now) {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const delta = minutes - currentMinutes;

  return delta >= 0 ? delta : delta + 24 * 60;
}

function findNextMedicationDose(medications, now = new Date()) {
  const doses = medications.flatMap((medication) =>
    medicationTimes(medication).map((time) => ({
      id: medication.id,
      medicationId: medication.id,
      name: medication.name || 'Medication',
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      instructions: medication.instructions || medication.description || '',
      time,
      dueInMinutes: minutesUntil(time, now),
    }))
  );

  return doses
    .filter((dose) => dose.dueInMinutes !== null)
    .sort((a, b) => a.dueInMinutes - b.dueInMinutes)[0] || null;
}

function dateKey(value) {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  if (value.timestamp) return dateKey(value.timestamp);
  if (value.date) return dateKey(value.date);
  return '';
}

function countTakenToday(medications, todayKey) {
  return medications.reduce((count, medication) => {
    const takenLog = Array.isArray(medication.takenLog) ? medication.takenLog : [];
    return count + takenLog.filter((entry) => dateKey(entry) === todayKey).length;
  }, 0);
}

function buildStats({ medications, schedules, reports, nextDose }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const totalMedicationDosesToday = medications.reduce(
    (count, medication) => count + Math.max(medicationTimes(medication).length, 1),
    0
  );
  const takenMedicationDosesToday = Math.min(
    countTakenToday(medications, todayKey),
    totalMedicationDosesToday
  );
  const progressPercent = totalMedicationDosesToday
    ? Math.round((takenMedicationDosesToday / totalMedicationDosesToday) * 100)
    : 0;

  return {
    activeMedicationCount: medications.length,
    activeScheduleCount: schedules.length,
    recentReportCount: reports.length,
    nextDose: serializeDocData(nextDose),
    today: {
      medicationDosesTotal: totalMedicationDosesToday,
      medicationDosesTaken: takenMedicationDosesToday,
      progressPercent,
    },
  };
}

async function listUserCollection(db, collectionName, userId) {
  const snapshot = await db.collection(collectionName)
    .where('userId', '==', userId)
    .limit(COLLECTION_QUERY_LIMIT)
    .get();

  return snapshot.docs.map(collectionDoc);
}

// GET - Dashboard data for tiles and summaries
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const db = getAdminDb();
    const [medicationDocs, scheduleDocs, reportDocs] = await Promise.all([
      listUserCollection(db, 'medications', user.uid),
      listUserCollection(db, 'schedules', user.uid),
      listUserCollection(db, 'medicalReports', user.uid),
    ]);

    const medications = medicationDocs
      .filter(isActive)
      .sort((a, b) => timestampMs(b.updatedAt || b.createdAt) - timestampMs(a.updatedAt || a.createdAt))
      .slice(0, DASHBOARD_LIST_LIMIT);
    const schedules = scheduleDocs
      .filter(isActive)
      .sort(compareByTime)
      .slice(0, DASHBOARD_LIST_LIMIT);
    const reports = reportDocs
      .filter(isNotDeleted)
      .sort((a, b) => timestampMs(b.uploadedAt || b.createdAt) - timestampMs(a.uploadedAt || a.createdAt))
      .slice(0, DASHBOARD_LIST_LIMIT);
    const nextDose = findNextMedicationDose(medications);

    return NextResponse.json({
      medications: medications.map(serializeDocData),
      schedules: schedules.map(serializeDocData),
      reports: reports.map(serializeDocData),
      stats: buildStats({ medications, schedules, reports, nextDose }),
    });
  } catch (err) {
    logger.error('dashboard_get_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
