import { Flame, Trash2, Clock } from 'lucide-react';
import { formatDuration } from '../utils/taskUtils';

export default function ScheduleTaskCard({
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
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
          <span className={`${getPriorityBadgeColor(task.priority)} rounded px-1.5 py-0.5 font-bold text-xs`}>
            {task.priority}
          </span>
          {(task.totalTimeMs ?? 0) > 0 && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-slate-100" title="Time tracked">
              <Clock className="w-3 h-3" />
              {formatDuration(task.totalTimeMs)}
            </span>
          )}
          {!compact && <span className="text-gray-400 text-xs hidden sm:inline">{getStatusLabel(task.status)}</span>}
          <button
            onClick={() => setFrog(task.id)}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 rounded-lg sm:rounded transition-all touch-manipulation flex items-center justify-center ${
              task.isFrog ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500 active:bg-orange-200'
            }`}
            title="Mark as frog"
          >
            <Flame className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1 rounded-lg sm:rounded bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-all touch-manipulation flex items-center justify-center"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
