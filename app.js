/**
 * TaskFlow — app.js
 * Interactive To-Do List Application
 *
 * Features:
 *  - Full CRUD (Create, Read, Update, Delete)
 *  - localStorage persistence
 *  - Filtering: All / Active / Completed
 *  - Sorting: Newest, Oldest, Priority, Alphabetical
 *  - Priority levels: Low, Medium, High
 *  - Delegated event listeners
 *  - Toast notifications
 *  - Light / Dark theme toggle
 *  - Keyboard accessibility (Escape to close modal)
 */

'use strict';

/* ============================================================
   1. CONSTANTS & STATE
   ============================================================ */

const STORAGE_KEY   = 'taskflow_tasks';
const THEME_KEY     = 'taskflow_theme';
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

/** @type {{ id: string, text: string, completed: boolean, priority: string, createdAt: number }[]} */
let tasks = [];
let currentFilter  = 'all';
let currentSort    = 'newest';
let editingTaskId  = null;

/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const formAddTask       = document.getElementById('form-add-task');
const inputTask         = document.getElementById('input-task');
const charCounter       = document.getElementById('char-counter');
const taskList          = document.getElementById('task-list');
const emptyState        = document.getElementById('empty-state');
const emptyTitle        = document.getElementById('empty-title');
const emptyDesc         = document.getElementById('empty-desc');

const statTotal         = document.getElementById('stat-total');
const statActive        = document.getElementById('stat-active');
const statCompleted     = document.getElementById('stat-completed');

const filterTabs        = document.querySelectorAll('.filter-tab');
const badgeAll          = document.getElementById('badge-all');
const badgeActive       = document.getElementById('badge-active');
const badgeCompleted    = document.getElementById('badge-completed');

const sortSelect        = document.getElementById('sort-select');
const btnMarkAll        = document.getElementById('btn-mark-all');
const btnClearCompleted = document.getElementById('btn-clear-completed');

const editModal         = document.getElementById('edit-modal');
const editInput         = document.getElementById('edit-input');
const btnModalClose     = document.getElementById('btn-modal-close');
const btnCancelEdit     = document.getElementById('btn-cancel-edit');
const btnSaveEdit       = document.getElementById('btn-save-edit');

const btnThemeToggle    = document.getElementById('btn-theme-toggle');
const toastContainer    = document.getElementById('toast-container');

/* Priority buttons (add form) */
const addPriorityBtns   = document.querySelectorAll('[data-priority]');
/* Priority buttons (edit modal) */
const editPriorityBtns  = document.querySelectorAll('[data-edit-priority]');

/* ============================================================
   3. LOCALSTORAGE HELPERS
   ============================================================ */

/**
 * Load tasks from localStorage.
 * @returns {Array}
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persist tasks to localStorage.
 */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Load theme preference from localStorage.
 * @returns {string} 'dark' | 'light'
 */
function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

/**
 * Save theme preference.
 * @param {string} theme
 */
function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/* ============================================================
   4. UTILITY HELPERS
   ============================================================ */

/**
 * Generate a unique ID (timestamp + random).
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Format a timestamp into a human-readable relative string.
 * @param {number} ts
 * @returns {string}
 */
function formatDate(ts) {
  const diff  = Date.now() - ts;
  const secs  = Math.floor(diff / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (secs  <  60) return 'Just now';
  if (mins  <  60) return `${mins}m ago`;
  if (hours <  24) return `${hours}h ago`;
  if (days  === 1) return 'Yesterday';
  if (days  <   7) return `${days}d ago`;

  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Sanitize text to prevent XSS when inserting via innerHTML.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   5. FILTER & SORT LOGIC
   ============================================================ */

/**
 * Returns the filtered list of tasks based on the current filter.
 * @returns {Array}
 */
function getFilteredTasks() {
  let filtered;
  switch (currentFilter) {
    case 'active':    filtered = tasks.filter(t => !t.completed);  break;
    case 'completed': filtered = tasks.filter(t =>  t.completed);  break;
    default:          filtered = [...tasks];
  }

  // Sort
  switch (currentSort) {
    case 'oldest':   filtered.sort((a, b) => a.createdAt - b.createdAt); break;
    case 'priority': filtered.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]); break;
    case 'alpha':    filtered.sort((a, b) => a.text.localeCompare(b.text)); break;
    default:         filtered.sort((a, b) => b.createdAt - a.createdAt); // newest
  }

  return filtered;
}

/* ============================================================
   6. RENDER ENGINE
   ============================================================ */

/**
 * Re-render the entire task list based on state.
 */
function render() {
  updateStats();
  renderTaskList();
}

/**
 * Update stat counters and filter badges.
 */
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active    = total - completed;

  statTotal.textContent     = total;
  statActive.textContent    = active;
  statCompleted.textContent = completed;

  badgeAll.textContent       = total;
  badgeActive.textContent    = active;
  badgeCompleted.textContent = completed;
}

/**
 * Build and inject task item HTML into the list.
 */
function renderTaskList() {
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    taskList.innerHTML = '';
    emptyState.hidden  = false;
    updateEmptyState();
    return;
  }

  emptyState.hidden = true;

  // Build all items as a DocumentFragment for performance
  const fragment = document.createDocumentFragment();
  filtered.forEach(task => {
    fragment.appendChild(createTaskElement(task));
  });

  taskList.innerHTML = '';
  taskList.appendChild(fragment);
}

/**
 * Update empty-state message text based on the active filter.
 */
function updateEmptyState() {
  switch (currentFilter) {
    case 'active':
      emptyTitle.textContent = 'All caught up! 🎉';
      emptyDesc.textContent  = 'No active tasks right now. Great job!';
      break;
    case 'completed':
      emptyTitle.textContent = 'Nothing completed yet';
      emptyDesc.textContent  = 'Start checking off tasks to see them here.';
      break;
    default:
      emptyTitle.textContent = 'No tasks here!';
      emptyDesc.textContent  = 'Add a new task above to get started.';
  }
}

/**
 * Create a <li> element for a given task object.
 * @param {{ id: string, text: string, completed: boolean, priority: string, createdAt: number }} task
 * @returns {HTMLLIElement}
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className     = `task-item${task.completed ? ' completed' : ''}`;
  li.dataset.id    = task.id;
  li.dataset.priority = task.priority;

  li.innerHTML = `
    <div class="task-checkbox-wrapper">
      <input
        type="checkbox"
        class="task-checkbox"
        id="task-cb-${sanitize(task.id)}"
        aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
        ${task.completed ? 'checked' : ''}
      />
    </div>
    <div class="task-content">
      <label class="task-text" for="task-cb-${sanitize(task.id)}">${sanitize(task.text)}</label>
      <div class="task-meta">
        <span class="task-date">${formatDate(task.createdAt)}</span>
        <span class="priority-badge">${sanitize(task.priority)}</span>
      </div>
    </div>
    <div class="task-actions" role="group" aria-label="Task actions">
      <button
        class="task-btn task-btn--edit"
        data-action="edit"
        data-id="${sanitize(task.id)}"
        aria-label="Edit task"
        title="Edit"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button
        class="task-btn task-btn--delete"
        data-action="delete"
        data-id="${sanitize(task.id)}"
        aria-label="Delete task"
        title="Delete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 11v6M14 11v6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  return li;
}

/* ============================================================
   7. CRUD OPERATIONS
   ============================================================ */

/**
 * CREATE — Add a new task.
 * @param {string} text
 * @param {string} priority
 */
function addTask(text, priority) {
  const trimmed = text.trim();
  if (!trimmed) {
    showToast('Please enter a task description.', 'warning');
    inputTask.focus();
    return;
  }

  const newTask = {
    id:        generateId(),
    text:      trimmed,
    completed: false,
    priority,
    createdAt: Date.now(),
  };

  tasks.unshift(newTask);
  saveTasks();
  render();
  showToast('Task added!', 'success');
}

/**
 * TOGGLE — Toggle a task's completed status.
 * @param {string} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  render();
  showToast(task.completed ? 'Task completed! 🎉' : 'Task marked as active.', 'info');
}

/**
 * UPDATE — Save edited text and priority to a task.
 * @param {string} id
 * @param {string} newText
 * @param {string} newPriority
 */
function updateTask(id, newText, newPriority) {
  const trimmed = newText.trim();
  if (!trimmed) {
    showToast('Task cannot be empty.', 'warning');
    return;
  }

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.text     = trimmed;
  task.priority = newPriority;
  saveTasks();
  render();
  closeModal();
  showToast('Task updated!', 'success');
}

/**
 * DELETE — Remove a task (with animation).
 * @param {string} id
 */
function deleteTask(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      render();
    }, { once: true });
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
  }
  showToast('Task deleted.', 'error');
}

/**
 * Mark ALL tasks as completed (or unmark all if all are already done).
 */
function markAllComplete() {
  const allDone = tasks.every(t => t.completed);
  tasks.forEach(t => { t.completed = !allDone; });
  saveTasks();
  render();
  showToast(allDone ? 'All tasks marked as active.' : 'All tasks completed! 🎉', 'info');
}

/**
 * Clear all completed tasks.
 */
function clearCompleted() {
  const count = tasks.filter(t => t.completed).length;
  if (count === 0) {
    showToast('No completed tasks to clear.', 'warning');
    return;
  }
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
  showToast(`Cleared ${count} completed task${count > 1 ? 's' : ''}.`, 'info');
}

/* ============================================================
   8. MODAL LOGIC
   ============================================================ */

/**
 * Open the edit modal for a task.
 * @param {string} id
 */
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingTaskId    = id;
  editInput.value  = task.text;

  // Set priority selection
  editPriorityBtns.forEach(btn => {
    const isActive = btn.dataset.editPriority === task.priority;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  editModal.hidden = false;
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => editInput.focus());
}

/**
 * Close the edit modal.
 */
function closeModal() {
  editModal.hidden = true;
  editingTaskId    = null;
  document.body.style.overflow = '';
}

/**
 * Get the currently selected priority inside the modal.
 * @returns {string}
 */
function getEditSelectedPriority() {
  const active = document.querySelector('[data-edit-priority].active');
  return active ? active.dataset.editPriority : 'low';
}

/* ============================================================
   9. TOAST NOTIFICATIONS
   ============================================================ */

const TOAST_ICONS = {
  success: '✅',
  error:   '🗑️',
  info:    'ℹ️',
  warning: '⚠️',
};

/**
 * Display a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration  ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 2800) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span>${sanitize(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ============================================================
   10. THEME TOGGLE
   ============================================================ */

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ============================================================
   11. PRIORITY BUTTON HELPERS
   ============================================================ */

/**
 * Get the selected priority from the Add Task form.
 * @returns {string}
 */
function getAddSelectedPriority() {
  const active = document.querySelector('[data-priority].active');
  return active ? active.dataset.priority : 'low';
}

/**
 * Handle clicks on priority buttons in either context.
 * @param {NodeList} buttons
 * @param {string}   attrName  'data-priority' | 'data-edit-priority'
 * @param {HTMLElement} target
 */
function handlePriorityClick(buttons, attrName, target) {
  buttons.forEach(btn => {
    const isActive = btn === target;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

/* ============================================================
   12. CHARACTER COUNTER
   ============================================================ */

function updateCharCounter(input, counterEl) {
  const len = input.value.length;
  const max = parseInt(input.getAttribute('maxlength'), 10);
  counterEl.textContent = `${len}/${max}`;

  counterEl.classList.remove('warn', 'danger');
  if (len >= max * 0.9) counterEl.classList.add('danger');
  else if (len >= max * 0.7) counterEl.classList.add('warn');
}

/* ============================================================
   13. EVENT LISTENERS
   ============================================================ */

// --- Add Task Form ---
formAddTask.addEventListener('submit', e => {
  e.preventDefault();
  addTask(inputTask.value, getAddSelectedPriority());
  inputTask.value = '';
  updateCharCounter(inputTask, charCounter);
  inputTask.focus();
});

// Character counter
inputTask.addEventListener('input', () => updateCharCounter(inputTask, charCounter));

// --- Delegated listener on task list (complete, edit, delete) ---
taskList.addEventListener('click', e => {
  // Checkbox toggle
  if (e.target.matches('.task-checkbox')) {
    const id = e.target.closest('.task-item').dataset.id;
    toggleTask(id);
    return;
  }

  // Action buttons
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;
  if (action === 'edit')   openEditModal(id);
  if (action === 'delete') deleteTask(id);
});

// --- Filter Tabs ---
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    currentFilter = tab.dataset.filter;

    filterTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    renderTaskList();
  });
});

// --- Sort Select ---
sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  renderTaskList();
});

// --- Bulk Actions ---
btnMarkAll.addEventListener('click', markAllComplete);
btnClearCompleted.addEventListener('click', clearCompleted);

// --- Priority buttons (Add Form) ---
addPriorityBtns.forEach(btn => {
  btn.addEventListener('click', () => handlePriorityClick(addPriorityBtns, 'data-priority', btn));
});

// --- Priority buttons (Edit Modal) ---
editPriorityBtns.forEach(btn => {
  btn.addEventListener('click', () => handlePriorityClick(editPriorityBtns, 'data-edit-priority', btn));
});

// --- Edit Modal Controls ---
btnModalClose.addEventListener('click', closeModal);
btnCancelEdit.addEventListener('click', closeModal);

btnSaveEdit.addEventListener('click', () => {
  if (editingTaskId) {
    updateTask(editingTaskId, editInput.value, getEditSelectedPriority());
  }
});

// Close modal on overlay backdrop click
editModal.addEventListener('click', e => {
  if (e.target === editModal) closeModal();
});

// Keyboard: Escape to close modal, Enter to save
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !editModal.hidden) {
    closeModal();
  }
  if (e.key === 'Enter' && !editModal.hidden && e.target !== editInput) {
    e.preventDefault();
    if (editingTaskId) updateTask(editingTaskId, editInput.value, getEditSelectedPriority());
  }
});

// --- Theme Toggle ---
btnThemeToggle.addEventListener('click', toggleTheme);

// ============================================================
//   14. REFRESH RELATIVE DATES (every 60s)
// ============================================================

setInterval(() => {
  const dateEls = taskList.querySelectorAll('.task-date');
  dateEls.forEach(el => {
    const li  = el.closest('.task-item');
    if (!li) return;
    const id  = li.dataset.id;
    const task = tasks.find(t => t.id === id);
    if (task) el.textContent = formatDate(task.createdAt);
  });
}, 60_000);

/* ============================================================
   15. INIT
   ============================================================ */

(function init() {
  // Load theme
  applyTheme(loadTheme());

  // Load tasks
  tasks = loadTasks();

  // Initial render
  render();

  // Focus the input on load
  inputTask.focus();
})();
