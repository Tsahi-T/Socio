/**
 * Top-level error boundary — the app never shows a blank screen.
 * Auto-saved data survives in localStorage, so a refresh recovers the session.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">משהו השתבש</h1>
          <p className="text-[var(--color-text-secondary)]">
            הנתונים שלכם שמורים במחשב. רעננו את הדף כדי להמשיך מהנקודה האחרונה.
          </p>
          <button
            type="button"
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 font-medium text-[var(--color-text-on-primary)]"
            onClick={() => window.location.reload()}
          >
            רענון הדף
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
