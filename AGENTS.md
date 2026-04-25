# JSON Viewer — AGENTS.md

## Project Overview

A static web app for viewing JSON, JSONL, and JSONC files. No build tools, no dependencies. Served as plain HTML/CSS/JS with ES modules.

## Running

Serve the directory with any static HTTP server (needed for ES module imports):

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

There are no build steps, no package.json, no npm. Just static files.

## Testing

Do NOT start an HTTP server to test changes — static file serving is guaranteed to work. Instead, run syntax checks:

```bash
node --check js/main.js js/parser.js js/jsonl-view.js js/search.js js/tree-view.js js/detail-view.js js/file-loader.js js/jsonc-parser.js
```

## Architecture

```
json-viewer/
├── index.html          — Main HTML shell (toolbar, panes, modals, screens)
├── styles.css          — All styles; uses CSS custom properties for theming
└── js/
    ├── main.js         — Entry point (DOMContentLoaded). Initializes all modules, manages app state/mode, orchestrates view switching
    ├── file-loader.js  — File opening: File System Access API, drag-and-drop, hidden <input>, paste modal
    ├── parser.js       — Combined format detection + parsing; returns { type, data } result objects (the only place JSON.parse is called)
    ├── jsonc-parser.js — Strips // and /* */ comments from JSONC strings (used by parser.js as a fallback)
    ├── tree-view.js    — Builds node tree from parsed data, renders DOM, expand/collapse, selection, search integration
    ├── tree-nav.js     — Arrow key navigation within the JSON tree
    ├── jsonl-view.js   — Virtualized list for JSONL line entries; scroll-based rendering
    ├── detail-view.js  — Right pane: readonly textarea, word wrap toggle, copy, path breadcrumb
    ├── search.js       — Search UI and logic for both tree mode and JSONL list mode
    └── platform.js     — isMac() helper for keyboard shortcut detection
```

## App Modes

The app has a `currentMode` state variable (in `main.js`) that determines behavior:

| Mode | Description |
|---|---|
| `null` | Welcome screen shown |
| `json` | Standard 2-pane JSON tree viewer |
| `jsonc` | Same as json but file was JSONC |
| `jsonl-list` | JSONL file loaded; shows virtualized line list |
| `jsonl-detail` | A JSONL line was opened; shows 2-pane tree for that line |

## Key Design Decisions

- **No framework**: Vanilla JS with ES modules (`<script type="module">`). All modern browsers support this.
- **No animations**: Zero CSS transitions/animations per requirement.
- **Theming**: CSS custom properties defined in `:root` (light) and `@media (prefers-color-scheme: dark)` (dark). Purely CSS-driven — no JS involved.
- **Virtualized JSONL list**: Only visible rows (+ buffer) rendered. Top/bottom spacer divs handle total height for scrollbar accuracy.
- **Tree rendering**: Full DOM rebuild on expand/collapse (not virtualized). Fine for typical JSON files. For very large files, this could be a perf concern.
- **Detail pane as textarea**: Uses a readonly `<textarea>` so users get native text selection.

## Keyboard Shortcuts

| Shortcut | Action | Works In |
|---|---|---|
| Cmd/Ctrl+O | Open file dialog | Any |
| Cmd/Ctrl+N | Open paste text modal | Any |
| Cmd/Ctrl+F | Focus search bar | Any (when data loaded) |
| Escape | Close search/paste modal, or go back from JSONL detail | Any |
| Arrow Up/Down | Navigate tree nodes or JSONL lines | Tree / JSONL list |
| Arrow Left | Collapse current tree node, or jump to parent | Tree |
| Arrow Right | Expand current tree node | Tree |
| Enter / Space | Activate JSONL line (open in tree view) | JSONL list |

## CSS Theming

All colors use CSS custom properties. To add or modify a color, edit `styles.css` in both `:root` and `@media (prefers-color-scheme: dark)` blocks. Theme switching is purely CSS-driven — no JS involved.

## File Format Detection & Parsing

All format detection and parsing happens in `parser.js` via a single `parseContent(text)` call. No file extension checks — detection is purely content-based using `JSON.parse`:

1. **JSONL**: Try parsing each non-empty line individually. If all parse and there are 2+ results → JSONL. Short-circuits on first failure (so pretty-printed JSON is cheap — just 1 failed `JSON.parse`).
2. **JSON**: Try parsing the whole text as a single JSON value. Covers objects, arrays, and primitives. A single-line JSONL file also falls here (better shown as a tree).
3. **JSONC**: Strip comments via `jsonc-parser.js`, then parse as JSON. Only attempted after normal JSON fails.
4. **Error**: Nothing worked → return error message for display.

`JSON.parse` is not called anywhere else in the codebase. For JSONL, parsed data is stored as `{text, data}` pairs so line activation doesn't need re-parsing.

## Known Limitations

- Tree view is not virtualized — very large JSON files (10MB+) may be slow
- JSONC comment stripper doesn't handle trailing commas
- No resizable pane divider (panes are fixed 50/50 split)
- Search in tree mode rebuilds the full DOM when expanding match paths
