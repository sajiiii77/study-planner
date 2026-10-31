import { iso, parse, addDays, startOfWeek, todayISO, daysUntil, fmtMinutes, studyStats, subjectColor, RANK } from "../utils.js";

export const getGoal = () => {
  try { return Number(localStorage.getItem("weeklyGoal")) || 10; } catch { return 10; }
};
export const saveGoal = (hours) => {
  try { localStorage.setItem("weeklyGoal", String(hours)); } catch { /* storage unavailable */ }
};

const sum = (list) => list.reduce((s, d) => s + d.minutes, 0);
const whenText = (n) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);

// Everything on the dashboard is derived here from real tasks, exams and focus sessions
export function buildInsights({ tasks, exams, sessions, goal }) {
  const now = new Date();
  const today = todayISO();
  const byDate = Object.fromEntries(sessions.map((s) => [s.date, s.minutes]));
  const { today: focusToday, streak } = studyStats(sessions);

  // weeks (Monday first)
  const mon = startOfWeek(now);
  const makeWeek = (offset) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(mon, offset * 7 + i);
      const key = iso(d);
      return { key, date: d, minutes: byDate[key] || 0, future: key > today };
    });
  const thisWeek = makeWeek(0);
  const lastWeek = makeWeek(-1);
  const todayIdx = thisWeek.findIndex((d) => d.key === today);
  const weekMinutes = sum(thisWeek);
  const toDate = sum(thisWeek.slice(0, todayIdx + 1));
  const lastToDate = sum(lastWeek.slice(0, todayIdx + 1));
  const deltaPct = lastToDate ? Math.round(((toDate - lastToDate) / lastToDate) * 100) : null;
  const totalMinutes = sessions.reduce((s, x) => s + x.minutes, 0);

  // best streak ever
  const studied = Object.keys(byDate).filter((k) => byDate[k] > 0).sort();
  let bestStreak = 0, run = 0, prev = null;
  for (const k of studied) {
    run = prev && iso(addDays(parse(prev), 1)) === k ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = k;
  }

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const key = iso(addDays(now, i - 13));
    return { key, minutes: byDate[key] || 0 };
  });
  const studied14 = last14.filter((x) => x.minutes > 0).length;
  const heat = Array.from({ length: 84 }, (_, i) => {
    const d = addDays(mon, -77 + i);
    const key = iso(d);
    const m = byDate[key] || 0;
    return { key, date: d, minutes: m, future: key > today, level: m === 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4 };
  });

  // tasks
  const open = tasks.filter((t) => !t.done);
  const doneCount = tasks.length - open.length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const dueToday = tasks.filter((t) => t.due === today);
  const overdue = open.filter((t) => t.due && t.due < today);
  const todayList = [...overdue, ...dueToday].sort((a, b) => a.done - b.done || RANK[a.priority] - RANK[b.priority]);
  const todayDone = dueToday.filter((t) => t.done).length;
  const nextUp = todayList.find((t) => !t.done) || null;
  const minutesLeft = open.reduce((s, t) => s + t.minutes, 0);

  // subject mix by planned study time
  const map = {};
  tasks.forEach((t) => {
    const s = (map[t.subject] ||= { name: t.subject, minutes: 0, count: 0, done: 0 });
    s.minutes += t.minutes;
    s.count++;
    if (t.done) s.done++;
  });
  let subjects = Object.values(map).sort((a, b) => b.minutes - a.minutes);
  if (subjects.length > 6) {
    const rest = subjects.slice(5);
    subjects = [
      ...subjects.slice(0, 5),
      { name: "Other", minutes: rest.reduce((s, x) => s + x.minutes, 0), count: rest.reduce((s, x) => s + x.count, 0), done: rest.reduce((s, x) => s + x.done, 0), other: true },
    ];
  }
  subjects = subjects.map((s) => ({ ...s, color: s.other ? "var(--text-3)" : subjectColor(s.name) }));

  // weekly goal
  const goalMinutes = goal * 60;
  const goalPct = Math.min(100, Math.round((weekMinutes / goalMinutes) * 100));
  const remaining = Math.max(0, goalMinutes - weekMinutes);
  const perDay = Math.ceil(remaining / (7 - todayIdx) / 5) * 5;

  // exams and upcoming schedule
  const upcomingExams = exams.filter((x) => daysUntil(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const nextExam = upcomingExams[0] || null;
  const nExam = nextExam ? daysUntil(nextExam.date) : null;
  const upcoming = [];
  for (let i = 1; i <= 7; i++) {
    const key = iso(addDays(now, i));
    exams.filter((x) => x.date === key).forEach((x) => upcoming.push({ id: `e${x.id}`, kind: "exam", title: x.title, subject: x.subject, date: key, n: i }));
    open.filter((t) => t.due === key).forEach((t) => upcoming.push({ id: `t${t.id}`, kind: "task", title: t.title, subject: t.subject, date: key, n: i, minutes: t.minutes }));
  }

  // areas that need attention
  const attention = [];
  const overBySubject = {};
  overdue.forEach((t) => (overBySubject[t.subject] ||= []).push(t));
  Object.entries(overBySubject).forEach(([subject, list]) => {
    const late = Math.abs(daysUntil(list.map((t) => t.due).sort()[0]));
    attention.push({ id: `o:${subject}`, sev: 3, kind: "overdue", title: `${list.length} overdue in ${subject}`, text: `Oldest is ${late} ${late === 1 ? "day" : "days"} late`, go: ["tasks", { subject }] });
  });
  exams.forEach((x) => {
    const n = daysUntil(x.date);
    if (n < 0 || n > 14) return;
    const openFor = open.filter((t) => t.subject === x.subject).length;
    const anyFor = tasks.some((t) => t.subject === x.subject);
    if ((!anyFor || openFor > 0) && (n <= 7 || !anyFor)) {
      attention.push({
        id: `e:${x.id}`, sev: n <= 3 ? 3 : 2, kind: "exam", title: `${x.title} ${whenText(n)}`,
        text: !anyFor ? `No study tasks planned for ${x.subject}` : `${openFor} open ${x.subject} ${openFor === 1 ? "task" : "tasks"} left`,
        go: ["calendar", { tab: "exams" }],
      });
    }
  });
  Object.values(map).forEach((s) => {
    if (s.count >= 3 && s.done / s.count < 0.25 && !overBySubject[s.name]) {
      attention.push({ id: `l:${s.name}`, sev: 1, kind: "low", title: `${s.name} is ${Math.round((s.done / s.count) * 100)}% done`, text: `${s.count - s.done} of ${s.count} tasks still open`, go: ["tasks", { subject: s.name }] });
    }
  });
  if (streak > 0 && focusToday === 0) {
    attention.push({ id: "streak", sev: 1, kind: "streak", title: `Keep your ${streak}-day streak`, text: "No focus session yet today", go: ["focus", {}] });
  }
  attention.sort((a, b) => b.sev - a.sev);

  // words
  const summary =
    tasks.length === 0
      ? "Add your first task and your week will fill in below."
      : todayList.length === 0
      ? `Nothing is due today. ${fmtMinutes(minutesLeft)} of study is still planned.`
      : `${dueToday.length} due today${overdue.length ? ` and ${overdue.length} overdue` : ""}, with ${fmtMinutes(minutesLeft)} of study left in total.`;

  let message = "Small, steady sessions beat last-minute marathons.";
  if (tasks.length === 0) message = "Add your first task and your week starts to take shape.";
  else if (nExam !== null && nExam <= 3) message = `${nextExam.title} is ${whenText(nExam)}. Give ${nextExam.subject} your best hour today.`;
  else if (overdue.length) message = overdue.length === 1 ? "One task slipped. Clear it first and the rest feels lighter." : `${overdue.length} tasks slipped. Start with the smallest one.`;
  else if (dueToday.length && todayDone === dueToday.length) message = "Everything planned for today is done. Rest is part of the plan.";
  else if (goalPct >= 100) message = "Weekly goal reached. Anything extra is a bonus.";
  else if (streak >= 3) message = `${streak} days in a row. Protect the streak with one short session.`;

  return {
    today, thisWeek, lastWeek, todayIdx, weekMinutes, deltaPct, totalMinutes, streak, bestStreak, last14, studied14, heat,
    open, doneCount, pct, dueToday, overdue, todayList, todayDone, nextUp, minutesLeft, focusToday,
    subjects, goalMinutes, goalPct, remaining, perDay, nextExam, nExam, upcoming, attention, summary, message,
  };
}
