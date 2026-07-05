/**
 * Friendly empty state shown before any items exist in an exercise.
 */
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-[var(--color-text-muted)]">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}
