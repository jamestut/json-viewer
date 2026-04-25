/**
 * parser.js
 *
 * Combined format detection and parsing. Instead of detecting the format first
 * and then parsing separately, this module does both in one pass and returns a
 * result object with the parsed data ready to use.
 *
 * Detection relies entirely on JSON.parse — no file extension checks, no custom
 * brace-tracking. The browser's native JSON parser is fast and correct, so we
 * lean on it rather than reimplementing parsing logic.
 *
 * Detection order matters:
 *
 *  1. JSONL — Try parsing each non-empty line as JSON. If ALL lines parse and
 *     there are 2+ results, it's JSONL. Short-circuits on the first line that
 *     fails, so pretty-printed JSON (where the first line is just `{`) is cheap.
 *
 *  2. JSON  — Try parsing the whole text as a single JSON value. Covers normal
 *     JSON (objects, arrays, primitives) and single-line JSONL files (a single
 *     valid JSON line is better shown as a tree, so it falls through here).
 *
 *  3. JSONC — Strip // and /* * / comments (via jsonc-parser.js), then try
 *     parsing as JSON. This is a last resort because we only want to strip
 *     comments if normal parsing failed.
 *
 *  4. Error — Nothing worked. The caller should display an error to the user.
 *
 * Return types:
 *   { type: 'json',  data: <parsed value> }
 *   { type: 'jsonl', data: [{ text: <raw line>, data: <parsed line> }, ...] }
 *   { type: 'jsonc', data: <parsed value> }
 *   { type: 'error', message: <human-readable string> }
 */

import { stripJsonc } from './jsonc-parser.js';

/**
 * Parse raw text content, auto-detecting its format.
 *
 * @param {string} text - Raw file content (from File API, drag-and-drop, or paste)
 * @returns {{ type: 'json', data: * } | { type: 'jsonl', data: {text: string, data: *}[] } | { type: 'jsonc', data: * } | { type: 'error', message: string }}
 */
export function parseContent(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { type: 'json', data: null };
  }

  // Step 1: JSONL detection.
  // Split into lines and try to parse each one. If every non-empty line is
  // valid JSON and we got more than 1 result, treat it as JSONL.
  const lines = trimmed.split('\n');
  if (lines.length > 1) {
    const parsed = [];
    for (const line of lines) {
      const lt = line.trim();
      if (lt.length === 0) continue;
      try {
        parsed.push({ text: lt, data: JSON.parse(lt) });
      } catch {
        parsed.length = 0;
        break;
      }
    }
    if (parsed.length > 1) {
      return { type: 'jsonl', data: parsed };
    }
    if (parsed.length === 1) {
      // a single line JSONL is a normal JSON
      return { type: 'json', data: parsed[0].data };
    }
  }

  // Step 2: Standard JSON.
  try {
    return { type: 'json', data: JSON.parse(trimmed) };
  } catch {
    // not valid JSON, try JSONC below
  }

  // Step 3: JSONC (JSON with Comments).
  try {
    const cleaned = stripJsonc(trimmed);
    return { type: 'jsonc', data: JSON.parse(cleaned) };
  } catch {
    // not valid JSONC either
  }

  // Step 4: Give up.
  return { type: 'error', message: 'Unable to parse content as JSON, JSONL, or JSONC.' };
}
