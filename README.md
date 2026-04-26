# JSON Viewer

A browser-based JSON, JSONL, and JSONC file viewer with interactive tree navigation. Built with vanilla web standards. No frameworks, no build tools, just pure HTML, CSS, and JavaScript.

[**Open the app here**](https://jamestut.github.io/json-viewer)

## Running

Serve the directory with any static HTTP server (needed for ES module imports). There are no build steps, no package.json, no npm. Just static files.

## Features

- **Multiple Format Support** - View JSON, JSON Lines (JSONL), and JSON with comments (JSONC) files
- **File Loading** - Open files via File System Access API, drag-and-drop, or paste text directly
- **Interactive Tree View** - Hierarchical display of nested JSON structures with expand/collapse
- **JSONL List View** - Virtualized list for efficient browsing of large JSONL files
- **Node Selection** - Click nodes to view full content in the right pane
- **Search** - Search through JSON tree or JSONL list with keyboard shortcut (Cmd/Ctrl+F)
- **Keyboard Navigation** - Arrow keys for navigation, Enter/Space to activate
- **Path Display** - Shows JSON path to selected node using dot/bracket notation
- **Word Wrap** - Toggle word wrapping in the content pane
- **Theme Support** - Automatic dark/light mode based on system preference
- **No Dependencies** - Pure vanilla JavaScript with ES modules, no build tools required

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Cmd/Ctrl+O | Open file dialog |
| Cmd/Ctrl+Shift+O | Open paste text modal |
| Cmd/Ctrl+F | Focus search bar (when data loaded) |
| Escape | Close search/paste modal, or go back to JSONL lines |
| Arrow Up/Down | Navigate tree nodes or JSONL lines |
| Arrow Left | Collapse current tree node, or jump to parent |
| Arrow Right | Expand current tree node |
| Enter / Space | Activate JSONL line (open in tree view) |
