export function getCompanionMenuLabel(aiCompanionName) {
  const label = String(aiCompanionName || '').trim();
  return label || 'AI Companion';
}
