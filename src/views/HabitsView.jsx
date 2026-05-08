import React, { useState } from 'react';
import {
  ListChecks, Plus, Trash2, Pencil, Save, Flame, Calendar, X,
} from 'lucide-react';
import { getTodayKey } from '../dateUtils';
import {
  isHabitDone,
  getCurrentStreak,
  getLongestStreak,
  getRecentDayKeysEnding,
} from '../utils/habitUtils';

export default function HabitsView({
  habits,
  habitLogs,
  onAddHabit,
  onRenameHabit,
  onDeleteHabit,
  onToggleHabitDay,
}) {
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const stripKeys = getRecentDayKeysEnding(todayKey, 14);

  const startEdit = (h) => {
    setEditingId(h.id);
    setEditText(h.name);
  };

  const saveEdit = () => {
    if (editingId) onRenameHabit(editingId, editText);
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
              <ListChecks className="w-7 h-7 text-orange-400 shrink-0" />
              Daily habits
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Check off each day to build a streak. If you haven&apos;t logged today yet, yesterday still keeps your streak alive until you miss a full day.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 shrink-0">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="sr-only">Day</span>
            <input
              type="date"
              value={selectedDate}
              max={todayKey}
              onChange={(e) => setSelectedDate(e.target.value || todayKey)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onAddHabit(newName);
                setNewName('');
              }
            }}
            placeholder="New habit name…"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none text-sm"
          />
          <button
            type="button"
            onClick={() => {
              onAddHabit(newName);
              setNewName('');
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800/40 py-16 px-6 text-center">
          <Flame className="w-10 h-10 text-orange-400/60 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No habits yet</p>
          <p className="text-gray-500 text-sm mt-1">Add one above to start tracking streaks.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {habits.map((h) => {
            const done = isHabitDone(habitLogs, h.id, selectedDate);
            const current = getCurrentStreak(habitLogs, h.id, todayKey);
            const longest = getLongestStreak(habitLogs, h.id);
            return (
              <li
                key={h.id}
                className="rounded-xl border border-slate-700/80 bg-slate-800/90 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="button"
                    onClick={() => onToggleHabitDay(h.id, selectedDate)}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all touch-manipulation ${
                      done
                        ? 'bg-orange-500 border-orange-400 text-white'
                        : 'bg-slate-900 border-slate-600 text-transparent hover:border-slate-500'
                    }`}
                    aria-pressed={done}
                    aria-label={done ? `Mark ${h.name} not done for ${selectedDate}` : `Mark ${h.name} done for ${selectedDate}`}
                  >
                    {done ? '✓' : ''}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingId === h.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="flex-1 min-w-[8rem] px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:border-orange-500 focus:outline-none"
                          autoFocus
                        />
                        <button type="button" onClick={saveEdit} className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600" aria-label="Save name">
                          <Save className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={cancelEdit} className="p-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600" aria-label="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-white font-semibold text-lg truncate">{h.name}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                      <span className="inline-flex items-center gap-1 text-orange-200">
                        <Flame className="w-4 h-4" />
                        <span className="font-semibold">{current}</span>
                        <span className="text-gray-500">current</span>
                      </span>
                      <span className="text-gray-500">
                        Best: <span className="text-gray-300 font-medium">{longest}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex gap-1 flex-wrap" title="Last 14 days (today on the right)">
                      {stripKeys.map((dk) => {
                        const d = isHabitDone(habitLogs, h.id, dk);
                        const isToday = dk === todayKey;
                        return (
                          <span
                            key={dk}
                            className={`w-2.5 h-2.5 rounded-sm shrink-0 ${
                              d ? 'bg-orange-500' : 'bg-slate-700'
                            } ${isToday ? 'ring-1 ring-orange-300 ring-offset-1 ring-offset-slate-800' : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:flex-col sm:items-stretch sm:ml-auto">
                    {editingId !== h.id && (
                      <button
                        type="button"
                        onClick={() => startEdit(h)}
                        className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 touch-manipulation"
                        aria-label={`Rename ${h.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove habit “${h.name}” and its history?`)) onDeleteHabit(h.id);
                      }}
                      className="p-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-slate-700 touch-manipulation"
                      aria-label={`Delete ${h.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
