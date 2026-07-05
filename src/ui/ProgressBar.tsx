/**
 * Animated progress bar for the diagnosis flow.
 */
import { motion } from 'framer-motion';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]"
    >
      <motion.div
        className="h-full rounded-full bg-[var(--color-primary)]"
        initial={false}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    </div>
  );
}
