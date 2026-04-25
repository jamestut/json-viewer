/**
 * jsonl-view.js
 *
 * Virtualized list view for JSONL (newline-delimited JSON) files.
 *
 * Instead of rendering all lines into the DOM, only the visible rows
 * (plus a small buffer above/below) are rendered. Spacer divs at the
 * top and bottom provide the correct total scroll height so the
 * scrollbar remains accurate.
 *
 * Scrolling triggers a re-render of only the visible range via
 * requestAnimationFrame for smooth performance.
 *
 * Supports keyboard navigation (up/down, enter/space) and search highlighting.
 */

let jsonlLines = [];      // Raw text of each JSONL line
let selectedIndex = -1;   // Currently selected line index (-1 = none)
let onLineSelected = null; // Callback when a line is activated (double-click or Enter/Space)
let containerEl = null;   // The scrollable #jsonl-container element
let listEl = null;        // The #jsonl-list element that holds rendered rows + spacers
const LINE_HEIGHT = 28;   // Fixed height of each row in pixels
const BUFFER = 10;        // Extra rows rendered above/below the viewport
let scrollListenerAttached = false;

export function initJsonlView({ onLineSelected }) {
  onLineSelected = onLineSelected || (() => {});
  containerEl = document.getElementById('jsonl-container');
  listEl = document.getElementById('jsonl-list');
}

/** Load lines and render the initial visible set. */
export function renderJsonlList(lines) {
  jsonlLines = lines;
  selectedIndex = -1;

  renderVisibleLines();

  // Attach scroll listener once
  if (!scrollListenerAttached && containerEl) {
    containerEl.addEventListener('scroll', () => {
      requestAnimationFrame(renderVisibleLines);
    });
    scrollListenerAttached = true;
  }

  // Auto-select the first line
  if (jsonlLines.length > 0) {
    selectedIndex = 0;
    highlightSelected();
  }
}

/**
 * Rebuild the DOM with only visible rows.
 * Structure: [top-spacer] [visible rows...] [bottom-spacer]
 */
function renderVisibleLines() {
  if (!containerEl || !listEl) return;

  const scrollTop = containerEl.scrollTop;
  const viewHeight = containerEl.clientHeight;
  const totalHeight = jsonlLines.length * LINE_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - BUFFER);
  const endIndex = Math.min(
    jsonlLines.length,
    Math.ceil((scrollTop + viewHeight) / LINE_HEIGHT) + BUFFER
  );

  listEl.innerHTML = '';

  // Top spacer pushes visible rows down to the correct scroll position
  const topSpacer = document.createElement('div');
  topSpacer.style.height = (startIndex * LINE_HEIGHT) + 'px';
  listEl.appendChild(topSpacer);

  for (let i = startIndex; i < endIndex; i++) {
    const row = document.createElement('div');
    row.className = 'jsonl-row';
    row.setAttribute('data-index', i);
    row.style.height = LINE_HEIGHT + 'px';
    row.style.lineHeight = LINE_HEIGHT + 'px';

    const numEl = document.createElement('span');
    numEl.className = 'jsonl-line-num';
    numEl.textContent = i + 1;

    const textEl = document.createElement('span');
    textEl.className = 'jsonl-line-text';
    textEl.textContent = jsonlLines[i];

    row.appendChild(numEl);
    row.appendChild(textEl);

    if (i === selectedIndex) {
      row.classList.add('selected');
    }

    // Use closure to capture the correct index
    const idx = i;
    row.addEventListener('click', () => {
      selectedIndex = idx;
      highlightSelected();
    });

    row.addEventListener('dblclick', () => {
      selectedIndex = idx;
      highlightSelected();
      if (onLineSelected) onLineSelected(jsonlLines[idx], idx);
    });

    listEl.appendChild(row);
  }

  // Bottom spacer fills the remaining scroll height
  const bottomSpacer = document.createElement('div');
  bottomSpacer.style.height = Math.max(0, totalHeight - endIndex * LINE_HEIGHT) + 'px';
  listEl.appendChild(bottomSpacer);
}

/** Update the 'selected' class on rendered rows. */
function highlightSelected() {
  if (!listEl) return;
  const rows = listEl.querySelectorAll('.jsonl-row');
  for (const row of rows) {
    row.classList.remove('selected');
    const idx = parseInt(row.getAttribute('data-index'));
    if (idx === selectedIndex) {
      row.classList.add('selected');
    }
  }
}

// --- Keyboard navigation (called by main.js) ---

export function jsonlNavigateUp() {
  if (selectedIndex > 0) {
    selectedIndex--;
    highlightSelected();
    scrollToSelected();
  }
}

export function jsonlNavigateDown() {
  if (selectedIndex < jsonlLines.length - 1) {
    selectedIndex++;
    highlightSelected();
    scrollToSelected();
  }
}

export function jsonlActivateLine() {
  if (selectedIndex >= 0 && selectedIndex < jsonlLines.length && onLineSelected) {
    onLineSelected(jsonlLines[selectedIndex], selectedIndex);
  }
}

/** Scroll the container to keep the selected row visible. */
function scrollToSelected() {
  if (!containerEl || selectedIndex < 0) return;
  const top = selectedIndex * LINE_HEIGHT;
  const bottom = top + LINE_HEIGHT;
  const viewTop = containerEl.scrollTop;
  const viewBottom = viewTop + containerEl.clientHeight;

  if (top < viewTop) {
    containerEl.scrollTop = top;
  } else if (bottom > viewBottom) {
    containerEl.scrollTop = bottom - containerEl.clientHeight;
  }

  // Re-render since the visible range may have changed
  requestAnimationFrame(renderVisibleLines);
}

// --- Search integration (called by search.js) ---

export function searchJsonl(query) {
  if (!query) return { matches: [], count: 0 };
  const lowerQuery = query.toLowerCase();
  const matches = [];
  for (let i = 0; i < jsonlLines.length; i++) {
    if (jsonlLines[i].toLowerCase().includes(lowerQuery)) {
      matches.push(i);
    }
  }
  return { matches, count: matches.length };
}

export function highlightJsonlSearch(matchIndices) {
  if (!listEl) return;
  const matchSet = new Set(matchIndices);
  const rows = listEl.querySelectorAll('.jsonl-row');
  for (const row of rows) {
    row.classList.remove('search-match');
    const idx = parseInt(row.getAttribute('data-index'));
    if (matchSet.has(idx)) {
      row.classList.add('search-match');
    }
  }
}

export function clearJsonlSearchHighlights() {
  if (!listEl) return;
  const rows = listEl.querySelectorAll('.jsonl-row');
  for (const row of rows) {
    row.classList.remove('search-match');
  }
}

// --- Accessors used by other modules ---

export function getJsonlLine(index) {
  return jsonlLines[index];
}

export function getJsonlCount() {
  return jsonlLines.length;
}

export function getSelectedIndex() {
  return selectedIndex;
}

/** Jump to a specific line index (used by search to navigate to match). */
export function setSelectedIndex(idx) {
  selectedIndex = idx;
  highlightSelected();
  scrollToSelected();
}

/** Update the callback (used when re-entering JSONL list from detail view). */
export function setOnLineSelected(callback) {
  onLineSelected = callback;
}
