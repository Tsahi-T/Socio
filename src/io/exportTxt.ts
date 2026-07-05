/**
 * Session → TXT serialization. Each exercise contributes its section through
 * its module's toTxt(); the flow-step id doubles as the section heading, so
 * the engine stays fully exercise-agnostic.
 */
import type { SerializeContext, Session } from '../engine/types';
import { FLOW } from '../engine/flow.config';
import { getExerciseModule } from '../engine/registry';
import { END_MARKER, SEPARATOR } from './txtFormat';

export function buildTxt(session: Session): string {
  const ctx: SerializeContext = {
    organizationName: session.organizationName,
    session,
  };

  const sections = session.exercises.map((exercise, index) => {
    const heading = FLOW[index]?.id ?? exercise.title;
    const body = getExerciseModule(exercise.type).toTxt(exercise.data, ctx).trimEnd();
    return `${SEPARATOR}\n\n${heading}\n\n${body}\n`;
  });

  return [...sections, `${SEPARATOR}\n\n${END_MARKER}\n`].join('\n');
}

/** Trigger a client-side download of the given text as a UTF-8 TXT file. */
export function downloadTxt(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Safe, descriptive filename: diagnosis-<org>-<yyyy-mm-dd>.txt */
export function exportFilename(organizationName: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const org = organizationName.trim().replace(/[\\/:*?"<>|\s]+/g, '-') || 'session';
  return `diagnosis-${org}-${date}.txt`;
}
