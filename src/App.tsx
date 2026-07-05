/**
 * App root — providers + mode routing + export/import wiring.
 * The diagnosis flow renders only when all configured exercises are
 * registered (exercises self-register in exercises/index.ts).
 */
import './exercises'; // side-effect: registers all exercise modules
import { useState } from 'react';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { ToastProvider, useToast } from './ui/Toast';
import { SessionProvider, useSession } from './state/SessionContext';
import { AppShell, type AppMode } from './shell/AppShell';
import { DiagnosisFlow } from './shell/DiagnosisFlow';
import { FLOW } from './engine/flow.config';
import { isExerciseRegistered } from './engine/registry';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { MindBoard } from './tools/mindboard/MindBoard';
import { buildTxt, downloadTxt, exportFilename } from './io/exportTxt';
import { parseTxt } from './io/importTxt';
import type { Session } from './engine/types';
import { STRINGS } from './i18n/strings';

// Dev-only console hook for verifying the TXT round-trips; stripped from builds.
if (import.meta.env.DEV) {
  void Promise.all([
    import('./io/exportTxt'),
    import('./io/importTxt'),
    import('./tools/mindboard/boardTxt'),
  ]).then(([exportIo, importIo, boardIo]) => {
    (window as unknown as Record<string, unknown>).__odsDebug = {
      buildTxt: exportIo.buildTxt,
      parseTxt: importIo.parseTxt,
      buildBoardTxt: boardIo.buildBoardTxt,
      parseBoardTxt: boardIo.parseBoardTxt,
    };
  });
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>('diagnosis');
  const { session, importSession } = useSession();
  const { show } = useToast();
  const [pendingImport, setPendingImport] = useState<Session | null>(null);

  const handleExport = () => {
    downloadTxt(buildTxt(session), exportFilename(session.organizationName));
    show(STRINGS.feedback.exported, 'success');
  };

  const handleImportFile = (text: string) => {
    try {
      setPendingImport(parseTxt(text));
    } catch {
      show(STRINGS.feedback.importError, 'error');
    }
  };

  return (
    <AppShell
      mode={mode}
      onModeChange={setMode}
      onExport={handleExport}
      onImportFile={handleImportFile}
    >
      {mode === 'diagnosis' ? <DiagnosisFlow /> : <MindBoard />}

      <ConfirmDialog
        open={pendingImport !== null}
        title={STRINGS.confirmations.importTitle}
        body={STRINGS.confirmations.importBody}
        confirmLabel={STRINGS.actions.import}
        onConfirm={() => {
          if (pendingImport) importSession(pendingImport);
          setPendingImport(null);
          show(STRINGS.feedback.imported, 'success');
        }}
        onCancel={() => setPendingImport(null)}
      />
    </AppShell>
  );
}

export default function App() {
  // Render the flow only once every configured exercise type is registered
  // (during staged development some modules may not exist yet).
  if (!FLOW.every((step) => isExerciseRegistered(step.type))) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">סטודיו אבחון ארגוני — בבנייה</h1>
      </main>
    );
  }
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
