import React, { useState, useEffect } from 'react';
import {
  Layout, Calendar, BarChart3, Settings, FileText,
  HelpCircle, Timer, Menu, X, Focus, Flame, Droplets, Dumbbell,
} from 'lucide-react';
import { storage } from './storage';
import { initSync } from './syncService';
import {
  getTodayKey, getWeekStart, getMonthStart,
  isInWeek, isInMonth, getNextRecurrenceDate,
} from './dateUtils';
import { STATUSES, PRIORITIES, DEFAULT_ROW_HEIGHT, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT } from './constants';
import { getStatusLabel, getPriorityBadgeColor, formatDuration } from './utils/taskUtils';

import Confetti from './components/Confetti';
import HeaderFrog from './components/HeaderFrog';
import PomodoroTimer from './components/PomodoroTimer';
import WaterTracker from './components/WaterTracker';
import KanbanView from './views/KanbanView';
import FocusModeView from './views/FocusModeView';
import ScheduleView from './views/ScheduleView';
import AboutView from './views/AboutView';
import SettingsView from './views/SettingsView';
import AnalyticsView from './views/AnalyticsView';
import FitnessView from './views/FitnessView';

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
  const [dragOverCell, setDragOverCell] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const quickAddInputRef = React.useRef(null);
  const initialLoadDone = React.useRef(false);
  const [scheduleRange, setScheduleRange] = useState('daily');
  const [focusDate, setFocusDate] = useState(getTodayKey());
  const [quickAddDate, setQuickAddDate] = useState(getTodayKey());
  const [editingDateTaskId, setEditingDateTaskId] = useState(null);
  const [addTaskCell, setAddTaskCell] = useState(null);
  const [addTaskCellText, setAddTaskCellText] = useState('');
  const addTaskCellInputRef = React.useRef(null);
  const [settingsClearBeforeDate, setSettingsClearBeforeDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    try { return localStorage.getItem('frog-theme') || 'dark'; }
    catch { return 'dark'; }
  });
  const importInputRef = React.useRef(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoState, setUndoState] = useState(null);
  const undoTimeoutRef = React.useRef(null);
  const confettiTimerRef = React.useRef(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedNotesTaskId, setExpandedNotesTaskId] = useState(null);
  const [expandedSubtasksTaskId, setExpandedSubtasksTaskId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [moveMenuTaskId, setMoveMenuTaskId] = useState(null);
  const [addSheetCell, setAddSheetCell] = useState(null);
  const [addSheetForm, setAddSheetForm] = useState({ text: '', status: 'todo', priority: 'A', date: getTodayKey() });
  const [editSheetTaskId, setEditSheetTaskId] = useState(null);
  const [editSheetForm, setEditSheetForm] = useState({ text: '', status: 'todo', priority: 'A', scheduledDate: '', notes: '', recurrence: 'none' });
  const [mobileSelectedTaskId, setMobileSelectedTaskId] = useState(null);
  const [showGuideSection, setShowGuideSection] = useState(true);
  const [helpTooltipId, setHelpTooltipId] = useState(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showWaterTracker, setShowWaterTracker] = useState(false);
  const [waterLogs, setWaterLogs] = useState({});
  const [waterSettings, setWaterSettings] = useState({
    dailyGoalGlasses: 8,
    reminderIntervalMinutes: 60,
    reminderEnabled: false,
  });
  const [fitnessLogs, setFitnessLogs] = useState({});
  const [fitnessSettings, setFitnessSettings] = useState({ weightUnit: 'kg' });
  const waterReminderRef = React.useRef(null);
  const waterLogsRef = React.useRef(waterLogs);

  // Sync (Firebase): config and code from localStorage; status from connection
  const [syncConfig, setSyncConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('frog-sync-config');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  });
  const [syncCode, setSyncCode] = useState(() => localStorage.getItem('frog-sync-code') || '');
  const [syncEnabled, setSyncEnabled] = useState(() => localStorage.getItem('frog-sync-enabled') === 'true');
  const [syncStatus, setSyncStatus] = useState(''); // '', 'not_configured', 'connected', 'offline'
  const syncRef = React.useRef(null);
  const lastAppliedUpdatedAtRef = React.useRef(0);
  const applyingFromSyncRef = React.useRef(false);

  const statuses = STATUSES;
  const priorities = PRIORITIES;

  const [rowHeights, setRowHeights] = useState(() => {
    const defaults = { A: DEFAULT_ROW_HEIGHT, B: DEFAULT_ROW_HEIGHT, C: DEFAULT_ROW_HEIGHT, D: DEFAULT_ROW_HEIGHT, E: DEFAULT_ROW_HEIGHT };
    try {
      const raw = localStorage.getItem('frog-kanban-rowHeights');
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch (_) {}
    return defaults;
  });
  const [resizingPriority, setResizingPriority] = useState(null);
  const resizeStartYRef = React.useRef(0);
  const resizeStartHeightRef = React.useRef(0);

  useEffect(() => {
    if (addSheetCell) setAddSheetForm({ text: '', status: addSheetCell.status, priority: addSheetCell.priority, date: getTodayKey() });
  }, [addSheetCell]);

  useEffect(() => {
    if (editSheetTaskId) {
      const t = tasks.find((x) => x.id === editSheetTaskId);
      if (t) setEditSheetForm({ text: t.text, status: t.status, priority: t.priority, scheduledDate: t.scheduledDate || '', notes: t.notes || '', recurrence: t.recurrence || 'none' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSheetTaskId]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobileView(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksResult = await storage.get('frog-tasks-kanban');
        const statsResult = await storage.get('frog-stats-kanban');
        const waterLogsResult = await storage.get('frog-water-logs');
        const waterSettingsResult = await storage.get('frog-water-settings');
        const fitnessLogsResult = await storage.get('frog-fitness-logs');
        const fitnessSettingsResult = await storage.get('frog-fitness-settings');
        if (tasksResult?.value) {
          const loaded = JSON.parse(tasksResult.value);
          const normalized = Array.isArray(loaded)
            ? loaded.map((t) => ({
                ...t,
                totalTimeMs: t.totalTimeMs ?? 0,
                timerStartedAt: null, // never persist running state; clear orphaned timers on load
              }))
            : [];
          setTasks(normalized);
        }
        if (statsResult?.value) setStats(JSON.parse(statsResult.value));
        if (waterLogsResult?.value) setWaterLogs(JSON.parse(waterLogsResult.value));
        if (waterSettingsResult?.value) setWaterSettings((prev) => ({ ...prev, ...JSON.parse(waterSettingsResult.value) }));
        if (fitnessLogsResult?.value) setFitnessLogs(JSON.parse(fitnessLogsResult.value));
        if (fitnessSettingsResult?.value) setFitnessSettings((prev) => ({ ...prev, ...JSON.parse(fitnessSettingsResult.value) }));
      } catch {
        console.log('No saved data found, starting fresh');
      } finally {
        initialLoadDone.current = true;
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-tasks-kanban', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-stats-kanban', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-water-logs', JSON.stringify(waterLogs));
  }, [waterLogs]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-water-settings', JSON.stringify(waterSettings));
  }, [waterSettings]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-fitness-logs', JSON.stringify(fitnessLogs));
  }, [fitnessLogs]);

  useEffect(() => {
    if (!initialLoadDone.current) return;
    storage.set('frog-fitness-settings', JSON.stringify(fitnessSettings));
  }, [fitnessSettings]);

  useEffect(() => {
    try { localStorage.setItem('frog-kanban-rowHeights', JSON.stringify(rowHeights)); }
    catch (_) {}
  }, [rowHeights]);

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

  const effectiveTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  useEffect(() => {
    try { localStorage.setItem('frog-theme', theme); } catch (_) {}
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme, effectiveTheme]);

  // Persist sync settings to localStorage
  useEffect(() => {
    try {
      if (syncConfig) localStorage.setItem('frog-sync-config', JSON.stringify(syncConfig));
      else localStorage.removeItem('frog-sync-config');
      if (syncCode) localStorage.setItem('frog-sync-code', syncCode);
      else localStorage.removeItem('frog-sync-code');
      localStorage.setItem('frog-sync-enabled', syncEnabled ? 'true' : 'false');
    } catch (_) {}
  }, [syncConfig, syncCode, syncEnabled]);

  // Init Firebase sync when enabled with valid config + code
  useEffect(() => {
    if (!syncEnabled || !syncConfig?.apiKey || !syncConfig?.databaseURL || !syncCode?.trim()) {
      if (syncEnabled && (!syncConfig?.apiKey || !syncConfig?.databaseURL || !syncCode?.trim())) setSyncStatus('not_configured');
      else setSyncStatus('');
      syncRef.current = null;
      return;
    }
    const { write, listen, disconnect, deviceId, subscribeConnectStatus } = initSync(syncConfig, syncCode);
    syncRef.current = { write, deviceId };
    const unsubData = listen((data) => {
      if (data.sourceDeviceId === deviceId) return;
      if (data.updatedAt <= lastAppliedUpdatedAtRef.current) return;
      lastAppliedUpdatedAtRef.current = data.updatedAt;
      applyingFromSyncRef.current = true;
      const normalized = (data.tasks || []).map((t) => ({
        ...t,
        totalTimeMs: t.totalTimeMs ?? 0,
        timerStartedAt: null,
      }));
      const statsToApply = data.stats || { today: 0, week: 0, frogStreak: 0 };
      setTasks(normalized);
      setStats(statsToApply);
      storage.set('frog-tasks-kanban', JSON.stringify(normalized));
      storage.set('frog-stats-kanban', JSON.stringify(statsToApply));
      applyingFromSyncRef.current = false;
    });
    const unsubConn = subscribeConnectStatus((connected) => {
      setSyncStatus(connected ? 'connected' : 'offline');
    });
    return () => {
      unsubData();
      unsubConn();
      disconnect();
      syncRef.current = null;
    };
  }, [syncEnabled, syncConfig, syncCode]);

  // Push local tasks/stats to Firebase when they change (debounced in syncService)
  useEffect(() => {
    if (!initialLoadDone.current || applyingFromSyncRef.current) return;
    if (syncRef.current?.write) syncRef.current.write(tasks, stats);
  }, [tasks, stats]);

  // ─── Water reminder notifications ────────────────────────────────────────────

  // Keep the ref in sync so the interval callback always reads current logs
  // without needing waterLogs in the interval's dependency array.
  useEffect(() => {
    waterLogsRef.current = waterLogs;
  }, [waterLogs]);

  useEffect(() => {
    clearInterval(waterReminderRef.current);
    if (!waterSettings.reminderEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    waterReminderRef.current = setInterval(() => {
      const todayKey = getTodayKey();
      const todayEntries = waterLogsRef.current[todayKey] || [];
      const count = todayEntries.reduce((s, e) => s + e.amount, 0);
      if (count < waterSettings.dailyGoalGlasses) {
        new Notification('💧 Time to hydrate!', {
          body: `You've had ${count}/${waterSettings.dailyGoalGlasses} glasses today. Drink up!`,
          tag: 'water-reminder',
        });
      }
    }, waterSettings.reminderIntervalMinutes * 60 * 1000);
    return () => clearInterval(waterReminderRef.current);
  }, [waterSettings.reminderEnabled, waterSettings.reminderIntervalMinutes, waterSettings.dailyGoalGlasses]);

  const logWater = (amount) => {
    const todayKey = getTodayKey();
    setWaterLogs((prev) => ({
      ...prev,
      [todayKey]: [...(prev[todayKey] || []), { id: Date.now(), timestamp: new Date().toISOString(), amount }],
    }));
  };

  const removeLastWaterLog = () => {
    const todayKey = getTodayKey();
    setWaterLogs((prev) => {
      const entries = prev[todayKey] || [];
      if (entries.length === 0) return prev;
      return { ...prev, [todayKey]: entries.slice(0, -1) };
    });
  };

  const updateWaterSettings = (newSettings) => {
    setWaterSettings(newSettings);
  };

  const updateFitnessDay = (dateKey, updater) => {
    setFitnessLogs((prev) => {
      const cur = prev[dateKey] || { weight: null, workouts: [] };
      const next = typeof updater === 'function' ? updater(cur) : updater;
      return { ...prev, [dateKey]: next };
    });
  };

  const updateFitnessSettings = (next) => {
    setFitnessSettings(next);
  };

  // ─── Task CRUD ────────────────────────────────────────────────────────────────

  const addTask = (text, priority, status = 'todo', scheduledDate = null) => {
    if (!text.trim()) return;
    const task = {
      id: Date.now(), text, priority, status,
      createdAt: new Date().toISOString(), isFrog: false,
      scheduledDate: scheduledDate || undefined, notes: '',
      subtasks: [], recurrence: 'none', collapsed: false,
      totalTimeMs: 0, timerStartedAt: null,
    };
    setTasks([task, ...tasks]);
  };

  const quickAdd = () => {
    if (!quickAddText.trim()) return;
    const date = quickAddDate?.trim() || getTodayKey();
    addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', date);
    setQuickAddText('');
    setQuickAddDate(getTodayKey());
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
    if (editingTaskId === id) { setEditingTaskId(null); setEditingText(''); }
    if (editSheetTaskId === id) setEditSheetTaskId(null);
    if (mobileSelectedTaskId === id) setMobileSelectedTaskId(null);
  };

  const updateTask = (id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const startTimer = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, timerStartedAt: new Date().toISOString() } : t
      )
    );
  };

  const stopTimer = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || !t.timerStartedAt) return t;
        const elapsed = Date.now() - new Date(t.timerStartedAt).getTime();
        return {
          ...t,
          totalTimeMs: (t.totalTimeMs ?? 0) + elapsed,
          timerStartedAt: null,
        };
      })
    );
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

  const clearTasksBeforeDate = (cutoffDate) => {
    const kept = tasks.filter((t) => (t.createdAt || '').slice(0, 10) >= cutoffDate);
    const removed = tasks.length - kept.length;
    setTasks(kept);
    return removed;
  };

  const handleClearWithConfirm = (label, cutoffDate) => {
    const toRemove = tasks.filter((t) => (t.createdAt || '').slice(0, 10) < cutoffDate).length;
    if (toRemove === 0) { window.alert('No tasks found before that date.'); return; }
    if (!window.confirm(`Remove ${toRemove} task(s) created before ${label}? This cannot be undone.`)) return;
    clearTasksBeforeDate(cutoffDate);
    window.alert(`Removed ${toRemove} task(s).`);
  };

  const mergeWaterLogsImport = (prev, incoming) => {
    if (!incoming || typeof incoming !== 'object') return prev;
    const out = { ...prev };
    Object.entries(incoming).forEach(([k, arr]) => {
      if (!Array.isArray(arr)) return;
      out[k] = [...(out[k] || []), ...arr];
    });
    return out;
  };

  const mergeFitnessLogsImport = (prev, incoming) => {
    if (!incoming || typeof incoming !== 'object') return prev;
    const out = { ...prev };
    const stamp = Date.now();
    Object.entries(incoming).forEach(([k, day]) => {
      const a = out[k] || { weight: null, workouts: [] };
      const b = day && typeof day === 'object' ? day : { weight: null, workouts: [] };
      const newWorkouts = (b.workouts || []).map((w, wi) => ({
        ...w,
        id: `m-${stamp}-${k}-${wi}-${Math.random().toString(36).slice(2, 7)}`,
        exercises: (w.exercises || []).map((ex, ei) => ({
          ...ex,
          id: `m-${stamp}-${k}-${wi}-${ei}`,
          sets: Array.isArray(ex.sets) ? ex.sets.map((s) => ({ ...s })) : [],
        })),
      }));
      out[k] = {
        weight: a.weight != null && a.weight !== '' ? a.weight : (b.weight ?? null),
        workouts: [...(a.workouts || []), ...newWorkouts],
      };
    });
    return out;
  };

  const handleExport = () => {
    const data = {
      tasks,
      stats,
      exportedAt: new Date().toISOString(),
      app: 'EatThatFrog',
      waterLogs,
      waterSettings,
      fitnessLogs,
      fitnessSettings,
    };
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
        setWaterLogs(data.waterLogs && typeof data.waterLogs === 'object' ? data.waterLogs : {});
        setWaterSettings(
          data.waterSettings && typeof data.waterSettings === 'object'
            ? { dailyGoalGlasses: 8, reminderIntervalMinutes: 60, reminderEnabled: false, ...data.waterSettings }
            : { dailyGoalGlasses: 8, reminderIntervalMinutes: 60, reminderEnabled: false }
        );
        setFitnessLogs(data.fitnessLogs && typeof data.fitnessLogs === 'object' ? data.fitnessLogs : {});
        setFitnessSettings(
          data.fitnessSettings && typeof data.fitnessSettings === 'object'
            ? { weightUnit: 'kg', ...data.fitnessSettings }
            : { weightUnit: 'kg' }
        );
        window.alert(`Imported ${importedTasks.length} task(s). Replaced tasks and merged backup fields (water, fitness) when present.`);
      } else {
        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const merged = [...prev];
          importedTasks.forEach((t) => {
            if (!existingIds.has(t.id)) { existingIds.add(t.id); merged.push(t); }
            else merged.push({ ...t, id: Date.now() + Math.random() });
          });
          return merged;
        });
        setStats((prev) => ({
          today: prev.today + importedStats.today,
          week: prev.week + importedStats.week,
          frogStreak: prev.frogStreak + importedStats.frogStreak,
        }));
        if (data.waterLogs && typeof data.waterLogs === 'object') {
          setWaterLogs((prev) => mergeWaterLogsImport(prev, data.waterLogs));
        }
        if (data.waterSettings && typeof data.waterSettings === 'object') {
          setWaterSettings((prev) => ({ ...prev, ...data.waterSettings }));
        }
        if (data.fitnessLogs && typeof data.fitnessLogs === 'object') {
          setFitnessLogs((prev) => mergeFitnessLogsImport(prev, data.fitnessLogs));
        }
        if (data.fitnessSettings && typeof data.fitnessSettings === 'object') {
          setFitnessSettings((prev) => ({ ...prev, ...data.fitnessSettings }));
        }
        window.alert(`Merged ${importedTasks.length} task(s). Stats added together. Water/fitness merged when present in file.`);
      }
    } catch {
      window.alert('Invalid file. Use a JSON backup from this app.');
    }
  };

  const handleResetStats = () => {
    if (!window.confirm('Reset all stats (Completed Today, This Week, Frogs Eaten) to zero? Tasks are not affected.')) return;
    setStats({ today: 0, week: 0, frogStreak: 0 });
    window.alert('Stats reset.');
  };

  const setFrog = (id) => {
    setTasks(tasks.map((t) => ({ ...t, isFrog: t.id === id ? !t.isFrog : t.isFrog })));
  };

  const moveTask = (taskId, newStatus, newPriority) => {
    const task = tasks.find((t) => t.id === taskId);
    const wasNotDone = task.status !== 'done';
    const cellTasks = getFilteredTasks(task.status, task.priority);
    const indexInCell = Math.max(0, cellTasks.findIndex((t) => t.id === taskId));
    pushUndo(tasks, stats, task, task.status, task.priority, indexInCell);

    setTasks((prev) => {
      let next = prev.map((t) => {
        if (t.id !== taskId) return t;
        const updates = { status: newStatus ?? t.status, priority: newPriority ?? t.priority, completedAt: newStatus === 'done' && wasNotDone ? new Date().toISOString() : t.completedAt };
        if (newStatus === 'done' && t.timerStartedAt) {
          const elapsed = Date.now() - new Date(t.timerStartedAt).getTime();
          updates.totalTimeMs = (t.totalTimeMs ?? 0) + elapsed;
          updates.timerStartedAt = null;
        }
        return { ...t, ...updates };
      });
      if (newStatus === 'done' && wasNotDone && task.recurrence && task.recurrence !== 'none') {
        const from = task.scheduledDate || (task.createdAt || '').slice(0, 10);
        const nextDate = getNextRecurrenceDate(task.recurrence, from);
        if (nextDate) {
          const copy = { ...task, id: Date.now(), status: 'todo', createdAt: new Date().toISOString(), scheduledDate: nextDate, isFrog: false, completedAt: undefined, totalTimeMs: 0, timerStartedAt: null };
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
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    setConfettiKey((k) => k + 1);
    setConfettiActive(true);
    confettiTimerRef.current = setTimeout(() => {
      setConfettiActive(false);
      confettiTimerRef.current = null;
    }, 2600);
  };

  // ─── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e, status, priority) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const cards = Array.from(e.currentTarget.querySelectorAll('[data-task-id]'))
      .filter((el) => Number(el.dataset.taskId) !== draggedTask?.id);
    let insertBeforeTaskId = null;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) { insertBeforeTaskId = Number(card.dataset.taskId); break; }
    }
    setDragOverCell({ status, priority, insertBeforeTaskId });
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget?.contains(e.relatedTarget)) return;
    setDragOverCell(null);
  };

  const reorderTaskInCell = (taskId, status, priority, insertBeforeTaskId) => {
    setTasks((prev) => {
      const cellTasks = prev.filter((t) => t.status === status && t.priority === priority);
      const fromIdx = cellTasks.findIndex((t) => t.id === taskId);
      if (fromIdx === -1) return prev;
      const newCellOrder = [...cellTasks];
      const [removed] = newCellOrder.splice(fromIdx, 1);
      if (insertBeforeTaskId == null) newCellOrder.push(removed);
      else {
        const toIdx = newCellOrder.findIndex((t) => t.id === insertBeforeTaskId);
        if (toIdx === -1) newCellOrder.push(removed);
        else newCellOrder.splice(toIdx, 0, removed);
      }
      let j = 0;
      return prev.map((t) => {
        if (t.status !== status || t.priority !== priority) return t;
        return newCellOrder[j++];
      });
    });
  };

  const handleDrop = (e, status, priority) => {
    e.preventDefault();
    e.stopPropagation();
    const cell = dragOverCell;
    setDragOverCell(null);
    if (draggedTask) {
      const sameCell = draggedTask.status === status && draggedTask.priority === priority;
      if (sameCell) {
        const insertBeforeTaskId = cell?.insertBeforeTaskId ?? null;
        if (insertBeforeTaskId !== draggedTask.id) reorderTaskInCell(draggedTask.id, status, priority, insertBeforeTaskId);
      } else {
        moveTask(draggedTask.id, status, priority);
      }
      setDraggedTask(null);
    }
  };

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '?') {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') { e.preventDefault(); setShowShortcuts((s) => !s); }
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

  useEffect(() => {
    if (addTaskCell) { setAddTaskCellText(''); addTaskCellInputRef.current?.focus(); }
  }, [addTaskCell]);

  const handleAddTaskInCell = (status, priority) => {
    const text = addTaskCellText.trim();
    if (text) addTask(text, priority, status);
    setAddTaskCellText('');
    setAddTaskCell((prev) => (prev?.status === status && prev?.priority === priority ? null : prev));
  };

  // ─── Computed values ──────────────────────────────────────────────────────────

  const searchLower = searchQuery.trim().toLowerCase();
  const taskMatchesSearch = (t) => !searchLower || (t.text && t.text.toLowerCase().includes(searchLower));

  const getFilteredTasks = (status, priority) =>
    tasks.filter((t) =>
      t.status === status &&
      t.priority === priority &&
      (!filterFrog || t.isFrog) &&
      (filterPriority === 'all' || t.priority === filterPriority) &&
      taskMatchesSearch(t)
    );

  const todaysFrogs = tasks.filter((t) => t.isFrog && t.status !== 'done');
  const todayKey = getTodayKey();

  const tasksWithDate = tasks.filter((t) => t.scheduledDate && taskMatchesSearch(t));
  const getTasksForDate = (dateKey) => tasksWithDate.filter((t) => t.scheduledDate === dateKey);
  const getOverdueTasks = () => tasksWithDate.filter((t) => t.scheduledDate < todayKey && t.status !== 'done');
  const getTasksForWeek = (weekStartKey) => tasksWithDate.filter((t) => isInWeek(t.scheduledDate, weekStartKey));
  const getTasksForMonth = (monthStartKey) => tasksWithDate.filter((t) => isInMonth(t.scheduledDate, monthStartKey));

  const goToToday = () => setFocusDate(getTodayKey());
  const isViewingToday = focusDate === todayKey;
  const isViewingThisWeek = scheduleRange === 'weekly' && getWeekStart(focusDate) === getWeekStart(todayKey);
  const isViewingThisMonth = scheduleRange === 'monthly' && getMonthStart(focusDate) === getMonthStart(todayKey);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Confetti active={confettiActive} confettiKey={confettiKey} />
      <div className={`min-h-screen font-sans theme-root pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:pt-[max(1.5rem,env(safe-area-inset-top))] md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pl-[max(1.5rem,env(safe-area-inset-left))] ${effectiveTheme === 'light' ? 'theme-light bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
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
          @keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes glow { 0%,100% { box-shadow:0 0 20px rgba(251,146,60,0.4); } 50% { box-shadow:0 0 40px rgba(251,146,60,0.6); } }
          .task-card { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
          .task-card:hover { transform:translateY(-2px); box-shadow:0 8px 16px rgba(0,0,0,0.3); }
          .task-card.dragging { opacity:0.5; }
          .kanban-column { transition:background-color 0.2s ease; }
          .kanban-column.drag-over { background-color:rgba(251,146,60,0.1); }
          .kanban-resize-handle { transition:background-color 0.15s ease,box-shadow 0.15s ease; }
          .kanban-resize-handle:hover { box-shadow:0 0 0 1px rgba(251,146,60,0.3); }
          .kanban-resize-handle.active { background-color:rgba(251,146,60,0.9); box-shadow:0 0 0 2px rgba(251,146,60,0.5); }
          .kanban-resize-handle .grip-line { width:20px; height:2px; border-radius:1px; background-color:currentColor; opacity:0.5; }
          .kanban-resize-handle:hover .grip-line, .kanban-resize-handle.active .grip-line { opacity:0.9; }
          .frog-glow { animation:glow 2s ease-in-out infinite; }
        `}</style>

        <div className="max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="mb-4 md:mb-6 animate-[slideIn_0.4s_ease-out]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <HeaderFrog />
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
                    EAT THAT FROG
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">ABCDE Priority Matrix • Kanban Board</p>
                </div>
              </div>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                {[
                  { id: 'kanban', label: 'Board', Icon: Layout },
                  { id: 'schedule', label: 'Schedule', Icon: Calendar },
                  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
                  { id: 'fitness', label: 'Fitness', Icon: Dumbbell },
                  { id: 'about', label: 'About', Icon: FileText },
                  { id: 'settings', label: 'Settings', Icon: Settings },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setView(id); if (id === 'kanban') setShowFocusMode(false); if (id === 'schedule') setFocusDate(getTodayKey()); }}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${view === id ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  >
                    <Icon className="w-4 h-4 inline mr-1.5" />{label}
                  </button>
                ))}
                <button
                  onClick={() => setShowShortcuts((s) => !s)}
                  className="p-2 rounded-lg transition-all bg-slate-700 text-gray-300 hover:bg-slate-600"
                  title="Keyboard shortcuts (?)"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                {view === 'kanban' && (
                  <button
                    onClick={() => setShowFocusMode(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all text-sm bg-slate-700 text-gray-300 hover:bg-slate-600"
                    title="Focus mode"
                  >
                    <Focus className="w-4 h-4" />
                    <span className="hidden lg:inline">Focus</span>
                  </button>
                )}
                <button
                  onClick={() => setShowPomodoro((s) => !s)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${showPomodoro ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  title="Pomodoro Timer"
                >
                  <Timer className="w-4 h-4" />
                  <span className="hidden lg:inline">Timer</span>
                </button>
                <button
                  onClick={() => setShowWaterTracker((s) => !s)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${showWaterTracker ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                  title="Water Tracker"
                >
                  <Droplets className="w-4 h-4" />
                  <span className="hidden lg:inline">Water</span>
                </button>
              </div>

              {/* Mobile: hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500 transition-colors touch-manipulation"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile nav overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm animate-[slideIn_0.2s_ease-out]" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          )}
          <div className={`fixed top-0 right-0 z-40 w-full max-w-[280px] h-full bg-slate-800 border-l border-slate-600 shadow-2xl transform transition-transform duration-200 ease-out md:hidden pt-[calc(1rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} aria-modal="true" aria-label="Navigation menu">
            <div className="px-4 py-2 flex items-center justify-between border-b border-slate-600">
              <span className="text-gray-400 font-medium text-sm">Menu</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {[
                { id: 'kanban', label: 'Board', icon: Layout },
                { id: 'schedule', label: 'Schedule', icon: Calendar, onSelect: () => setFocusDate(getTodayKey()) },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'fitness', label: 'Fitness', icon: Dumbbell },
                { id: 'about', label: 'About', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map(({ id, label, icon: Icon, onSelect }) => (
                <button key={id} type="button" onClick={() => { setView(id); if (id === 'kanban') setShowFocusMode(false); onSelect?.(); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-colors touch-manipulation min-h-[44px] ${view === id ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-slate-700 active:bg-slate-600'}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />{label}
                </button>
              ))}
              <button type="button" onClick={() => { setShowShortcuts(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium text-gray-300 hover:bg-slate-700 active:bg-slate-600 transition-colors touch-manipulation min-h-[44px]">
                <HelpCircle className="w-5 h-5 flex-shrink-0" />Shortcuts
              </button>
              {view === 'kanban' && (
                <button type="button" onClick={() => { setView('kanban'); setShowFocusMode(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium text-gray-300 hover:bg-slate-700 active:bg-slate-600 transition-colors touch-manipulation min-h-[44px]">
                  <Focus className="w-5 h-5 flex-shrink-0" />Focus mode
                </button>
              )}
              <button type="button" onClick={() => { setShowPomodoro((s) => !s); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-colors touch-manipulation min-h-[44px] ${showPomodoro ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-slate-700 active:bg-slate-600'}`}>
                <Timer className="w-5 h-5 flex-shrink-0" />Focus Timer
              </button>
              <button type="button" onClick={() => { setShowWaterTracker((s) => !s); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium transition-colors touch-manipulation min-h-[44px] ${showWaterTracker ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-slate-700 active:bg-slate-600'}`}>
                <Droplets className="w-5 h-5 flex-shrink-0" />Water Tracker
              </button>
            </nav>
          </div>

          {/* Keyboard shortcuts modal */}
          {showShortcuts && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={() => setShowShortcuts(false)}>
              <div className="bg-slate-800 rounded-t-2xl sm:rounded-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-600 sm:border-t" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Keyboard shortcuts</h3>
                  <button onClick={() => setShowShortcuts(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation -mr-2" aria-label="Close">×</button>
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

          {/* Move task bottom sheet (mobile) */}
          {moveMenuTaskId && (() => {
            const moveTaskObj = tasks.find((t) => t.id === moveMenuTaskId);
            if (!moveTaskObj) return null;
            return (
              <>
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMoveMenuTaskId(null)} aria-hidden="true" />
                <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-800 rounded-t-2xl shadow-2xl border border-slate-600 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto" role="dialog" aria-label="Move task to column">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Move task</p>
                      <p className="text-white font-medium truncate">{moveTaskObj.text}</p>
                    </div>
                    <button type="button" onClick={() => setMoveMenuTaskId(null)} className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation" aria-label="Close">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {statuses.map((s) => (
                          <button key={s} type="button" onClick={() => { moveTask(moveTaskObj.id, s, moveTaskObj.priority); setMoveMenuTaskId(null); }} className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${moveTaskObj.status === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'}`}>
                            {getStatusLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-2">Priority</p>
                      <div className="flex flex-wrap gap-2">
                        {priorities.map((p) => (
                          <button key={p} type="button" onClick={() => { moveTask(moveTaskObj.id, moveTaskObj.status, p); setMoveMenuTaskId(null); }} className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-colors touch-manipulation ${getPriorityBadgeColor(p)} ${moveTaskObj.priority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-90 hover:opacity-100 active:opacity-100'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs mt-3">Tap a status or priority to move. Tap again to change the other.</p>
                </div>
              </>
            );
          })()}

          {/* Add Task bottom sheet (mobile) */}
          {addSheetCell && (
            <>
              <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setAddSheetCell(null)} aria-hidden="true" />
              <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-800 rounded-t-2xl shadow-2xl border border-slate-600 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto" role="dialog" aria-label="Add task">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">New task</h2>
                  <button type="button" onClick={() => setAddSheetCell(null)} className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Task name</label>
                    <input type="text" value={addSheetForm.text} onChange={(e) => setAddSheetForm((f) => ({ ...f, text: e.target.value }))} placeholder="What do you need to do?" className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-base min-h-[48px] touch-manipulation" autoFocus />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((s) => (
                        <button key={s} type="button" onClick={() => setAddSheetForm((f) => ({ ...f, status: s }))} className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${addSheetForm.status === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'}`}>
                          {getStatusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-2">Priority</p>
                    <div className="flex flex-wrap gap-2">
                      {priorities.map((p) => (
                        <button key={p} type="button" onClick={() => setAddSheetForm((f) => ({ ...f, priority: p }))} className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-colors touch-manipulation ${getPriorityBadgeColor(p)} ${addSheetForm.priority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-90 hover:opacity-100'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-semibold mb-1.5">Schedule (optional)</label>
                    <input type="date" value={addSheetForm.date} onChange={(e) => setAddSheetForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-h-[48px] touch-manipulation" />
                  </div>
                  <button type="button" onClick={() => { const text = addSheetForm.text.trim(); if (text) { addTask(text, addSheetForm.priority, addSheetForm.status, addSheetForm.date || getTodayKey()); setAddSheetCell(null); } }} disabled={!addSheetForm.text.trim()} className="w-full min-h-[52px] rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation">
                    Add task
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Edit Task bottom sheet (mobile) */}
          {editSheetTaskId && (() => {
            const editTask = tasks.find((t) => t.id === editSheetTaskId);
            if (!editTask) return null;
            return (
              <>
                <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setEditSheetTaskId(null)} aria-hidden="true" />
                <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-800 rounded-t-2xl shadow-2xl border border-slate-600 border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto" role="dialog" aria-label="Edit task">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Edit task</h2>
                    <button type="button" onClick={() => setEditSheetTaskId(null)} className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation" aria-label="Close"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 font-semibold mb-1.5">Task name</label>
                      <input type="text" value={editSheetForm.text} onChange={(e) => setEditSheetForm((f) => ({ ...f, text: e.target.value }))} className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-base min-h-[48px] touch-manipulation" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {statuses.map((s) => (
                          <button key={s} type="button" onClick={() => setEditSheetForm((f) => ({ ...f, status: s }))} className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${editSheetForm.status === s ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'}`}>
                            {getStatusLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-2">Priority</p>
                      <div className="flex flex-wrap gap-2">
                        {priorities.map((p) => (
                          <button key={p} type="button" onClick={() => setEditSheetForm((f) => ({ ...f, priority: p }))} className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition-colors touch-manipulation ${getPriorityBadgeColor(p)} ${editSheetForm.priority === p ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : 'opacity-90 hover:opacity-100'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 font-semibold mb-1.5">Schedule</label>
                      <input type="date" value={editSheetForm.scheduledDate} onChange={(e) => setEditSheetForm((f) => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-h-[48px] touch-manipulation" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 font-semibold mb-1.5">Notes</label>
                      <textarea value={editSheetForm.notes} onChange={(e) => setEditSheetForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." rows={3} className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none resize-y min-h-[80px] touch-manipulation" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 font-semibold mb-1.5">Checklist</label>
                      <div className="space-y-2">
                        {(editTask.subtasks || []).map((st) => (
                          <div key={st.id} className="flex items-center gap-2">
                            <input type="checkbox" checked={!!st.done} onChange={() => toggleSubtask(editSheetTaskId, st.id)} className="rounded w-5 h-5 touch-manipulation" />
                            <span className={`flex-1 text-sm ${st.done ? 'line-through text-gray-500' : 'text-white'}`}>{st.text}</span>
                            <button type="button" onClick={() => removeSubtask(editSheetTaskId, st.id)} className="p-2 text-red-400 hover:text-red-300 touch-manipulation" aria-label="Remove">×</button>
                          </div>
                        ))}
                        <form onSubmit={(e) => { e.preventDefault(); const input = e.target.querySelector('input'); if (input?.value.trim()) { addSubtask(editSheetTaskId, input.value); input.value = ''; } }} className="flex gap-2">
                          <input type="text" placeholder="Add step..." className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] touch-manipulation" />
                          <button type="submit" className="px-4 py-2 rounded-lg bg-slate-600 text-white text-sm font-medium touch-manipulation">Add</button>
                        </form>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 font-semibold mb-1.5">Repeat</label>
                      <select value={editSheetForm.recurrence} onChange={(e) => setEditSheetForm((f) => ({ ...f, recurrence: e.target.value }))} className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border-2 border-slate-600 focus:border-orange-500 focus:outline-none min-h-[48px] touch-manipulation">
                        <option value="none">No repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => {
                        const wasNotDone = editTask.status !== 'done';
                        const timerStop =
                          editSheetForm.status === 'done' && editTask.timerStartedAt
                            ? {
                                totalTimeMs: (editTask.totalTimeMs ?? 0) + (Date.now() - new Date(editTask.timerStartedAt).getTime()),
                                timerStartedAt: null,
                              }
                            : {};
                        updateTask(editSheetTaskId, {
                          text: editSheetForm.text.trim() || editTask.text,
                          status: editSheetForm.status, priority: editSheetForm.priority,
                          scheduledDate: editSheetForm.scheduledDate || undefined,
                          notes: editSheetForm.notes, recurrence: editSheetForm.recurrence,
                          ...(editSheetForm.status === 'done' && wasNotDone ? { completedAt: new Date().toISOString() } : {}),
                          ...timerStop,
                        });
                        if (wasNotDone && editSheetForm.status === 'done') {
                          const taskDate = new Date(editTask.createdAt).toDateString();
                          const today = new Date().toDateString();
                          setStats((prev) => ({ ...prev, today: taskDate === today ? prev.today + 1 : prev.today, week: prev.week + 1, frogStreak: editTask.isFrog ? prev.frogStreak + 1 : prev.frogStreak }));
                          triggerConfetti();
                        }
                        setEditSheetTaskId(null);
                        if (editingTaskId === editSheetTaskId) { setEditingTaskId(null); setEditingText(''); }
                      }} className="flex-1 min-h-[52px] rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation">Save</button>
                      <button type="button" onClick={() => { deleteTask(editSheetTaskId); setEditSheetTaskId(null); }} className="min-h-[52px] px-4 rounded-xl bg-red-900/50 text-red-200 font-semibold hover:bg-red-800/50 active:bg-red-700/50 transition-colors touch-manipulation">Delete</button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* View Router */}
          {view === 'kanban' && showFocusMode ? (
            <FocusModeView
              todaysFrogs={todaysFrogs}
              setShowFocusMode={setShowFocusMode}
              startTimer={startTimer}
              stopTimer={stopTimer}
              formatDuration={formatDuration}
              getStatusLabel={getStatusLabel}
              getPriorityBadgeColor={getPriorityBadgeColor}
              setShowPomodoro={setShowPomodoro}
            />
          ) : view === 'kanban' ? (
            <KanbanView
              tasks={tasks} priorities={priorities} statuses={statuses}
              todaysFrogs={todaysFrogs}
              filterFrog={filterFrog} setFilterFrog={setFilterFrog}
              filterPriority={filterPriority} setFilterPriority={setFilterPriority}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              taskMatchesSearch={taskMatchesSearch} getFilteredTasks={getFilteredTasks}
              quickAddText={quickAddText} setQuickAddText={setQuickAddText}
              quickAddPriority={quickAddPriority} setQuickAddPriority={setQuickAddPriority}
              quickAddColumn={quickAddColumn} setQuickAddColumn={setQuickAddColumn}
              quickAddDate={quickAddDate} setQuickAddDate={setQuickAddDate}
              quickAddInputRef={quickAddInputRef} quickAdd={quickAdd}
              addTask={addTask} deleteTask={deleteTask} updateTask={updateTask}
              startTimer={startTimer} stopTimer={stopTimer}
              setFrog={setFrog} toggleTaskCollapsed={toggleTaskCollapsed}
              addSubtask={addSubtask} toggleSubtask={toggleSubtask} removeSubtask={removeSubtask}
              editingTaskId={editingTaskId} editingText={editingText}
              setEditingText={setEditingText} setEditingTaskId={setEditingTaskId}
              startEditing={startEditing} saveEditing={saveEditing}
              editingDateTaskId={editingDateTaskId} setEditingDateTaskId={setEditingDateTaskId}
              addTaskCell={addTaskCell} setAddTaskCell={setAddTaskCell}
              addTaskCellText={addTaskCellText} setAddTaskCellText={setAddTaskCellText}
              addTaskCellInputRef={addTaskCellInputRef} handleAddTaskInCell={handleAddTaskInCell}
              draggedTask={draggedTask} dragOverCell={dragOverCell}
              handleDragStart={handleDragStart} handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver} handleDragLeave={handleDragLeave} handleDrop={handleDrop}
              undoState={undoState} handleUndo={handleUndo}
              rowHeights={rowHeights} resizingPriority={resizingPriority} handleResizeStart={handleResizeStart}
              isMobileView={isMobileView}
              mobileSelectedTaskId={mobileSelectedTaskId} setMobileSelectedTaskId={setMobileSelectedTaskId}
              setMoveMenuTaskId={setMoveMenuTaskId} setAddSheetCell={setAddSheetCell} setEditSheetTaskId={setEditSheetTaskId}
              confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
              expandedNotesTaskId={expandedNotesTaskId} setExpandedNotesTaskId={setExpandedNotesTaskId}
              expandedSubtasksTaskId={expandedSubtasksTaskId} setExpandedSubtasksTaskId={setExpandedSubtasksTaskId}
              showGuideSection={showGuideSection} setShowGuideSection={setShowGuideSection}
              helpTooltipId={helpTooltipId} setHelpTooltipId={setHelpTooltipId}
            />
          ) : view === 'schedule' ? (
            <ScheduleView
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              quickAddText={quickAddText} setQuickAddText={setQuickAddText}
              quickAddDate={quickAddDate} setQuickAddDate={setQuickAddDate}
              quickAddPriority={quickAddPriority} setQuickAddPriority={setQuickAddPriority}
              quickAddColumn={quickAddColumn}
              addTask={addTask} setFrog={setFrog} deleteTask={deleteTask}
              scheduleRange={scheduleRange} setScheduleRange={setScheduleRange}
              focusDate={focusDate} setFocusDate={setFocusDate}
              todayKey={todayKey} goToToday={goToToday}
              isViewingToday={isViewingToday} isViewingThisWeek={isViewingThisWeek} isViewingThisMonth={isViewingThisMonth}
              getOverdueTasks={getOverdueTasks} getTasksForDate={getTasksForDate}
              getTasksForWeek={getTasksForWeek} getTasksForMonth={getTasksForMonth}
              editingTaskId={editingTaskId} editingText={editingText}
              setEditingText={setEditingText} startEditing={startEditing}
              saveEditing={saveEditing} cancelEditing={cancelEditing}
            />
          ) : view === 'fitness' ? (
            <FitnessView
              fitnessLogs={fitnessLogs}
              fitnessSettings={fitnessSettings}
              onUpdateDay={updateFitnessDay}
              onUpdateSettings={updateFitnessSettings}
            />
          ) : view === 'about' ? (
            <AboutView />
          ) : view === 'settings' ? (
            <SettingsView
              theme={theme} setTheme={setTheme}
              handleExport={handleExport} handleImport={handleImport} importInputRef={importInputRef}
              rowHeights={rowHeights} setRowHeights={setRowHeights}
              handleResetStats={handleResetStats}
              settingsClearBeforeDate={settingsClearBeforeDate} setSettingsClearBeforeDate={setSettingsClearBeforeDate}
              handleClearWithConfirm={handleClearWithConfirm}
              syncEnabled={syncEnabled} setSyncEnabled={setSyncEnabled}
              syncConfig={syncConfig} setSyncConfig={setSyncConfig}
              syncCode={syncCode} setSyncCode={setSyncCode}
              syncStatus={syncStatus}
            />
          ) : (
            <AnalyticsView
              tasks={tasks} stats={stats}
              priorities={priorities} statuses={statuses}
              waterLogs={waterLogs} waterSettings={waterSettings}
            />
          )}
        </div>
      </div>

      {/* Pomodoro Timer */}
      {showPomodoro && (
        <PomodoroTimer
          onClose={() => setShowPomodoro(false)}
          frogTask={tasks.find((t) => t.isFrog && t.status !== 'done') || null}
        />
      )}

      {/* Water Tracker */}
      {showWaterTracker && (
        <WaterTracker
          onClose={() => setShowWaterTracker(false)}
          waterLogs={waterLogs}
          waterSettings={waterSettings}
          onLog={logWater}
          onRemoveLog={removeLastWaterLog}
          onUpdateSettings={updateWaterSettings}
        />
      )}
    </>
  );
}
