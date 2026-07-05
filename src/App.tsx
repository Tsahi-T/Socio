/**
 * App root — providers + mode routing.
 * The diagnosis flow renders only when all configured exercises are
 * registered (exercises self-register in exercises/index.ts).
 */
import './exercises'; // side-effect: registers all exercise modules
import { useState } from 'react';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { ToastProvider, useToast } from './ui/Toast';
import { SessionProvider } from './state/SessionContext';
import { AppShell, type AppMode } from './shell/AppShell';
import { DiagnosisFlow } from './shell/DiagnosisFlow';
import { FLOW } from './engine/flow.config';
import { isExerciseRegistered } from './engine/registry';
import { EmptyState } from './ui/EmptyState';
import { LightbulbIcon } from './ui/icons';

function AppContent() {
  const [mode, setMode] = useState<AppMode>('diagnosis');
  const { show } = useToast();

  return (
    <AppShell
      mode={mode}
      onModeChange={setMode}
      onExport={() => show('הייצוא יחובר בשלב הבא', 'info')}
      onImportFile={() => show('הטעינה תחובר בשלב הבא', 'info')}
    >
      {mode === 'diagnosis' ? (
        <DiagnosisFlow />
      ) : (
        <EmptyState icon={<LightbulbIcon size={32} />} message="לוח החשיבה יתווסף בקרוב" />
      )}
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
