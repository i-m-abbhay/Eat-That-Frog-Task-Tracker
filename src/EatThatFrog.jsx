import React, { useState, useEffect } from 'react';
import { CheckCircle2, Flame, TrendingUp, Trash2, Plus, BarChart3, Filter, GripVertical, Layout, Calendar, ChevronLeft, ChevronRight, ChevronDown, Settings, Search, Download, Upload, RotateCcw, Sun, Moon, Monitor, FileText, ListTodo, Undo2, HelpCircle, Repeat } from 'lucide-react';
import { storage } from './storage';
import {
  toDateKey,
  getTodayKey,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addDays,
  addWeeks,
  addMonths,
  isInWeek,
  isInMonth,
  formatDay,
  formatWeekRange,
  formatMonth,
  getDaysInWeek,
  getWeekNumbersInMonth,
  getCutoffForPreset,
  formatCutoffLabel,
  getNextRecurrenceDate,
} from './dateUtils';

function ScheduleTaskCard({
  task,
  getPriorityBadgeColor,
  getStatusLabel,
  setFrog,
  deleteTask,
  editingTaskId,
  editingText,
  setEditingText,
  startEditing,
  saveEditing,
  cancelEditing,
  compact = false,
}) {
  const isEditing = editingTaskId === task.id;
  return (
    <div className={`task-card bg-white rounded-lg p-3 shadow-md ${task.isFrog ? 'ring-2 ring-orange-500' : ''} ${compact ? 'p-2' : ''}`}>
      <div className={`flex items-start gap-2 ${compact ? 'flex-wrap' : ''}`}>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={saveEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEditing();
                if (e.key === 'Escape') cancelEditing();
              }}
              className="w-full text-sm text-gray-800 font-medium border border-orange-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className={`text-gray-800 font-medium break-words cursor-text hover:text-orange-600 transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
              onClick={() => startEditing(task)}
              title="Click to edit"
            >
              {task.text}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`${getPriorityBadgeColor(task.priority)} rounded px-1.5 py-0.5 font-bold text-xs`}>
            {task.priority}
          </span>
          {!compact && <span className="text-gray-400 text-xs hidden sm:inline">{getStatusLabel(task.status)}</span>}
          <button
            onClick={() => setFrog(task.id)}
            className={`p-1 rounded transition-all ${
              task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'
            }`}
            title="Mark as frog"
          >
            <Flame className="w-3 h-3" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EatThatFrog() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('kanban');
  const [stats, setStats] = useState({ today: 0, week: 0, frogStreak: 0 });
  const [filterFrog, setFilterFrog] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);
  const [quickAddColumn, setQuickAddColumn] = useState('todo');
  const [quickAddPriority, setQuickAddPriority] = useState('A');
  const [quickAddText, setQuickAddText] = useState('');
  const [dragOverCell, setDragOverCell] = useState(null); // { status, priority }
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const quickAddInputRef = React.useRef(null);
  const initialLoadDone = React.useRef(false);
  // Schedule view: 'daily' | 'weekly' | 'monthly', and the focus date (YYYY-MM-DD)
  const [scheduleRange, setScheduleRange] = useState('daily');
  const [focusDate, setFocusDate] = useState(getTodayKey());
  const [quickAddDate, setQuickAddDate] = useState(''); // YYYY-MM-DD or ''
  const [editingDateTaskId, setEditingDateTaskId] = useState(null);
  const [addTaskCell, setAddTaskCell] = useState(null); // { status, priority } when double-click add is active
  const [addTaskCellText, setAddTaskCellText] = useState('');
  const addTaskCellInputRef = React.useRef(null);
  const [settingsClearBeforeDate, setSettingsClearBeforeDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      return localStorage.getItem('frog-theme') || 'dark';
    } catch { return 'dark'; }
  });
  const importInputRef = React.useRef(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoState, setUndoState] = useState(null); // { tasks, stats, task, previousStatus, previousPriority, indexInCell }
  const undoTimeoutRef = React.useRef(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // show in-task confirmation instead of window.confirm
  const [expandedNotesTaskId, setExpandedNotesTaskId] = useState(null);
  const [expandedSubtasksTaskId, setExpandedSubtasksTaskId] = useState(null);

  const statuses = ['todo', 'progress', 'done'];
  const priorities = ['A', 'B', 'C', 'D', 'E'];

  const DEFAULT_ROW_HEIGHT = 160;
  const MIN_ROW_HEIGHT = 80;
  const MAX_ROW_HEIGHT = 480;
  const [rowHeights, setRowHeights] = useState(() => {
    const defaults = { A: DEFAULT_ROW_HEIGHT, B: DEFAULT_ROW_HEIGHT, C: DEFAULT_ROW_HEIGHT, D: DEFAULT_ROW_HEIGHT, E: DEFAULT_ROW_HEIGHT };
    try {
      const raw = localStorage.getItem('frog-kanban-rowHeights');
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
      }
    } catch (_) {}
    return defaults;
  });
  const [resizingPriority, setResizingPriority] = useState(null);
  const resizeStartYRef = React.useRef(0);
  const resizeStartHeightRef = React.useRef(0);

  // Load tasks from storage on mount (only load runs first; save is skipped until this completes)
  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksResult = await storage.get('frog-tasks-kanban');
        const statsResult = await storage.get('frog-stats-kanban');

        if (tasksResult && tasksResult.value) {
          setTasks(JSON.parse(tasksResult.value));
        }
        if (statsResult && statsResult.value) {
          setStats(JSON.parse(statsResult.value));
        }
      } catch (error) {
        console.log('No saved data found, starting fresh');
      } finally {
        initialLoadDone.current = true;
      }
    };
    loadData();
  }, []);

  // Save tasks whenever they change (skip initial mount so we don't overwrite before load completes)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-tasks-kanban', JSON.stringify(tasks));
  }, [tasks]);

  // Save stats whenever they change (skip initial mount)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-stats-kanban', JSON.stringify(stats));
  }, [stats]);

  // Persist row heights (layout)
  useEffect(() => {
    try {
      localStorage.setItem('frog-kanban-rowHeights', JSON.stringify(rowHeights));
    } catch (_) {}
  }, [rowHeights]);

  // Row resize: global mouse move/up when dragging
  useEffect(() => {
    if (!resizingPriority) return;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
    const onMove = (e) => {
      const delta = e.clientY - resizeStartYRef.current;
      let next = resizeStartHeightRef.current + delta;
      next = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, next));
      setRowHeights((prev) => ({ ...prev, [resizingPriority]: next }));
    };
    const onUp = () => {
      setResizingPriority(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [resizingPriority]);

  const handleResizeStart = (priority, e) => {
    e.preventDefault();
    setResizingPriority(priority);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = rowHeights[priority];
  };

  // Persist theme and apply to document
  const effectiveTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  useEffect(() => {
    try {
      localStorage.setItem('frog-theme', theme);
    } catch (_) {}
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme, effectiveTheme]);

  const addTask = (text, priority, status = 'todo', scheduledDate = null) => {
    if (!text.trim()) return;

    const task = {
      id: Date.now(),
      text: text,
      priority: priority,
      status: status,
      createdAt: new Date().toISOString(),
      isFrog: false,
      scheduledDate: scheduledDate || undefined,
      notes: '',
      subtasks: [],
      recurrence: 'none',
      collapsed: false,
    };

    setTasks([task, ...tasks]);
  };

  const quickAdd = () => {
    if (!quickAddText.trim()) return;
    const date = quickAddDate && quickAddDate.trim() ? quickAddDate.trim() : null;
    addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', date);
    setQuickAddText('');
    setQuickAddDate('');
  };

  const pushUndo = (tasksSnapshot, statsSnapshot, affectedTask, previousStatus, previousPriority, indexInCell) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoState({
      tasks: JSON.parse(JSON.stringify(tasksSnapshot)),
      stats: { ...statsSnapshot },
      task: affectedTask ? { ...affectedTask } : null,
      previousStatus: previousStatus ?? null,
      previousPriority: previousPriority ?? null,
      indexInCell: indexInCell ?? 0,
    });
    undoTimeoutRef.current = setTimeout(() => { setUndoState(null); undoTimeoutRef.current = null; }, 5000);
  };

  const handleUndo = () => {
    if (!undoState) return;
    setTasks(undoState.tasks);
    setStats(undoState.stats);
    setUndoState(null);
    if (undoTimeoutRef.current) { clearTimeout(undoTimeoutRef.current); undoTimeoutRef.current = null; }
  };

  const deleteTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const cellTasks = getFilteredTasks(task.status, task.priority);
    const indexInCell = Math.max(0, cellTasks.findIndex((t) => t.id === id));
    pushUndo(tasks, stats, task, task.status, task.priority, indexInCell);
    setTasks(tasks.filter((t) => t.id !== id));
    setConfirmDeleteId(null);
    if (editingTaskId === id) {
      setEditingTaskId(null);
      setEditingText('');
    }
  };

  const updateTask = (id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const toggleTaskCollapsed = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    updateTask(id, { collapsed: !(task.collapsed === true) });
  };

  const addSubtask = (taskId, text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const task = tasks.find((t) => t.id === taskId);
    const subtasks = Array.isArray(task.subtasks) ? [...task.subtasks] : [];
    subtasks.push({ id: Date.now(), text: trimmed, done: false });
    updateTask(taskId, { subtasks });
  };

  const toggleSubtask = (taskId, subtaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const subtasks = (task.subtasks || []).map((s) => s.id === subtaskId ? { ...s, done: !s.done } : s);
    updateTask(taskId, { subtasks });
  };

  const removeSubtask = (taskId, subtaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const subtasks = (task.subtasks || []).filter((s) => s.id !== subtaskId);
    updateTask(taskId, { subtasks });
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEditing = () => {
    if (editingTaskId == null) return;
    const trimmed = editingText.trim();
    if (trimmed) updateTask(editingTaskId, { text: trimmed });
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  /** Remove tasks created before this date (YYYY-MM-DD). Keeps tasks on or after cutoff. */
  const clearTasksBeforeDate = (cutoffDate) => {
    const kept = tasks.filter((t) => (t.createdAt || '').slice(0, 10) >= cutoffDate);
    const removed = tasks.length - kept.length;
    setTasks(kept);
    return removed;
  };

  const handleClearWithConfirm = (label, cutoffDate) => {
    const toRemove = tasks.filter((t) => (t.createdAt || '').slice(0, 10) < cutoffDate).length;
    if (toRemove === 0) {
      window.alert('No tasks found before that date.');
      return;
    }
    if (!window.confirm(`Remove ${toRemove} task(s) created before ${label}? This cannot be undone.`)) return;
    clearTasksBeforeDate(cutoffDate);
    window.alert(`Removed ${toRemove} task(s).`);
  };

  const handleExport = () => {
    const data = { tasks, stats, exportedAt: new Date().toISOString(), app: 'EatThatFrog' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eat-that-frog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (replace, data) => {
    try {
      const importedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const importedStats = data.stats && typeof data.stats === 'object'
        ? { today: Number(data.stats.today) || 0, week: Number(data.stats.week) || 0, frogStreak: Number(data.stats.frogStreak) || 0 }
        : { today: 0, week: 0, frogStreak: 0 };
      if (replace) {
        setTasks(importedTasks);
        setStats(importedStats);
        window.alert(`Imported ${importedTasks.length} task(s). Replaced all data.`);
      } else {
        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const merged = [...prev];
          importedTasks.forEach((t) => {
            if (!existingIds.has(t.id)) {
              existingIds.add(t.id);
              merged.push(t);
            } else {
              merged.push({ ...t, id: Date.now() + Math.random() });
            }
          });
          return merged;
        });
        setStats((prev) => ({
          today: prev.today + importedStats.today,
          week: prev.week + importedStats.week,
          frogStreak: prev.frogStreak + importedStats.frogStreak,
        }));
        window.alert(`Merged ${importedTasks.length} task(s). Stats added together.`);
      }
    } catch (e) {
      window.alert('Invalid file. Use a JSON backup from this app.');
    }
  };

  const handleResetStats = () => {
    if (!window.confirm('Reset all stats (Completed Today, This Week, Frogs Eaten) to zero? Tasks are not affected.')) return;
    setStats({ today: 0, week: 0, frogStreak: 0 });
    window.alert('Stats reset.');
  };

  const setFrog = (id) => {
    setTasks(
      tasks.map((t) => ({
        ...t,
        isFrog: t.id === id ? !t.isFrog : false,
      }))
    );
  };

  const moveTask = (taskId, newStatus, newPriority) => {
    const task = tasks.find((t) => t.id === taskId);
    const wasNotDone = task.status !== 'done';
    const cellTasks = getFilteredTasks(task.status, task.priority);
    const indexInCell = Math.max(0, cellTasks.findIndex((t) => t.id === taskId));
    pushUndo(tasks, stats, task, task.status, task.priority, indexInCell);

    setTasks((prev) => {
      let next = prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus !== undefined ? newStatus : t.status,
              priority: newPriority !== undefined ? newPriority : t.priority,
              completedAt: newStatus === 'done' && wasNotDone ? new Date().toISOString() : t.completedAt,
            }
          : t
      );
      if (newStatus === 'done' && wasNotDone && task.recurrence && task.recurrence !== 'none') {
        const from = (task.scheduledDate || (task.createdAt || '').slice(0, 10));
        const nextDate = getNextRecurrenceDate(task.recurrence, from);
        if (nextDate) {
          const copy = {
            ...task,
            id: Date.now(),
            status: 'todo',
            createdAt: new Date().toISOString(),
            completedAt: undefined,
            scheduledDate: nextDate,
            isFrog: false,
          };
          next = [copy, ...next];
        }
      }
      return next;
    });

    if (newStatus === 'done' && wasNotDone) {
      const today = new Date().toDateString();
      const taskDate = new Date(task.createdAt).toDateString();
      setStats((prev) => ({
        ...prev,
        today: taskDate === today ? prev.today + 1 : prev.today,
        week: prev.week + 1,
        frogStreak: task.isFrog ? prev.frogStreak + 1 : prev.frogStreak,
      }));
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status, priority) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ status, priority });
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverCell(null);
  };

  const handleDrop = (e, status, priority) => {
    e.preventDefault();
    setDragOverCell(null);
    if (draggedTask) {
      moveTask(draggedTask.id, status, priority);
      setDraggedTask(null);
    }
  };

  // Focus quick-add when pressing "n" or "/" (unless typing in an input)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '?') {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowShortcuts((s) => !s);
        }
        return;
      }
      if (e.key !== 'n' && e.key !== '/') return;
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      quickAddInputRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus inline add-task input when a cell is selected for add
  useEffect(() => {
    if (addTaskCell) {
      setAddTaskCellText('');
      addTaskCellInputRef.current?.focus();
    }
  }, [addTaskCell]);

  const handleAddTaskInCell = (status, priority) => {
    const text = addTaskCellText.trim();
    if (text) {
      addTask(text, priority, status);
    }
    setAddTaskCellText('');
    setAddTaskCell((prev) => (prev?.status === status && prev?.priority === priority ? null : prev));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      A: 'bg-red-50 border-red-300',
      B: 'bg-orange-50 border-orange-300',
      C: 'bg-yellow-50 border-yellow-300',
      D: 'bg-blue-50 border-blue-300',
      E: 'bg-gray-50 border-gray-300',
    };
    return colors[priority] || colors['C'];
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      A: 'bg-red-500 text-white',
      B: 'bg-orange-500 text-white',
      C: 'bg-yellow-500 text-white',
      D: 'bg-blue-500 text-white',
      E: 'bg-gray-500 text-white',
    };
    return colors[priority] || colors['C'];
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      A: 'Must Do',
      B: 'Should Do',
      C: 'Nice to Do',
      D: 'Delegate',
      E: 'Eliminate',
    };
    return labels[priority];
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: 'To Do',
      progress: 'In Progress',
      done: 'Done',
    };
    return labels[status];
  };

  const searchLower = searchQuery.trim().toLowerCase();
  const taskMatchesSearch = (t) => !searchLower || (t.text && t.text.toLowerCase().includes(searchLower));

  const getFilteredTasks = (status, priority) => {
    return tasks.filter((t) => {
      const statusMatch = t.status === status;
      const priorityMatch = t.priority === priority;
      const frogMatch = !filterFrog || t.isFrog;
      const priorityFilterMatch = filterPriority === 'all' || t.priority === filterPriority;
      const searchMatch = taskMatchesSearch(t);

      return statusMatch && priorityMatch && frogMatch && priorityFilterMatch && searchMatch;
    });
  };

  const todaysFrog = tasks.find((t) => t.isFrog && t.status !== 'done');

  const todayKey = getTodayKey();

  // Tasks with a scheduled date (for schedule views); respect search when set
  const tasksWithDate = tasks.filter((t) => t.scheduledDate && taskMatchesSearch(t));
  const getTasksForDate = (dateKey) =>
    tasksWithDate.filter((t) => t.scheduledDate === dateKey);
  const getOverdueTasks = () =>
    tasksWithDate.filter(
      (t) => t.scheduledDate < todayKey && t.status !== 'done'
    );
  const getTasksForWeek = (weekStartKey) =>
    tasksWithDate.filter((t) => isInWeek(t.scheduledDate, weekStartKey));
  const getTasksForMonth = (monthStartKey) =>
    tasksWithDate.filter((t) => isInMonth(t.scheduledDate, monthStartKey));

  const goToToday = () => setFocusDate(getTodayKey());
  const isViewingToday = focusDate === todayKey;
  const isViewingThisWeek = scheduleRange === 'weekly' && getWeekStart(focusDate) === getWeekStart(todayKey);
  const isViewingThisMonth = scheduleRange === 'monthly' && getMonthStart(focusDate) === getMonthStart(todayKey);

  return (
    <div className={`min-h-screen p-4 md:p-6 font-sans theme-root ${effectiveTheme === 'light' ? 'theme-light bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .theme-root.theme-light .text-white { color: #1e293b; }
        .theme-root.theme-light .text-gray-400 { color: #64748b; }
        .theme-root.theme-light .text-gray-300 { color: #475569; }
        .theme-root.theme-light .text-gray-500 { color: #64748b; }
        .theme-root.theme-light .bg-slate-800 { background-color: #e2e8f0; }
        .theme-root.theme-light .bg-slate-700 { background-color: #cbd5e1; }
        .theme-root.theme-light .border-slate-600 { border-color: #94a3b8; }
        .theme-root.theme-light .text-gray-800 { color: #1e293b; }
        .theme-root.theme-light .text-red-400 { color: #dc2626; }
        .theme-root.theme-light .text-amber-200 { color: #b45309; }
        .theme-root.theme-light .bg-amber-900\\/30 { background-color: rgba(251 191 36 / 0.2); }
        .theme-root.theme-light .border-amber-600\\/50 { border-color: rgba(217 119 6 / 0.5); }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(251, 146, 60, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(251, 146, 60, 0.6);
          }
        }

        .task-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .task-card.dragging {
          opacity: 0.5;
        }

        .kanban-column {
          transition: background-color 0.2s ease;
        }

        .kanban-column.drag-over {
          background-color: rgba(251, 146, 60, 0.1);
        }

        .kanban-resize-handle {
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .kanban-resize-handle:hover {
          box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.3);
        }
        .kanban-resize-handle.active {
          background-color: rgba(251, 146, 60, 0.9);
          box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.5);
        }
        .kanban-resize-handle .grip-line {
          width: 20px;
          height: 2px;
          border-radius: 1px;
          background-color: currentColor;
          opacity: 0.5;
        }
        .kanban-resize-handle:hover .grip-line,
        .kanban-resize-handle.active .grip-line {
          opacity: 0.9;
        }

        .frog-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 animate-[slideIn_0.4s_ease-out]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Flame className="w-12 h-12 text-orange-500" />
              <div>
                <h1
                  className="text-5xl font-bold text-white"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}
                >
                  EAT THAT FROG
                </h1>
                <p className="text-gray-400 text-sm">ABCDE Priority Matrix • Kanban Board</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('kanban')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  view === 'kanban' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Layout className="w-4 h-4 inline mr-2" />
                Board
              </button>
              <button
                onClick={() => { setView('schedule'); setFocusDate(getTodayKey()); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  view === 'schedule' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  view === 'analytics' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setView('about')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  view === 'about' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                About
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  view === 'settings' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
              <button
                onClick={() => setShowShortcuts((s) => !s)}
                className={`p-2 rounded-lg transition-all ${showShortcuts ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts modal */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowShortcuts(false)}>
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-600" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Keyboard shortcuts</h3>
                <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-white">×</button>
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">N</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">/</kbd> — Focus quick-add</li>
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">?</kbd> — This panel</li>
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Enter</kbd> — Save / add task</li>
                <li><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Escape</kbd> — Cancel edit / close</li>
              </ul>
            </div>
          </div>
        )}

        {view === 'kanban' ? (
          <>
            {/* Today's Frog Banner */}
            {todaysFrog && (
              <div className="mb-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white shadow-2xl frog-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Flame className="w-10 h-10" />
                    <div>
                      <div className="text-sm font-semibold opacity-90 uppercase tracking-wider">
                        Today's Frog
                      </div>
                      <div className="text-2xl font-bold">{todaysFrog.text}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-white/20 rounded-lg text-sm font-bold">
                      Priority {todaysFrog.priority}
                    </span>
                    <span className="px-4 py-2 bg-white/20 rounded-lg text-sm font-bold">
                      {getStatusLabel(todaysFrog.status)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters + Search */}
            <div className="mb-6 bg-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-semibold">Filter:</span>
                  <button
                    onClick={() => setFilterFrog(!filterFrog)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      filterFrog ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <Flame className="w-4 h-4 inline mr-1" />
                    Frogs Only
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-semibold">Priority:</span>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All</option>
                    <option value="A">A - Must Do</option>
                    <option value="B">B - Should Do</option>
                    <option value="C">C - Nice to Do</option>
                    <option value="D">D - Delegate</option>
                    <option value="E">E - Eliminate</option>
                  </select>
                </div>
              </div>
              <div className="relative min-w-[200px] flex-1 max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-8 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {searchQuery && (
              <p className="text-gray-400 text-xs mb-4 -mt-2">Showing tasks matching &quot;{searchQuery}&quot;</p>
            )}

            {/* Quick Add Bar */}
            <div className="mb-6 bg-slate-800 rounded-xl p-4">
              <div className="flex gap-3">
                <input
                  ref={quickAddInputRef}
                  type="text"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
                  placeholder="Quick add task... (or press N or / to focus)"
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                />
                <select
                  value={quickAddPriority || ''}
                  onChange={(e) => setQuickAddPriority(e.target.value)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Priority</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <select
                  value={quickAddColumn || ''}
                  onChange={(e) => setQuickAddColumn(e.target.value)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Status</option>
                  <option value="todo">To Do</option>
                  <option value="progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <input
                  type="date"
                  value={quickAddDate}
                  onChange={(e) => setQuickAddDate(e.target.value)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-w-[140px]"
                  title="Optional: schedule for a specific day"
                />
                <button
                  onClick={quickAdd}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Empty state */}
            {tasks.length === 0 && (
              <div className="mb-6 bg-slate-800/80 rounded-xl p-12 text-center border-2 border-dashed border-slate-600">
                <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
                <p className="text-gray-500 text-sm mb-4">Add one above with priority and status, or press <kbd className="px-2 py-0.5 bg-slate-700 rounded text-gray-300">N</kbd> or <kbd className="px-2 py-0.5 bg-slate-700 rounded text-gray-300">/</kbd> to focus the quick-add field.</p>
                <p className="text-gray-500 text-sm">Mark your most important task with the flame icon — that&apos;s your frog for the day.</p>
              </div>
            )}

            {/* Kanban Matrix */}
            <div className="overflow-x-auto">
              <div className="inline-flex gap-1 min-w-full">
                {/* Header Column for Priority Labels */}
                <div className="w-32 flex-shrink-0">
                  <div className="h-14 bg-slate-800 rounded-t-lg mb-1"></div>
                  {priorities.map((priority) => (
                    <React.Fragment key={priority}>
                      <div
                        style={{ height: rowHeights[priority] }}
                        className="bg-slate-800 rounded-lg mb-0 flex items-center justify-center flex-shrink-0"
                      >
                        <div className="text-center">
                          <div
                            className={`text-3xl font-bold mb-1 ${getPriorityBadgeColor(priority)} w-12 h-12 rounded-lg flex items-center justify-center mx-auto`}
                          >
                            {priority}
                          </div>
                          <div className="text-xs text-gray-400 font-semibold">{getPriorityLabel(priority)}</div>
                        </div>
                      </div>
                      <div
                        role="separator"
                        aria-label={`Resize row ${priority}`}
                        onMouseDown={(e) => handleResizeStart(priority, e)}
                        className={`kanban-resize-handle flex-shrink-0 cursor-ns-resize flex flex-col items-center justify-center gap-0.5 py-1.5 mb-1 rounded-md select-none ${resizingPriority === priority ? 'active bg-orange-500 text-white' : 'bg-slate-700/80 hover:bg-slate-600 text-slate-400'}`}
                        title="Drag to resize row"
                      >
                        <span className="grip-line" />
                        <span className="grip-line" />
                        <span className="grip-line" />
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Status Columns */}
                {statuses.map((status) => (
                  <div key={status} className="flex-1 min-w-[280px]">
                    <div className="h-14 bg-slate-800 rounded-t-lg mb-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-white font-bold text-lg uppercase tracking-wider">
                          {getStatusLabel(status)}
                        </div>
                      </div>
                    </div>

                    {priorities.map((priority) => {
                      const cellTasks = getFilteredTasks(status, priority);
                      const count = cellTasks.length;

                      return (
                        <React.Fragment key={`${status}-${priority}`}>
                        <div
                          style={{ height: rowHeights[priority] }}
                          className={`kanban-column ${getPriorityColor(priority)} border-2 rounded-lg mb-0 p-2 overflow-y-auto flex-shrink-0 ${
                            dragOverCell?.status === status && dragOverCell?.priority === priority ? 'drag-over' : ''
                          } ${addTaskCell?.status === status && addTaskCell?.priority === priority ? 'ring-2 ring-orange-500 ring-inset' : ''}`}
                          onDragOver={(e) => handleDragOver(e, status, priority)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, status, priority)}
                          onDoubleClick={(e) => {
                            if (!e.target.closest('.task-card')) setAddTaskCell({ status, priority });
                          }}
                          title="Double-click to add a task here"
                        >
                          {addTaskCell?.status === status && addTaskCell?.priority === priority && (
                            <div className="mb-2">
                              <input
                                ref={addTaskCellInputRef}
                                type="text"
                                value={addTaskCellText}
                                onChange={(e) => setAddTaskCellText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddTaskInCell(status, priority);
                                  if (e.key === 'Escape') { setAddTaskCell(null); setAddTaskCellText(''); }
                                }}
                                onBlur={() => handleAddTaskInCell(status, priority)}
                                placeholder={`New task (${getStatusLabel(status)}, ${priority})`}
                                className="w-full text-sm px-3 py-2 bg-white border-2 border-orange-500 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </div>
                          )}
                          {count > 0 && (
                            <div className="flex justify-end mb-1">
                              <span className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded-full font-bold">
                                {count}
                              </span>
                            </div>
                          )}

                          <div className="space-y-2">
                            {(() => {
                              const showGhost = undoState?.task && undoState.previousStatus === status && undoState.previousPriority === priority;
                              const ghostIndex = showGhost ? (undoState.indexInCell ?? 0) : -1;
                              const itemsToRender = showGhost
                                ? [...cellTasks.slice(0, ghostIndex), { __ghost: true, key: `ghost-${undoState.task.id}` }, ...cellTasks.slice(ghostIndex)]
                                : cellTasks.map((t) => ({ ...t, __ghost: false, key: t.id }));
                              return itemsToRender.map((item) => {
                                if (item.__ghost) {
                                  return (
                                    <div
                                      key={item.key}
                                      className="task-card bg-white rounded-lg shadow-md p-3 opacity-50 hover:opacity-90 transition-opacity group border border-dashed border-gray-400 pointer-events-auto cursor-default"
                                      style={{ minHeight: '52px' }}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-gray-700 font-medium truncate flex-1">{undoState.task.text}</p>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-opacity"
                                        >
                                          <Undo2 className="w-3.5 h-3.5" /> Undo
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                                const task = item;
                                return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task)}
                                className={`task-card bg-white rounded-lg shadow-md ${
                                  draggedTask?.id === task.id ? 'dragging' : ''
                                } ${task.isFrog ? 'ring-2 ring-orange-500' : ''} ${task.collapsed ? 'p-2 cursor-pointer' : 'p-3 cursor-move'}`}
                              >
                                {confirmDeleteId === task.id ? (
                                  <div className="flex items-center justify-between gap-2 py-1" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-sm text-gray-700">Delete this task?</span>
                                    <div className="flex gap-1">
                                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs font-medium rounded bg-slate-200 text-gray-700 hover:bg-slate-300">Cancel</button>
                                      <button type="button" onClick={() => deleteTask(task.id)} className="px-2 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600">Delete</button>
                                    </div>
                                  </div>
                                ) : task.collapsed ? (
                                  <div
                                    className="flex items-center gap-2 min-w-0"
                                    onClick={(e) => { e.stopPropagation(); toggleTaskCollapsed(task.id); }}
                                    title="Click to expand"
                                  >
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" title="Drag to move" />
                                    <p className="text-sm text-gray-800 font-medium truncate flex-1 min-w-0">{task.text}</p>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {task.scheduledDate && (
                                        <span className="text-[10px] text-gray-500 whitespace-nowrap flex items-center" title={`Scheduled: ${formatDay(task.scheduledDate)}`}>
                                          <Calendar className="w-3 h-3 mr-0.5 flex-shrink-0" />
                                          {new Date(task.scheduledDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {(task.subtasks || []).length > 0 && (
                                        <span className="text-[10px] text-gray-500" title="Checklist">
                                          {(task.subtasks || []).filter(s => s.done).length}/{(task.subtasks || []).length}
                                        </span>
                                      )}
                                      {task.notes && task.notes.trim() && (
                                        <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" title="Has note" />
                                      )}
                                      {task.recurrence && task.recurrence !== 'none' && (
                                        <Repeat className="w-3 h-3 text-gray-400 flex-shrink-0" title={`Repeats ${task.recurrence}`} />
                                      )}
                                    </div>
                                    <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => setFrog(task.id)}
                                        className={`p-1 rounded ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`}
                                        title="Mark as frog"
                                      >
                                        <Flame className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(task.id)}
                                        className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                <div className="flex items-start gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); toggleTaskCollapsed(task.id); }}
                                    className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                    title="Collapse"
                                  >
                                    <ChevronDown className="w-4 h-4 mt-0.5" />
                                  </button>
                                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    {editingTaskId === task.id ? (
                                      <input
                                        type="text"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        onBlur={saveEditing}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEditing();
                                          if (e.key === 'Escape') {
                                            setEditingTaskId(null);
                                            setEditingText('');
                                          }
                                        }}
                                        className="w-full text-sm text-gray-800 font-medium border border-orange-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <p
                                        className="text-sm text-gray-800 font-medium break-words cursor-text hover:text-orange-600 transition-colors"
                                        onClick={() => startEditing(task)}
                                        title="Click to edit"
                                      >
                                        {task.text}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => setFrog(task.id)}
                                      className={`p-1 rounded transition-all ${
                                        task.isFrog
                                          ? 'bg-orange-500 text-white'
                                          : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'
                                      }`}
                                      title="Mark as frog"
                                    >
                                      <Flame className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(task.id)}
                                      className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {/* Optional scheduled date */}
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  {editingDateTaskId === task.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="date"
                                        value={task.scheduledDate || ''}
                                        onChange={(e) => { updateTask(task.id, { scheduledDate: e.target.value || undefined }); if (!e.target.value) setEditingDateTaskId(null); }}
                                        onBlur={() => setEditingDateTaskId(null)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 w-full max-w-[140px]"
                                        autoFocus
                                      />
                                      <button type="button" onClick={() => setEditingDateTaskId(null)} className="text-xs text-gray-500 hover:text-gray-700">Done</button>
                                    </div>
                                  ) : task.scheduledDate ? (
                                    <button type="button" onClick={() => setEditingDateTaskId(task.id)} className="text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1" title="Change date">
                                      <Calendar className="w-3 h-3" /> {formatDay(task.scheduledDate)}
                                    </button>
                                  ) : (
                                    <button type="button" onClick={() => setEditingDateTaskId(task.id)} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1" title="Schedule for a day">
                                      <Calendar className="w-3 h-3" /> Add date
                                    </button>
                                  )}
                                </div>
                                {/* Notes */}
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                  {expandedNotesTaskId === task.id ? (
                                    <div>
                                      <textarea
                                        value={task.notes || ''}
                                        onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                                        onBlur={() => setExpandedNotesTaskId(null)}
                                        placeholder="Notes..."
                                        className="text-xs w-full border border-gray-300 rounded px-2 py-1 min-h-[60px] resize-y"
                                      />
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => setExpandedNotesTaskId(task.id)} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1">
                                      <FileText className="w-3 h-3" /> {task.notes ? `${task.notes.slice(0, 30)}${task.notes.length > 30 ? '…' : ''}` : 'Add note'}
                                    </button>
                                  )}
                                </div>
                                {/* Subtasks */}
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                  {expandedSubtasksTaskId === task.id ? (
                                    <div className="space-y-1">
                                      {(task.subtasks || []).map((st) => (
                                        <div key={st.id} className="flex items-center gap-2 text-xs">
                                          <input type="checkbox" checked={!!st.done} onChange={() => toggleSubtask(task.id, st.id)} className="rounded" />
                                          <span className={st.done ? 'line-through text-gray-500' : 'text-gray-800'}>{st.text}</span>
                                          <button type="button" onClick={() => removeSubtask(task.id, st.id)} className="text-red-500 hover:text-red-700 ml-auto">×</button>
                                        </div>
                                      ))}
                                      <form onSubmit={(e) => { e.preventDefault(); const input = e.target.querySelector('input'); if (input?.value.trim()) { addSubtask(task.id, input.value); input.value = ''; } }} className="flex gap-1">
                                        <input type="text" placeholder="Add step..." className="flex-1 text-xs border border-gray-300 rounded px-2 py-0.5" />
                                        <button type="submit" className="text-xs text-orange-600 font-medium">Add</button>
                                      </form>
                                      <button type="button" onClick={() => setExpandedSubtasksTaskId(null)} className="text-xs text-gray-500">Close</button>
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => setExpandedSubtasksTaskId(task.id)} className="text-xs text-gray-400 hover:text-orange-600 flex items-center gap-1">
                                      <ListTodo className="w-3 h-3" /> {(task.subtasks || []).length ? `${(task.subtasks || []).filter(s => s.done).length}/${(task.subtasks || []).length} steps` : 'Checklist'}
                                    </button>
                                  )}
                                </div>
                                {/* Recurrence */}
                                <div className="mt-1 pt-1 border-t border-gray-100 flex items-center gap-2">
                                  <Repeat className="w-3 h-3 text-gray-400" />
                                  <select
                                    value={task.recurrence || 'none'}
                                    onChange={(e) => updateTask(task.id, { recurrence: e.target.value })}
                                    className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                  >
                                    <option value="none">No repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                  </select>
                                </div>
                                  </> 
                                )}
                              </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                        <div
                          role="separator"
                          aria-label={`Resize row ${priority}`}
                          onMouseDown={(e) => handleResizeStart(priority, e)}
                          className={`kanban-resize-handle flex-shrink-0 cursor-ns-resize flex flex-col items-center justify-center gap-0.5 py-1.5 mb-1 rounded-md select-none ${resizingPriority === priority ? 'active bg-orange-500 text-white' : 'bg-slate-700/80 hover:bg-slate-600 text-slate-400'}`}
                          title="Drag to resize row"
                        >
                          <span className="grip-line" />
                          <span className="grip-line" />
                          <span className="grip-line" />
                        </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* No tasks match filters or search */}
            {tasks.length > 0 && searchQuery.trim() && !tasks.some(taskMatchesSearch) && (
              <div className="mt-4 bg-amber-900/30 border border-amber-600/50 rounded-lg px-4 py-2 text-amber-200 text-sm">
                No tasks match &quot;{searchQuery}&quot;. Clear search or try different keywords.
              </div>
            )}
            {tasks.length > 0 && !searchQuery.trim() && (filterFrog || filterPriority !== 'all') && tasks.filter(t => (!filterFrog || t.isFrog) && (filterPriority === 'all' || t.priority === filterPriority)).length === 0 && (
              <div className="mt-4 bg-amber-900/30 border border-amber-600/50 rounded-lg px-4 py-2 text-amber-200 text-sm">
                No tasks match the current filters. Try &quot;All&quot; or turn off &quot;Frogs Only&quot;.
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 bg-slate-800 rounded-xl p-4">
              <div className="text-sm text-gray-400">
                <strong className="text-white">How to use:</strong> Double-click a cell to add a task. Drag to change status/priority. Click text to edit. Flame = today&apos;s frog. Add note, checklist, or repeat (daily/weekly/monthly) on each card. After delete or move, the task fades in place — hover it and click <strong>Undo</strong> within 5s. Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-gray-300">?</kbd> for shortcuts.
              </div>
            </div>
          </>
        ) : view === 'schedule' ? (
          /* Schedule View: Daily | Weekly | Monthly */
          <div className="space-y-6">
            {/* Search in Schedule */}
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scheduled tasks..."
                  className="w-full max-w-xs pl-9 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm"
                />
              </div>
            </div>
            {/* Quick-add for Schedule: task + date defaulting to focus date */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && quickAddText.trim()) { const d = quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey); addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', d); setQuickAddText(''); setQuickAddDate(''); } }}
                  placeholder="Add task for this day/week/month..."
                  className="flex-1 min-w-[200px] px-4 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="date"
                  value={quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey)}
                  onChange={(e) => setQuickAddDate(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                  title="Scheduled date"
                />
                <select
                  value={quickAddPriority || 'A'}
                  onChange={(e) => setQuickAddPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
                <button
                  onClick={() => { if (quickAddText.trim()) { const d = quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey); addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', d); setQuickAddText(''); setQuickAddDate(''); } }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5 inline" />
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Date defaults to the day/week/month you’re viewing. Tasks appear here and on the Board.</p>
            </div>

            {/* Schedule sub-tabs + date navigation */}
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {(['daily', 'weekly', 'monthly']).map((range) => (
                    <button
                      key={range}
                      onClick={() => setScheduleRange(range)}
                      className={`px-4 py-2 rounded-lg font-semibold capitalize transition-all ${
                        scheduleRange === range ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {range === 'daily' ? 'Day' : range === 'weekly' ? 'Week' : 'Month'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFocusDate(scheduleRange === 'daily' ? addDays(focusDate, -1) : scheduleRange === 'weekly' ? addWeeks(focusDate, -1) : addMonths(focusDate, -1))}
                    className="p-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToToday}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      (scheduleRange === 'daily' && isViewingToday) || (scheduleRange === 'weekly' && isViewingThisWeek) || (scheduleRange === 'monthly' && isViewingThisMonth)
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {scheduleRange === 'daily' ? 'Today' : scheduleRange === 'weekly' ? 'This week' : 'This month'}
                  </button>
                  <button
                    onClick={() => setFocusDate(scheduleRange === 'daily' ? addDays(focusDate, 1) : scheduleRange === 'weekly' ? addWeeks(focusDate, 1) : addMonths(focusDate, 1))}
                    className="p-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 text-gray-400 text-sm font-medium">
                {scheduleRange === 'daily' && formatDay(focusDate)}
                {scheduleRange === 'weekly' && formatWeekRange(getWeekStart(focusDate)).long}
                {scheduleRange === 'monthly' && formatMonth(getMonthStart(focusDate))}
              </div>
            </div>

            {/* Schedule content */}
            {scheduleRange === 'daily' && (
              <div className="space-y-6">
                {getOverdueTasks().length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                      <span>Overdue</span>
                      <span className="text-sm font-normal text-gray-500">({getOverdueTasks().length})</span>
                    </h3>
                    <div className="space-y-2">
                      {getOverdueTasks().map((task) => (
                        <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">{formatDay(focusDate)}</h3>
                  {getTasksForDate(focusDate).length === 0 ? (
                    <p className="text-gray-500 py-6 bg-slate-800 rounded-xl text-center">No tasks scheduled for this day. Add a date when creating a task on the Board.</p>
                  ) : (
                    <div className="space-y-2">
                      {getTasksForDate(focusDate).map((task) => (
                        <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {scheduleRange === 'weekly' && (() => {
              const weekStart = getWeekStart(focusDate);
              const days = getDaysInWeek(weekStart);
              const weekTasks = getTasksForWeek(weekStart);
              return (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {days.map((dayKey) => {
                    const dayTasks = weekTasks.filter((t) => t.scheduledDate === dayKey);
                    const isToday = dayKey === todayKey;
                    return (
                      <div key={dayKey} className={`rounded-xl p-4 min-h-[200px] ${isToday ? 'bg-orange-500/10 border-2 border-orange-500/50' : 'bg-slate-800'}`}>
                        <div className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                          {formatDay(dayKey)}
                          {isToday && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">Today</span>}
                        </div>
                        <div className="space-y-2">
                          {dayTasks.length === 0 ? (
                            <p className="text-gray-500 text-xs">No tasks</p>
                          ) : (
                            dayTasks.map((task) => (
                              <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} compact />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {scheduleRange === 'monthly' && (() => {
              const monthStart = getMonthStart(focusDate);
              const weeks = getWeekNumbersInMonth(monthStart);
              const monthTasks = getTasksForMonth(monthStart);
              return (
                <div className="space-y-6">
                  {weeks.map((weekStartKey) => {
                    const days = getDaysInWeek(weekStartKey);
                    const weekTasks = monthTasks.filter((t) => days.includes(t.scheduledDate));
                    if (weekTasks.length === 0) return null;
                    return (
                      <div key={weekStartKey} className="bg-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">{formatWeekRange(weekStartKey).short}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                          {days.map((dayKey) => {
                            const dayTasks = weekTasks.filter((t) => t.scheduledDate === dayKey);
                            if (dayTasks.length === 0) return null;
                            return (
                              <div key={dayKey}>
                                <div className="text-xs font-semibold text-gray-500 mb-1">{formatDay(dayKey)}</div>
                                <div className="space-y-1">
                                  {dayTasks.map((task) => (
                                    <ScheduleTaskCard key={task.id} task={task} getPriorityBadgeColor={getPriorityBadgeColor} getStatusLabel={getStatusLabel} setFrog={setFrog} deleteTask={deleteTask} editingTaskId={editingTaskId} editingText={editingText} setEditingText={setEditingText} startEditing={startEditing} saveEditing={saveEditing} cancelEditing={cancelEditing} compact />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {monthTasks.length === 0 && (
                    <p className="text-gray-500 py-12 bg-slate-800 rounded-xl text-center">No tasks scheduled this month. Add a date when creating tasks on the Board.</p>
                  )}
                </div>
              );
            })()}
          </div>
        ) : view === 'about' ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>SUMMARY OF BRIAN TRACY&apos;S BOOK</h2>
              <p className="text-xl font-semibold text-orange-200">Eat That Frog!</p>
              <p className="text-gray-400 text-sm mt-1">21 Great Ways to Stop Procrastinating and Get More Done in Less Time</p>
            </div>
            <div className="space-y-6 text-gray-300">
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Why &quot;Eat That Frog&quot;?</h3>
                <p className="leading-relaxed mb-2">If you have to eat a frog, do it first thing in the morning. If you have to eat two frogs, eat the biggest one first.</p>
                <p className="leading-relaxed">The <strong className="text-white">frog</strong> is your <strong className="text-white">most important task</strong> — the one that will bring you the most success. These tasks often deliver five or ten times the value of others. They&apos;re also usually the hardest. You can&apos;t eat every tadpole in the pond, but eating the <strong className="text-white">biggest and ugliest frog</strong> first sets you up for consistent success.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Three Questions to Ask Yourself</h3>
                <p className="text-sm text-gray-400 mb-2">To maximize productivity and eat your frog first:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex gap-2"><span className="text-orange-400">1.</span> What are my highest-value activities?</li>
                  <li className="flex gap-2"><span className="text-orange-400">2.</span> What can I, and only I, do that, if done well, will make a genuine difference?</li>
                  <li className="flex gap-2"><span className="text-orange-400">3.</span> What is the most valuable use of my time right now?</li>
                </ul>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Planning: Think on Paper</h3>
                <p className="leading-relaxed mb-2">Decide what you want and <strong className="text-white">write it down</strong>. Set a deadline and sub-deadlines — without them, goals lack urgency. Create a list of sub-tasks, organise them into a plan, visualise it, then take action. Build in daily activities that move you toward your goals.</p>
                <p className="text-orange-200 font-medium italic">Proper Prior Planning Prevents Poor Performance.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">A Step-by-Step Approach to Planning</h3>
                <ul className="space-y-2">
                  <li><strong className="text-white">Write a list</strong> — everything you have to do before you work through the plan.</li>
                  <li><strong className="text-white">Work from the list</strong> — treat it as your reference. Add new things to the list first, even if urgent.</li>
                  <li><strong className="text-white">Plan ahead</strong> — e.g. the night before; let your subconscious work on it overnight.</li>
                  <li><strong className="text-white">Update the list</strong> — move unfinished items to the next day and tick off completed ones.</li>
                </ul>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Focus on the Top 20 Percent</h3>
                <p className="leading-relaxed">Refuse to work on the bottom 80 percent while you still have tasks in the top 20 percent. Practising this consistently builds the habit of tackling the most critical tasks first.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Key Result Areas</h3>
                <p className="leading-relaxed">Key result areas are areas of work for which <strong className="text-white">you</strong> are entirely responsible. If you don&apos;t do this work, it won&apos;t get done — and the output is often crucial for others. Find them by listing your most important output responsibilities and asking what others need from you to start their work.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">Why We Procrastinate — and How to Get Better</h3>
                <p className="leading-relaxed mb-2">A major cause of procrastination is feeling weak or deficient in one part of a task. The more you practise, the better you get at eating that kind of frog.</p>
                <p className="leading-relaxed text-orange-200 font-medium">Everything is learnable.</p>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">The ABCDE Method (Priority System)</h3>
                <p className="leading-relaxed mb-3">Tracy recommends labelling tasks by impact. This app uses the same A–E priorities:</p>
                <ul className="space-y-1.5 text-sm">
                  <li><strong className="text-white">A</strong> — Must do; serious consequences if you don&apos;t.</li>
                  <li><strong className="text-white">B</strong> — Should do; mild consequences.</li>
                  <li><strong className="text-white">C</strong> — Nice to do; no consequences.</li>
                  <li><strong className="text-white">D</strong> — Delegate; someone else can do it.</li>
                  <li><strong className="text-white">E</strong> — Eliminate; drop it if it no longer matters.</li>
                </ul>
              </section>
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-200 mb-3">You Are Unique</h3>
                <p className="leading-relaxed">You have talents and abilities that nobody else has. The goal of this method — and this app — is to help you use your time and focus where they matter most: on your frog first.</p>
              </section>
              <section className="bg-gradient-to-r from-orange-600/20 to-slate-800 rounded-xl p-6 border border-orange-500/30 text-center">
                <p className="text-gray-300 text-sm italic">Brian Tracy, <em>Eat That Frog!</em> — 21 Great Ways to Stop Procrastinating and Get More Done in Less Time.</p>
              </section>
            </div>
          </div>
        ) : view === 'settings' ? (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="hidden">
              <h2 className="text-xl font-bold text-white mb-2">About (moved to About tab)</h2>
              <p className="text-gray-300 text-sm mb-4">
                This app is inspired by <strong className="text-white">Brian Tracy&apos;s <em>Eat That Frog!</em></strong> — a method for doing your most important work first. Here&apos;s the thinking behind it.
              </p>
              <div className="space-y-4 text-sm text-gray-300 max-h-[320px] overflow-y-auto pr-2">
                <div>
                  <h3 className="font-semibold text-orange-200 mb-1">Why “eat that frog”?</h3>
                  <p>The <strong>frog</strong> is your most important task — often worth 5–10× the others. It&apos;s usually the hardest. Eat the biggest, ugliest frog first; you can&apos;t eat every tadpole in the pond, but that one sets you up for success.</p>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Theme</h2>
              <p className="text-gray-400 text-sm mb-4">Choose light, dark, or follow your system.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      theme === value ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export / Import */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Backup & restore</h2>
              <p className="text-gray-400 text-sm mb-4">Export all tasks and stats as JSON. Import to restore or merge with current data.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                >
                  <Download className="w-4 h-4" /> Export backup
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const input = e.target;
                    if (!input.files?.length) return;
                    const file = input.files[0];
                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        const data = JSON.parse(reader.result);
                        const replace = window.confirm('Replace all data with the file? (Cancel = merge with current data)');
                        handleImport(replace, data);
                      } catch (err) {
                        window.alert('Invalid file. Use a JSON backup from this app.');
                      }
                      input.value = '';
                    };
                    reader.readAsText(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" /> Import backup
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Import will ask: Replace all data or Merge (add tasks, add stats).</p>
            </div>

            {/* Board layout */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Board layout</h2>
              <p className="text-gray-400 text-sm mb-4">Kanban row heights are saved automatically. Reset to default heights.</p>
              <button
                type="button"
                onClick={() => setRowHeights({ A: DEFAULT_ROW_HEIGHT, B: DEFAULT_ROW_HEIGHT, C: DEFAULT_ROW_HEIGHT, D: DEFAULT_ROW_HEIGHT, E: DEFAULT_ROW_HEIGHT })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
              >
                <Layout className="w-4 h-4" /> Reset row heights
              </button>
            </div>

            {/* Reset stats */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Reset stats</h2>
              <p className="text-gray-400 text-sm mb-4">Set Completed Today, This Week, and Frogs Eaten back to zero. Your tasks are not changed.</p>
              <button
                type="button"
                onClick={handleResetStats}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/50 text-red-200 hover:bg-red-800/50 font-medium text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset stats
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-1">Clear old data</h2>
              <p className="text-gray-400 text-sm mb-6">
                Remove tasks created before a chosen date. Tasks on or after the cutoff are kept. Stats are not changed.
              </p>

              <div className="space-y-4">
                <p className="text-gray-300 text-sm font-medium">Quick options</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleClearWithConfirm(formatCutoffLabel('lastMonth'), getCutoffForPreset('lastMonth'))}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                  >
                    Till last month (keep from {formatCutoffLabel('lastMonth')})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearWithConfirm(formatCutoffLabel('last6Months'), getCutoffForPreset('last6Months'))}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                  >
                    Till last 6 months (keep from {formatCutoffLabel('last6Months')})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearWithConfirm(formatCutoffLabel('lastYear'), getCutoffForPreset('lastYear'))}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-gray-200 hover:bg-slate-600 font-medium text-sm transition-colors"
                  >
                    Till last year (keep from {formatCutoffLabel('lastYear')})
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <p className="text-gray-300 text-sm font-medium mb-2">Custom date</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      id="settings-clear-date"
                      value={settingsClearBeforeDate}
                      onChange={(e) => setSettingsClearBeforeDate(e.target.value)}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!settingsClearBeforeDate}
                      onClick={() => {
                        if (settingsClearBeforeDate) {
                          const label = new Date(settingsClearBeforeDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                          handleClearWithConfirm(label, settingsClearBeforeDate);
                          setSettingsClearBeforeDate('');
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-900/50 text-red-200 hover:bg-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                    >
                      Clear before this date
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">Tasks created on or after the chosen date are kept.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Analytics View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stats.today}</div>
                <div className="text-gray-400">Completed Today</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stats.week}</div>
                <div className="text-gray-400">This Week</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stats.frogStreak}</div>
                <div className="text-gray-400">Frogs Eaten</div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">Task Distribution by Priority</h3>

              {priorities.map((priority) => {
                const count = tasks.filter((t) => t.priority === priority && t.status !== 'done').length;
                const total = tasks.filter((t) => t.status !== 'done').length;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={priority} className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-white">
                        Priority {priority} - {getPriorityLabel(priority)}
                      </span>
                      <span className="text-gray-400">
                        {count} tasks ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          priority === 'A'
                            ? 'bg-red-500'
                            : priority === 'B'
                              ? 'bg-orange-500'
                              : priority === 'C'
                                ? 'bg-yellow-500'
                                : priority === 'D'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-800 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">Task Distribution by Status</h3>

              <div className="grid grid-cols-3 gap-4">
                {statuses.map((status) => {
                  const count = tasks.filter((t) => t.status === status).length;
                  return (
                    <div key={status} className="bg-slate-700 rounded-lg p-6 text-center">
                      <div className="text-3xl font-bold text-white mb-2">{count}</div>
                      <div className="text-gray-400">{getStatusLabel(status)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-8 text-white">
              <h3
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}
              >
                EAT THAT FROG PRINCIPLES
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🐸</span>
                  <div>
                    <strong>Eat the ugliest frog first:</strong> Start with your most important, challenging task
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <strong>Do it first thing:</strong> Tackle your A tasks in the morning when your energy is highest
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <strong>Focus ruthlessly:</strong> Work on one task at a time until completion
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✂️</span>
                  <div>
                    <strong>Eliminate & delegate:</strong> Use D and E priorities to free up time for what matters
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
