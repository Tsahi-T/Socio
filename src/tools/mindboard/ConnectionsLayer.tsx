/**
 * SVG layer drawing the mind-map connections between note centers,
 * with a small delete button at each line's midpoint.
 */
import type { BoardState } from './types';
import { XIcon } from '../../ui/icons';

interface ConnectionsLayerProps {
  board: BoardState;
  canvasWidth: number;
  canvasHeight: number;
  onDeleteConnection: (id: string) => void;
}

export function ConnectionsLayer({
  board,
  canvasWidth,
  canvasHeight,
  onDeleteConnection,
}: ConnectionsLayerProps) {
  const centerOf = (noteId: string) => {
    const note = board.notes.find((n) => n.id === noteId);
    if (!note) return null;
    return { x: note.x + note.width / 2, y: note.y + note.height / 2 };
  };

  const lines = board.connections
    .map((connection) => {
      const from = centerOf(connection.fromNoteId);
      const to = centerOf(connection.toNoteId);
      return from && to ? { connection, from, to } : null;
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  return (
    <>
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {lines.map(({ connection, from, to }) => (
          <line
            key={connection.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--color-text-muted)"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            opacity="0.6"
          />
        ))}
      </svg>
      {lines.map(({ connection, from, to }) => (
        <button
          key={connection.id}
          type="button"
          aria-label="מחיקת חיבור"
          title="מחיקת חיבור"
          onClick={() => onDeleteConnection(connection.id)}
          className="absolute z-10 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-40 shadow-[var(--shadow-sm)] transition-all duration-150 hover:scale-110 hover:text-[var(--color-danger)] hover:opacity-100"
          style={{ left: (from.x + to.x) / 2, top: (from.y + to.y) / 2 }}
        >
          <XIcon size={10} />
        </button>
      ))}
    </>
  );
}
