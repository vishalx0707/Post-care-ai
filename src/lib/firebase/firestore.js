import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from './client';

export function userDoc(userId) {
  return doc(getFirebaseDb(), 'users', userId);
}

export function conversationsCollection(userId) {
  return collection(getFirebaseDb(), 'users', userId, 'conversations');
}

export function conversationDoc(userId, conversationId) {
  return doc(getFirebaseDb(), 'users', userId, 'conversations', conversationId);
}

export function messagesCollection(userId, conversationId) {
  return collection(
    getFirebaseDb(),
    'users',
    userId,
    'conversations',
    conversationId,
    'messages'
  );
}

export async function ensureUserProfile(user, profile = {}) {
  await setDoc(
    userDoc(user.uid),
    {
      email: user.email || profile.email || '',
      full_name: profile.fullName || profile.full_name || '',
      onboarding_completed: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...profile,
    },
    { merge: true }
  );
}

export async function getOnboardingCompleted(userId) {
  const snapshot = await getDoc(userDoc(userId));
  return Boolean(snapshot.data()?.onboarding_completed);
}

export async function updateOnboarding(userId, ageGroup) {
  await updateDoc(userDoc(userId), {
    age_group: ageGroup,
    onboarding_completed: true,
    updated_at: serverTimestamp(),
  });
}

export async function listConversations(userId) {
  const snapshot = await getDocs(
    query(conversationsCollection(userId), orderBy('updated_at', 'desc'))
  );

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

export async function deleteConversation(userId, conversationId) {
  await deleteDoc(conversationDoc(userId, conversationId));
}

export async function listMessages(userId, conversationId) {
  const snapshot = await getDocs(
    query(messagesCollection(userId, conversationId), orderBy('created_at', 'asc'), limit(100))
  );

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

export async function createConversation(userId, title = 'New Conversation') {
  const ref = await addDoc(conversationsCollection(userId), {
    user_id: userId,
    title,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return ref.id;
}
