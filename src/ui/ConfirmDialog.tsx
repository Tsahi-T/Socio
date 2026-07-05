/**
 * Confirmation dialog for destructive actions (reset, import-overwrite).
 * Rendered as an accessible modal with backdrop; Escape/backdrop closes.
 */
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { STRINGS } from '../i18n/strings';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = STRINGS.actions.confirm,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
            {body && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{body}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onCancel}>
                {STRINGS.actions.cancel}
              </Button>
              <Button
                autoFocus
                variant={danger ? 'danger' : 'primary'}
                className={danger ? 'border-[var(--color-danger)]' : ''}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
