/**
 * theme.js
 *
 * Auto-switches between light and dark themes by listening to the
 * OS-level prefers-color-scheme media query. Sets data-theme="light"|"dark"
 * on <html>, which the CSS custom properties in styles.css respond to.
 *
 * No manual toggle — always follows the system preference.
 */

export function initTheme() {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    document.documentElement.setAttribute(
      'data-theme',
      mql.matches ? 'dark' : 'light'
    );
  }
  apply();
  mql.addEventListener('change', apply);
}
