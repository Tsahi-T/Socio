/**
 * Exercise: Association Sun — the organization name sits in a central circle
 * and association words gather around it as chips. Used twice in the flow
 * with different prompts (organization view / customers view).
 */
import { AnimatePresence, motion } from 'framer-motion';
import type {
  AssociationsData,
  ExerciseComponentProps,
  ExerciseModule,
  Item,
} from '../../engine/types';
import { useSession } from '../../state/SessionContext';
import { AddItemInput } from '../../ui/AddItemInput';
import { Chip } from '../../ui/Chip';
import { createId } from '../../lib/id';
import { sanitizeText } from '../../lib/sanitize';

function AssociationSunExercise({ data, onChange }: ExerciseComponentProps<AssociationsData>) {
  const { session } = useSession();
  const { items } = data;

  const setItems = (next: Item[]) => onChange({ ...data, items: next });

  // Split the cloud so words surround the central circle evenly.
  const midpoint = Math.ceil(items.length / 2);
  const before = items.slice(0, midpoint);
  const after = items.slice(midpoint);

  const renderChip = (item: Item) => (
    <Chip
      key={item.id}
      text={item.text}
      onEdit={(text) => setItems(items.map((i) => (i.id === item.id ? { ...i, text } : i)))}
      onDelete={() => setItems(items.filter((i) => i.id !== item.id))}
    />
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full max-w-sm">
        <AddItemInput
          autoFocus
          placeholder="מילה או משפט קצר — Enter להוספה"
          onAdd={(text) => setItems([...items, { id: createId(), text, createdAt: Date.now() }])}
        />
      </div>

      <div className="flex min-h-72 w-full flex-wrap content-center items-center justify-center gap-2.5 py-4">
        <AnimatePresence initial={false}>
          {before.map(renderChip)}
          <motion.div
            key="sun-center"
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-3 flex size-36 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] p-4 text-center shadow-[var(--shadow-lg)] sm:size-44"
          >
            <span className="break-words text-lg font-bold leading-snug text-[var(--color-text-on-primary)]">
              {session.organizationName || 'הארגון'}
            </span>
          </motion.div>
          {after.map(renderChip)}
        </AnimatePresence>
      </div>

      {items.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">{items.length} אסוציאציות</p>
      )}
    </div>
  );
}

/** Serialize items as "* text" bullet lines (human/LLM friendly). */
function itemsToTxt(items: Item[]): string {
  return items.map((item) => `* ${item.text}`).join('\n');
}

/** Parse "* text" / "- text" bullet lines back into items. */
export function itemsFromTxt(body: string): Item[] {
  return body
    .split('\n')
    .map((line) => line.replace(/^\s*[*-]\s*/, ''))
    .map((line) => sanitizeText(line))
    .filter((text) => text.length > 0)
    .map((text) => ({ id: createId(), text, createdAt: Date.now() }));
}

export const associationSunModule: ExerciseModule<AssociationsData> = {
  type: 'association-sun',
  Component: AssociationSunExercise,
  createInitialData: () => ({ kind: 'associations', items: [] }),
  toTxt: (data) => itemsToTxt(data.items),
  fromTxt: (body) => ({ kind: 'associations', items: itemsFromTxt(body) }),
  isDone: (data) => data.items.length > 0,
};
