import { createHash } from 'crypto';
import { FieldValue } from '@/lib/firebase/admin';

function memoryId(userId, memory) {
  const hash = createHash('sha1')
    .update(`${userId}:${memory.memoryType}:${String(memory.value).toLowerCase()}`)
    .digest('hex')
    .slice(0, 24);
  return `${userId}_${hash}`;
}

export async function saveMemoryCandidates(db, userId, candidates = []) {
  const validCandidates = candidates.filter((memory) => memory?.memoryType && memory?.value);
  if (validCandidates.length === 0) return;

  const batch = db.batch();
  for (const memory of validCandidates.slice(0, 8)) {
    const ref = db.collection('memories').doc(memoryId(userId, memory));
    batch.set(
      ref,
      {
        userId,
        memoryType: memory.memoryType,
        value: String(memory.value).slice(0, 500),
        source: memory.source || 'chat',
        confidence: Number(memory.confidence || 0.7),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
}
