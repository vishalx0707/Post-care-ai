const TYPE_KEYWORDS = [
  { type: 'medicine', pattern: /\b(medicine|medication|meds|pill|dose|tablet|capsule|take)\b/i },
  { type: 'exercise', pattern: /\b(exercise|workout|walk|walking|stretch|physio|fitness)\b/i },
  { type: 'sleep', pattern: /\b(sleep|bed|bedtime|nap)\b/i },
  { type: 'appointment', pattern: /\b(appointment|doctor|follow-?up|checkup|visit)\b/i },
];

const AFFIRMATIVE_PATTERN = /^(yes|yeah|yep|sure|ok|okay|please|do it|create it|make it|add it)\b/i;
const NEGATIVE_PATTERN = /^(no|nope|nah|not now|cancel|dont|do not)\b/i;
const SCHEDULE_CUE_PATTERN = /\b(remind|reminder|schedules?|scedules?|routine|generate|create|make|add|take|medicine|medication|meds|dose|exercise|workout|walk|walking|sleep|appointment)\b/i;

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function toDisplayTime(hours, minutes) {
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function parseTime(text) {
  const meridiemMatch = text.match(/\b(?:at|by|around|about)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2] || 0);
    const meridiem = meridiemMatch[3].toLowerCase();

    if (hours < 1 || hours > 12 || minutes > 59) return null;
    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    return {
      time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      displayTime: toDisplayTime(hours, minutes),
    };
  }

  const twentyFourHourMatch = text.match(/\b(?:at|by|around|about)\s+([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    return {
      time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      displayTime: toDisplayTime(hours, minutes),
    };
  }

  return null;
}

function inferType(text) {
  const matches = TYPE_KEYWORDS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ type }) => type);

  const unique = [...new Set(matches)];
  if (unique.includes('medicine') && unique.includes('exercise')) return 'custom';
  return unique[0] || 'custom';
}

function inferTitle(text, type) {
  if (type === 'custom' && /\bmedicine|medication|meds|pill|dose\b/i.test(text) && /\bexercise|workout|walk|stretch\b/i.test(text)) {
    return 'Exercise and medicine';
  }

  if (type === 'medicine') return 'Take medicine';
  if (type === 'exercise') return 'Exercise routine';
  if (type === 'sleep') return 'Sleep routine';
  if (type === 'appointment') return 'Health appointment';

  const cleaned = text
    .replace(/\b(?:remind me to|remind me|schedule|create|make|add|at|by|around|about)\b/gi, '')
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCase((cleaned || 'Health reminder').slice(0, 80));
}

function inferFrequency(text) {
  if (/\b(weekly|every week)\b/i.test(text)) return 'weekly';
  if (/\b(monthly|every month)\b/i.test(text)) return 'monthly';
  if (/\b(once|tomorrow|today)\b/i.test(text)) return 'once';
  return 'daily';
}

export function extractScheduleIntent(message = '') {
  const text = String(message).trim();
  if (!text) return null;

  const hasScheduleCue = SCHEDULE_CUE_PATTERN.test(text);
  if (!hasScheduleCue) return null;

  const parsedTime = parseTime(text);
  if (!parsedTime) return null;

  const type = inferType(text);
  return {
    title: inferTitle(text, type),
    type,
    time: parsedTime.time,
    displayTime: parsedTime.displayTime,
    frequency: inferFrequency(text),
    reminderEnabled: true,
    createdBy: 'ai',
  };
}

export function isScheduleRequestMissingTime(message = '') {
  const text = String(message).trim();
  if (!text || !SCHEDULE_CUE_PATTERN.test(text)) return false;
  return !parseTime(text);
}

export function isAffirmativeScheduleConfirmation(message = '') {
  const text = String(message).trim();
  if (!text || NEGATIVE_PATTERN.test(text)) return false;
  return AFFIRMATIVE_PATTERN.test(text);
}

export function buildScheduleConfirmationText(intent, { displayName } = {}) {
  const namePart = displayName ? `, ${displayName}` : '';
  return `Got it${namePart}. Do you want me to make a schedule for ${intent.title} at ${intent.displayTime}?`;
}

export function buildScheduleCreatedText(intent, { displayName } = {}) {
  const namePart = displayName ? `, ${displayName}` : '';
  return `Done${namePart}. I created a ${intent.title} reminder for ${intent.displayTime}.`;
}

export function buildScheduleNeedsTimeText({ displayName } = {}) {
  const namePart = displayName ? `${displayName}, ` : '';
  return `${namePart}I can make that schedule. Tell me the activity and time, like "remind me to take medicine at 8 PM."`;
}
