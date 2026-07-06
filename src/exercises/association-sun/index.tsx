/**
 * Exercise: Association Sun — an SNA-style network view. The organization
 * sits in a glowing central node; each association word is a node placed on
 * a golden-angle spiral around it, connected by an animated dashed edge.
 * Used twice in the flow with different prompts (organization / customers).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
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

const GOLDEN_ANGLE = (137.508 * Math.PI) / 180;

interface NodePosition {
  x: number;
  y: number;
}

/**
 * Golden-angle spiral layout: evenly spreads nodes around the center,
 * growing outward as the network gets denser. Elliptical to use wide screens.
 */
function layoutNodes(count: number, width: number, height: number): NodePosition[] {
  const cx = width / 2;
  const cy = height / 2;
  const rMinX = Math.min(170, width / 2 - 80);
  const rMinY = 130;
  const rMaxX = Math.max(width / 2 - 90, rMinX + 30);
  const rMaxY = Math.max(height / 2 - 40, rMinY + 20);

  return Array.from({ length: count }, (_, i) => {
    const spread = count > 1 ? Math.pow(i / (count - 1), 0.65) : 0;
    const angle = -Math.PI / 2 + i * GOLDEN_ANGLE;
    return {
      x: cx + Math.cos(angle) * (rMinX + (rMaxX - rMinX) * spread),
      y: cy + Math.sin(angle) * (rMinY + (rMaxY - rMinY) * spread),
    };
  });
}

function AssociationSunExercise({ data, onChange }: ExerciseComponentProps<AssociationsData>) {
  const { session } = useSession();
  const { items } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 500 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const positions = useMemo(
    () => layoutNodes(items.length, size.width, size.height),
    [items.length, size.width, size.height]
  );
  const cx = size.width / 2;
  const cy = size.height / 2;

  const setItems = (next: Item[]) => onChange({ ...data, items: next });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-sm">
        <AddItemInput
          autoFocus
          placeholder="מילה או משפט קצר — Enter להוספה"
          onAdd={(text) => setItems([...items, { id: createId(), text, createdAt: Date.now() }])}
        />
      </div>

      <div ref={containerRef} className="relative h-[500px] w-full select-none overflow-hidden">
        {/* Network edges */}
        <svg
          width={size.width}
          height={size.height}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <AnimatePresence>
            {items.map((item, i) => {
              const pos = positions[i];
              if (!pos) return null;
              return (
                <motion.line
                  key={item.id}
                  className="sna-line"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55, x2: pos.x, y2: pos.y }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
                  x1={cx}
                  y1={cy}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="var(--color-primary)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Central node with pulsing halo */}
        <div className="absolute" style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}>
          <span
            aria-hidden="true"
            className="sna-pulse absolute inset-0 rounded-full bg-[var(--color-primary)]"
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex size-36 items-center justify-center rounded-full bg-[var(--color-primary)] p-4 text-center shadow-[var(--shadow-lg)] sm:size-44"
          >
            <span className="break-words text-lg font-bold leading-snug text-[var(--color-text-on-primary)]">
              {session.organizationName || 'הארגון'}
            </span>
          </motion.div>
        </div>

        {/* Word nodes */}
        <AnimatePresence>
          {items.map((item, i) => {
            const pos = positions[i];
            if (!pos) return null;
            return (
              <motion.div
                key={item.id}
                className="absolute z-10 hover:z-20"
                initial={{ x: cx, y: cy, opacity: 0, scale: 0.4 }}
                animate={{ x: pos.x, y: pos.y, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                style={{ left: 0, top: 0 }}
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <Chip
                    text={item.text}
                    onEdit={(text) =>
                      setItems(items.map((x) => (x.id === item.id ? { ...x, text } : x)))
                    }
                    onDelete={() => setItems(items.filter((x) => x.id !== item.id))}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {items.length === 0 && (
          <p className="absolute inset-x-0 top-6 text-center text-sm text-[var(--color-text-muted)]">
            הוסיפו אסוציאציות — הן יתחברו לרשת סביב הארגון
          </p>
        )}
      </div>

      {items.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">{items.length} אסוציאציות</p>
      )}
    </div>
  );
}

/* ------------------------------ Serialization ------------------------------ */

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
