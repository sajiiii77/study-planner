# Cadence

[![CI](https://github.com/sajiiii77/study-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/sajiiii77/study-planner/actions/workflows/ci.yml)

A study planner for students. Plan tasks on a weekly calendar, count down to exams, run focus sessions, and see how your study time adds up, with every subject color-coded.

**Live demo:** coming soon

![Dashboard](docs/screenshots/dashboard.png)

| Study calendar | My tasks |
| --- | --- |
| ![Calendar](docs/screenshots/calendar.png) | ![Tasks](docs/screenshots/tasks.png) |

| Analytics | Focus mode |
| --- | --- |
| ![Analytics](docs/screenshots/analytics.png) | ![Focus](docs/screenshots/focus.png) |

## Features

- **Accounts:** register and log in. Every user only ever sees their own data.
- **Dashboard:** this-week strip, today's tasks, exam countdown, study time chart with last-week comparison, streak, weekly goal, consistency heatmap, subject mix and an "areas that need attention" list. Every number is computed from real data.
- **Study calendar:** week view (timetable blocks sized by study time), month view and exam tickets. Drag tasks between days.
- **My tasks:** search, filters, and grouping by due date, subject or priority. Add and edit in a dialog.
- **Subjects:** progress, time left, next deadline and next exam for each subject.
- **Analytics:** 7, 30 and 90 day study charts, weekday rhythm, 26-week heatmap, completion by subject and upcoming workload.
- **Focus mode:** Pomodoro timer with breaks, session tracking, a full-screen focus view and a daily study streak.
- **Command palette:** press `Ctrl K` to search tasks, exams, subjects and pages. Press `N` for a new task.
- **Settings:** weekly goal, timer lengths, theme, JSON export of your data.
- **Polish:** dark and light themes, responsive layout, keyboard navigation, reduced-motion support, skeleton loading and an error screen instead of a blank page.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite, Motion, lucide-react, a hand-written CSS design system, custom SVG charts |
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
2. Create the database: open phpMyAdmin, go to the **SQL** tab, and run [`server/schema.sql`](server/schema.sql).
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
| `npm start` | Starts the API and serves the built client when present |

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
client/
  src/shell/        Sidebar, top bar, command palette, notifications
  src/pages/        Dashboard, Tasks, Calendar (week, month, exams), Subjects, Analytics, Focus, Settings
  src/components/   Dialogs, task rows, charts
  src/lib/          Pure functions that turn tasks, exams and sessions into insights (unit tested)
  src/styles/       Design tokens and page styles
server/
  index.js          Routes, auth and database access
  sessions.js       Focus session routes
  schema.sql        Database schema
```

## Design decisions

- **Insights are pure functions.** `lib/insights.js` and `lib/analytics.js` take plain data and return everything the UI shows, so they are easy to test and the pages stay thin.
- **Ownership checks in SQL.** Every query filters by `user_id`, so one user can never read or change another user's rows.
- **Parameterized queries everywhere**, which prevents SQL injection.
- **Dates are plain `YYYY-MM-DD` strings** end to end, which avoids time zone bugs.
- **Subject colors come from the subject name**, so they stay consistent on every page without storing anything.
- **Motion answers actions.** Entrance animation plays once per visit, and everything else animates only in response to something you do. Reduced-motion preferences are respected.

## Roadmap

- Per-subject focus time (needs a `subject` on sessions)
- Recurring tasks
- Notes and attachments on tasks
- Email reminders before exams

## License

MIT
