/**
 * jsonc-parser.js
 *
 * Strips // and /* *​/ comments from JSONC (JSON with Comments) strings,
 * producing valid JSON that can be parsed with JSON.parse().
 *
 * Uses a character-by-character state machine that respects string boundaries
 * so comments inside strings are preserved. Newlines inside block comments are
 * preserved to keep line numbers accurate in error messages.
 */

export function stripJsonc(text) {
  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    // Double-quoted string — copy verbatim, skip escaped chars
    if (ch === '"') {
      const start = i;
      i++;
      while (i < len && text[i] !== '"') {
        if (text[i] === '\\') {
          i++;
        }
        i++;
      }
      if (i < len) i++;
      result += text.slice(start, i);
      continue;
    }

    // Comment detection: only when '/' is not inside a string
    if (ch === '/' && i + 1 < len) {
      // Line comment (//)
      if (text[i + 1] === '/') {
        while (i < len && text[i] !== '\n') {
          i++;
        }
        result += ' '; // replace with space to avoid joining adjacent tokens
        continue;
      }
      // Block comment (/* */)
      if (text[i + 1] === '*') {
        i += 2;
        while (i < len && !(text[i] === '*' && i + 1 < len && text[i + 1] === '/')) {
          if (text[i] === '\n') result += '\n'; // preserve newlines for line-number accuracy
          i++;
        }
        if (i < len) i += 2;
        result += ' ';
        continue;
      }
    }

    result += ch;
    i++;
  }

  return result;
}

/** Strip comments then parse as standard JSON. */
export function parseJsonc(text) {
  const cleaned = stripJsonc(text);
  return JSON.parse(cleaned);
}
