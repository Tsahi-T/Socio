/**
 * Mind Board state — reducer + localStorage persistence, mirroring the
 * session-state pattern but fully independent of the diagnosis flow.
 */
import { useEffect, useReducer } from 'react';
import { createId } from '../../lib/id';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  NOTE_COLORS,
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
  NOTE_MAX_HEIGHT,
  NOTE_MAX_WIDTH,
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
  createEmptyBoard,
  type BoardState,
  type Connection,
  type NoteColor,
  type StickyNote,
} from './types';

const STORAGE_KEY = 'ods:board:v1';

type BoardAction =
  | { type: 'ADD_NOTE'; x: number; y: number; color: NoteColor }
  | { type: 'UPDATE_NOTE'; id: string; patch: Partial<Omit<StickyNote, 'id'>> }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'ADD_CONNECTION'; fromNoteId: string; toNoteId: string }
  | { type: 'DELETE_CONNECTION'; id: string }
  | { type: 'IMPORT_BOARD'; board: BoardState }
  | { type: 'CLEAR_BOARD' };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'ADD_NOTE': {
      const note: StickyNote = {
        id: createId(),
        text: '',
        x: clamp(action.x, 0, CANVAS_WIDTH - NOTE_DEFAULT_WIDTH),
        y: clamp(action.y, 0, CANVAS_HEIGHT - NOTE_DEFAULT_HEIGHT),
        width: NOTE_DEFAULT_WIDTH,
        height: NOTE_DEFAULT_HEIGHT,
        color: action.color,
        rotation: Math.round((Math.random() * 5 - 2.5) * 10) / 10,
        createdAt: Date.now(),
      };
      return { ...state, notes: [...state.notes, note], updatedAt: Date.now() };
    }
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((note) => {
          if (note.id !== action.id) return note;
          const patched = { ...note, ...action.patch };
          return {
            ...patched,
            x: clamp(patched.x, 0, CANVAS_WIDTH - patched.width),
            y: clamp(patched.y, 0, CANVAS_HEIGHT - patched.height),
            width: clamp(patched.width, NOTE_MIN_WIDTH, NOTE_MAX_WIDTH),
            height: clamp(patched.height, NOTE_MIN_HEIGHT, NOTE_MAX_HEIGHT),
          };
        }),
        updatedAt: Date.now(),
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.id),
        connections: state.connections.filter(
          (c) => c.fromNoteId !== action.id && c.toNoteId !== action.id
        ),
        updatedAt: Date.now(),
      };
    case 'ADD_CONNECTION': {
      if (action.fromNoteId === action.toNoteId) return state;
      const exists = state.connections.some(
        (c) =>
          (c.fromNoteId === action.fromNoteId && c.toNoteId === action.toNoteId) ||
          (c.fromNoteId === action.toNoteId && c.toNoteId === action.fromNoteId)
      );
      if (exists) return state;
      const connection: Connection = {
        id: createId(),
        fromNoteId: action.fromNoteId,
        toNoteId: action.toNoteId,
      };
      return { ...state, connections: [...state.connections, connection], updatedAt: Date.now() };
    }
    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.id),
        updatedAt: Date.now(),
      };
    case 'IMPORT_BOARD':
      return { ...action.board, updatedAt: Date.now() };
    case 'CLEAR_BOARD':
      return createEmptyBoard();
    default:
      return state;
  }
}

function isValidBoard(value: unknown): value is BoardState {
  if (typeof value !== 'object' || value === null) return false;
  const board = value as Record<string, unknown>;
  return (
    typeof board.version === 'string' &&
    Array.isArray(board.notes) &&
    Array.isArray(board.connections) &&
    (board.notes as unknown[]).every((n) => {
      const note = n as Record<string, unknown>;
      return (
        typeof note.id === 'string' &&
        typeof note.text === 'string' &&
        typeof note.x === 'number' &&
        typeof note.y === 'number' &&
        typeof note.width === 'number' &&
        typeof note.height === 'number' &&
        NOTE_COLORS.includes(note.color as NoteColor)
      );
    })
  );
}

function loadPersistedBoard(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidBoard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function useMindBoard() {
  const [board, dispatch] = useReducer(
    boardReducer,
    undefined,
    () => loadPersistedBoard() ?? createEmptyBoard()
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
      } catch {
        // Storage unavailable — board keeps working in memory.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [board]);

  return { board, dispatch };
}

export type BoardDispatch = ReturnType<typeof useMindBoard>['dispatch'];
