import express from "express";
import cors from "cors";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const FILE = new URL("./db.json", import.meta.url);
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const empty = { users: [], tasks: [], exams: [] };

const load = () => {
  try { return { ...empty, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { return { ...empty }; }
};
const save = (db) => fs.writeFileSync(FILE, JSON.stringify(db, null, 2));

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Auth ----------
const session = (user) => ({
  token: jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" }),
  user: { name: user.name, email: user.email },
});

app.post("/api/register", async (req, res) => {
  const { name = "", email = "", password = "" } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  if (!name.trim() || !cleanEmail.includes("@")) return res.status(400).json({ error: "Enter your name and a valid email" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const db = load();
  if (db.users.some((u) => u.email === cleanEmail)) return res.status(409).json({ error: "That email is already registered" });
  const user = { id: randomUUID(), name: name.trim(), email: cleanEmail, hash: await bcrypt.hash(password, 10) };
  db.users.push(user);
  save(db);
  res.status(201).json(session(user));
});

app.post("/api/login", async (req, res) => {
  const { email = "", password = "" } = req.body;
  const user = load().users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.hash))) return res.status(401).json({ error: "Wrong email or password" });
  res.json(session(user));
});

const auth = (req, res, next) => {
  try {
    req.userId = jwt.verify((req.headers.authorization || "").replace("Bearer ", ""), SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again" });
  }
};

// ---------- Tasks and exams (each user sees only their own) ----------
const PRIORITIES = ["high", "medium", "low"];

const makeTask = (b) => {
  if (!b.title || !b.title.trim()) return { error: "Task title is required" };
  return {
    title: b.title.trim(),
    subject: (b.subject || "").trim() || "General",
    due: b.due || "",
    minutes: Number(b.minutes) || 30,
    priority: PRIORITIES.includes(b.priority) ? b.priority : "medium",
    done: false,
  };
};

const makeExam = (b) => {
  if (!b.title || !b.title.trim() || !b.date) return { error: "Exam name and date are required" };
  return { title: b.title.trim(), subject: (b.subject || "").trim() || "General", date: b.date };
};

const resource = (key, make) => {
  app.get(`/api/${key}`, auth, (req, res) => res.json(load()[key].filter((x) => x.userId === req.userId)));

  app.post(`/api/${key}`, auth, (req, res) => {
    const item = make(req.body);
    if (item.error) return res.status(400).json(item);
    const db = load();
    const full = { ...item, id: randomUUID(), userId: req.userId };
    db[key].push(full);
    save(db);
    res.status(201).json(full);
  });

  app.patch(`/api/${key}/:id`, auth, (req, res) => {
    const db = load();
    const i = db[key].findIndex((x) => x.id === req.params.id && x.userId === req.userId);
    if (i === -1) return res.status(404).json({ error: "Not found" });
    const { id, userId, ...changes } = req.body;
    db[key][i] = { ...db[key][i], ...changes };
    save(db);
    res.json(db[key][i]);
  });

  app.delete(`/api/${key}/:id`, auth, (req, res) => {
    const db = load();
    db[key] = db[key].filter((x) => !(x.id === req.params.id && x.userId === req.userId));
    save(db);
    res.status(204).end();
  });
};

resource("tasks", makeTask);
resource("exams", makeExam);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
