/**
 * Exercise: Strategic Goals — the facilitator phrases strategic goals while
 * the voted focus topics stay visible in a side panel (goals usually grow
 * out of the topics). Each topic offers one-click "add as goal".
 */
import { motion } from 'framer-motion';
import type {
  ExerciseComponentProps,
  ExerciseModule,
  GoalsData,
  VoteOption,
} from '../../engine/types';
import { useSession } from '../../state/SessionContext';
import { EditableList } from '../../ui/EditableList';
import { Card } from '../../ui/Card';
import { IconButton } from '../../ui/IconButton';
import { PlusIcon } from '../../ui/icons';
import { createId } from '../../lib/id';
import { itemsFromTxt } from '../association-sun';

function StrategicGoalsExercise({ data, onChange }: ExerciseComponentProps<GoalsData>) {
  const { session } = useSession();

  // Voted topics, highest first — the natural raw material for goals.
  const votingExercise = session.exercises.find((ex) => ex.data.kind === 'voting');
  const topics: VoteOption[] =
    votingExercise?.data.kind === 'voting'
      ? [...votingExercise.data.options].sort((a, b) => b.votes - a.votes)
      : [];

  const addGoal = (text: string) => {
    if (data.items.some((item) => item.text === text)) return;
    onChange({ ...data, items: [...data.items, { id: createId(), text, createdAt: Date.now() }] });
  };

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 items-start gap-6 md:grid-cols-[1fr_260px]">
      <div>
        <EditableList
          numbered
          items={data.items}
          onChange={(items) => onChange({ ...data, items })}
          placeholder="נסחו יעד אסטרטגי — Enter להוספה"
        />
      </div>

      <motion.aside
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
        aria-label="נושאי המיקוד שנבחרו"
      >
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text-secondary)]">
            נושאי המיקוד שנבחרו
          </h2>
          {topics.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              עדיין אין נושאים — חזרו לשלבי הנושאים וההצבעה.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {topics.map((topic) => (
                <li
                  key={topic.id}
                  className="group flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-[var(--color-primary-soft)]"
                >
                  <span
                    className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${
                      topic.votes > 0
                        ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]'
                        : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {topic.votes}
                  </span>
                  <span
                    dir="auto"
                    className="min-w-0 flex-1 break-words text-xs text-[var(--color-text)]"
                  >
                    {topic.text}
                  </span>
                  <IconButton
                    label="הוספה כיעד"
                    onClick={() => addGoal(topic.text)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <PlusIcon size={13} />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.aside>
    </div>
  );
}

export const strategicGoalsModule: ExerciseModule<GoalsData> = {
  type: 'strategic-goals',
  Component: StrategicGoalsExercise,
  createInitialData: () => ({ kind: 'goals', items: [] }),
  toTxt: (data) => data.items.map((item, i) => `${i + 1}. ${item.text}`).join('\n'),
  fromTxt: (body) => ({
    kind: 'goals',
    items: itemsFromTxt(body.replace(/^\s*\d+\.\s*/gm, '* ')),
  }),
  isDone: (data) => data.items.length > 0,
};
