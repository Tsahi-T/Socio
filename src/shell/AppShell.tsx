/**
 * Application shell: sticky header with mode tabs (diagnosis / tools),
 * global actions (undo, export, import, reset, theme) and the content area.
 */
import { useRef, useState, type ReactNode } from 'react';
import { useSession } from '../state/SessionContext';
import { useTheme } from '../state/useTheme';
import { IconButton } from '../ui/IconButton';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import {
  DownloadIcon,
  MoonIcon,
  RefreshIcon,
  SunIcon,
  UndoIcon,
  UploadIcon,
} from '../ui/icons';
import { STRINGS } from '../i18n/strings';

export type AppMode = 'diagnosis' | 'tools';

interface AppShellProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  /** Export the current mode's content to a TXT file (wired in io stage). */
  onExport?: () => void;
  /** Import a TXT file; receives the raw file text. */
  onImportFile?: (text: string) => void;
  children: ReactNode;
}

export function AppShell({ mode, onModeChange, onExport, onImportFile, children }: AppShellProps) {
  const { canUndo, undo, resetSession } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { show } = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = async (file: File | undefined) => {
    if (!file || !onImportFile) return;
    try {
      const text = await file.text();
      onImportFile(text);
    } catch {
      show(STRINGS.feedback.importError, 'error');
    }
  };

  const modeTab = (value: AppMode, label: string) => (
    <button
      type="button"
      onClick={() => onModeChange(value)}
      aria-pressed={mode === value}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
        mode === value
          ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-sm)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="shrink-0 text-base font-bold text-[var(--color-text)] sm:text-lg">
            {STRINGS.appTitle}
          </h1>

          <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
            {modeTab('diagnosis', STRINGS.modes.diagnosis)}
            {modeTab('tools', STRINGS.modes.tools)}
          </div>

          <div className="flex items-center gap-0.5">
            <IconButton label={STRINGS.nav.undo} onClick={undo} disabled={!canUndo}>
              <UndoIcon />
            </IconButton>
            <IconButton label={STRINGS.actions.export} onClick={onExport}>
              <DownloadIcon />
            </IconButton>
            <IconButton label={STRINGS.actions.import} onClick={() => fileRef.current?.click()}>
              <UploadIcon />
            </IconButton>
            <IconButton label={STRINGS.actions.reset} tone="danger" onClick={() => setConfirmReset(true)}>
              <RefreshIcon />
            </IconButton>
            <IconButton
              label={theme === 'light' ? STRINGS.theme.toggleDark : STRINGS.theme.toggleLight}
              onClick={toggleTheme}
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </IconButton>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <input
        ref={fileRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={(e) => {
          void handleFileChosen(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title={STRINGS.confirmations.resetTitle}
        body={STRINGS.confirmations.resetBody}
        danger
        confirmLabel={STRINGS.actions.reset}
        onConfirm={() => {
          resetSession();
          setConfirmReset(false);
          show(STRINGS.feedback.deleted, 'info');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
