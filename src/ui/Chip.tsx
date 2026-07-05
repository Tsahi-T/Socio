/**
 * Editable chip — a single association word/phrase.
 * Click the text to edit inline; small × deletes.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from './icons';
import { sanitizeText } from '../lib/sanitize';

interface ChipProps {
  text: string;
  onEdit: (next: string) => void;
  onDelete: () => void;
}

export function Chip({ text, onEdit, onDelete }: ChipProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const clean = sanitizeText(draft);
    if (clean && clean !== text) onEdit(clean);
    setDraft(clean || text);
    setEditing(false);
  };

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pe-2 ps-3 text-sm shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
    >
      {editing ? (
        <input
          ref={inputRef}
          dir="auto"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(text);
              setEditing(false);
            }
          }}
          className="w-24 bg-transparent text-sm focus:outline-none"
        />
      ) : (
        <button
          type="button"
          title="לחיצה לעריכה"
          onClick={() => setEditing(true)}
          className="cursor-text text-[var(--color-text)]"
        >
          {text}
        </button>
      )}
      <button
        type="button"
        aria-label={`מחיקת "${text}"`}
        onClick={onDelete}
        className="rounded-full p-0.5 text-[var(--color-text-muted)] opacity-0 transition-all duration-150 hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover:opacity-100"
      >
        <XIcon size={13} />
      </button>
    </motion.span>
  );
}
