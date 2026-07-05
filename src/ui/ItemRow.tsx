/**
 * A single list item row: inline edit, delete, optional drag handle
 * and optional ordinal number. Shared by EditableList and the SWOT columns.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PencilIcon, TrashIcon } from './icons';
import { IconButton } from './IconButton';
import { sanitizeText } from '../lib/sanitize';
import { STRINGS } from '../i18n/strings';

interface ItemRowProps {
  text: string;
  ordinal?: number;
  /** Drag handle element rendered at the row start (provided by dnd wrapper). */
  handle?: ReactNode;
  /** Extra element rendered at the row end (e.g. vote controls). */
  trailing?: ReactNode;
  onEdit: (next: string) => void;
  onDelete: () => void;
}

export function ItemRow({ text, ordinal, handle, trailing, onEdit, onDelete }: ItemRowProps) {
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
    <div className="group flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 shadow-[var(--shadow-sm)] transition-shadow duration-150 hover:shadow-[var(--shadow-md)]">
      {handle}
      {ordinal !== undefined && (
        <span className="w-6 shrink-0 text-center text-sm font-bold text-[var(--color-primary)]">
          {ordinal}
        </span>
      )}
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
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-text)] focus:outline-none"
        />
      ) : (
        <span dir="auto" className="min-w-0 flex-1 break-words text-sm text-[var(--color-text)]">
          {text}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
        <IconButton label={STRINGS.actions.edit} onClick={() => setEditing(true)}>
          <PencilIcon size={15} />
        </IconButton>
        <IconButton label={STRINGS.actions.delete} tone="danger" onClick={onDelete}>
          <TrashIcon size={15} />
        </IconButton>
      </div>
      {trailing}
    </div>
  );
}
