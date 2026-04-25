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

## Architecture

```
json-viewer/
├── index.html          — Main HTML shell (toolbar, panes, modals, screens)
├── styles.css          — All styles; uses CSS custom properties for theming
└── js/
    ├── main.js         — Entry point (DOMContentLoaded). Initializes all modules, manages app state/mode, orchestrates view switching
    ├── file-loader.js  — File opening: File System Access API, drag-and-drop, hidden <input>, paste modal
    ├── format-detector.js — Detects JSON vs JSONL vs JSONC from extension and content
    ├── jsonc-parser.js — Strips // and /* */ comments from JSONC strings
    ├── tree-view.js    — Builds node tree from parsed data, renders DOM, expand/collapse, selection, search integration
    ├── tree-nav.js     — Arrow key navigation within the JSON tree
    ├── jsonl-view.js   — Virtualized list for JSONL line entries; scroll-based rendering
    ├── detail-view.js  — Right pane: readonly textarea, word wrap toggle, copy, path breadcrumb
    ├── search.js       — Search UI and logic for both tree mode and JSONL list mode
    ├── theme.js        — Listens to prefers-color-scheme media query, sets data-theme attribute
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
- **Theming**: CSS custom properties defined in `:root` (light) and `[data-theme="dark"]` (dark). Auto-switches via `prefers-color-scheme` media query.
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

All colors use CSS custom properties. To add or modify a color, edit `styles.css` in both `:root` and `[data-theme="dark"]` blocks. The `data-theme` attribute is set on `<html>` by `theme.js`.

## File Format Detection

`format-detector.js` uses this logic:
1. If filename has `.jsonl` or `.ndjson` extension → JSONL
2. If filename has `.jsonc` extension → JSONC
3. Otherwise, inspect content:
   - Starts with `[` → JSON
   - Starts with `{` and contains multiple top-level objects → JSONL
   - Single valid JSON value → JSON
   - Multiple lines each parseable as JSON → JSONL
   - Otherwise → unknown

## Known Limitations

- Tree view is not virtualized — very large JSON files (10MB+) may be slow
- JSONC parser uses a hand-written state machine; doesn't handle trailing commas
- No resizable pane divider (panes are fixed 50/50 split)
- Search in tree mode rebuilds the full DOM when expanding match paths
