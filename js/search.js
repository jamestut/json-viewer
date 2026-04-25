/**
 * search.js
 *
 * Unified search bar for both tree mode (JSON/JSONC/JSONL-detail)
 * and JSONL list mode. Bound to Ctrl/Cmd+F.
 *
 * Behavior:
 * - Debounced input triggers a search across the current view
 * - Enter / Shift+Enter navigates between matches
 * - Escape closes the search bar (with stopImmediatePropagation
 *   so other Escape handlers don't fire simultaneously)
 *
 * In tree mode: searches node keys and leaf values, expands paths to
 * matches, and highlights matching rows.
 *
 * In JSONL list mode: searches line content, highlights matching rows,
 * and scrolls to the first match.
 */

import { isMac } from './platform.js';
import { searchTree, getSearchVisiblePath, selectNodeById, clearSearchHighlights } from './tree-view.js';
import { searchJsonl, highlightJsonlSearch, clearJsonlSearchHighlights, setSelectedIndex } from './jsonl-view.js';

let currentMode = null;       // Function that returns the current app mode string
let currentMatches = [];      // Array of matching node IDs or line indices
let currentMatchIndex = -1;   // Index into currentMatches for the active match

export function initSearch({ getMode }) {
  currentMode = getMode;

  const searchInput = document.getElementById('search-input');
  const searchPrev = document.getElementById('search-prev');
  const searchNext = document.getElementById('search-next');
  const searchClose = document.getElementById('search-close');
  const searchCount = document.getElementById('search-count');
  const searchContainer = document.getElementById('search-container');

  // Global keyboard listener for Ctrl/Cmd+F and Escape
  document.addEventListener('keydown', (e) => {
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    if (mod && e.key === 'f') {
      e.preventDefault();
      searchContainer.classList.add('visible');
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === 'Escape' && searchContainer.classList.contains('visible')) {
      // Stop other listeners (e.g. jsonl-detail Escape-to-go-back) from seeing this event
      e.stopImmediatePropagation();
      searchContainer.classList.remove('visible');
      searchInput.value = '';
      searchCount.textContent = '';
      clearSearchHighlights();
      clearJsonlSearchHighlights();
      currentMatches = [];
      currentMatchIndex = -1;
      searchInput.blur();
    }
  });

  // Debounced search on input
  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(searchInput.value, searchCount);
    }, 200);
  });

  // Enter/Shift+Enter to navigate between matches
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigatePrev();
      } else {
        navigateNext(searchCount);
      }
    }
  });

  searchNext.addEventListener('click', () => navigateNext(searchCount));
  searchPrev.addEventListener('click', () => navigatePrev());
  searchClose.addEventListener('click', () => {
    searchContainer.classList.remove('visible');
    searchInput.value = '';
    searchCount.textContent = '';
    clearSearchHighlights();
    clearJsonlSearchHighlights();
  });
}

/** Execute the search against the current view's data. */
function performSearch(query, countEl) {
  const mode = currentMode();
  if (!query) {
    currentMatches = [];
    currentMatchIndex = -1;
    countEl.textContent = '';
    clearSearchHighlights();
    clearJsonlSearchHighlights();
    return;
  }

  if (mode === 'json' || mode === 'jsonc' || mode === 'jsonl-detail') {
    const result = searchTree(query);
    currentMatches = result.matches;
    currentMatchIndex = currentMatches.length > 0 ? 0 : -1;
    countEl.textContent = currentMatches.length > 0
      ? `${currentMatchIndex + 1}/${currentMatches.length}`
      : 'No results';
    if (currentMatches.length > 0) {
      getSearchVisiblePath(currentMatches);
      selectNodeById(currentMatches[0]);
    }
  } else if (mode === 'jsonl-list') {
    const result = searchJsonl(query);
    currentMatches = result.matches;
    currentMatchIndex = currentMatches.length > 0 ? 0 : -1;
    countEl.textContent = currentMatches.length > 0
      ? `${currentMatchIndex + 1}/${currentMatches.length}`
      : 'No results';
    if (currentMatches.length > 0) {
      highlightJsonlSearch(currentMatches);
      setSelectedIndex(currentMatches[0]);
    }
  } else {
    countEl.textContent = '';
  }
}

function navigateNext(countEl) {
  if (currentMatches.length === 0) return;
  currentMatchIndex = (currentMatchIndex + 1) % currentMatches.length;
  countEl.textContent = `${currentMatchIndex + 1}/${currentMatches.length}`;
  jumpToMatch();
}

function navigatePrev() {
  if (currentMatches.length === 0) return;
  currentMatchIndex = (currentMatchIndex - 1 + currentMatches.length) % currentMatches.length;
  const countEl = document.getElementById('search-count');
  countEl.textContent = `${currentMatchIndex + 1}/${currentMatches.length}`;
  jumpToMatch();
}

function jumpToMatch() {
  const mode = currentMode();
  const id = currentMatches[currentMatchIndex];

  if (mode === 'json' || mode === 'jsonc' || mode === 'jsonl-detail') {
    selectNodeById(id);
  } else if (mode === 'jsonl-list') {
    setSelectedIndex(id);
  }
}
