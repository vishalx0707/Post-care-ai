import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const maxDuration = 30;

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return unauthorizedJson();
    }

    const formData = await request.formData();
    const file = formData.get('file');
    let conversationId = formData.get('conversationId');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(user.uid);

    if (!conversationId) {
      const convRef = userRef.collection('conversations').doc();
      await convRef.set({
        user_id: user.uid,
        title: 'New Conversation',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      conversationId = convRef.id;
    }

    // Sanitize filename to prevent path traversal and extension spoofing
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileExt = sanitizedName.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
    }

    const uploadRef = userRef.collection('uploads').doc();
    const storagePath = `users/${user.uid}/medical-files/${uploadRef.id}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await getAdminStorage()
      .bucket()
      .file(storagePath)
      .save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

    let extractedText = null;
    if (file.type === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text?.slice(0, 5000) || null;
      } catch (pdfErr) {
        logger.warn('upload_pdf_parse_error', { error: pdfErr, fileName: sanitizedName });
      }
    }

    const upload = {
      user_id: user.uid,
      conversation_id: conversationId,
      file_name: sanitizedName,
      file_type: file.type,
      file_path: storagePath,
      file_size: file.size,
      extracted_text: extractedText,
      created_at: FieldValue.serverTimestamp(),
    };

    await uploadRef.set(upload);

    return NextResponse.json({
      id: uploadRef.id,
      file_name: upload.file_name,
      file_type: upload.file_type,
      extracted_text: upload.extracted_text,
      conversationId,
    });
  } catch (err) {
    logger.error('upload_route_error', { error: err });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

