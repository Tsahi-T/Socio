/**
 * Central session state — single reducer over the whole Session object,
 * with built-in undo history and localStorage persistence.
 *
 * The reducer is exercise-agnostic: exercises change their own data through
 * UPDATE_EXERCISE_DATA. This keeps the engine core closed for modification
 * and open for extension (new exercises need no reducer changes).
 */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { ExerciseData, Session } from '../engine/types';
import { SESSION_VERSION } from '../engine/types';
import { FLOW } from '../engine/flow.config';
import { getExerciseModule } from '../engine/registry';
import { createId } from '../lib/id';
import { validateSession } from '../lib/validation';

/* ------------------------------ Creation ------------------------------ */

/** Build a fresh session from the flow config (modules must be registered). */
export function createInitialSession(): Session {
  return {
    version: SESSION_VERSION,
    organizationName: '',
    exercises: FLOW.map((step) => ({
      id: createId(),
      type: step.type,
      title: step.title,
      description: step.description,
      params: step.params ?? {},
      data: getExerciseModule(step.type).createInitialData(step.params ?? {}),
    })),
    currentIndex: 0,
    updatedAt: Date.now(),
  };
}

/* ------------------------------- Actions ------------------------------- */

type SessionAction =
  | { type: 'SET_ORGANIZATION_NAME'; name: string }
  | { type: 'UPDATE_EXERCISE_DATA'; exerciseId: string; data: ExerciseData }
  | { type: 'GO_TO_STEP'; index: number }
  | { type: 'IMPORT_SESSION'; session: Session }
  | { type: 'RESET_SESSION' }
  | { type: 'UNDO' };

/** Actions that modify content (and therefore push an undo snapshot). */
const UNDOABLE = new Set([
  'SET_ORGANIZATION_NAME',
  'UPDATE_EXERCISE_DATA',
  'IMPORT_SESSION',
  'RESET_SESSION',
]);

const MAX_UNDO_DEPTH = 50;

interface HistoryState {
  past: Session[];
  present: Session;
}

function sessionReducer(present: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'SET_ORGANIZATION_NAME':
      return { ...present, organizationName: action.name, updatedAt: Date.now() };
    case 'UPDATE_EXERCISE_DATA':
      return {
        ...present,
        exercises: present.exercises.map((ex) =>
          ex.id === action.exerciseId ? { ...ex, data: action.data } : ex
        ),
        updatedAt: Date.now(),
      };
    case 'GO_TO_STEP': {
      const index = Math.min(Math.max(action.index, 0), present.exercises.length - 1);
      return { ...present, currentIndex: index };
    }
    case 'IMPORT_SESSION':
      return { ...action.session, updatedAt: Date.now() };
    case 'RESET_SESSION':
      return createInitialSession();
    default:
      return present;
  }
}

function historyReducer(state: HistoryState, action: SessionAction): HistoryState {
  if (action.type === 'UNDO') {
    const previous = state.past[state.past.length - 1];
    if (!previous) return state;
    return { past: state.past.slice(0, -1), present: previous };
  }
  const next = sessionReducer(state.present, action);
  if (next === state.present) return state;
  if (!UNDOABLE.has(action.type)) {
    return { ...state, present: next };
  }
  return {
    past: [...state.past, state.present].slice(-MAX_UNDO_DEPTH),
    present: next,
  };
}

/* ------------------------------ Persistence ------------------------------ */

const STORAGE_KEY = 'ods:session:v1';

function loadPersistedSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return validateSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable — the app keeps working in memory.
  }
}

/* -------------------------------- Context -------------------------------- */

export interface SessionContextValue {
  session: Session;
  canUndo: boolean;
  setOrganizationName: (name: string) => void;
  updateExerciseData: (exerciseId: string, data: ExerciseData) => void;
  goToStep: (index: number) => void;
  importSession: (session: Session) => void;
  resetSession: () => void;
  undo: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: loadPersistedSession() ?? createInitialSession(),
  }));

  // Auto-save: debounce writes so rapid typing doesn't hammer localStorage.
  useEffect(() => {
    const timer = setTimeout(() => persistSession(state.present), 400);
    return () => clearTimeout(timer);
  }, [state.present]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session: state.present,
      canUndo: state.past.length > 0,
      setOrganizationName: (name) => dispatch({ type: 'SET_ORGANIZATION_NAME', name }),
      updateExerciseData: (exerciseId, data) =>
        dispatch({ type: 'UPDATE_EXERCISE_DATA', exerciseId, data }),
      goToStep: (index) => dispatch({ type: 'GO_TO_STEP', index }),
      importSession: (session) => dispatch({ type: 'IMPORT_SESSION', session }),
      resetSession: () => dispatch({ type: 'RESET_SESSION' }),
      undo: () => dispatch({ type: 'UNDO' }),
    }),
    [state]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Access the session state and actions. Must be used inside SessionProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
