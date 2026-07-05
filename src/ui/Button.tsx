/**
 * Primary button component — variants share one visual language.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium ' +
  'transition-all duration-150 ease-out select-none ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ' +
  'disabled:opacity-45 disabled:pointer-events-none active:scale-[0.97]';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-md)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-primary-soft)] hover:border-[var(--color-primary)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-soft-text)]',
  danger:
    'bg-transparent text-[var(--color-danger)] border border-transparent hover:bg-[var(--color-danger-soft)]',
};

export function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button type="button" className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  );
}
