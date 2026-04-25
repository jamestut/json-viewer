/**
 * detail-view.js
 *
 * Manages the right pane: a readonly <textarea> that displays the value
 * of the currently selected tree node, plus a path breadcrumb, copy button,
 * and word-wrap toggle.
 *
 * Uses a native <textarea> (not <pre>) so users get free text selection,
 * cursor movement, and native copy behavior.
 */

let wordWrapEnabled = true;

export function initDetailView() {
  const textarea = document.getElementById('detail-content');
  const wrapBtn = document.getElementById('btn-word-wrap');
  const copyBtn = document.getElementById('btn-copy-detail');
  const pathEl = document.getElementById('detail-path');

  // Word wrap toggle
  wrapBtn.addEventListener('click', () => {
    wordWrapEnabled = !wordWrapEnabled;
    applyWrap();
    wrapBtn.textContent = wordWrapEnabled ? 'Wrap: On' : 'Wrap: Off';
    wrapBtn.classList.toggle('wrap-off', !wordWrapEnabled);
  });

  // Copy value to clipboard
  copyBtn.addEventListener('click', () => {
    if (textarea.value) {
      navigator.clipboard.writeText(textarea.value).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    }
  });

  // Click path breadcrumb to copy it
  pathEl.addEventListener('click', () => {
    const path = pathEl.textContent;
    if (path && path !== '—') {
      navigator.clipboard.writeText(path).then(() => {
        const orig = pathEl.textContent;
        pathEl.textContent = 'Copied!';
        setTimeout(() => { pathEl.textContent = orig; }, 1500);
      });
    }
  });

  applyWrap();
}

function applyWrap() {
  const textarea = document.getElementById('detail-content');
  if (wordWrapEnabled) {
    textarea.setAttribute('wrap', 'soft');
    textarea.classList.remove('no-wrap');
  } else {
    textarea.setAttribute('wrap', 'off');
    textarea.classList.add('no-wrap');
  }
}

/**
 * Display a value in the detail pane.
 * - Strings: shown raw (the main use case — users want the full string content)
 * - null/undefined: shown as "null"
 * - Objects/arrays: pretty-printed JSON
 * - Other primitives: String() conversion
 */
export function showDetail(value, path) {
  const textarea = document.getElementById('detail-content');
  const pathEl = document.getElementById('detail-path');

  let text;
  if (typeof value === 'string') {
    text = value;
  } else if (value === null || value === undefined) {
    text = 'null';
  } else if (typeof value === 'object') {
    text = JSON.stringify(value, null, 2);
  } else {
    text = String(value);
  }

  textarea.value = text;
  pathEl.textContent = path || '—';
}

/** Clear the detail pane (used when switching views). */
export function clearDetail() {
  const textarea = document.getElementById('detail-content');
  const pathEl = document.getElementById('detail-path');
  textarea.value = '';
  pathEl.textContent = '—';
}
