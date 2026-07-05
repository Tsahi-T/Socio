/**
 * Exercise: SWOT — classic 2x2 board. Items can be added to, edited in,
 * and dragged between the four quadrants.
 *
 * Drag strategy: during a drag we mutate a local mirror of the board (smooth
 * visuals, no state spam); the final layout is committed once on drag end,
 * producing a single undo entry.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
  ExerciseComponentProps,
  ExerciseModule,
  Item,
  SwotData,
  SwotQuadrant,
} from '../../engine/types';
import { AddItemInput } from '../../ui/AddItemInput';
import { ItemRow } from '../../ui/ItemRow';
import { GripIcon } from '../../ui/icons';
import { createId } from '../../lib/id';
import { itemsFromTxt } from '../association-sun';

const QUADRANTS: { key: SwotQuadrant; title: string; heading: string; accent: string }[] = [
  { key: 'strengths', title: 'חוזקות', heading: 'Strengths', accent: 'var(--color-success)' },
  { key: 'weaknesses', title: 'חולשות', heading: 'Weaknesses', accent: 'var(--color-danger)' },
  {
    key: 'opportunities',
    title: 'הזדמנויות',
    heading: 'Opportunities',
    accent: 'var(--color-primary)',
  },
  { key: 'threats', title: 'איומים', heading: 'Threats', accent: 'var(--color-warning)' },
];

function findQuadrant(board: SwotData, id: string): SwotQuadrant | null {
  for (const { key } of QUADRANTS) {
    if (board[key].some((item) => item.id === id)) return key;
  }
  return null;
}

function SortableSwotRow({
  item,
  onEdit,
  onDelete,
}: {
  item: Item;
  onEdit: (text: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'z-10 opacity-60' : ''}
    >
      <ItemRow
        text={item.text}
        onEdit={onEdit}
        onDelete={onDelete}
        handle={
          <button
            type="button"
            aria-label="גרירה בין רבעים"
            className="shrink-0 cursor-grab touch-none text-[var(--color-text-muted)] active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripIcon size={16} />
          </button>
        }
      />
    </motion.li>
  );
}

function SwotColumn({
  quadrant,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  quadrant: (typeof QUADRANTS)[number];
  items: Item[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.key });
  return (
    <section
      ref={setNodeRef}
      aria-label={quadrant.title}
      className={`flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition-colors duration-150 ${
        isOver ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
      }`}
      style={{ borderTopWidth: 3, borderTopColor: quadrant.accent }}
    >
      <h2 className="text-sm font-bold" style={{ color: quadrant.accent }}>
        {quadrant.title}
        <span className="ms-2 font-normal text-[var(--color-text-muted)]">{items.length}</span>
      </h2>
      <AddItemInput placeholder="הוספת פריט..." onAdd={onAdd} />
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-16 flex-col gap-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <SortableSwotRow
                key={item.id}
                item={item}
                onEdit={(text) => onEdit(item.id, text)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </section>
  );
}

function SwotExercise({ data, onChange }: ExerciseComponentProps<SwotData>) {
  const [board, setBoard] = useState<SwotData>(data);
  const draggingRef = useRef(false);

  // Keep the local mirror in sync while not dragging.
  useEffect(() => {
    if (!draggingRef.current) setBoard(data);
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const moveItem = (
    current: SwotData,
    id: string,
    target: SwotQuadrant,
    overId?: string
  ): SwotData => {
    const source = findQuadrant(current, id);
    if (!source) return current;
    const item = current[source].find((i) => i.id === id);
    if (!item) return current;
    const withoutItem = { ...current, [source]: current[source].filter((i) => i.id !== id) };
    const targetItems = [...withoutItem[target]];
    const overIndex = overId ? targetItems.findIndex((i) => i.id === overId) : -1;
    if (overIndex >= 0) targetItems.splice(overIndex, 0, item);
    else targetItems.push(item);
    return { ...withoutItem, [target]: targetItems };
  };

  const handleDragOver = (event: DragOverEvent) => {
    draggingRef.current = true;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const targetQuadrant = QUADRANTS.some((q) => q.key === overId)
      ? (overId as SwotQuadrant)
      : findQuadrant(board, overId);
    if (!targetQuadrant) return;
    if (findQuadrant(board, activeId) === targetQuadrant && activeId !== overId) {
      // Same-column reorder handled on drag end; only cross-column moves here.
      return;
    }
    if (findQuadrant(board, activeId) !== targetQuadrant) {
      setBoard((current) =>
        moveItem(current, activeId, targetQuadrant, overId !== targetQuadrant ? overId : undefined)
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    let next = board;
    if (over) {
      const activeId = String(active.id);
      const overId = String(over.id);
      const targetQuadrant = QUADRANTS.some((q) => q.key === overId)
        ? (overId as SwotQuadrant)
        : findQuadrant(board, overId);
      if (targetQuadrant && activeId !== overId) {
        next = moveItem(
          board,
          activeId,
          targetQuadrant,
          overId !== targetQuadrant ? overId : undefined
        );
      }
    }
    draggingRef.current = false;
    setBoard(next);
    onChange(next); // single undo entry per drag
  };

  const updateQuadrant = (key: SwotQuadrant, items: Item[]) => onChange({ ...data, [key]: items });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {QUADRANTS.map((quadrant) => (
          <SwotColumn
            key={quadrant.key}
            quadrant={quadrant}
            items={board[quadrant.key]}
            onAdd={(text) =>
              updateQuadrant(quadrant.key, [
                ...data[quadrant.key],
                { id: createId(), text, createdAt: Date.now() },
              ])
            }
            onEdit={(id, text) =>
              updateQuadrant(
                quadrant.key,
                data[quadrant.key].map((i) => (i.id === id ? { ...i, text } : i))
              )
            }
            onDelete={(id) =>
              updateQuadrant(
                quadrant.key,
                data[quadrant.key].filter((i) => i.id !== id)
              )
            }
          />
        ))}
      </div>
    </DndContext>
  );
}

/* ------------------------------ Serialization ------------------------------ */

function swotToTxt(data: SwotData): string {
  return QUADRANTS.map(
    ({ key, heading }) =>
      `${heading}\n${data[key].map((item) => `* ${item.text}`).join('\n') || '* -'}`
  ).join('\n\n');
}

function swotFromTxt(body: string): SwotData {
  const result: SwotData = {
    kind: 'swot',
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };
  let currentKey: SwotQuadrant | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (currentKey) {
      result[currentKey] = itemsFromTxt(buffer.join('\n')).filter((i) => i.text !== '-');
    }
    buffer = [];
  };
  for (const line of body.split('\n')) {
    const heading = QUADRANTS.find((q) => q.heading.toLowerCase() === line.trim().toLowerCase());
    if (heading) {
      flush();
      currentKey = heading.key;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return result;
}

export const swotModule: ExerciseModule<SwotData> = {
  type: 'swot',
  Component: SwotExercise,
  createInitialData: () => ({
    kind: 'swot',
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  }),
  toTxt: swotToTxt,
  fromTxt: swotFromTxt,
  isDone: (data) => QUADRANTS.some(({ key }) => data[key].length > 0),
};
