/**
 * platform.js
 *
 * Detects whether the user is on a Mac/iOS platform.
 * Used to decide between Cmd (metaKey) vs Ctrl (ctrlKey) for keyboard shortcuts.
 */

export function isMac() {
  // Modern API (Chromium)
  if (navigator.userAgentData) {
    return navigator.userAgentData.platform === 'macOS';
  }
  // Fallback
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}
