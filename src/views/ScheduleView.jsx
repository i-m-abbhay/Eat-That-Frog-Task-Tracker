import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import ScheduleTaskCard from '../components/ScheduleTaskCard';
import {
  formatDay, formatWeekRange, formatMonth,
  getWeekStart, getMonthStart, getDaysInWeek, getWeekNumbersInMonth,
  addDays, addWeeks, addMonths,
} from '../dateUtils';
import { getPriorityBadgeColor, getStatusLabel } from '../utils/taskUtils';

export default function ScheduleView({
  searchQuery, setSearchQuery,
  quickAddText, setQuickAddText, quickAddDate, setQuickAddDate,
  quickAddPriority, setQuickAddPriority, quickAddColumn,
  addTask, setFrog, deleteTask,
  scheduleRange, setScheduleRange,
  focusDate, setFocusDate,
  todayKey, goToToday, isViewingToday, isViewingThisWeek, isViewingThisMonth,
  getOverdueTasks, getTasksForDate, getTasksForWeek, getTasksForMonth,
  editingTaskId, editingText, setEditingText, startEditing, saveEditing, cancelEditing,
}) {
  return (
    <div className="space-y-6">
      {/* Search */}
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

      {/* Quick-add */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickAddText.trim()) {
                const d = quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey);
                addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', d);
                setQuickAddText('');
                setQuickAddDate('');
              }
            }}
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
            onClick={() => {
              if (quickAddText.trim()) {
                const d = quickAddDate || (scheduleRange === 'daily' ? focusDate : todayKey);
                addTask(quickAddText, quickAddPriority || 'A', quickAddColumn || 'todo', d);
                setQuickAddText('');
                setQuickAddDate('');
              }
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5 inline" />
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">Date defaults to the day/week/month you&apos;re viewing. Tasks appear here and on the Board.</p>
      </div>

      {/* Sub-tabs + date navigation */}
      <div className="bg-slate-800 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map((range) => (
              <button
                key={range}
                onClick={() => setScheduleRange(range)}
                className={`flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg font-semibold capitalize transition-all touch-manipulation ${
                  scheduleRange === range ? 'bg-orange-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
                }`}
              >
                {range === 'daily' ? 'Day' : range === 'weekly' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusDate(scheduleRange === 'daily' ? addDays(focusDate, -1) : scheduleRange === 'weekly' ? addWeeks(focusDate, -1) : addMonths(focusDate, -1))}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl sm:rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500 transition-colors touch-manipulation"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className={`flex-1 min-h-[44px] sm:min-h-0 px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg font-semibold transition-all touch-manipulation ${
                (scheduleRange === 'daily' && isViewingToday) || (scheduleRange === 'weekly' && isViewingThisWeek) || (scheduleRange === 'monthly' && isViewingThisMonth)
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              {scheduleRange === 'daily' ? 'Today' : scheduleRange === 'weekly' ? 'This week' : 'This month'}
            </button>
            <button
              onClick={() => setFocusDate(scheduleRange === 'daily' ? addDays(focusDate, 1) : scheduleRange === 'weekly' ? addWeeks(focusDate, 1) : addMonths(focusDate, 1))}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl sm:rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 active:bg-slate-500 transition-colors touch-manipulation"
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

      {/* Daily view */}
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
                  <ScheduleTaskCard
                    key={task.id} task={task}
                    getPriorityBadgeColor={getPriorityBadgeColor}
                    getStatusLabel={getStatusLabel}
                    setFrog={setFrog} deleteTask={deleteTask}
                    editingTaskId={editingTaskId} editingText={editingText}
                    setEditingText={setEditingText} startEditing={startEditing}
                    saveEditing={saveEditing} cancelEditing={cancelEditing}
                  />
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
                  <ScheduleTaskCard
                    key={task.id} task={task}
                    getPriorityBadgeColor={getPriorityBadgeColor}
                    getStatusLabel={getStatusLabel}
                    setFrog={setFrog} deleteTask={deleteTask}
                    editingTaskId={editingTaskId} editingText={editingText}
                    setEditingText={setEditingText} startEditing={startEditing}
                    saveEditing={saveEditing} cancelEditing={cancelEditing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly view */}
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
                        <ScheduleTaskCard
                          key={task.id} task={task} compact
                          getPriorityBadgeColor={getPriorityBadgeColor}
                          getStatusLabel={getStatusLabel}
                          setFrog={setFrog} deleteTask={deleteTask}
                          editingTaskId={editingTaskId} editingText={editingText}
                          setEditingText={setEditingText} startEditing={startEditing}
                          saveEditing={saveEditing} cancelEditing={cancelEditing}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Monthly view */}
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
                              <ScheduleTaskCard
                                key={task.id} task={task} compact
                                getPriorityBadgeColor={getPriorityBadgeColor}
                                getStatusLabel={getStatusLabel}
                                setFrog={setFrog} deleteTask={deleteTask}
                                editingTaskId={editingTaskId} editingText={editingText}
                                setEditingText={setEditingText} startEditing={startEditing}
                                saveEditing={saveEditing} cancelEditing={cancelEditing}
                              />
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
  );
}
