/**
 * tree-nav.js
 *
 * Handles arrow-key navigation within the JSON tree view.
 * Only active when the app is in a tree-displaying mode (json, jsonc, jsonl-detail).
 * Delegates actual movement to tree-view.js navigate* functions.
 *
 * Guards: ignores events when the paste modal or search input is focused.
 */

import {
  navigateUp,
  navigateDown,
  navigateLeft,
  navigateRight,
} from './tree-view.js';

export function initTreeNav(getMode) {
  document.addEventListener('keydown', (e) => {
    const mode = getMode();
    if (mode !== 'json' && mode !== 'jsonc' && mode !== 'jsonl-detail') return;

    const pasteModal = document.getElementById('paste-modal');
    if (pasteModal.classList.contains('visible')) return;

    const searchInput = document.getElementById('search-input');
    if (document.activeElement === searchInput) return;

    const treeContainer = document.getElementById('tree-container');
    if (!treeContainer || !treeContainer.querySelector('.tree-node')) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateDown();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateRight();
        break;
    }
  });
}
