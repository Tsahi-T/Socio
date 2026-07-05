/**
 * TXT → Session parsing (the round-trip back).
 * Defensive: unknown sections are ignored, missing sections fall back to
 * empty exercises, and anything unrecognizable throws a friendly error the
 * UI turns into a clear message (never a crash).
 */
import type { Session } from '../engine/types';
import { SESSION_VERSION } from '../engine/types';
import { FLOW } from '../engine/flow.config';
import { getExerciseModule } from '../engine/registry';
import { createId } from '../lib/id';
import { validateSession } from '../lib/validation';
import { END_MARKER, isSeparatorLine } from './txtFormat';

export class TxtImportError extends Error {}

interface RawSection {
  heading: string;
  body: string;
}

/** Split file text into { heading, body } sections by separator lines. */
function splitSections(text: string): RawSection[] {
  const sections: RawSection[] = [];
  let currentLines: string[] = [];

  const flush = () => {
    const nonEmptyIndex = currentLines.findIndex((line) => line.trim().length > 0);
    if (nonEmptyIndex >= 0) {
      const heading = currentLines[nonEmptyIndex]?.trim() ?? '';
      const body = currentLines
        .slice(nonEmptyIndex + 1)
        .join('\n')
        .trim();
      sections.push({ heading, body });
    }
    currentLines = [];
  };

  for (const line of text.split(/\r?\n/)) {
    if (isSeparatorLine(line)) flush();
    else currentLines.push(line);
  }
  flush();
  return sections;
}

/**
 * Parse an exported TXT file back into a full Session.
 * @throws TxtImportError when the file doesn't look like a valid export.
 */
export function parseTxt(text: string): Session {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new TxtImportError('Empty file');
  }

  const sections = splitSections(text).filter(
    (section) => section.heading.toLowerCase() !== END_MARKER.toLowerCase()
  );

  const findSection = (flowId: string): RawSection | undefined =>
    sections.find((section) => section.heading.toLowerCase() === flowId.toLowerCase());

  // The file must contain at least one recognizable section.
  if (!FLOW.some((step) => findSection(step.id))) {
    throw new TxtImportError('No recognizable sections found');
  }

  const exercises = FLOW.map((step) => {
    const module = getExerciseModule(step.type);
    const section = findSection(step.id);
    const params = step.params ?? {};
    const data = section ? module.fromTxt(section.body, params) : module.createInitialData(params);
    return {
      id: createId(),
      type: step.type,
      title: step.title,
      description: step.description,
      params,
      data,
    };
  });

  const organizationExercise = exercises.find((ex) => ex.data.kind === 'organization');
  const organizationName =
    organizationExercise?.data.kind === 'organization' ? organizationExercise.data.name : '';

  const session: Session = {
    version: SESSION_VERSION,
    organizationName,
    exercises,
    currentIndex: 0,
    updatedAt: Date.now(),
  };

  const validated = validateSession(session);
  if (!validated) {
    throw new TxtImportError('Parsed content failed validation');
  }
  return validated;
}
