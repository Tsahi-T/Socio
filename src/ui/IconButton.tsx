/**
 * Small icon-only button. `label` is required for accessibility
 * (aria-label + native tooltip).
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

export function IconButton({ label, children, tone = 'default', className = '', ...rest }: IconButtonProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]'
      : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-all duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${toneClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
