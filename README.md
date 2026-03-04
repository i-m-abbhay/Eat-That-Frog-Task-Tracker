# Eat That Frog – Task Tracker

A Kanban-style task tracker based on the **ABCDE priority method** from Brian Tracy’s *Eat That Frog!*.

**New to the method?** Read [PHILOSOPHY.md](./PHILOSOPHY.md) for the thinking behind the app — planning, the “frog,” key result areas, and why doing the most important task first changes everything. You can also open **Settings → About & philosophy** in the app.

## Features

- **ABCDE priority matrix** – Prioritize tasks (A = Must Do → E = Eliminate)
- **Kanban board** – Columns: To Do, In Progress, Done
- **“Frog” task** – Mark one task as today’s most important (flame icon)
- **Drag & drop** – Move tasks between status and priority cells
- **Quick add** – Add tasks with priority and status from the top bar
- **Filters** – Show only frogs or a specific priority
- **Analytics** – Completed today, this week, frogs eaten, and distribution charts
- **Persistence** – Data saved in the browser (localStorage)

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

- React 18 + Vite
- Tailwind CSS
- lucide-react icons
- localStorage for data
