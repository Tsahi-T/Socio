/**
 * The diagnosis flow screen: stepper + progress + the current exercise,
 * rendered dynamically through the exercise registry.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { FLOW } from '../engine/flow.config';
import { getExerciseModule } from '../engine/registry';
import { useSession } from '../state/SessionContext';
import { Stepper } from '../ui/Stepper';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';
import { STRINGS } from '../i18n/strings';

export function DiagnosisFlow() {
  const { session, goToStep, updateExerciseData } = useSession();
  const { exercises, currentIndex } = session;
  const exercise = exercises[currentIndex];
  if (!exercise) return null;

  const module = getExerciseModule(exercise.type);
  const ExerciseComponent = module.Component;

  const steps = exercises.map((ex, i) => ({
    label: FLOW[i]?.navLabel ?? ex.title,
    done: getExerciseModule(ex.type).isDone(ex.data),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pb-16 pt-4">
      <Stepper steps={steps} currentIndex={currentIndex} onSelect={goToStep} />
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]">
          {STRINGS.nav.stepOf(currentIndex + 1, exercises.length)}
        </span>
        <ProgressBar progress={(currentIndex + 1) / exercises.length} />
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={exercise.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          aria-label={exercise.title}
        >
          <header className="mb-6 mt-2 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              {exercise.title}
            </h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">{exercise.description}</p>
          </header>
          <ExerciseComponent
            exercise={exercise}
            data={exercise.data}
            onChange={(next) => updateExerciseData(exercise.id, next)}
          />
        </motion.section>
      </AnimatePresence>

      <footer className="mt-8 flex items-center justify-between">
        <Button
          variant="secondary"
          icon={<ChevronRightIcon size={16} />}
          disabled={currentIndex === 0}
          onClick={() => goToStep(currentIndex - 1)}
        >
          {STRINGS.nav.back}
        </Button>
        <Button
          disabled={currentIndex === exercises.length - 1}
          onClick={() => goToStep(currentIndex + 1)}
        >
          {STRINGS.nav.next}
          <ChevronLeftIcon size={16} />
        </Button>
      </footer>
    </div>
  );
}
