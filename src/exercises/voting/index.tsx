/**
 * Exercise: Voting — facilitator-driven voting from a single screen.
 * Each participant picks exactly three topics; the facilitator enters the
 * picks, presses "next participant", and repeats. Topics stay sorted by
 * votes (animated), so results emerge live.
 *
 * Options mirror the focus-topics items (synced by id, then by text after
 * a TXT import); votes survive topic edits.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  ExerciseComponentProps,
  ExerciseModule,
  Item,
  SerializeContext,
  VoteOption,
  VotingData,
} from '../../engine/types';
import { useSession } from '../../state/SessionContext';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { EmptyState } from '../../ui/EmptyState';
import { CheckIcon, LightbulbIcon, PlusIcon } from '../../ui/icons';
import { sanitizeText } from '../../lib/sanitize';
import { createId } from '../../lib/id';

const VOTES_PER_PARTICIPANT = 3;

/** Mirror focus items into vote options, preserving votes by id, then text. */
function syncOptions(focusItems: Item[], existing: VoteOption[]): VoteOption[] {
  return focusItems.map((item) => {
    const match =
      existing.find((o) => o.id === item.id) ?? existing.find((o) => o.text === item.text);
    return { id: item.id, text: item.text, votes: match?.votes ?? 0 };
  });
}

function VotingExercise({ data, onChange }: ExerciseComponentProps<VotingData>) {
  const { session } = useSession();
  const focusExercise = session.exercises.find((ex) => ex.data.kind === 'focus');
  const focusItems = focusExercise?.data.kind === 'focus' ? focusExercise.data.items : [];

  // Current participant's picks — ephemeral by design (not part of the session).
  // A ref mirror keeps the 3-vote limit airtight even for same-tick rapid clicks.
  const [picks, setPicks] = useState<Record<string, number>>({});
  const picksRef = useRef(picks);
  const usedVotes = Object.values(picks).reduce((sum, n) => sum + n, 0);

  // Keep options mirrored to the focus topics.
  useEffect(() => {
    const synced = syncOptions(focusItems, data.options);
    if (JSON.stringify(synced) !== JSON.stringify(data.options)) {
      onChange({ ...data, options: synced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusItems]);

  const sorted = useMemo(() => [...data.options].sort((a, b) => b.votes - a.votes), [data.options]);

  const changeVote = (id: string, delta: 1 | -1) => {
    const current = picksRef.current;
    const used = Object.values(current).reduce((sum, n) => sum + n, 0);
    if (delta === 1 && used >= VOTES_PER_PARTICIPANT) return;
    if (delta === -1 && !(current[id] ?? 0)) return; // only undo current participant's picks
    picksRef.current = { ...current, [id]: Math.max((current[id] ?? 0) + delta, 0) };
    setPicks(picksRef.current);
    // Functional update: rapid clicks must build on the latest state.
    onChange((prev) => ({
      ...prev,
      options: prev.options.map((o) =>
        o.id === id && o.votes + delta >= 0 ? { ...o, votes: o.votes + delta } : o
      ),
    }));
  };

  const nextParticipant = () => {
    picksRef.current = {};
    setPicks({});
  };

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<LightbulbIcon size={32} />}
        message="אין עדיין נושאים להצבעה — הוסיפו נושאים בשלב הקודם"
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-3">
        <span className="text-sm font-medium text-[var(--color-primary-soft-text)]">
          המשתתף הנוכחי בחר {usedVotes} מתוך {VOTES_PER_PARTICIPANT}
        </span>
        <Button
          variant="secondary"
          icon={<CheckIcon size={15} />}
          disabled={usedVotes === 0}
          onClick={nextParticipant}
        >
          משתתף הבא
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {sorted.map((option, index) => {
            const picked = (picks[option.id] ?? 0) > 0;
            return (
              <motion.li
                key={option.id}
                layout
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)] transition-colors duration-150 ${
                  picked ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'
                }`}
              >
                <span className="w-6 shrink-0 text-center text-sm font-bold text-[var(--color-text-muted)]">
                  {index + 1}
                </span>
                <span
                  dir="auto"
                  className="min-w-0 flex-1 break-words text-sm text-[var(--color-text)]"
                >
                  {option.text}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <IconButton
                    label="הסרת קול"
                    onClick={() => changeVote(option.id, -1)}
                    disabled={!picks[option.id]}
                    className="disabled:pointer-events-none disabled:opacity-30"
                  >
                    <span className="block w-3 text-center text-lg leading-none">−</span>
                  </IconButton>
                  <motion.span
                    key={option.votes}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`min-w-9 rounded-full px-2 py-1 text-center text-sm font-bold ${
                      option.votes > 0
                        ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]'
                        : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {option.votes}
                  </motion.span>
                  <IconButton
                    label="הוספת קול"
                    onClick={() => changeVote(option.id, 1)}
                    disabled={usedVotes >= VOTES_PER_PARTICIPANT}
                    className="disabled:pointer-events-none disabled:opacity-30"
                  >
                    <PlusIcon size={16} />
                  </IconButton>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/* ------------------------------ Serialization ------------------------------ */

function votingToTxt(data: VotingData, ctx: SerializeContext): string {
  // Prefer the live focus topics so an un-visited voting screen still exports.
  const focusExercise = ctx.session.exercises.find((ex) => ex.data.kind === 'focus');
  const focusItems = focusExercise?.data.kind === 'focus' ? focusExercise.data.items : [];
  const options = syncOptions(focusItems, data.options);
  return [...options]
    .sort((a, b) => b.votes - a.votes)
    .map((option, i) => `${i + 1}. ${option.text}\n   Votes: ${option.votes}`)
    .join('\n');
}

function votingFromTxt(body: string): VotingData {
  const options: VoteOption[] = [];
  for (const line of body.split('\n')) {
    const topicMatch = /^\s*\d+\.\s*(.+)$/.exec(line);
    const votesMatch = /^\s*Votes:\s*(\d+)\s*$/i.exec(line);
    if (topicMatch?.[1]) {
      const text = sanitizeText(topicMatch[1]);
      if (text) options.push({ id: createId(), text, votes: 0 });
    } else if (votesMatch?.[1] && options.length > 0) {
      const last = options[options.length - 1];
      if (last) last.votes = Number(votesMatch[1]);
    }
  }
  return { kind: 'voting', options, votesPerParticipant: VOTES_PER_PARTICIPANT };
}

export const votingModule: ExerciseModule<VotingData> = {
  type: 'voting',
  Component: VotingExercise,
  createInitialData: () => ({
    kind: 'voting',
    options: [],
    votesPerParticipant: VOTES_PER_PARTICIPANT,
  }),
  toTxt: votingToTxt,
  fromTxt: votingFromTxt,
  isDone: (data) => data.options.some((o) => o.votes > 0),
};
