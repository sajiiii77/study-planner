// Fills a demo account with realistic study data, so your screenshots look great
// and your README does not show your real email or tasks.
//
// 1. Start the app:            npm run dev
// 2. In another terminal run:  node scripts/seed-demo.mjs
// 3. Log in with:              demo@cadence.app / demo1234
//
// Options: node scripts/seed-demo.mjs [email] [password] [--force]

const API = process.env.API || "http://localhost:4000";
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");
const email = args[0] || "demo@cadence.app";
const password = args[1] || "demo1234";

const pad = (n) => String(n).padStart(2, "0");
const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

let token = "";
async function call(method, path, body) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function signIn() {
  try {
    return await call("POST", "/login", { email, password });
  } catch (e) {
    if (e.status !== 401) throw e;
  }
  try {
    return await call("POST", "/register", { name: "Demo Student", email, password });
  } catch (e) {
    if (e.status === 409) throw new Error(`${email} already exists with a different password. Pass the right password, or use another email.`);
    throw e;
  }
}

// title, subject, due (days from today, null for none), minutes, priority, done
const TASKS = [
  ["Normalization practice set", "Databases", -2, 40, "high", false],
  ["SQL joins worksheet", "Databases", 0, 45, "high", false],
  ["Read chapter 4: transport layer", "Networks", 0, 30, "medium", true],
  ["Flashcards: hypothesis testing", "Statistics", 0, 25, "low", false],
  ["Lab report draft", "Databases", 1, 90, "high", false],
  ["Past paper 2023", "Networks", 2, 60, "medium", false],
  ["Summarise lecture 7", "Statistics", 3, 30, "low", false],
  ["Essay outline: Industrial Revolution", "History", 3, 50, "medium", false],
  ["Dynamic programming problems", "Algorithms", 4, 75, "high", false],
  ["Revise sorting algorithms", "Algorithms", 5, 45, "medium", false],
  ["Read primary sources", "History", 6, 45, "low", false],
  ["Packet tracing lab", "Networks", 8, 60, "medium", false],
  ["Plan revision timetable", "Databases", null, 20, "medium", false],
  ["Chapter 3 notes", "Databases", -5, 35, "medium", true],
  ["Regression exercises", "Statistics", -4, 50, "medium", true],
  ["Graph traversal notes", "Algorithms", -3, 40, "low", true],
  ["Lecture recap: TCP", "Networks", -1, 30, "medium", true],
  ["Intro quiz", "History", -6, 20, "low", true],
  ["Normal forms flashcards", "Databases", -1, 25, "low", true],
];
const EXAMS = [
  ["Quiz 2", "Statistics", 2],
  ["Midterm", "Databases", 5],
  ["Midterm", "Algorithms", 12],
  ["Final", "Networks", 24],
  ["Quiz 1", "History", -10],
];
// study minutes for the last 84 days; the last 6 days are always studied so the streak shows
const PATTERN = [0, 35, 50, 0, 65, 80, 25, 95, 45, 60, 0, 40];
const minutesFor = (offset) => (offset >= -5 ? [45, 60, 35, 90, 50, 75][offset + 5] : PATTERN[(Math.abs(offset) * 7 + 3) % PATTERN.length]);

async function main() {
  const session = await signIn();
  token = session.token;

  const existing = await call("GET", "/tasks");
  if (existing.length && !force) {
    console.log(`This account already has ${existing.length} tasks, so nothing was added. Add --force to add the demo data anyway.`);
    return;
  }

  for (const [title, subject, due, minutes, priority, done] of TASKS) {
    const t = await call("POST", "/tasks", { title, subject, due: due === null ? "" : day(due), minutes, priority });
    if (done) await call("PATCH", `/tasks/${t.id}`, { done: true });
  }
  for (const [title, subject, offset] of EXAMS) await call("POST", "/exams", { title, subject, date: day(offset) });

  let sessions = 0;
  for (let offset = -83; offset <= 0; offset++) {
    const minutes = minutesFor(offset);
    if (minutes > 0) { await call("POST", "/sessions", { minutes, date: day(offset) }); sessions++; }
  }

  console.log(`Done. Added ${TASKS.length} tasks, ${EXAMS.length} exams and ${sessions} study days.`);
  console.log(`Log in at http://localhost:5173 with ${email} / ${password}`);
}

main().catch((e) => {
  if (e.cause && e.cause.code === "ECONNREFUSED") console.error(`Could not reach the API at ${API}. Is "npm run dev" running?`);
  else console.error(e.message);
  process.exit(1);
});
