import { CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { getPriorityLabel, getStatusLabel } from '../utils/taskUtils';

export default function AnalyticsView({ tasks, stats, priorities, statuses }) {
  return (
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
                <span className="font-semibold text-white">Priority {priority} - {getPriorityLabel(priority)}</span>
                <span className="text-gray-400">{count} tasks ({percentage.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    priority === 'A' ? 'bg-red-500'
                    : priority === 'B' ? 'bg-orange-500'
                    : priority === 'C' ? 'bg-yellow-500'
                    : priority === 'D' ? 'bg-blue-500'
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
        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}>
          EAT THAT FROG PRINCIPLES
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-2xl">🐸</span>
            <div><strong>Eat the ugliest frog first:</strong> Start with your most important, challenging task</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div><strong>Do it first thing:</strong> Tackle your A tasks in the morning when your energy is highest</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div><strong>Focus ruthlessly:</strong> Work on one task at a time until completion</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-2xl">✂️</span>
            <div><strong>Eliminate &amp; delegate:</strong> Use D and E priorities to free up time for what matters</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
