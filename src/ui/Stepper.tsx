/**
 * Flow stepper — shows all steps, marks the current one, and lets the
 * facilitator jump freely between steps (essential during live workshops).
 */
import { motion } from 'framer-motion';
import { CheckIcon } from './icons';

export interface StepperStep {
  label: string;
  /** A step is "done" when it has content (visual hint only, never blocks). */
  done: boolean;
}

interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function Stepper({ steps, currentIndex, onSelect }: StepperProps) {
  return (
    <nav
      aria-label="שלבי האבחון"
      className="flex items-center justify-center gap-1 overflow-x-auto py-1 sm:gap-2"
    >
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        return (
          <button
            key={step.label}
            type="button"
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => onSelect(index)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm ${
              isCurrent
                ? 'text-[var(--color-text-on-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-soft-text)]'
            }`}
          >
            {isCurrent && (
              <motion.span
                layoutId="stepper-pill"
                className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {step.done && !isCurrent && (
                <CheckIcon size={13} className="text-[var(--color-success)]" />
              )}
              {step.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
