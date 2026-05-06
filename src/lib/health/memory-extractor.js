function normalizeSentence(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .trim()
    .slice(0, 300);
}

function normalizeTimeDisplay(rawTime) {
  const value = String(rawTime || '');
  const match = value.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const twentyFourHourMatch = value.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match && !twentyFourHourMatch) return rawTime;

  let hours = Number(match ? match[1] : twentyFourHourMatch[1]);
  const minutes = Number((match ? match[2] : twentyFourHourMatch[2]) || 0);
  const meridiem = match?.[3]?.toLowerCase();

  if (meridiem === 'pm' && hours !== 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function addCandidate(candidates, memoryType, value, source, confidence = 0.72) {
  const cleanValue = normalizeSentence(value);
  if (!cleanValue) return;

  candidates.push({
    memoryType,
    value: cleanValue,
    source,
    confidence,
  });
}

export function extractMemoryCandidates(message = '', source = 'chat') {
  const text = String(message || '');
  if (!text.trim()) return [];

  const candidates = [];

  for (const match of text.matchAll(/\b(?:i take|i am taking|i'm taking|my medicine is|my medication is)\s+([^.!?]+)/gi)) {
    addCandidate(candidates, 'medicine', match[1], source, 0.82);
  }

  for (const match of text.matchAll(/\b(?:i usually sleep at|i sleep at|sleep at|go to bed at|bedtime is)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi)) {
    addCandidate(candidates, 'sleep', `Sleeps at ${normalizeTimeDisplay(match[1])}`, source, 0.78);
  }

  for (const match of text.matchAll(/\b(?:i prefer|i like|i want)\s+([^.!?]+)/gi)) {
    addCandidate(candidates, 'preference', match[1], source, 0.65);
  }

  for (const match of text.matchAll(/\b(?:my goal is|my health goal is|goal is|i want to)\s+([^.!?]+)/gi)) {
    addCandidate(candidates, 'goal', match[1], source, 0.7);
  }

  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.memoryType}:${candidate.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildProfileMemoryCandidates(profile = {}, source = 'settings') {
  const candidates = [];

  if (profile.sleepTime) {
    addCandidate(candidates, 'sleep', `Sleeps at ${normalizeTimeDisplay(profile.sleepTime)}`, source, 0.9);
  }

  for (const medicine of profile.medicineRoutines || []) {
    addCandidate(candidates, 'medicine', medicine, source, 0.86);
  }

  for (const fitness of profile.fitnessRoutines || []) {
    addCandidate(candidates, 'fitness', fitness, source, 0.82);
  }

  for (const goal of profile.healthGoals || []) {
    addCandidate(candidates, 'goal', goal, source, 0.82);
  }

  return candidates;
}
