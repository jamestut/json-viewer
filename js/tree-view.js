/**
 * tree-view.js
 *
 * Renders a JSON value as an interactive, collapsible tree in the left pane.
 *
 * Architecture:
 * - buildNode() recursively creates a flat array of node objects (allNodes[]),
 *   each with an id, key, value, type, depth, parent, and children.
 * - renderNodeInto() creates the DOM from that array, only rendering children
 *   of expanded nodes.
 * - expand/collapse triggers a full DOM rebuild via rerender(), which
 *   preserves scroll position.
 * - Selection is tracked by selectedNodeId and highlighted via CSS class.
 * - Keyboard navigation (up/down/left/right) is handled by tree-nav.js,
 *   which calls the exported navigate* functions.
 *
 * Node IDs are simply indices into allNodes[], so lookup is O(1).
 */

let allNodes = [];
let selectedNodeId = null;
let onNodeSelected = null;
let expandedSet = new Set(); // Set of node IDs whose children are visible
let currentSearchMatches = new Set(); // Node IDs that match the current search query

export function initTreeView({ onSelected }) {
  onNodeSelected = onSelected;

  const container = document.getElementById('tree-container');

  // Single click: toggle expand/collapse on the arrow, or select the row
  container.addEventListener('click', (e) => {
    const row = e.target.closest('.tree-row');
    if (!row) return;
    const nodeId = parseInt(row.getAttribute('data-node-id'));
    if (isNaN(nodeId)) return;

    const toggleEl = e.target.closest('.tree-toggle');
    const isToggle = toggleEl && !toggleEl.classList.contains('leaf');

    if (isToggle) {
      toggleNode(nodeId);
    } else {
      selectNode(nodeId);
    }
  });

  // Double click on an object/array row: toggle expand/collapse
  container.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.tree-row');
    if (!row) return;
    const nodeId = parseInt(row.getAttribute('data-node-id'));
    if (isNaN(nodeId)) return;
    const node = allNodes[nodeId];
    if (node && (node.type === 'object' || node.type === 'array')) {
      toggleNode(nodeId);
    }
  });
}

/**
 * Build the node tree from a parsed JSON value and render it.
 * All nodes start expanded.
 */
export function renderTree(data) {
  const container = document.getElementById('tree-container');
  container.innerHTML = '';
  allNodes = [];
  selectedNodeId = null;
  expandedSet = new Set();
  currentSearchMatches = new Set();

  const rootNode = buildNode('root', data, null, 0);
  expandAllInternal();

  renderTreeInto(container);

  // Auto-select the root node
  if (allNodes.length > 0) {
    selectNode(allNodes[0].id);
  }
}

/** Recursively build node objects from a JSON value. */
function buildNode(key, value, parent, depth) {
  const type = getType(value);
  const node = {
    id: allNodes.length,
    key,
    value,
    type,
    depth,
    parent,
    children: [],
    childCount: 0,
  };
  allNodes.push(node);

  if (type === 'object') {
    const entries = Object.entries(value);
    node.childCount = entries.length;
    for (const [k, v] of entries) {
      node.children.push(buildNode(k, v, node, depth + 1));
    }
  } else if (type === 'array') {
    node.childCount = value.length;
    for (let i = 0; i < value.length; i++) {
      node.children.push(buildNode(String(i), value[i], node, depth + 1));
    }
  }

  return node;
}

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/** Render the entire tree into a container element. */
function renderTreeInto(container) {
  const fragment = document.createDocumentFragment();
  if (allNodes.length > 0) {
    renderNodeInto(allNodes[0], fragment);
  }
  container.appendChild(fragment);
}

/** Render a single node and (if expanded) its children into the given container. */
function renderNodeInto(node, container) {
  const el = document.createElement('div');
  el.className = 'tree-node';

  const row = document.createElement('div');
  row.className = 'tree-row';
  row.setAttribute('data-node-id', node.id);
  row.style.paddingLeft = (node.depth * 20 + 4) + 'px';

  // Toggle arrow: ▼ expanded, ▶ collapsed, · leaf
  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle';
  if (node.type === 'object' || node.type === 'array') {
    toggle.textContent = expandedSet.has(node.id) ? '\u25BC' : '\u25B6';
  } else {
    toggle.textContent = '\u00B7';
    toggle.classList.add('leaf');
  }

  const label = document.createElement('span');
  label.className = 'tree-label';
  label.textContent = node.key;

  row.appendChild(toggle);
  row.appendChild(label);

  if (node.type !== 'object' && node.type !== 'array') {
    // Leaf node: show "key: value" with a type-specific color
    const sep = document.createElement('span');
    sep.className = 'tree-sep';
    sep.textContent = ': ';
    row.appendChild(sep);

    const val = document.createElement('span');
    val.className = 'tree-value tree-value-' + node.type;
    val.textContent = formatValuePreview(node.value, node.type);
    row.appendChild(val);
  } else {
    // Container node: show "{}/[] N items"
    const count = document.createElement('span');
    count.className = 'tree-count';
    const brace = node.type === 'object' ? '{}' : '[]';
    count.textContent = brace + ' ' + node.childCount + (node.childCount === 1 ? ' item' : ' items');
    row.appendChild(count);
  }

  // Restore visual state
  if (selectedNodeId === node.id) {
    row.classList.add('selected');
  }
  if (currentSearchMatches.has(node.id)) {
    row.classList.add('search-match');
  }

  el.appendChild(row);
  container.appendChild(el);

  // Recursively render children of expanded container nodes
  if ((node.type === 'object' || node.type === 'array') && expandedSet.has(node.id)) {
    for (const child of node.children) {
      renderNodeInto(child, el);
    }
  }
}

/** Truncate long strings for the inline preview in the tree. */
function formatValuePreview(value, type) {
  if (type === 'string') {
    const s = String(value);
    return s.length > 80 ? s.slice(0, 80) + '\u2026' : s;
  }
  if (type === 'null') return 'null';
  return String(value);
}

/** Full DOM rebuild. Preserves scroll position. Called on expand/collapse. */
function rerender() {
  const container = document.getElementById('tree-container');
  const scrollTop = container.scrollTop;
  container.innerHTML = '';
  renderTreeInto(container);
  container.scrollTop = scrollTop;
}

/** Select a node: update highlight, scroll into view, fire onSelected callback. */
function selectNode(nodeId) {
  const prev = selectedNodeId;
  selectedNodeId = nodeId;

  const container = document.getElementById('tree-container');

  // Remove highlight from previously selected row
  if (prev !== null) {
    const prevEl = container.querySelector(`.tree-row[data-node-id="${prev}"]`);
    if (prevEl) prevEl.classList.remove('selected');
  }

  // Add highlight to new selection
  const el = container.querySelector(`.tree-row[data-node-id="${nodeId}"]`);
  if (el) {
    el.classList.add('selected');
    el.scrollIntoView({ block: 'nearest' });
  }

  const node = allNodes[nodeId];
  if (node && onNodeSelected) {
    onNodeSelected(node);
  }
}

/** Toggle expand/collapse on a container node, then rerender. */
function toggleNode(nodeId) {
  const node = allNodes[nodeId];
  if (!node || (node.type !== 'object' && node.type !== 'array')) return;

  if (expandedSet.has(nodeId)) {
    expandedSet.delete(nodeId);
  } else {
    expandedSet.add(nodeId);
  }

  rerender();
  selectNode(nodeId);
}

/** Add all container nodes to the expanded set (no rerender). */
function expandAllInternal() {
  for (const node of allNodes) {
    if (node.type === 'object' || node.type === 'array') {
      expandedSet.add(node.id);
    }
  }
}

export function expandAll() {
  expandAllInternal();
  if (allNodes.length > 0) rerender();
}

export function collapseAll() {
  expandedSet.clear();
  if (allNodes.length > 0) rerender();
}

/**
 * Build a human-readable path string like "root > users > [2] > name".
 * Used in the detail pane breadcrumb.
 */
export function getNodePath(nodeId) {
  const parts = [];
  let current = allNodes[nodeId];
  while (current) {
    if (current.key !== 'root') {
      parts.unshift(current.key);
    }
    current = current.parent;
  }
  return parts.length > 0 ? parts.join(' > ') : 'root';
}

// --- Keyboard navigation (called by tree-nav.js) ---

export function navigateUp() {
  if (selectedNodeId === null) return;
  const visible = getVisibleNodes();
  const idx = visible.indexOf(selectedNodeId);
  if (idx > 0) selectNode(visible[idx - 1]);
}

export function navigateDown() {
  if (selectedNodeId === null) return;
  const visible = getVisibleNodes();
  const idx = visible.indexOf(selectedNodeId);
  if (idx < visible.length - 1) selectNode(visible[idx + 1]);
}

/** Left arrow: collapse if expanded, otherwise jump to parent. */
export function navigateLeft() {
  if (selectedNodeId === null) return;
  const node = allNodes[selectedNodeId];
  if ((node.type === 'object' || node.type === 'array') && expandedSet.has(selectedNodeId)) {
    expandedSet.delete(selectedNodeId);
    rerender();
    selectNode(selectedNodeId);
  } else if (node.parent) {
    selectNode(node.parent.id);
  }
}

/** Right arrow: expand if collapsed (no-op on leaf nodes). */
export function navigateRight() {
  if (selectedNodeId === null) return;
  const node = allNodes[selectedNodeId];
  if ((node.type === 'object' || node.type === 'array') && !expandedSet.has(selectedNodeId)) {
    expandedSet.add(selectedNodeId);
    rerender();
    selectNode(selectedNodeId);
  }
}

/**
 * Return an array of node IDs in the order they appear visually
 * (only expanded nodes' children are included).
 */
function getVisibleNodes() {
  const visible = [];
  function walk(nodeId) {
    visible.push(nodeId);
    const node = allNodes[nodeId];
    if ((node.type === 'object' || node.type === 'array') && expandedSet.has(nodeId)) {
      for (const child of node.children) {
        walk(child.id);
      }
    }
  }
  if (allNodes.length > 0) walk(0);
  return visible;
}

// --- Search integration (called by search.js) ---

/** Search all node keys and leaf values for the given query. */
export function searchTree(query) {
  if (!query) return { matches: [], count: 0 };
  const lowerQuery = query.toLowerCase();
  const matches = [];
  for (const node of allNodes) {
    const keyMatch = node.key.toLowerCase().includes(lowerQuery);
    let valueMatch = false;
    if (node.type === 'string') {
      valueMatch = String(node.value).toLowerCase().includes(lowerQuery);
    } else if (node.type !== 'object' && node.type !== 'array') {
      valueMatch = String(node.value).toLowerCase().includes(lowerQuery);
    }
    if (keyMatch || valueMatch) {
      matches.push(node.id);
    }
  }
  return { matches, count: matches.length };
}

/**
 * Expand all ancestor paths to make match nodes visible,
 * store match IDs for CSS highlighting, and rerender.
 */
export function getSearchVisiblePath(matchIds) {
  for (const id of matchIds) {
    let current = allNodes[id];
    while (current) {
      if (current.type === 'object' || current.type === 'array') {
        expandedSet.add(current.id);
      }
      current = current.parent;
    }
  }
  currentSearchMatches = new Set(matchIds);
  rerender();
}

/** Remove search-match highlights from the DOM. */
export function clearSearchHighlights() {
  currentSearchMatches = new Set();
  const container = document.getElementById('tree-container');
  const rows = container.querySelectorAll('.tree-row.search-match');
  for (const row of rows) {
    row.classList.remove('search-match');
  }
}

/** Public helper to select a node by its ID (used by search.js). */
export function selectNodeById(id) {
  selectNode(id);
}
