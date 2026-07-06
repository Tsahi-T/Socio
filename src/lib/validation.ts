/**
 * Structural validation for data restored from localStorage or imported files.
 * Defensive by design: anything malformed yields null (caller falls back to a
 * fresh session) instead of crashing the app.
 */
import type { Exercise, ExerciseData, Item, Session } from '../engine/types';
import { FLOW } from '../engine/flow.config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isItem(value: unknown): value is Item {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.createdAt === 'number'
  );
}

function isItemArray(value: unknown): value is Item[] {
  return Array.isArray(value) && value.every(isItem);
}

function isExerciseData(value: unknown): value is ExerciseData {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case 'organization':
      return typeof value.name === 'string';
    case 'associations':
      return isItemArray(value.items);
    case 'swot':
      return (
        isItemArray(value.strengths) &&
        isItemArray(value.weaknesses) &&
        isItemArray(value.opportunities) &&
        isItemArray(value.threats)
      );
    case 'focus':
      return isItemArray(value.items);
    case 'voting':
      return (
        Array.isArray(value.options) &&
        value.options.every(
          (o: unknown) =>
            isRecord(o) &&
            typeof o.id === 'string' &&
            typeof o.text === 'string' &&
            typeof o.votes === 'number' &&
            o.votes >= 0
        ) &&
        typeof value.votesPerParticipant === 'number'
      );
    case 'goals':
      return isItemArray(value.items);
    case 'breakdown':
      return (
        Array.isArray(value.entries) &&
        value.entries.every(
          (e: unknown) =>
            isRecord(e) &&
            typeof e.goalId === 'string' &&
            typeof e.goalText === 'string' &&
            typeof e.purpose === 'string' &&
            isItemArray(e.measures) &&
            isItemArray(e.tasks)
        )
      );
    default:
      return false;
  }
}

/** Validate a single exercise-data value (used by session salvage). */
export function validateExerciseData(value: unknown): value is ExerciseData {
  return isExerciseData(value);
}

function isExercise(value: unknown): value is Exercise {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    isRecord(value.params) &&
    isExerciseData(value.data)
  );
}

/**
 * Validate a candidate session object. Returns the typed session when the
 * structure matches the current flow, otherwise null.
 */
export function validateSession(value: unknown): Session | null {
  if (!isRecord(value)) return null;
  if (typeof value.version !== 'string') return null;
  if (typeof value.organizationName !== 'string') return null;
  if (typeof value.currentIndex !== 'number') return null;
  if (typeof value.updatedAt !== 'number') return null;
  if (!Array.isArray(value.exercises)) return null;
  if (value.exercises.length !== FLOW.length) return null;
  if (!value.exercises.every(isExercise)) return null;

  const session = value as unknown as Session;
  // Exercise types must line up with the configured flow.
  const typesMatch = session.exercises.every((ex, i) => ex.type === FLOW[i]?.type);
  if (!typesMatch) return null;

  const boundedIndex = Math.min(Math.max(session.currentIndex, 0), FLOW.length - 1);
  return { ...session, currentIndex: boundedIndex };
}
