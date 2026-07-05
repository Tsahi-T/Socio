/**
 * Unique ID generation for items, exercises, and notes.
 * Uses crypto.randomUUID when available (all modern browsers).
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for very old environments
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
