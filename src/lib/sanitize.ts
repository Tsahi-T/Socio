/**
 * Input sanitization.
 * React already escapes rendered text (XSS-safe by default); this layer
 * normalizes user input: strips control characters, trims, caps length.
 */

/** Maximum length for any single user-entered text item. */
export const MAX_TEXT_LENGTH = 500;

const TAB = 9;
const NEWLINE = 10;
const SPACE = 32;
const DEL = 127;

/** Remove ASCII control characters. Tab is always dropped; newline is optional. */
function stripControlChars(input: string, keepNewlines: boolean): string {
  let result = '';
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    const isControl = (code < SPACE && code !== TAB && code !== NEWLINE) || code === DEL;
    if (isControl) continue;
    if (code === NEWLINE && !keepNewlines) {
      result += ' ';
      continue;
    }
    if (code === TAB) {
      result += ' ';
      continue;
    }
    result += char;
  }
  return result;
}

/** Sanitize a single-line text input (item text, organization name). */
export function sanitizeText(raw: string): string {
  return stripControlChars(raw, false).replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
}

/** Sanitize multiline text (sticky notes) — preserves line breaks. */
export function sanitizeMultiline(raw: string): string {
  return stripControlChars(raw.replace(/\r\n/g, '\n'), true)
    .slice(0, MAX_TEXT_LENGTH * 4)
    .trimEnd();
}
