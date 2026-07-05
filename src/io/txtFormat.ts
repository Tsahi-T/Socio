/**
 * Shared constants of the TXT project-file format.
 *
 * The file is intentionally structured yet human-readable — the same file
 * feeds language models, people, and the importer (full round-trip):
 *
 *   ====================================
 *
 *   <Section Heading>
 *
 *   <section body>
 *
 *   ====================================
 *
 *   End
 */
export const SEPARATOR = '===================================='; // 36 chars

export const END_MARKER = 'End';

/** A line consisting only of '=' characters (4+) is a section separator. */
export function isSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length >= 4 && /^=+$/.test(trimmed);
}
