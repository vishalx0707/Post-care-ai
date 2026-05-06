import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { getReportAnalysisPrompt } from '@/lib/ai-prompt';
import { getGeminiModel } from '@/lib/gemini';
import { saveMemoryCandidates } from '@/lib/health/memory-store';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import logger from '@/lib/logger';

export const maxDuration = 60;

const REPORT_LIST_LIMIT = 50;
const REPORT_QUERY_LIMIT = 100;
const MAX_REPORT_TEXT_LENGTH = 20000;
const MAX_GEMINI_TEXT_LENGTH = 12000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
]);

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

function serializeReport(report) {
  return serializeValue(report);
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

function reportSortTime(report) {
  return timestampMs(report.uploadedAt || report.createdAt || report.updatedAt);
}

function toReport(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  };
}

function safeReportName(reportName) {
  const name = String(reportName || '').trim().slice(0, 200);
  return name || 'Medical report';
}

function sanitizeFileName(fileName) {
  return String(fileName || 'report')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 180);
}

function isSafeDocumentId(id) {
  return Boolean(id && id.length <= 200 && !id.includes('/'));
}

function getDisplayName(profile, user) {
  return profile.displayName || profile.full_name || user.name || '';
}

async function parseReportRequest(request, userId) {
  const contentType = request.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    const body = await request.json().catch(() => ({}));
    return {
      reportName: safeReportName(body.reportName),
      extractedText: String(body.extractedText || '').trim(),
      fileUrl: '',
      imagePart: null,
    };
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const formText = String(formData.get('extractedText') || '').trim();
  let reportName = safeReportName(formData.get('reportName'));
  let extractedText = formText;
  let fileUrl = '';
  let imagePart = null;

  if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      throw new Error('Unsupported file type');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large');
    }

    const sanitizedName = sanitizeFileName(file.name);
    reportName = safeReportName(formData.get('reportName') || sanitizedName.replace(/\.[^.]+$/, ''));
    const ext = sanitizedName.includes('.') ? sanitizedName.split('.').pop().toLowerCase() : 'bin';
    const reportRefId = randomUUID();
    const storagePath = `users/${userId}/medical-reports/${reportRefId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await getAdminStorage()
      .bucket()
      .file(storagePath)
      .save(buffer, { metadata: { contentType: file.type } });

    fileUrl = storagePath;

    if (file.type === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = [formText, pdfData.text || ''].filter(Boolean).join('\n\n').trim();
      } catch (pdfErr) {
        logger.warn('reports_pdf_parse_error', { error: pdfErr, fileName: sanitizedName });
      }
    } else if (file.type === 'text/plain') {
      extractedText = [formText, buffer.toString('utf8')].filter(Boolean).join('\n\n').trim();
    } else if (file.type.startsWith('image/')) {
      imagePart = {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type,
        },
      };
    }
  }

  return { reportName, extractedText, fileUrl, imagePart };
}

// GET - List non-deleted reports for the authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const snapshot = await getAdminDb().collection('medicalReports')
      .where('userId', '==', user.uid)
      .limit(REPORT_QUERY_LIMIT)
      .get();

    const reports = snapshot.docs
      .map(toReport)
      .filter((report) => !report.deletedAt)
      .sort((a, b) => reportSortTime(b) - reportSortTime(a))
      .slice(0, REPORT_LIST_LIMIT)
      .map(serializeReport);

    return NextResponse.json({ reports });
  } catch (err) {
    logger.error('reports_get_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Analyze extracted report text and store a medicalReports document
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    let reportInput;
    try {
      reportInput = await parseReportRequest(request, user.uid);
    } catch (inputErr) {
      return NextResponse.json({ error: inputErr.message || 'Invalid report input' }, { status: 400 });
    }

    const { reportName, fileUrl, imagePart } = reportInput;
    const extractedText = String(reportInput.extractedText || '').trim();

    if (!extractedText && !imagePart) {
      return NextResponse.json({ error: 'Report text or a supported file is required' }, { status: 400 });
    }

    const db = getAdminDb();
    const profileSnapshot = await db.collection('users').doc(user.uid).get();
    const profile = profileSnapshot.data() || {};

    const prompt = getReportAnalysisPrompt({
      displayName: getDisplayName(profile, user),
      aiCompanionName: profile.aiCompanionName || 'AI Companion',
      reportName,
    });

    const model = getGeminiModel(prompt);
    const parts = [
      {
        text: `Report name: ${reportName}\n\nReport text:\n${extractedText.slice(0, MAX_GEMINI_TEXT_LENGTH) || 'Analyze the uploaded report image.'}`,
      },
    ];
    if (imagePart) parts.push(imagePart);

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
    });

    const summary = result.response.text()?.trim() || 'No summary was generated.';
    const reportRef = db.collection('medicalReports').doc();

    await reportRef.set({
      userId: user.uid,
      reportName,
      fileUrl,
      extractedText: (extractedText || '[Uploaded image analyzed directly by AI.]').slice(0, MAX_REPORT_TEXT_LENGTH),
      summary,
      uploadedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await saveMemoryCandidates(db, user.uid, [
      {
        memoryType: 'health_detail',
        value: `${reportName}: ${summary.slice(0, 500)}`,
        source: 'report',
        confidence: 0.62,
      },
    ]);

    const createdSnapshot = await reportRef.get();

    return NextResponse.json(
      { report: serializeReport(toReport(createdSnapshot)) },
      { status: 201 }
    );
  } catch (err) {
    logger.error('reports_post_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft-delete a report after the client confirms user intent
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedJson();

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id')?.trim();

    if (!isSafeDocumentId(reportId)) {
      return NextResponse.json({ error: 'Valid id is required' }, { status: 400 });
    }

    const reportRef = getAdminDb().collection('medicalReports').doc(reportId);
    const snapshot = await reportRef.get();

    if (!snapshot.exists || snapshot.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await reportRef.update({
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('reports_delete_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
