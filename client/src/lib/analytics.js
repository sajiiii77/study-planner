import { iso, addDays, startOfWeek, todayISO, daysUntil, fmtMinutes, parse } from "../utils.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sum = (a) => a.reduce((s, x) => s + x, 0);

export function buildAnalytics({ sessions, tasks, exams, days }) {
  const now = new Date();
  const today = todayISO();
  const byDate = Object.fromEntries(sessions.map((s) => [s.date, s.minutes]));

  const series = Array.from({ length: days }, (_, i) => {
    const d = addDays(now, i - (days - 1));
    const key = iso(d);
    return { key, date: d, minutes: byDate[key] || 0 };
  });
  const prevTotal = sum(Array.from({ length: days }, (_, i) => byDate[iso(addDays(now, i - (2 * days - 1)))] || 0));
  const total = sum(series.map((d) => d.minutes));
  const active = series.filter((d) => d.minutes > 0);
  const avgActive = active.length ? Math.round(total / active.length) : 0;
  const best = series.reduce((b, d) => (d.minutes > b.minutes ? d : b), { minutes: 0 });
  const deltaPct = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  const consistency = Math.round((active.length / days) * 100);

  // average minutes per weekday in the range
  const wk = WEEKDAYS.map(() => ({ sum: 0, count: 0 }));
  series.forEach((d) => { const i = (d.date.getDay() + 6) % 7; wk[i].sum += d.minutes; wk[i].count++; });
  const weekday = wk.map((w, i) => ({ label: WEEKDAYS[i], full: FULL[i], avg: w.count ? Math.round(w.sum / w.count) : 0 }));
  const bestWeekday = weekday.reduce((b, d) => (d.avg > b.avg ? d : b), { avg: 0 });

  // 26 weeks of activity
  const mon = startOfWeek(now);
  const heat = Array.from({ length: 182 }, (_, i) => {
    const d = addDays(mon, -175 + i);
    const key = iso(d);
    const m = byDate[key] || 0;
    return { key, date: d, minutes: m, future: key > today, level: m === 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4 };
  });

  // longest streak on record
  const studied = Object.keys(byDate).filter((k) => byDate[k] > 0).sort();
  let bestStreak = 0, run = 0, prev = null;
  for (const k of studied) {
    run = prev && iso(addDays(parse(prev), 1)) === k ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = k;
  }

  // completion by subject
  const map = {};
  tasks.forEach((t) => {
    const s = (map[t.subject] ||= { name: t.subject, done: 0, total: 0, minutes: 0 });
    s.total++;
    s.minutes += t.minutes;
    if (t.done) s.done++;
  });
  const bySubject = Object.values(map).sort((a, b) => b.total - a.total);
  const priority = ["high", "medium", "low"].map((p) => {
    const mine = tasks.filter((t) => t.priority === p);
    return { key: p, open: mine.filter((t) => !t.done).length, total: mine.length };
  });

  // planned workload for the next 14 days
  const workload = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(now, i);
    const key = iso(d);
    return {
      key, date: d,
      minutes: tasks.filter((t) => !t.done && t.due === key).reduce((s, t) => s + t.minutes, 0),
      exams: exams.filter((x) => x.date === key).length,
    };
  });

  // plain-language notes
  const notes = [];
  if (total === 0) {
    notes.push("No focus time logged in this period yet. Finish a session on the Focus page to start seeing patterns.");
  } else {
    if (bestWeekday.avg > 0) notes.push(`${bestWeekday.full} is your strongest day, with about ${fmtMinutes(bestWeekday.avg)} on average.`);
    notes.push(`You studied on ${active.length} of the last ${days} days (${consistency}%).`);
    if (deltaPct !== null) notes.push(`${deltaPct >= 0 ? "Up" : "Down"} ${Math.abs(deltaPct)}% compared with the previous ${days} days.`);
    if (best.minutes > 0) notes.push(`Your longest day was ${best.date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}, with ${fmtMinutes(best.minutes)}.`);
    if (bestStreak > 1) notes.push(`Your best streak so far is ${bestStreak} days in a row.`);
  }
  const lateExam = exams.filter((x) => { const n = daysUntil(x.date); return n >= 0 && n <= 7; })[0];
  if (lateExam) notes.push(`${lateExam.title} is ${daysUntil(lateExam.date) === 0 ? "today" : `in ${daysUntil(lateExam.date)} days`}. Plan a revision block for ${lateExam.subject}.`);

  return { series, total, prevTotal, avgActive, best, deltaPct, consistency, activeDays: active.length, weekday, bestWeekday, heat, bestStreak, bySubject, priority, workload, notes };
}
