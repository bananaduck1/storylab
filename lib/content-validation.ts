const INJECTION_PHRASES = [
  "ignore previous instructions", "ignore all previous", "disregard all previous",
  "you are now", "forget all instructions", "override instructions",
  "new instructions:", "system prompt:",
];

export function hasInjection(t: string): boolean {
  const l = t.toLowerCase();
  return INJECTION_PHRASES.some((p) => l.includes(p));
}

export const MAX_FIELD = 5000;
export const MAX_SHORT_FIELD = 500;
