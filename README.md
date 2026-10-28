# Study Planner (React + Express)

    npm run install:all
    npm run dev

Open http://localhost:5173. The API runs on port 4000 and saves data to server/db.json.

Set JWT_SECRET (environment variable) before using this anywhere other than your own computer.

API: POST /api/register, POST /api/login, then (with a Bearer token)
GET/POST /api/tasks and /api/exams, PATCH/DELETE /api/tasks/:id and /api/exams/:id
