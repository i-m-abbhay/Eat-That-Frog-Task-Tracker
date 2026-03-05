export function getPriorityColor(priority) {
  const colors = {
    A: 'bg-red-50 border-red-300',
    B: 'bg-orange-50 border-orange-300',
    C: 'bg-yellow-50 border-yellow-300',
    D: 'bg-blue-50 border-blue-300',
    E: 'bg-gray-50 border-gray-300',
  };
  return colors[priority] || colors['C'];
}

export function getPriorityBadgeColor(priority) {
  const colors = {
    A: 'bg-red-500 text-white',
    B: 'bg-orange-500 text-white',
    C: 'bg-yellow-500 text-white',
    D: 'bg-blue-500 text-white',
    E: 'bg-gray-500 text-white',
  };
  return colors[priority] || colors['C'];
}

export function getPriorityLabel(priority) {
  const labels = {
    A: 'Must Do',
    B: 'Should Do',
    C: 'Nice to Do',
    D: 'Delegate',
    E: 'Eliminate',
  };
  return labels[priority];
}

export function getStatusLabel(status) {
  const labels = {
    todo: 'To Do',
    progress: 'In Progress',
    done: 'Done',
  };
  return labels[status];
}

export function getDateStatus(task) {
  if (!task.scheduledDate || task.status === 'done') return null;
  const now = new Date();
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [y, m, d] = task.scheduledDate.split('-').map(Number);
  const scheduledMs = new Date(y, m - 1, d).getTime();
  if (scheduledMs < todayMs) return 'overdue';
  if (scheduledMs === todayMs) return 'today';
  return null;
}

export function getRowProgress(tasks, priority) {
  const all = tasks.filter((t) => t.priority === priority);
  if (all.length === 0) return null;
  const done = all.filter((t) => t.status === 'done').length;
  return { done, total: all.length, pct: Math.round((done / all.length) * 100) };
}

export function playDoneChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (_) { /* AudioContext unavailable */ }
}
