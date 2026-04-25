/**
 * file-loader.js
 *
 * Handles all file input methods:
 * - File System Access API (showOpenFilePicker) — primary, Chromium only
 * - Hidden <input type="file"> — universal fallback
 * - Drag-and-drop overlay — universal fallback
 * - Paste modal (Cmd/Ctrl+N) — for pasting raw text
 *
 * Keyboard shortcuts registered here:
 * - Cmd/Ctrl+O → open file dialog
 * - Cmd/Ctrl+N → open paste modal
 * - Escape → close paste modal
 */

import { isMac } from './platform.js';

export function initFileLoader({ onFileLoaded, onTextLoaded }) {
  const openBtn = document.getElementById('btn-open');
  const textBtn = document.getElementById('btn-from-text');
  const hiddenInput = document.getElementById('hidden-file-input');
  const dropOverlay = document.getElementById('drop-overlay');
  const pasteModal = document.getElementById('paste-modal');
  const pasteTextarea = document.getElementById('paste-textarea');
  const pasteLoadBtn = document.getElementById('paste-load-btn');
  const pasteCancelBtn = document.getElementById('paste-cancel-btn');

  const hasFileSystemAccess = 'showOpenFilePicker' in window;

  openBtn.addEventListener('click', () => {
    if (hasFileSystemAccess) {
      openWithFileSystemAPI().catch(() => openWithInput());
    } else {
      openWithInput();
    }
  });

  hiddenInput.addEventListener('change', () => {
    const file = hiddenInput.files[0];
    if (file) {
      readFile(file);
      hiddenInput.value = '';
    }
  });

  // Paste modal
  textBtn.addEventListener('click', () => {
    pasteTextarea.value = '';
    pasteModal.classList.add('visible');
    setTimeout(() => pasteTextarea.focus(), 0);
  });

  pasteLoadBtn.addEventListener('click', submitPaste);

  // Cmd/Ctrl+Enter to submit from within the textarea
  pasteTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitPaste();
    }
  });

  pasteCancelBtn.addEventListener('click', () => {
    pasteModal.classList.remove('visible');
  });

  // Close modal by clicking the backdrop
  pasteModal.addEventListener('click', (e) => {
    if (e.target === pasteModal) {
      pasteModal.classList.remove('visible');
    }
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape closes paste modal first
    if (pasteModal.classList.contains('visible') && e.key === 'Escape') {
      pasteModal.classList.remove('visible');
      return;
    }
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    if (mod && e.key === 'o') {
      e.preventDefault();
      openBtn.click();
    }
    if (mod && e.key === 'n') {
      e.preventDefault();
      textBtn.click();
    }
  });

  // Drag-and-drop
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropOverlay.classList.add('visible');
  });

  document.addEventListener('dragleave', (e) => {
    // Only hide if the pointer actually left the document
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
      dropOverlay.classList.remove('visible');
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dropOverlay.classList.remove('visible');
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  });

  async function openWithFileSystemAPI() {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON files',
        accept: {
          'application/json': ['.json', '.jsonl', '.jsonc', '.ndjson'],
        },
      }],
      multiple: false,
    });
    const file = await handle.getFile();
    readFile(file);
  }

  function openWithInput() {
    hiddenInput.click();
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      onFileLoaded(reader.result, file.name);
    };
    reader.onerror = () => {
      alert('Failed to read file.');
    };
    reader.readAsText(file);
  }

  function submitPaste() {
    const text = pasteTextarea.value;
    if (text.trim()) {
      pasteModal.classList.remove('visible');
      onTextLoaded(text);
    }
  }
}
