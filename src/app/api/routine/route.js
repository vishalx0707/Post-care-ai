import { getAuthenticatedUser, unauthorizedJson } from '@/lib/firebase/server-auth';
import { FieldValue, getAdminDb } from '@/lib/firebase/admin';
import { getRoutinePrompt } from '@/lib/ai-prompt';
import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import logger from '@/lib/logger';

export const maxDuration = 30;

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return unauthorizedJson();
    }

    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(user.uid);
    const profileSnapshot = await userRef.get();
    const profile = profileSnapshot.data() || {};
    const conversationRef = userRef.collection('conversations').doc(conversationId);
    const conversationSnapshot = await conversationRef.get();

    if (!conversationSnapshot.exists) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify conversation belongs to this user
    const convData = conversationSnapshot.data();
    if (convData?.user_id && convData.user_id !== user.uid) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messagesSnapshot = await conversationRef
      .collection('messages')
      .orderBy('created_at', 'asc')
      .limit(20)
      .get();

    const messages = messagesSnapshot.docs.map((doc) => doc.data());

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No conversation context found' }, { status: 400 });
    }

    const contextSummary = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const model = getGeminiModel(getRoutinePrompt(profile.age_group));
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Based on this health conversation, generate a personalized recovery routine:\n\n${contextSummary}` }],
        },
      ],
    });

    const responseText = result.response.text();

    let routineData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        routineData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseErr) {
      logger.warn('routine_parse_error', { error: parseErr });
      return NextResponse.json({ error: 'Failed to generate routine. Please try again.' }, { status: 500 });
    }

    // Validate and sanitize the parsed routine structure
    const sanitizedSchedule = {
      daily: Array.isArray(routineData.schedule?.daily)
        ? routineData.schedule.daily.map((item) => ({
            time: String(item.time || '').slice(0, 20),
            activity: String(item.activity || '').slice(0, 500),
            notes: String(item.notes || '').slice(0, 500),
          }))
        : [],
      weekly: Array.isArray(routineData.schedule?.weekly)
        ? routineData.schedule.weekly.map((item) => ({
            day: String(item.day || '').slice(0, 20),
            activity: String(item.activity || '').slice(0, 500),
            notes: String(item.notes || '').slice(0, 500),
          }))
        : [],
      reminders: Array.isArray(routineData.schedule?.reminders)
        ? routineData.schedule.reminders.map((r) => String(r).slice(0, 500))
        : [],
    };

    const routineRef = userRef.collection('routines').doc();
    const routine = {
      id: routineRef.id,
      user_id: user.uid,
      conversation_id: conversationId,
      title: String(routineData.title || 'Recovery Routine').slice(0, 200),
      schedule: sanitizedSchedule,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await routineRef.set(routine);

    return NextResponse.json(routine);
  } catch (err) {
    logger.error('routine_route_error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
