/**
 * Exercise: Focus Topics — the facilitator collects candidate focus areas,
 * one sentence per row. Reorderable, editable, numbered.
 */
import type { ExerciseComponentProps, ExerciseModule, FocusData } from '../../engine/types';
import { EditableList } from '../../ui/EditableList';
import { itemsFromTxt } from '../association-sun';

function FocusTopicsExercise({ data, onChange }: ExerciseComponentProps<FocusData>) {
  return (
    <div className="mx-auto max-w-xl">
      <EditableList
        numbered
        items={data.items}
        onChange={(items) => onChange({ ...data, items })}
        placeholder="לדוגמה: לשפר תקשורת, להקטין עומסים — Enter להוספה"
      />
    </div>
  );
}

export const focusTopicsModule: ExerciseModule<FocusData> = {
  type: 'focus-topics',
  Component: FocusTopicsExercise,
  createInitialData: () => ({ kind: 'focus', items: [] }),
  toTxt: (data) => data.items.map((item, i) => `${i + 1}. ${item.text}`).join('\n'),
  fromTxt: (body) => ({
    kind: 'focus',
    // Accept both "1. text" numbered lines and plain bullets.
    items: itemsFromTxt(body.replace(/^\s*\d+\.\s*/gm, '* ')),
  }),
  isDone: (data) => data.items.length > 0,
};
