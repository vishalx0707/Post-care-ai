import { getAuthenticatedUser } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb, getAdminStorage } from '@/lib/firebase/admin';
import { getCompanionPrompt } from '@/lib/ai-prompt';
import { getGeminiModel, toGeminiRole } from '@/lib/gemini';
import { serializeChatMessage } from '@/lib/health/chat-history';
import { extractMemoryCandidates } from '@/lib/health/memory-extractor';
import { saveMemoryCandidates } from '@/lib/health/memory-store';
import {
  buildScheduleConfirmationText,
  buildScheduleCreatedText,
  buildScheduleNeedsTimeText,
  extractScheduleIntent,
  isAffirmativeScheduleConfirmation,
  isScheduleRequestMissingTime,
} from '@/lib/health/schedule-intent';
import logger from '@/lib/logger';

export const maxDuration = 60;

async function getConversationForHistory(userRef, userId, requestedConversationId) {
  if (requestedConversationId) {
    const conversationRef = userRef.collection('conversations').doc(requestedConversationId);
    const conversationSnapshot = await conversationRef.get();

    if (!conversationSnapshot.exists) return null;

    const conversation = conversationSnapshot.data() || {};
    if (conversation.user_id && conversation.user_id !== userId) return null;

    return { id: requestedConversationId, ref: conversationRef, data: conversation };
  }

  const conversationSnapshot = await userRef
    .collection('conversations')
    .orderBy('updated_at', 'desc')
    .limit(1)
    .get();

  const latestConversation = conversationSnapshot.docs[0];
  if (!latestConversation) return null;

  return {
    id: latestConversation.id,
    ref: latestConversation.ref,
    data: latestConversation.data() || {},
  };
}

function streamText(text) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

async function createSchedule(db, userId, intent) {
  const scheduleRef = db.collection('schedules').doc();
  const schedule = {
    userId,
    title: intent.title,
    type: intent.type,
    time: intent.time,
    frequency: intent.frequency || 'daily',
    reminderEnabled: intent.reminderEnabled !== false,
    createdBy: 'ai',
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await scheduleRef.set(schedule);
  return { id: scheduleRef.id, ...schedule };
}

async function getPendingScheduleIntent(conversationRef) {
  const recentSnapshot = await conversationRef
    .collection('messages')
    .orderBy('created_at', 'desc')
    .limit(8)
    .get();

  const latestAssistantMessage = recentSnapshot.docs
    .map((doc) => doc.data())
    .find((msg) => msg.role === 'assistant');

  return latestAssistantMessage?.metadata?.pendingScheduleIntent || null;
}

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(user.uid);
    const { searchParams } = new URL(request.url);
    const requestedConversationId = searchParams.get('conversationId')?.trim();
    const conversation = await getConversationForHistory(userRef, user.uid, requestedConversationId);

    if (!conversation) {
      return Response.json({ conversationId: null, messages: [] });
    }

    const messagesSnapshot = await conversation.ref
      .collection('messages')
      .orderBy('created_at', 'asc')
      .limit(100)
      .get();

    return Response.json({
      conversationId: conversation.id,
      conversation: {
        id: conversation.id,
        title: conversation.data.title || 'Conversation',
      },
      messages: messagesSnapshot.docs.map((doc, index) => serializeChatMessage(doc, index)),
    });
  } catch (err) {
    logger.error('chat_history_error', { error: err });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { conversationId: convId, message, uploadIds = [] } = await request.json();

    if (!message?.trim() && uploadIds.length === 0) {
      return new Response('Message required', { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(user.uid);

    // Fetch user profile for personalized AI prompt
    const profileSnapshot = await userRef.get();
    const profile = profileSnapshot.data() || {};

    // Fetch user memories for context
    let memories = [];
    try {
      const memSnapshot = await db.collection('memories')
        .where('userId', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(20)
        .get();
      memories = memSnapshot.docs.map((d) => d.data());
    } catch {
      // Memories collection may not exist yet — that's fine
    }

    // Create or validate conversation
    let conversationId = convId;
    if (!conversationId) {
      const title = message
        ? message.slice(0, 50) + (message.length > 50 ? '...' : '')
        : 'New Conversation';
      const convRef = userRef.collection('conversations').doc();
      await convRef.set({
        user_id: user.uid,
        title,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      conversationId = convRef.id;
    }

    const conversationRef = userRef.collection('conversations').doc(conversationId);

    // Verify the conversation belongs to this user
    if (convId) {
      const convSnapshot = await conversationRef.get();
      if (!convSnapshot.exists) {
        return new Response('Conversation not found', { status: 404 });
      }
    }

    const settingsSnapshot = await db.collection('aiSettings').doc(user.uid).get();
    const settings = settingsSnapshot.exists ? settingsSnapshot.data() : {};
    const pendingScheduleIntent = conversationId
      ? await getPendingScheduleIntent(conversationRef)
      : null;
    const scheduleIntent = message ? extractScheduleIntent(message) : null;
    const shouldCreateAutomatically =
      settings.autoScheduleEnabled === true || settings.askBeforeCreatingReminder === false;
    let scheduleActionContext = '';

    // Save user message
    await conversationRef.collection('messages').add({
      role: 'user',
      content: message || '[Uploaded file]',
      metadata: uploadIds.length > 0 ? { uploadIds } : {},
      created_at: FieldValue.serverTimestamp(),
    });
    await conversationRef.set({ updated_at: FieldValue.serverTimestamp() }, { merge: true });

    await saveMemoryCandidates(
      db,
      user.uid,
      extractMemoryCandidates(message || '', uploadIds.length > 0 ? 'report' : 'chat')
    );

    if (pendingScheduleIntent && isAffirmativeScheduleConfirmation(message)) {
      await createSchedule(db, user.uid, pendingScheduleIntent);
      const responseText = buildScheduleCreatedText(pendingScheduleIntent, {
        displayName: profile.displayName || profile.full_name || '',
      });

      await conversationRef.collection('messages').add({
        role: 'assistant',
        content: responseText,
        metadata: { scheduleCreated: pendingScheduleIntent },
        created_at: FieldValue.serverTimestamp(),
      });
      await conversationRef.set({ updated_at: FieldValue.serverTimestamp() }, { merge: true });

      return new Response(streamText(responseText), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conversationId,
        },
      });
    }

    if (scheduleIntent && !shouldCreateAutomatically) {
      const responseText = buildScheduleConfirmationText(scheduleIntent, {
        displayName: profile.displayName || profile.full_name || '',
      });

      await conversationRef.collection('messages').add({
        role: 'assistant',
        content: responseText,
        metadata: { pendingScheduleIntent: scheduleIntent },
        created_at: FieldValue.serverTimestamp(),
      });
      await conversationRef.set({ updated_at: FieldValue.serverTimestamp() }, { merge: true });

      return new Response(streamText(responseText), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conversationId,
        },
      });
    }

    if (!scheduleIntent && isScheduleRequestMissingTime(message)) {
      const responseText = buildScheduleNeedsTimeText({
        displayName: profile.displayName || profile.full_name || '',
      });

      await conversationRef.collection('messages').add({
        role: 'assistant',
        content: responseText,
        metadata: { scheduleNeedsTime: true },
        created_at: FieldValue.serverTimestamp(),
      });
      await conversationRef.set({ updated_at: FieldValue.serverTimestamp() }, { merge: true });

      return new Response(streamText(responseText), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-conversation-id': conversationId,
        },
      });
    }

    if (scheduleIntent && shouldCreateAutomatically) {
      await createSchedule(db, user.uid, scheduleIntent);
      scheduleActionContext = `Created schedule "${scheduleIntent.title}" at ${scheduleIntent.displayTime}.`;
    }

    // Build chat history
    const historySnapshot = await conversationRef
      .collection('messages')
      .orderBy('created_at', 'asc')
      .limit(20)
      .get();
    const history = historySnapshot.docs.map((doc) => doc.data());

    // Process uploaded files
    let uploadContext = '';
    const imageParts = [];

    for (const uploadId of uploadIds) {
      const uploadSnapshot = await userRef.collection('uploads').doc(uploadId).get();
      const upload = uploadSnapshot.data();

      if (!upload) continue;

      if (upload.extracted_text) {
        uploadContext += `\n\n--- Uploaded Document: ${upload.file_name} ---\n${upload.extracted_text}\n--- End Document ---`;
      } else if (upload.file_type?.startsWith('image/')) {
        const [fileBuffer] = await getAdminStorage()
          .bucket()
          .file(upload.file_path)
          .download();
        imageParts.push({
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: upload.file_type,
          },
        });
      }
    }

    // Build Gemini content array
    const contents = [];

    if (history.length > 1) {
      for (const msg of history.slice(0, -1)) {
        if (msg.content?.trim()) {
          contents.push({
            role: toGeminiRole(msg.role),
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    const userParts = [...imageParts];
    userParts.push({ text: (message || 'Please analyze this image.') + uploadContext });

    contents.push({
      role: 'user',
      parts: userParts,
    });

    // Build personalized system prompt
    const systemPrompt = getCompanionPrompt({
      displayName: profile.displayName || profile.full_name || '',
      aiCompanionName: profile.aiCompanionName || 'AI Companion',
      age: profile.age || null,
      memories,
      settings,
      scheduleActionContext,
    });

    const model = getGeminiModel(systemPrompt);
    const result = await model.generateContentStream({ contents });

    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }

          // Save AI response
          if (fullResponse) {
            await conversationRef.collection('messages').add({
              role: 'assistant',
              content: fullResponse,
              created_at: FieldValue.serverTimestamp(),
            });
            await conversationRef.set({ updated_at: FieldValue.serverTimestamp() }, { merge: true });
          }

          controller.close();
        } catch (err) {
          logger.error('chat_stream_error', { error: err });
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-conversation-id': conversationId,
      },
    });
  } catch (err) {
    logger.error('chat_route_error', { error: err });
    return new Response('Internal server error', { status: 500 });
  }
}
