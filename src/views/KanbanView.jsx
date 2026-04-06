import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Filter, Search, GripVertical, Plus, Calendar,
  ChevronRight, ChevronDown, Undo2, ArrowRightLeft, Pencil,
  FileText, ListTodo, Repeat, Trash2, Play, Pause, Maximize2, Minimize2,
} from 'lucide-react';
import HelpTip from '../components/HelpTip';
import { formatDay, getTodayKey } from '../dateUtils';
import {
  getPriorityColor, getPriorityBadgeColor, getPriorityLabel,
  getStatusLabel, getDateStatus, getRowProgress, formatDuration,
} from '../utils/taskUtils';

export default function KanbanView({
  tasks, priorities, statuses, todaysFrogs,
  filterFrog, setFilterFrog, filterPriority, setFilterPriority,
  searchQuery, setSearchQuery, taskMatchesSearch, getFilteredTasks,
  quickAddText, setQuickAddText, quickAddPriority, setQuickAddPriority,
  quickAddColumn, setQuickAddColumn, quickAddDate, setQuickAddDate,
  quickAddInputRef, quickAdd,
  addTask, deleteTask, updateTask, startTimer, stopTimer, setFrog, toggleTaskCollapsed,
  addSubtask, toggleSubtask, removeSubtask,
  editingTaskId, editingText, setEditingText, setEditingTaskId,
  startEditing, saveEditing, editingDateTaskId, setEditingDateTaskId,
  addTaskCell, setAddTaskCell, addTaskCellText, setAddTaskCellText,
  addTaskCellInputRef, handleAddTaskInCell,
  draggedTask, dragOverCell,
  handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop,
  undoState, handleUndo,
  rowHeights, resizingPriority, handleResizeStart,
  isMobileView, mobileSelectedTaskId, setMobileSelectedTaskId,
  setMoveMenuTaskId, setAddSheetCell, setEditSheetTaskId,
  confirmDeleteId, setConfirmDeleteId,
  expandedNotesTaskId, setExpandedNotesTaskId,
  expandedSubtasksTaskId, setExpandedSubtasksTaskId,
  showGuideSection, setShowGuideSection,
  helpTooltipId, setHelpTooltipId,
}) {
  const boardScrollRef = useRef(null);
  const statusHeaderRefs = useRef({});
  const [kanbanScrollHintDismissed, setKanbanScrollHintDismissed] = useState(() => {
    try {
      return localStorage.getItem('frog-kanban-scroll-hint-dismissed') === '1';
    } catch {
      return false;
    }
  });

  const dismissKanbanScrollHint = () => {
    setKanbanScrollHintDismissed(true);
    try {
      localStorage.setItem('frog-kanban-scroll-hint-dismissed', '1');
    } catch (_) {}
  };

  const scrollToStatusColumn = (status) => {
    const el = statusHeaderRefs.current[status];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  const [maximizedCell, setMaximizedCell] = useState(null);

  useEffect(() => {
    if (!maximizedCell) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMaximizedCell(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maximizedCell]);

  useEffect(() => {
    if (!maximizedCell) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [maximizedCell]);

  const hasActiveTimer = tasks.some((t) => t.timerStartedAt);
  const [timerTick, setTimerTick] = useState(0);
  useEffect(() => {
    if (!hasActiveTimer) return;
    const id = setInterval(() => setTimerTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [hasActiveTimer]);

  const getDisplayTimeMs = (task, _tick) => {
    const base = task.totalTimeMs ?? 0;
    if (!task.timerStartedAt) return base;
    return base + (Date.now() - new Date(task.timerStartedAt).getTime());
  };

  const TimerControl = ({ task }) => {
    const isRunning = !!task.timerStartedAt;
    const displayMs = getDisplayTimeMs(task, timerTick);
    const isDone = task.status === 'done';
    if (isDone) {
      return (
        <span className="text-[10px] text-gray-500 whitespace-nowrap flex items-center gap-1" title="Time tracked">
          {formatDuration(task.totalTimeMs ?? 0)}
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); isRunning ? stopTimer(task.id) : startTimer(task.id); }}
        className={`flex items-center gap-1.5 touch-manipulation cursor-pointer hover:opacity-90 transition-opacity rounded ${
          isMobileView
            ? `min-h-[36px] px-2.5 py-1.5 ${isRunning ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 text-slate-700'}`
            : `gap-1 px-1.5 py-0.5 ${isRunning ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`
        }`}
        title={isRunning ? 'Pause' : 'Start timer'}
        aria-label={isRunning ? 'Pause timer' : 'Start timer'}
      >
        {isRunning ? <Pause className={isMobileView ? 'w-4 h-4' : 'w-3 h-3'} /> : <Play className={isMobileView ? 'w-4 h-4' : 'w-3 h-3'} />}
        <span className={`font-medium tabular-nums ${isMobileView ? 'text-xs' : 'text-[10px]'}`}>{formatDuration(displayMs)}</span>
      </button>
    );
  };

  const renderKanbanCellBody = (status, priority) => {
    const cellTasks = getFilteredTasks(status, priority);
    const count = cellTasks.length;
    return (
      <>
                      {addTaskCell?.status !== status || addTaskCell?.priority !== priority ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMobileView) setAddSheetCell({ status, priority });
                            else setAddTaskCell({ status, priority });
                          }}
                          className="cell-add-btn w-full flex items-center justify-center gap-1.5 py-2.5 px-2 mb-2 rounded-lg border-2 border-dashed border-slate-400 text-slate-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-500/10 active:bg-orange-500/20 transition-colors text-sm font-medium min-h-[44px] md:min-h-0 md:py-1.5 touch-manipulation"
                          title="Add task in this cell (or double-tap empty area)"
                        >
                          <Plus className="w-4 h-4 flex-shrink-0" />
                          <span>Add task</span>
                        </button>
                      ) : null}
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
                          <span className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded-full font-bold">{count}</span>
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
                            const inSameCell = dragOverCell?.status === status && dragOverCell?.priority === priority;
                            const showDropBefore = !isMobileView && inSameCell && dragOverCell?.insertBeforeTaskId === task.id;
                            return (
                              <React.Fragment key={task.id}>
                                {showDropBefore && (
                                  <div className="h-1 rounded-full bg-orange-500 opacity-90 flex-shrink-0 min-h-[8px]" aria-hidden />
                                )}
                                <div
                                  data-task-id={task.id}
                                  draggable={!isMobileView}
                                  onDragStart={isMobileView ? undefined : (e) => handleDragStart(e, task)}
                                  onDragEnd={!isMobileView ? handleDragEnd : undefined}
                                  className={`task-card bg-white rounded-lg shadow-md ${
                                    draggedTask?.id === task.id && (!dragOverCell || dragOverCell.status !== task.status || dragOverCell.priority !== task.priority) ? 'dragging' : ''
                                  } ${task.isFrog ? 'ring-2 ring-orange-500' : ''} ${task.collapsed ? 'p-2 cursor-pointer' : `p-3 ${isMobileView ? 'cursor-default' : 'cursor-move'}`}`}
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
                                    <div className="min-w-0">
                                      <div
                                        className="flex items-start sm:items-center gap-2 min-w-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isMobileView) setMobileSelectedTaskId((prev) => (prev === task.id ? null : task.id));
                                          else toggleTaskCollapsed(task.id);
                                        }}
                                        title={isMobileView ? 'Tap to show actions' : 'Click to expand'}
                                      >
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); toggleTaskCollapsed(task.id); }}
                                          className="flex-shrink-0 p-0.5 -m-0.5 rounded hover:bg-gray-100 text-gray-400 touch-manipulation"
                                          aria-label="Expand"
                                        >
                                          <ChevronRight className="w-4 h-4 mt-0.5 sm:mt-0" />
                                        </button>
                                        {!isMobileView && <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" title="Drag to move" />}
                                        <p className="text-base sm:text-sm text-gray-800 font-medium flex-1 min-w-0 break-words line-clamp-2 sm:line-clamp-none sm:truncate leading-snug">{task.text}</p>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {task.scheduledDate && (() => {
                                            const ds = getDateStatus(task);
                                            if (ds === 'overdue') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 whitespace-nowrap" title={`Overdue — was due ${formatDay(task.scheduledDate)}`}>Overdue</span>;
                                            if (ds === 'today') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 whitespace-nowrap" title="Due today">Today</span>;
                                            return <span className="text-[10px] text-gray-500 whitespace-nowrap flex items-center" title={`Scheduled: ${formatDay(task.scheduledDate)}`}><Calendar className="w-3 h-3 mr-0.5 flex-shrink-0" />{new Date(task.scheduledDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>;
                                          })()}
                                          {(task.subtasks || []).length > 0 && <span className="text-[10px] text-gray-500" title="Checklist">{(task.subtasks || []).filter(s => s.done).length}/{(task.subtasks || []).length}</span>}
                                          {task.notes && task.notes.trim() && <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" title="Has note" />}
                                          {task.recurrence && task.recurrence !== 'none' && <Repeat className="w-3 h-3 text-gray-400 flex-shrink-0" title={`Repeats ${task.recurrence}`} />}
                                          <TimerControl task={task} />
                                        </div>
                                        {!isMobileView && (
                                          <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setFrog(task.id)} className={`p-1 rounded flex items-center justify-center touch-manipulation ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`} title="Mark as frog"><Flame className="w-3 h-3" /></button>
                                            <button onClick={() => setConfirmDeleteId(task.id)} className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 touch-manipulation" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        )}
                                      </div>
                                      {isMobileView && mobileSelectedTaskId === task.id && (
                                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                          <button onClick={() => setEditSheetTaskId(task.id)} className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300" title="Edit task"><Pencil className="w-4 h-4" /></button>
                                          <button onClick={() => setMoveMenuTaskId(task.id)} className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300" title="Move to another column"><ArrowRightLeft className="w-4 h-4" /></button>
                                          <button onClick={() => setFrog(task.id)} className={`min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 active:bg-orange-200'}`} title="Mark as frog"><Flame className="w-4 h-4" /></button>
                                          <button onClick={() => setConfirmDeleteId(task.id)} className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start gap-2">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleTaskCollapsed(task.id); }} className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Collapse">
                                          <ChevronDown className="w-4 h-4 mt-0.5" />
                                        </button>
                                        {!isMobileView && <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                                        <div className="flex-1 min-w-0">
                                          {editingTaskId === task.id ? (
                                            <input
                                              type="text"
                                              value={editingText}
                                              onChange={(e) => setEditingText(e.target.value)}
                                              onBlur={saveEditing}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEditing();
                                                if (e.key === 'Escape') { setEditingTaskId(null); setEditingText(''); }
                                              }}
                                              className="w-full text-sm text-gray-800 font-medium border border-orange-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                              autoFocus
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <p
                                              className="text-base sm:text-sm text-gray-800 font-medium break-words cursor-text hover:text-orange-600 transition-colors"
                                              onClick={() => {
                                                if (isMobileView) setMobileSelectedTaskId((prev) => (prev === task.id ? null : task.id));
                                                else startEditing(task);
                                              }}
                                              title={isMobileView ? 'Tap to show actions' : 'Click to edit'}
                                            >
                                              {task.text}
                                            </p>
                                          )}
                                        </div>
                                        {!isMobileView && (
                                          <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => setFrog(task.id)} className={`p-1 rounded flex items-center justify-center transition-all ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`} title="Mark as frog"><Flame className="w-3 h-3" /></button>
                                            <button onClick={() => setConfirmDeleteId(task.id)} className="p-1 rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all" title="Delete"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-1.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <TimerControl task={task} />
                                      </div>
                                      {isMobileView && mobileSelectedTaskId === task.id && (
                                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                                          <button onClick={(e) => { e.stopPropagation(); setEditSheetTaskId(task.id); }} className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300" title="Edit task"><Pencil className="w-4 h-4" /></button>
                                          <button onClick={(e) => { e.stopPropagation(); setMoveMenuTaskId(task.id); }} className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-500 hover:bg-slate-200 active:bg-slate-300" title="Move to another column"><ArrowRightLeft className="w-4 h-4" /></button>
                                          <button onClick={() => setFrog(task.id)} className={`min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation ${task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 active:bg-orange-200'}`} title="Mark as frog"><Flame className="w-4 h-4" /></button>
                                          <button onClick={() => setConfirmDeleteId(task.id)} className="min-w-[40px] min-h-[40px] p-2 rounded-lg flex items-center justify-center touch-manipulation bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                      )}
                                      {/* Scheduled date */}
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
                                          <button type="button" onClick={() => setEditingDateTaskId(task.id)} className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity" title="Change scheduled date">
                                            {(() => {
                                              const ds = getDateStatus(task);
                                              if (ds === 'overdue') return <span className="font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Overdue · {formatDay(task.scheduledDate)}</span>;
                                              if (ds === 'today') return <span className="font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">Due today</span>;
                                              return <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDay(task.scheduledDate)}</span>;
                                            })()}
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
                              </React.Fragment>
                            );
                          });
                        })()}
                        {!isMobileView && dragOverCell?.status === status && dragOverCell?.priority === priority && dragOverCell?.insertBeforeTaskId == null && (
                          <div className="h-1 rounded-full bg-orange-500 opacity-90 flex-shrink-0 min-h-[8px]" aria-hidden />
                        )}
                      </div>
      </>
    );
  };


  return (
    <div
      onClick={(e) => {
        if (helpTooltipId != null && !e.target.closest('[data-help-tip]')) setHelpTooltipId(null);
      }}
    >
      {/* Quick guide section */}
      {showGuideSection && (
        <div className="mb-4 md:mb-5 rounded-xl bg-slate-800/90 border border-slate-600/80 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-gray-300 text-sm font-medium shrink-0 flex items-center gap-1.5">
              Quick guide
              <HelpTip id="guide" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="This short guide explains how to use the board. Dismiss with Got it when you're familiar." />
            </span>
            <span className="text-gray-400 text-xs sm:text-sm">
              Add tasks with the bar below. Rows = priority (A→E), columns = status. Drag to move; mark one task with the flame as your frog for the day.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideSection(false)}
            className="shrink-0 text-xs font-semibold text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors touch-manipulation min-h-[36px]"
            aria-label="Dismiss guide"
          >
            Got it
          </button>
        </div>
      )}

      {/* Today's Frogs Banner */}
      {todaysFrogs.length > 0 && (
        <div className="mb-4 md:mb-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 sm:p-6 text-white shadow-2xl frog-glow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <Flame className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-semibold opacity-90 uppercase tracking-wider">
                  Today&apos;s Frog{todaysFrogs.length > 1 ? 's' : ''} ({todaysFrogs.length})
                </div>
                <ul className="mt-1 space-y-1">
                  {todaysFrogs.map((frog) => (
                    <li key={frog.id} className="flex flex-wrap items-center gap-2">
                      <span className="text-lg sm:text-xl font-bold break-words">{frog.text}</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold">Priority {frog.priority}</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">{getStatusLabel(frog.status)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Search */}
      <div className="mb-4 md:mb-6 bg-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 order-2 sm:order-1">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0 hidden sm:block" />
          <HelpTip id="filters" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Filter by Frogs only (today's priority task) or by priority (A–E). Search matches task text." />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterFrog(!filterFrog)}
              className={`min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-1 rounded-xl sm:rounded-lg text-sm font-semibold transition-all touch-manipulation ${
                filterFrog ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              <Flame className="w-4 h-4 inline mr-1.5" />
              Frogs
            </button>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-1 bg-slate-700 text-gray-300 rounded-xl sm:rounded-lg text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-orange-500 touch-manipulation"
            >
              <option value="all">All</option>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="relative flex-1 min-w-0 order-1 sm:order-2 sm:min-w-[200px] sm:max-w-sm sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-10 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg touch-manipulation"
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
      <div className="mb-4 md:mb-6 bg-slate-800 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <input
              ref={quickAddInputRef}
              type="text"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
              placeholder="Quick add task..."
              className="flex-1 min-w-0 px-4 py-3 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-base sm:text-sm min-h-[48px] sm:min-h-0 touch-manipulation"
            />
            <HelpTip id="quickadd" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Type a task name, set priority and status, then press Enter or click + to add. Date defaults to today; change it to schedule for another day." className="shrink-0" />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <select
              value={quickAddPriority || ''}
              onChange={(e) => setQuickAddPriority(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <option value="">Priority</option>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={quickAddColumn || ''}
              onChange={(e) => setQuickAddColumn(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation"
            >
              <option value="">Status</option>
              {statuses.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            </select>
            <input
              type="date"
              value={quickAddDate || getTodayKey()}
              onChange={(e) => setQuickAddDate(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 bg-slate-700 text-white rounded-xl sm:rounded-lg border-2 border-slate-600 focus:border-orange-500 focus:outline-none text-sm min-h-[44px] sm:min-h-0 touch-manipulation sm:min-w-[140px]"
              title="Default: today. Change to schedule for another day."
            />
            <button
              onClick={quickAdd}
              className="flex items-center justify-center min-h-[48px] sm:min-h-0 px-5 py-2.5 sm:py-2 bg-orange-500 text-white rounded-xl sm:rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors font-semibold touch-manipulation shrink-0"
            >
              <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {!maximizedCell && (
      <>
      {/* Mobile: jump to status column + scroll hint (above board so layout is discoverable) */}
      {isMobileView && (
        <div className="mb-3 flex flex-col gap-2 md:hidden">
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Columns</p>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => scrollToStatusColumn(status)}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-700 text-gray-200 text-sm font-semibold border border-slate-600 active:bg-slate-600 touch-manipulation"
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!kanbanScrollHintDismissed && isMobileView && (
        <div className="mb-4 md:hidden flex items-start gap-2 rounded-xl bg-slate-700/60 border border-slate-600 px-3 py-2.5 text-xs text-gray-300">
          <span className="flex-1 leading-snug">
            <span className="text-orange-300 font-semibold">Tip:</span> Swipe sideways on the board to see every status column, or use the column buttons above.
          </span>
          <button
            type="button"
            onClick={dismissKanbanScrollHint}
            className="shrink-0 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg touch-manipulation -m-2"
            aria-label="Dismiss tip"
          >
            ×
          </button>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="mb-6 bg-slate-800/80 rounded-xl p-12 text-center border-2 border-dashed border-slate-600">
          <p className="text-gray-400 text-lg mb-2">No tasks yet</p>
          <p className="text-gray-500 text-sm mb-4">Add one above with priority and status, or press <kbd className="px-2 py-0.5 bg-slate-700 rounded text-gray-300">N</kbd> or <kbd className="px-2 py-0.5 bg-slate-700 rounded text-gray-300">/</kbd> to focus the quick-add field.</p>
          <p className="text-gray-500 text-sm">Mark your most important task with the flame icon — that&apos;s your frog for the day.</p>
        </div>
      )}

      {/* Kanban Matrix */}
      <div className="-mx-2 px-2 sm:mx-0 sm:px-0">
        <div
        ref={boardScrollRef}
        className="overflow-x-auto overflow-y-visible touch-pan-x overscroll-x-contain [scrollbar-gutter:stable]"
        onClick={(e) => {
          if (isMobileView && mobileSelectedTaskId && !e.target.closest('.task-card')) setMobileSelectedTaskId(null);
        }}
      >
        <div
          className="min-w-full gap-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(5rem, 8rem) minmax(200px, 1fr) minmax(200px, 1fr) minmax(200px, 1fr)',
            gridTemplateRows: `auto ${priorities.map((p) => `${rowHeights[p]}px auto`).join(' ')}`,
          }}
        >
          {/* Header row */}
          <div className="h-12 sm:h-14 bg-slate-800 rounded-t-lg flex items-center justify-center gap-1">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Priority</span>
            <HelpTip id="priority" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Rows are priority: A = Must do, B = Should do, C = Nice to do, D = Delegate, E = Eliminate. Put your most important tasks in row A." />
          </div>
          {statuses.map((status, idx) => (
            <div
              key={status}
              ref={(el) => {
                statusHeaderRefs.current[status] = el;
              }}
              className="h-14 bg-slate-800 rounded-t-lg flex items-center justify-center gap-1 scroll-mr-2"
            >
              <div className="text-center">
                <div className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-1">
                  {getStatusLabel(status)}
                  {idx === 0 && (
                    <HelpTip id="status" activeId={helpTooltipId} onToggle={setHelpTooltipId} text="Columns are status: To Do → In Progress → Done. Drag tasks between columns to update their status." />
                  )}
                </div>
              </div>
            </div>
          ))}
          {priorities.map((priority) => (
            <React.Fragment key={priority}>
              {/* Priority cell */}
              <div
                style={{ height: rowHeights[priority] }}
                className="bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <div className="text-center px-0.5 w-full">
                  <div className={`text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 ${getPriorityBadgeColor(priority)} w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto`}>
                    {priority}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-400 font-semibold leading-tight">{getPriorityLabel(priority)}</div>
                  {(() => {
                    const prog = getRowProgress(tasks, priority);
                    if (!prog) return null;
                    return (
                      <div className="mt-1.5 px-1" title={`${prog.done} / ${prog.total} done`}>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${prog.pct}%`,
                              background: prog.pct === 100 ? '#34d399' : prog.pct >= 50 ? '#f97316' : '#64748b',
                            }}
                          />
                        </div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{prog.done}/{prog.total}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Status cells for this row */}
              {statuses.map((status) => (
                    <div
                      key={status}
                      style={{ height: rowHeights[priority] }}
                      className={`kanban-column group ${getPriorityColor(priority)} border-2 rounded-lg p-2 overflow-y-auto ${
                        dragOverCell?.status === status && dragOverCell?.priority === priority ? 'drag-over' : ''
                      } ${addTaskCell?.status === status && addTaskCell?.priority === priority ? 'ring-2 ring-orange-500 ring-inset' : ''}`}
                      onDragOver={(e) => handleDragOver(e, status, priority)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, status, priority)}
                      onDoubleClick={(e) => {
                        if (!e.target.closest('.task-card') && !e.target.closest('.cell-add-btn')) {
                          if (isMobileView) setAddSheetCell({ status, priority });
                          else setAddTaskCell({ status, priority });
                        }
                      }}
                      title="Double-click to add a task here"
                    >
                      <div className="flex justify-end mb-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileSelectedTaskId(null);
                            setMaximizedCell({ status, priority });
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-orange-400 hover:bg-slate-800/90 border border-slate-500/80 touch-manipulation"
                          title="Expand this cell"
                          aria-label="Expand this cell"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                      {renderKanbanCellBody(status, priority)}
                    </div>
              ))}
              {/* Full-width resize handle for this row */}
              <div
                role="separator"
                aria-label={`Resize row ${priority}`}
                onMouseDown={(e) => handleResizeStart(priority, e)}
                style={{ gridColumn: '1 / -1' }}
                className={`kanban-resize-handle hidden md:flex w-full cursor-ns-resize flex-col items-center justify-center gap-0.5 py-0.5 rounded-md select-none ${resizingPriority === priority ? 'active bg-orange-500 text-white' : 'bg-slate-700/80 hover:bg-slate-600 text-slate-400'}`}
                title="Drag to resize this row"
              >
                <span className="grip-line" />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      </div>
      </>
      )}

      {/* Filter/search empty state messages */}
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
      {isMobileView ? (
        <details className="mt-6 bg-slate-800 rounded-xl border border-slate-600/80 open:shadow-inner">
          <summary className="px-4 py-3 text-sm font-semibold text-white cursor-pointer list-none flex items-center justify-between gap-2 touch-manipulation min-h-[48px] [&::-webkit-details-marker]:hidden">
            <span>How to use this board</span>
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
          </summary>
          <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-slate-600/60 pt-3">
            <strong className="text-white">Mobile:</strong> Tap a task to show actions (edit, move, frog, delete). Double-tap empty space in a cell to add a task. Use the column buttons to scroll the board. Tap the expand icon on a cell to focus it full screen. Swipe sideways to see all columns.
            {' '}
            <strong className="text-white">Desktop:</strong> Double-click a cell to add. Use the expand icon on a cell to work in that cell full screen. Drag to move. Click text to edit. Flame = frog. Notes, checklist, repeat on each card. Undo delete/move within 5s. <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-gray-300">?</kbd> for shortcuts.
          </div>
        </details>
      ) : (
        <div className="mt-6 bg-slate-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">
            <strong className="text-white">How to use:</strong> Double-click a cell to add a task. Click the expand icon on a cell to focus it full screen (Esc or Board to exit). Drag to change status/priority. Click text to edit. Flame = today&apos;s frog. Add note, checklist, or repeat (daily/weekly/monthly) on each card. After delete or move, the task fades in place — hover it and click <strong>Undo</strong> within 5s. Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-gray-300">?</kbd> for shortcuts.
          </div>
        </div>
      )}

      {maximizedCell && (
        <div
          className="fixed inset-0 z-[35] flex flex-col bg-slate-950/95 backdrop-blur-sm px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kanban-maximized-title"
        >
          <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
            <div id="kanban-maximized-title" className="flex items-center gap-2 min-w-0">
              <span className={`text-xl font-bold px-3 py-2 rounded-lg ${getPriorityBadgeColor(maximizedCell.priority)}`}>{maximizedCell.priority}</span>
              <span className="text-white font-semibold text-base sm:text-lg truncate">
                {getPriorityLabel(maximizedCell.priority)} · {getStatusLabel(maximizedCell.status)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMaximizedCell(null)}
              className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-slate-700 text-gray-100 font-semibold border border-slate-600 hover:bg-slate-600 touch-manipulation shrink-0"
            >
              <Minimize2 className="w-5 h-5" aria-hidden />
              Board
            </button>
          </div>
          <div
            className={`flex-1 min-h-0 overflow-y-auto rounded-xl border-2 p-3 ${getPriorityColor(maximizedCell.priority)} kanban-column shadow-xl`}
            onDragOver={(e) => handleDragOver(e, maximizedCell.status, maximizedCell.priority)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, maximizedCell.status, maximizedCell.priority)}
            onDoubleClick={(e) => {
              if (!e.target.closest('.task-card') && !e.target.closest('.cell-add-btn')) {
                if (isMobileView) setAddSheetCell({ status: maximizedCell.status, priority: maximizedCell.priority });
                else setAddTaskCell({ status: maximizedCell.status, priority: maximizedCell.priority });
              }
            }}
          >
            {renderKanbanCellBody(maximizedCell.status, maximizedCell.priority)}
          </div>
        </div>
      )}
    </div>
  );
}
