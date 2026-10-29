import { randomUUID } from "crypto";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function registerSessions(app, pool, auth, wrap) {
  // Save one finished focus session
  app.post("/api/sessions", auth, wrap(async (req, res) => {
    const minutes = Math.round(Number(req.body.minutes));
    const date = String(req.body.date || "");
    if (!(minutes >= 1 && minutes <= 240)) return res.status(400).json({ error: "Minutes must be between 1 and 240" });
    if (!DATE.test(date)) return res.status(400).json({ error: "A valid date is required" });

    let taskId = req.body.taskId || null;
    if (taskId) {
      const [rows] = await pool.query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [taskId, req.userId]);
      if (!rows.length) taskId = null;
    }
    await pool.query(
      "INSERT INTO sessions (id, user_id, task_id, minutes, study_date) VALUES (?, ?, ?, ?, ?)",
      [randomUUID(), req.userId, taskId, minutes, date]
    );
    res.status(201).json({ ok: true });
  }));

  // Minutes studied per day since ?from=YYYY-MM-DD
  app.get("/api/sessions", auth, wrap(async (req, res) => {
    const from = String(req.query.from || "");
    if (!DATE.test(from)) return res.status(400).json({ error: "A valid from date is required" });
    const [rows] = await pool.query(
      "SELECT study_date AS date, SUM(minutes) AS minutes FROM sessions WHERE user_id = ? AND study_date >= ? GROUP BY study_date ORDER BY study_date",
      [req.userId, from]
    );
    res.json(rows.map((r) => ({ date: r.date, minutes: Number(r.minutes) })));
  }));
}
