/**
 * Sortable editable list — add, edit, delete, drag to reorder.
 * Self-contained DndContext (vertical). Used by focus-topics; SWOT builds
 * its own cross-column dnd from the same ItemRow.
 */
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item } from '../engine/types';
import { createId } from '../lib/id';
import { ItemRow } from './ItemRow';
import { AddItemInput } from './AddItemInput';
import { GripIcon } from './icons';

interface EditableListProps {
  items: Item[];
  onChange: (items: Item[]) => void;
  placeholder: string;
  numbered?: boolean;
}

function SortableRow({
  item,
  ordinal,
  onEdit,
  onDelete,
}: {
  item: Item;
  ordinal?: number;
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
      className={isDragging ? 'z-10 opacity-70' : ''}
    >
      <ItemRow
        text={item.text}
        ordinal={ordinal}
        onEdit={onEdit}
        onDelete={onDelete}
        handle={
          <button
            type="button"
            aria-label="גרירה לשינוי סדר"
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

export function EditableList({
  items,
  onChange,
  placeholder,
  numbered = false,
}: EditableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(items, from, to));
  };

  return (
    <div className="flex flex-col gap-3">
      <AddItemInput
        placeholder={placeholder}
        onAdd={(text) => onChange([...items, { id: createId(), text, createdAt: Date.now() }])}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  ordinal={numbered ? index + 1 : undefined}
                  onEdit={(text) =>
                    onChange(items.map((i) => (i.id === item.id ? { ...i, text } : i)))
                  }
                  onDelete={() => onChange(items.filter((i) => i.id !== item.id))}
                />
              ))}
            </AnimatePresence>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
