# Eat That Frog – Task Tracker

A Kanban-style task tracker based on the **ABCDE priority method** from Brian Tracy’s *Eat That Frog!*.

**New to the method?** Read [PHILOSOPHY.md](./PHILOSOPHY.md) for the thinking behind the app — planning, the “frog,” key result areas, and why doing the most important task first changes everything. You can also open **About** in the app.

## Features

- **ABCDE priority matrix** – Rows by priority (A = Must Do → E = Eliminate), columns by status
- **Kanban board** – To Do, In Progress, Done with drag & drop between cells
- **“Frog” task** – Mark one task as today’s most important (flame icon)
- **Time tracking** – Start/pause a timer on any task; total time is shown on cards and in Analytics
- **Schedule view** – Day, week, and month views for scheduled tasks
- **Quick add** – Add tasks with priority, status, and optional date from the top bar
- **Filters & search** – Filter by frogs or priority, search task text
- **Analytics** – Completed today, this week, frogs eaten, time tracked (total, by priority, top tasks), and distribution charts
- **Pomodoro-style timer** – Optional focus timer (work / short break / long break)
- **Persistence** – All data is stored locally in your browser using **IndexedDB** (the browser’s built-in database). If IndexedDB isn’t available, the app falls back to localStorage. Nothing is sent to a server.
- **Export / import** – Backup and restore your tasks and stats (Settings)
- **Theme** – Light, dark, or system

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Tech

- React 18 + Vite 6
- Tailwind CSS
- lucide-react icons
- **Browser IndexedDB** for storing tasks and stats (localStorage fallback if IndexedDB is unavailable)

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for the full text.

## Contributing

This project is open source. Contributors are welcome — feel free to open issues, suggest features, or submit pull requests. Whether it’s a bug fix, a small improvement, or a new idea that fits the “eat the frog” workflow, we’re happy to consider it.
