/**
 * format-detector.js
 *
 * Detects whether text content is JSON, JSONL (newline-delimited JSON),
 * or JSONC (JSON with Comments). Uses filename extension first, then
 * falls back to content-based heuristics.
 *
 * Returns one of: 'json', 'jsonl', 'jsonc', 'unknown'
 */

export function detectFormat(text, filename) {
  if (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'jsonl' || ext === 'ndjson') return 'jsonl';
    if (ext === 'jsonc') return 'jsonc';
    // .json files can still be JSONL if content says so
    if (ext === 'json') return detectFromContent(text);
  }
  return detectFromContent(text);
}

/**
 * Content-based detection logic:
 * 1. Starts with [ → JSON array
 * 2. Starts with { → check if there are multiple top-level objects (JSONL)
 *    by tracking brace depth. If content remains after first object closes, it's JSONL.
 * 3. Try parsing as a single JSON value.
 * 4. If that fails, try treating each non-empty line as a separate JSON value.
 * 5. Give up → 'unknown'
 */
function detectFromContent(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'json';

  const firstChar = trimmed[0];

  // JSON array — always treated as a single JSON document
  if (firstChar === '[') {
    return 'json';
  }

  // Could be a single object or multiple objects (JSONL)
  if (firstChar === '{') {
    let braceCount = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braceCount++;
      if (ch === '}') {
        braceCount--;
        // First top-level object closed — if there's more content, it's JSONL
        if (braceCount === 0) {
          const rest = trimmed.slice(i + 1).trim();
          if (rest.length > 0) return 'jsonl';
          return 'json';
        }
      }
    }
    return 'json';
  }

  // Try parsing as a single JSON value (number, string, boolean, etc.)
  try {
    JSON.parse(trimmed);
    return 'json';
  } catch {
    // Last resort: try each line as a separate JSON value
    const lines = trimmed.split('\n');
    if (lines.length > 1) {
      let parsedCount = 0;
      for (const line of lines) {
        const lt = line.trim();
        if (lt.length === 0) continue;
        try { JSON.parse(lt); parsedCount++; } catch { return 'unknown'; }
      }
      if (parsedCount > 0) return 'jsonl';
    }
  }

  return 'unknown';
}
