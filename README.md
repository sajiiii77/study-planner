# Study Planner

[![CI](https://github.com/sajiiii77/study-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/sajiiii77/study-planner/actions/workflows/ci.yml)

A full-stack planner for students. Plan tasks on a weekly calendar, count down to exams, and track focus time, with every subject color-coded.

**Live demo:** coming soon

![Dashboard](docs/screenshots/dashboard.png)

| Calendar | Tasks |
| --- | --- |
| ![Calendar](docs/screenshots/calendar.png) | ![Tasks](docs/screenshots/tasks.png) |

## Features

- **Accounts:** register and log in; every user only ever sees their own data.
- **Dashboard:** this-week overview, today's tasks, exam countdown, study time chart and a weekly goal.
- **Weekly calendar:** timetable-style blocks sized by study time. Drag tasks between days, or into the unscheduled tray.
- **Tasks:** add, edit, search, filter by subject or status, and set a priority (high, medium, low).
- **Exams:** countdown tickets that highlight in the final week.
- **Focus timer:** Pomodoro-style timer that saves each session and tracks a daily study streak.
- **Polish:** light and dark mode, keyboard shortcut (`N` for a new task), responsive layout, reduced-motion support.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite, lucide-react icons, plain CSS design system |
| Backend | Node.js, Express 4 |
| Database | MySQL (developed on XAMPP) via `mysql2` |
| Auth and security | JWT, bcrypt password hashing, helmet, login rate limiting, parameterized SQL |
| Tooling | Node test runner, GitHub Actions CI |

## Getting started

You need Node.js 20 or newer and a MySQL server (XAMPP works well on Windows).

```bash
git clone https://github.com/sajiiii77/study-planner.git
cd study-planner
npm run install:all
```

1. Start **MySQL** in the XAMPP control panel.
2. Create the database: open phpMyAdmin, go to the **SQL** tab, and run the contents of [`server/schema.sql`](server/schema.sql).
3. Copy `server/.env.example` to `server/.env` and fill in your values.
4. Start the app:

```bash
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:4000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the React dev server together |
| `npm test` | Runs the unit tests |
| `npm run build` | Installs dependencies and builds the client |
| `npm start` | Starts the API (and serves the built client when present) |

## API

All routes except register and login need an `Authorization: Bearer <token>` header.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/register` | Create an account |
| POST | `/api/login` | Log in and receive a token |
| GET, POST | `/api/tasks` | List and create tasks |
| PATCH, DELETE | `/api/tasks/:id` | Update and delete a task |
| GET, POST | `/api/exams` | List and create exams |
| DELETE | `/api/exams/:id` | Delete an exam |
| GET | `/api/sessions?from=YYYY-MM-DD` | Minutes studied per day |
| POST | `/api/sessions` | Save a finished focus session |

## Project structure

```
client/            React app (Vite)
  src/pages/       Dashboard, Calendar, Tasks, Exams, Focus
  src/components/  Task modal, task row, empty state
server/            Express API
  index.js         Routes, auth and database access
  sessions.js      Focus session routes
  schema.sql       Database schema
```

## Design decisions

- **Ownership checks in SQL:** every query filters by `user_id`, so one user can never read or change another user's rows.
- **Parameterized queries** everywhere, which prevents SQL injection.
- **Dates as plain `YYYY-MM-DD` strings** end to end, which avoids time zone bugs that come from JavaScript `Date` objects.
- **Subject colors are derived from the subject name**, so they stay consistent across every page without storing anything.

## Roadmap

- Notes and attachments on tasks
- Recurring tasks
- Per-subject focus time in the study chart
- Email reminders before exams

## License

MIT
