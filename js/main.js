/**
 * main.js
 *
 * Application entry point. Initializes all modules on DOMContentLoaded,
 * manages the current app mode (null/json/jsonc/jsonl-list/jsonl-detail),
 * and orchestrates view switching between the welcome screen, JSON tree,
 * JSONL line list, and error display.
 *
 * Event flow for file loading:
 *   file-loader → onFileLoaded/onTextLoaded → loadContent → parseContent →
 *     → JSON/JSONC: showJsonView → renderTree
 *     → JSONL: renderJsonlList
 */

import { initFileLoader } from './file-loader.js';
import { parseContent } from './parser.js';
import { initTreeView, renderTree, expandAll, collapseAll, getNodePath } from './tree-view.js';
import { initTreeNav } from './tree-nav.js';
import { initJsonlView, renderJsonlList, jsonlNavigateUp, jsonlNavigateDown, jsonlActivateLine, setOnLineSelected } from './jsonl-view.js';
import { initDetailView, showDetail, clearDetail } from './detail-view.js';
import { initSearch } from './search.js';

/** Current app mode. One of: null, 'json', 'jsonc', 'jsonl-list', 'jsonl-detail' */
let currentMode = null;

/** Saved JSONL lines ({text, data} pairs) for restoring the list when returning from detail view */
let jsonlLinesBackup = [];

function getMode() {
  return currentMode;
}

function init() {
  initDetailView();

  initTreeView({
    onSelected: (node) => {
      showDetail(node.value, getNodePath(node.id));
    },
  });

  initTreeNav(getMode);

  initJsonlView({
    onLineSelected: handleJsonlLineSelected,
  });

  initSearch({ getMode });

  initFileLoader({
    onFileLoaded: (text) => {
      loadContent(text);
    },
    onTextLoaded: (text) => {
      loadContent(text);
    },
  });

  // Toolbar buttons
  document.getElementById('btn-expand-all').addEventListener('click', expandAll);
  document.getElementById('btn-collapse-all').addEventListener('click', collapseAll);
  document.getElementById('btn-back-jsonl').addEventListener('click', goBackToJsonlList);

  // Welcome screen buttons
  document.getElementById('welcome-open').addEventListener('click', () => {
    document.getElementById('btn-open').click();
  });
  document.getElementById('welcome-paste').addEventListener('click', () => {
    document.getElementById('btn-from-text').click();
  });
  document.getElementById('error-retry').addEventListener('click', () => {
    document.getElementById('btn-open').click();
  });

  // Global keydown for JSONL-specific keyboard handling
  document.addEventListener('keydown', handleGlobalKeydown);

  showWelcome();
}

/** Handle a JSONL line being activated (double-click or Enter/Space). */
function handleJsonlLineSelected(data) {
  currentMode = 'jsonl-detail';
  showJsonView(data, true);
}

/**
 * Global keydown handler for JSONL-specific interactions.
 * - JSONL list mode: arrow keys for navigation, Enter/Space to activate
 * - JSONL detail mode: Escape to go back to list
 *
 * Search and paste-modal Escape handling is done in their respective modules
 * (with stopImmediatePropagation to prevent this handler from also firing).
 */
function handleGlobalKeydown(e) {
  const pasteModal = document.getElementById('paste-modal');
  if (pasteModal.classList.contains('visible')) return;

  const searchInput = document.getElementById('search-input');
  const searchContainer = document.getElementById('search-container');

  if (currentMode === 'jsonl-list') {
    // Don't intercept if the search bar is focused
    if (document.activeElement === searchInput && searchContainer.classList.contains('visible')) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      jsonlNavigateUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      jsonlNavigateDown();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement !== searchInput) {
        e.preventDefault();
        jsonlActivateLine();
      }
    }
  }

  // Escape in JSONL detail → go back to line list
  if (currentMode === 'jsonl-detail' && e.key === 'Escape') {
    e.preventDefault();
    goBackToJsonlList();
  }
}

/** Detect format, parse, and switch to the appropriate view. */
function loadContent(text) {
  const result = parseContent(text);

  if (result.type === 'jsonl') {
    currentMode = 'jsonl-list';
    jsonlLinesBackup = result.data;
    hideAllViews();
    document.getElementById('jsonl-view').classList.remove('hidden');
    document.getElementById('back-jsonl-bar').classList.add('hidden');
    setOnLineSelected(handleJsonlLineSelected);
    renderJsonlList(result.data);
    clearDetail();
  } else if (result.type === 'json' || result.type === 'jsonc') {
    currentMode = result.type;
    showJsonView(result.data, false);
  } else {
    showError(result.message);
  }
}

/**
 * Switch to the 2-pane JSON tree view.
 * @param {*} data          Parsed JSON data to display
 * @param {boolean} isJsonlDetail  If true, show the "Back to line list" bar
 */
function showJsonView(data, isJsonlDetail) {
  hideAllViews();
  document.getElementById('main-view').classList.remove('hidden');

  if (isJsonlDetail) {
    document.getElementById('back-jsonl-bar').classList.remove('hidden');
  } else {
    document.getElementById('back-jsonl-bar').classList.add('hidden');
  }

  renderTree(data);
}

/** Return from JSONL detail view to the line list. */
function goBackToJsonlList() {
  currentMode = 'jsonl-list';
  hideAllViews();
  document.getElementById('jsonl-view').classList.remove('hidden');
  document.getElementById('back-jsonl-bar').classList.add('hidden');
  setOnLineSelected(handleJsonlLineSelected);
  renderJsonlList(jsonlLinesBackup);
  clearDetail();
}

function showError(message) {
  hideAllViews();
  document.getElementById('error-screen').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

function showWelcome() {
  hideAllViews();
  document.getElementById('welcome-screen').classList.remove('hidden');
}

function hideAllViews() {
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('error-screen').classList.add('hidden');
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('jsonl-view').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', init);
