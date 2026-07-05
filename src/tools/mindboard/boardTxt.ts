/**
 * Mind Board TXT serialization — human/LLM-readable and fully round-trippable.
 * Notes are numbered; connections reference note numbers.
 */
import { createId } from '../../lib/id';
import { sanitizeMultiline } from '../../lib/sanitize';
import { END_MARKER, SEPARATOR, isSeparatorLine } from '../../io/txtFormat';
import {
  BOARD_VERSION,
  NOTE_COLORS,
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
  type BoardState,
  type NoteColor,
  type StickyNote,
} from './types';

export class BoardImportError extends Error {}

const BOARD_HEADING = 'Mind Board';
const CONNECTIONS_HEADING = 'Connections';

export function buildBoardTxt(board: BoardState): string {
  const indexOf = new Map(board.notes.map((note, i) => [note.id, i + 1]));

  const noteSections = board.notes.map((note, i) => {
    const meta = [
      `Note ${i + 1}`,
      `Color: ${note.color}`,
      `Position: ${Math.round(note.x)}, ${Math.round(note.y)}`,
      `Size: ${Math.round(note.width)} x ${Math.round(note.height)}`,
    ].join('\n');
    return `${SEPARATOR}\n\n${meta}\n\n${note.text.trimEnd()}\n`;
  });

  const connectionLines = board.connections
    .map((c) => {
      const from = indexOf.get(c.fromNoteId);
      const to = indexOf.get(c.toNoteId);
      return from && to ? `* ${from} -> ${to}` : null;
    })
    .filter((line): line is string => line !== null);

  const connectionsSection = `${SEPARATOR}\n\n${CONNECTIONS_HEADING}\n\n${connectionLines.join('\n') || '* -'}\n`;

  return [
    `${SEPARATOR}\n\n${BOARD_HEADING}\n`,
    ...noteSections,
    connectionsSection,
    `${SEPARATOR}\n\n${END_MARKER}\n`,
  ].join('\n');
}

/** Parse an exported board TXT back into a BoardState. */
export function parseBoardTxt(text: string): BoardState {
  if (typeof text !== 'string' || !text.includes(BOARD_HEADING)) {
    throw new BoardImportError('Not a Mind Board export file');
  }

  // Split into sections by separator lines.
  const sections: string[][] = [];
  let current: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (isSeparatorLine(line)) {
      if (current.some((l) => l.trim())) sections.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.some((l) => l.trim())) sections.push(current);

  const notes: StickyNote[] = [];
  const numberToId = new Map<number, string>();
  const connections: BoardState['connections'] = [];

  for (const sectionLines of sections) {
    const headingIndex = sectionLines.findIndex((l) => l.trim().length > 0);
    if (headingIndex < 0) continue;
    const heading = (sectionLines[headingIndex] ?? '').trim();
    const rest = sectionLines.slice(headingIndex + 1);

    const noteMatch = /^Note\s+(\d+)$/i.exec(heading);
    if (noteMatch?.[1]) {
      const number = Number(noteMatch[1]);
      let color: NoteColor = 'yellow';
      let x = 40 + (notes.length % 6) * 220;
      let y = 40 + Math.floor(notes.length / 6) * 190;
      let width = NOTE_DEFAULT_WIDTH;
      let height = NOTE_DEFAULT_HEIGHT;
      const textLines: string[] = [];
      let metaDone = false;

      for (const line of rest) {
        const colorMatch = /^Color:\s*(\w+)\s*$/i.exec(line);
        const posMatch = /^Position:\s*(-?\d+)\s*,\s*(-?\d+)\s*$/i.exec(line);
        const sizeMatch = /^Size:\s*(\d+)\s*x\s*(\d+)\s*$/i.exec(line);
        if (!metaDone && colorMatch?.[1] && NOTE_COLORS.includes(colorMatch[1] as NoteColor)) {
          color = colorMatch[1] as NoteColor;
        } else if (!metaDone && posMatch?.[1] && posMatch[2]) {
          x = Number(posMatch[1]);
          y = Number(posMatch[2]);
        } else if (!metaDone && sizeMatch?.[1] && sizeMatch[2]) {
          width = Number(sizeMatch[1]);
          height = Number(sizeMatch[2]);
        } else if (line.trim() === '' && textLines.length === 0) {
          metaDone = true;
        } else {
          metaDone = true;
          textLines.push(line);
        }
      }

      const id = createId();
      numberToId.set(number, id);
      notes.push({
        id,
        text: sanitizeMultiline(textLines.join('\n').trim()),
        x,
        y,
        width,
        height,
        color,
        rotation: Math.round((Math.random() * 5 - 2.5) * 10) / 10,
        createdAt: Date.now(),
      });
      continue;
    }

    if (heading.toLowerCase() === CONNECTIONS_HEADING.toLowerCase()) {
      for (const line of rest) {
        const match = /^\s*[*-]\s*(\d+)\s*->\s*(\d+)\s*$/.exec(line);
        if (match?.[1] && match[2]) {
          const fromNoteId = numberToId.get(Number(match[1]));
          const toNoteId = numberToId.get(Number(match[2]));
          if (fromNoteId && toNoteId) {
            connections.push({ id: createId(), fromNoteId, toNoteId });
          }
        }
      }
    }
  }

  return { version: BOARD_VERSION, notes, connections, updatedAt: Date.now() };
}
