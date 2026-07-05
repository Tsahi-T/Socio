/**
 * Surface card — the basic container of the visual language.
 */
import type { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
