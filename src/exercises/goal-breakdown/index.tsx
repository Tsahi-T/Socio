/**
 * Exercise: Goals Breakdown ("תכלס") — every strategic goal expands into an
 * accordion with its purpose, measurable indicators, and key tasks.
 * Entries mirror the strategic-goals items (synced by id, then by text after
 * a TXT import), so goals edited earlier stay linked to their breakdown.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  BreakdownData,
  ExerciseComponentProps,
  ExerciseModule,
  GoalBreakdown,
  Item,
  SerializeContext,
} from '../../engine/types';
import { useSession } from '../../state/SessionContext';
import { EditableList } from '../../ui/EditableList';
import { EmptyState } from '../../ui/EmptyState';
import { ChevronLeftIcon, LightbulbIcon } from '../../ui/icons';
import { sanitizeMultiline, sanitizeText } from '../../lib/sanitize';
import { createId } from '../../lib/id';

/** Mirror goal items into breakdown entries, preserving content by id, then text. */
function syncEntries(goals: Item[], existing: GoalBreakdown[]): GoalBreakdown[] {
  return goals.map((goal) => {
    const match =
      existing.find((e) => e.goalId === goal.id) ?? existing.find((e) => e.goalText === goal.text);
    return {
      goalId: goal.id,
      goalText: goal.text,
      purpose: match?.purpose ?? '',
      measures: match?.measures ?? [],
      tasks: match?.tasks ?? [],
    };
  });
}

function entryHasContent(entry: GoalBreakdown): boolean {
  return entry.purpose.trim().length > 0 || entry.measures.length > 0 || entry.tasks.length > 0;
}

function GoalBreakdownExercise({ data, onChange }: ExerciseComponentProps<BreakdownData>) {
  const { session } = useSession();
  const goalsExercise = session.exercises.find((ex) => ex.data.kind === 'goals');
  const goals = goalsExercise?.data.kind === 'goals' ? goalsExercise.data.items : [];

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(goals[0] ? [goals[0].id] : []));

  // Keep entries mirrored to the strategic goals.
  useEffect(() => {
    const synced = syncEntries(goals, data.entries);
    if (JSON.stringify(synced) !== JSON.stringify(data.entries)) {
      onChange({ ...data, entries: synced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  const updateEntry = (goalId: string, patch: Partial<GoalBreakdown>) => {
    onChange((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.goalId === goalId ? { ...e, ...patch } : e)),
    }));
  };

  const toggle = (goalId: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<LightbulbIcon size={32} />}
        message="אין עדיין יעדים — הגדירו יעדים אסטרטגיים בשלב הקודם"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {data.entries.map((entry, index) => {
        const isOpen = openIds.has(entry.goalId);
        return (
          <section
            key={entry.goalId}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
          >
            {/* Accordion header */}
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(entry.goalId)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-[var(--color-primary-soft)]"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-[var(--color-text-on-primary)]">
                {index + 1}
              </span>
              <span
                dir="auto"
                className="min-w-0 flex-1 break-words font-medium text-[var(--color-text)]"
              >
                {entry.goalText}
              </span>
              {entryHasContent(entry) && (
                <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                  {entry.measures.length} מדדים · {entry.tasks.length} משימות
                </span>
              )}
              <motion.span
                animate={{ rotate: isOpen ? -90 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-[var(--color-text-muted)]"
              >
                <ChevronLeftIcon size={16} />
              </motion.span>
            </button>

            {/* Accordion body */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <div className="flex flex-col gap-5 border-t border-[var(--color-border)] px-4 py-4">
                    <div>
                      <label
                        htmlFor={`purpose-${entry.goalId}`}
                        className="mb-1.5 block text-sm font-bold text-[var(--color-text-secondary)]"
                      >
                        מטרת היעד
                      </label>
                      <textarea
                        id={`purpose-${entry.goalId}`}
                        dir="auto"
                        rows={2}
                        value={entry.purpose}
                        placeholder="מה נרצה להשיג? לשם מה היעד הזה קיים?"
                        onChange={(e) =>
                          updateEntry(entry.goalId, { purpose: sanitizeMultiline(e.target.value) })
                        }
                        className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/25"
                      />
                    </div>

                    <div>
                      <h3 className="mb-1.5 text-sm font-bold text-[var(--color-text-secondary)]">
                        אופני מדידה
                      </h3>
                      <EditableList
                        items={entry.measures}
                        onChange={(measures) => updateEntry(entry.goalId, { measures })}
                        placeholder="כיצד נדע שהצלחנו? — Enter להוספה"
                      />
                    </div>

                    <div>
                      <h3 className="mb-1.5 text-sm font-bold text-[var(--color-text-secondary)]">
                        משימות עיקריות
                      </h3>
                      <EditableList
                        numbered
                        items={entry.tasks}
                        onChange={(tasks) => updateEntry(entry.goalId, { tasks })}
                        placeholder="משימה — Enter להוספה"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------ Serialization ------------------------------ */

function breakdownToTxt(data: BreakdownData, ctx: SerializeContext): string {
  // Serialize against the live goals so un-visited breakdowns still export.
  const goalsExercise = ctx.session.exercises.find((ex) => ex.data.kind === 'goals');
  const goals = goalsExercise?.data.kind === 'goals' ? goalsExercise.data.items : [];
  const entries = syncEntries(goals, data.entries);

  return entries
    .map((entry, i) => {
      const lines = [`Goal ${i + 1}: ${entry.goalText}`];
      lines.push('Purpose:');
      if (entry.purpose.trim()) lines.push(entry.purpose.trim());
      lines.push('Measures:');
      lines.push(entry.measures.map((m) => `* ${m.text}`).join('\n') || '* -');
      lines.push('Tasks:');
      lines.push(entry.tasks.map((t) => `* ${t.text}`).join('\n') || '* -');
      return lines.join('\n');
    })
    .join('\n\n');
}

function breakdownFromTxt(body: string): BreakdownData {
  const entries: GoalBreakdown[] = [];
  let current: GoalBreakdown | null = null;
  let mode: 'purpose' | 'measures' | 'tasks' | null = null;
  const purposeLines: string[] = [];

  const flushPurpose = () => {
    // Assign only while actually capturing a purpose — otherwise a later
    // flush (next Goal line / end of section) would overwrite it with ''.
    if (current && mode === 'purpose') {
      current.purpose = sanitizeMultiline(purposeLines.join('\n').trim());
    }
    purposeLines.length = 0;
  };

  for (const line of body.split('\n')) {
    const goalMatch = /^Goal\s+\d+:\s*(.+)$/i.exec(line);
    if (goalMatch?.[1]) {
      flushPurpose();
      current = {
        goalId: createId(),
        goalText: sanitizeText(goalMatch[1]),
        purpose: '',
        measures: [],
        tasks: [],
      };
      entries.push(current);
      mode = null;
      continue;
    }
    if (!current) continue;
    if (/^Purpose:\s*$/i.test(line)) {
      mode = 'purpose';
      continue;
    }
    if (/^Measures:\s*$/i.test(line)) {
      flushPurpose();
      mode = 'measures';
      continue;
    }
    if (/^Tasks:\s*$/i.test(line)) {
      mode = 'tasks';
      continue;
    }
    const bullet = /^\s*[*-]\s*(.*)$/.exec(line);
    if (mode === 'purpose') {
      purposeLines.push(line);
    } else if ((mode === 'measures' || mode === 'tasks') && bullet) {
      const text = sanitizeText(bullet[1] ?? '');
      if (text && text !== '-') {
        current[mode].push({ id: createId(), text, createdAt: Date.now() });
      }
    }
  }
  flushPurpose();

  return { kind: 'breakdown', entries };
}

export const goalBreakdownModule: ExerciseModule<BreakdownData> = {
  type: 'goal-breakdown',
  Component: GoalBreakdownExercise,
  createInitialData: () => ({ kind: 'breakdown', entries: [] }),
  toTxt: breakdownToTxt,
  fromTxt: breakdownFromTxt,
  isDone: (data) => data.entries.some(entryHasContent),
};
