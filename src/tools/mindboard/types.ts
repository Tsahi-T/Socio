/**
 * Mind Board domain types — a free-form sticky-notes canvas for facilitators.
 * Independent from the diagnosis session (separate storage, separate export).
 */

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'purple'] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface StickyNote {
  id: string;
  text: string;
  /** Canvas coordinates (px). */
  x: number;
  y: number;
  width: number;
  height: number;
  color: NoteColor;
  /** Small fixed rotation (degrees) for a hand-placed feel. */
  rotation: number;
  createdAt: number;
}

/** A visual link between two notes (mind-map edge). */
export interface Connection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
}

export const BOARD_VERSION = '1.0';

export interface BoardState {
  version: string;
  notes: StickyNote[];
  connections: Connection[];
  updatedAt: number;
}

export const NOTE_MIN_WIDTH = 140;
export const NOTE_MIN_HEIGHT = 110;
export const NOTE_MAX_WIDTH = 420;
export const NOTE_MAX_HEIGHT = 420;
export const NOTE_DEFAULT_WIDTH = 190;
export const NOTE_DEFAULT_HEIGHT = 150;

/** Inner canvas size — large enough to spread out, scrollable in the viewport. */
export const CANVAS_WIDTH = 2400;
export const CANVAS_HEIGHT = 1400;

export function createEmptyBoard(): BoardState {
  return { version: BOARD_VERSION, notes: [], connections: [], updatedAt: Date.now() };
}
