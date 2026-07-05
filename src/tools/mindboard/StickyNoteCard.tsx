/**
 * A single sticky note: draggable (top strip), resizable (corner handle),
 * editable in place, recolorable, connectable, deletable.
 */
import { useRef, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '../../ui/icons';
import { sanitizeMultiline } from '../../lib/sanitize';
import {
  NOTE_COLORS,
  NOTE_MAX_HEIGHT,
  NOTE_MAX_WIDTH,
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
  type NoteColor,
  type StickyNote,
} from './types';

const COLOR_VAR: Record<NoteColor, string> = {
  yellow: 'var(--note-yellow)',
  pink: 'var(--note-pink)',
  blue: 'var(--note-blue)',
  green: 'var(--note-green)',
  purple: 'var(--note-purple)',
};

interface StickyNoteCardProps {
  note: StickyNote;
  isConnectSource: boolean;
  connectMode: boolean;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onText: (id: string, text: string) => void;
  onColor: (id: string, color: NoteColor) => void;
  onDelete: (id: string) => void;
  onConnectClick: (id: string) => void;
}

export function StickyNoteCard({
  note,
  isConnectSource,
  connectMode,
  onMove,
  onResize,
  onText,
  onColor,
  onDelete,
  onConnectClick,
}: StickyNoteCardProps) {
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(
    null
  );
  const resizeStart = useRef<{
    pointerX: number;
    pointerY: number;
    width: number;
    height: number;
  } | null>(null);

  const handleDragPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (connectMode) {
      onConnectClick(note.id);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { pointerX: e.clientX, pointerY: e.clientY, x: note.x, y: note.y };
  };

  const handleDragPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.pointerX;
    const dy = e.clientY - dragStart.current.pointerY;
    // RTL layout: visual X still maps 1:1 to left-based canvas coordinates.
    onMove(note.id, dragStart.current.x + dx, dragStart.current.y + dy);
  };

  const endDrag = () => {
    dragStart.current = null;
  };

  const handleResizePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStart.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      width: note.width,
      height: note.height,
    };
  };

  const handleResizePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!resizeStart.current) return;
    // Handle sits at the visual bottom-left (RTL end); dragging left grows width.
    const dx = resizeStart.current.pointerX - e.clientX;
    const dy = e.clientY - resizeStart.current.pointerY;
    onResize(
      note.id,
      Math.min(Math.max(resizeStart.current.width + dx, NOTE_MIN_WIDTH), NOTE_MAX_WIDTH),
      Math.min(Math.max(resizeStart.current.height + dy, NOTE_MIN_HEIGHT), NOTE_MAX_HEIGHT)
    );
  };

  const endResize = () => {
    resizeStart.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, rotate: note.rotation }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group absolute flex flex-col rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-lg)] ${
        isConnectSource ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''
      } ${connectMode ? 'cursor-crosshair' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: COLOR_VAR[note.color],
      }}
    >
      {/* Drag strip + actions */}
      <div
        className={`flex h-8 shrink-0 items-center justify-between rounded-t-[var(--radius-sm)] px-2 ${
          connectMode ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`צבע ${color}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onColor(note.id, color)}
              className={`size-3.5 rounded-full border transition-transform duration-150 hover:scale-125 ${
                note.color === color ? 'border-[var(--color-text)]' : 'border-black/20'
              }`}
              style={{ backgroundColor: COLOR_VAR[color] }}
            />
          ))}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            aria-label="חיבור לפתק אחר"
            title="חיבור לפתק אחר"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onConnectClick(note.id)}
            className="rounded p-1 text-[var(--color-text)]/60 transition-colors hover:bg-black/10 hover:text-[var(--color-text)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M9 12h6M8 8a4 4 0 0 0 0 8h2M16 8a4 4 0 0 1 0 8h-2" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="מחיקת פתק"
            title="מחיקת פתק"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(note.id)}
            className="rounded p-1 text-[var(--color-text)]/60 transition-colors hover:bg-black/10 hover:text-[var(--color-danger)]"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* Editable text */}
      <textarea
        dir="auto"
        value={note.text}
        placeholder="כתבו כאן..."
        onChange={(e) => onText(note.id, sanitizeMultiline(e.target.value))}
        onPointerDown={(e) => e.stopPropagation()}
        className="min-h-0 flex-1 resize-none bg-transparent px-3 pb-3 text-sm leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text)]/35 focus:outline-none"
      />

      {/* Resize handle — visual bottom-left corner */}
      <div
        role="separator"
        aria-label="שינוי גודל"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        className="absolute bottom-1 left-1 size-4 cursor-sw-resize rounded-sm opacity-0 transition-opacity duration-150 group-hover:opacity-60"
      >
        <svg viewBox="0 0 16 16" className="size-full text-[var(--color-text)]" aria-hidden="true">
          <path d="M10 14 2 6M14 10 6 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </motion.div>
  );
}
