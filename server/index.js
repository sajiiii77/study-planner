import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import registerSessions from "./sessions.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "study_planner",
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
    port: Number(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
});
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const PRIORITIES = ["high", "medium", "low"];
const subjectOf = (s) => (s || "").trim() || "General";
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});
app.use(["/api/login", "/api/register"], authLimiter);
// ---------- Auth ----------
const session = (user) => ({
  token: jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" }),
  user: { name: user.name, email: user.email },
});

app.post("/api/register", wrap(async (req, res) => {
  const { name = "", email = "", password = "" } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  if (!name.trim() || !cleanEmail.includes("@")) return res.status(400).json({ error: "Enter your name and a valid email" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
  if (exists.length) return res.status(409).json({ error: "That email is already registered" });
  const user = { id: randomUUID(), name: name.trim(), email: cleanEmail };
  await pool.query("INSERT INTO users (id, name, email, hash) VALUES (?, ?, ?, ?)", [
    user.id, user.name, user.email, await bcrypt.hash(password, 10),
  ]);
  res.status(201).json(session(user));
}));

app.post("/api/login", wrap(async (req, res) => {
  const { email = "", password = "" } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email.trim().toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.hash))) return res.status(401).json({ error: "Wrong email or password" });
  res.json(session(user));
}));

const auth = (req, res, next) => {
  try {
    req.userId = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again" });
  }
};

// ---------- Tasks ----------
const toTask = (r) => ({
  id: r.id, title: r.title, subject: r.subject, due: r.due || "",
  minutes: r.minutes, priority: r.priority, done: !!r.done,
});

app.get("/api/tasks", auth, wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM tasks WHERE user_id = ?", [req.userId]);
  res.json(rows.map(toTask));
}));

app.post("/api/tasks", auth, wrap(async (req, res) => {
  const b = req.body;
  if (!b.title || !b.title.trim()) return res.status(400).json({ error: "Task title is required" });
  const id = randomUUID();
  await pool.query(
    "INSERT INTO tasks (id, user_id, title, subject, due, minutes, priority) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, req.userId, b.title.trim(), subjectOf(b.subject), b.due || null, Number(b.minutes) || 30,
     PRIORITIES.includes(b.priority) ? b.priority : "medium"]
  );
  const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
  res.status(201).json(toTask(rows[0]));
}));

app.patch("/api/tasks/:id", auth, wrap(async (req, res) => {
  const sets = [], vals = [];
  for (const f of ["title", "subject", "due", "minutes", "priority", "done"]) {
    if (f in req.body) {
      sets.push(`\`${f}\` = ?`);
      vals.push(f === "due" ? req.body.due || null : req.body[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
  await pool.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, [...vals, req.params.id, req.userId]);
  const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.userId]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  res.json(toTask(rows[0]));
}));

app.delete("/api/tasks/:id", auth, wrap(async (req, res) => {
  await pool.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.userId]);
  res.status(204).end();
}));

// ---------- Exams ----------
const toExam = (r) => ({ id: r.id, title: r.title, subject: r.subject, date: r.date });

app.get("/api/exams", auth, wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM exams WHERE user_id = ?", [req.userId]);
  res.json(rows.map(toExam));
}));

app.post("/api/exams", auth, wrap(async (req, res) => {
  const b = req.body;
  if (!b.title || !b.title.trim() || !b.date) return res.status(400).json({ error: "Exam name and date are required" });
  const id = randomUUID();
  await pool.query("INSERT INTO exams (id, user_id, title, subject, `date`) VALUES (?, ?, ?, ?, ?)", [
    id, req.userId, b.title.trim(), subjectOf(b.subject), b.date,
  ]);
  const [rows] = await pool.query("SELECT * FROM exams WHERE id = ?", [id]);
  res.status(201).json(toExam(rows[0]));
}));

app.delete("/api/exams/:id", auth, wrap(async (req, res) => {
  await pool.query("DELETE FROM exams WHERE id = ? AND user_id = ?", [req.params.id, req.userId]);
  res.status(204).end();
}));
registerSessions(app, pool, auth, wrap);
// Serve the built React app (after `npm run build`)
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../client/dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => (req.path.startsWith("/api") ? next() : res.sendFile(path.join(dist, "index.html"))));
// ---------- Errors and start ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 4000;
pool.query("SELECT 1")
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Cannot connect to MySQL. Is MySQL started in XAMPP?", err.message);
    process.exit(1);
  });