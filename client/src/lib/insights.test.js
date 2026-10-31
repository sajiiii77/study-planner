import { test } from "node:test";
import assert from "node:assert/strict";
import { iso, addDays } from "../utils.js";
import { buildInsights } from "./insights.js";
import { buildAnalytics } from "./analytics.js";
import { smoothPath } from "./path.js";

const day = (n) => iso(addDays(new Date(), n));
const tasks = [
  { id: "1", title: "Joins", subject: "Databases", due: day(0), minutes: 45, priority: "high", done: false },
  { id: "2", title: "Chapter 4", subject: "Networks", due: day(0), minutes: 30, priority: "medium", done: true },
  { id: "3", title: "Normalization", subject: "Databases", due: day(-2), minutes: 40, priority: "high", done: false },
  { id: "4", title: "Lab", subject: "Databases", due: day(3), minutes: 90, priority: "low", done: false },
];
const exams = [{ id: "e1", title: "Midterm", subject: "Databases", date: day(2) }];
const sessions = [{ date: day(-1), minutes: 40 }, { date: day(0), minutes: 25 }];

test("buildInsights counts tasks, overdue work and today's list", () => {
  const ins = buildInsights({ tasks, exams, sessions, goal: 10 });
  assert.equal(ins.doneCount, 1);
  assert.equal(ins.pct, 25);
  assert.equal(ins.overdue.length, 1);
  assert.equal(ins.dueToday.length, 2);
  assert.equal(ins.todayList[0].done, false);
  assert.equal(ins.minutesLeft, 45 + 40 + 90);
});

test("buildInsights derives streak, goal progress and attention items from real data", () => {
  const ins = buildInsights({ tasks, exams, sessions, goal: 10 });
  assert.equal(ins.streak, 2);
  assert.equal(ins.totalMinutes, 65);
  assert.equal(ins.goalPct, Math.min(100, Math.round((ins.weekMinutes / 600) * 100)));
  assert.ok(ins.attention.some((a) => a.kind === "overdue"));
  assert.ok(ins.attention.some((a) => a.kind === "exam"));
  assert.equal(ins.subjects[0].name, "Databases");
});

test("buildInsights handles an empty account", () => {
  const ins = buildInsights({ tasks: [], exams: [], sessions: [], goal: 10 });
  assert.equal(ins.pct, 0);
  assert.equal(ins.streak, 0);
  assert.equal(ins.attention.length, 0);
  assert.match(ins.message, /first task/i);
});

test("buildAnalytics builds the requested range", () => {
  const a = buildAnalytics({ sessions, tasks, exams, days: 30 });
  assert.equal(a.series.length, 30);
  assert.equal(a.total, 65);
  assert.equal(a.activeDays, 2);
  assert.equal(a.heat.length, 182);
  assert.equal(a.workload.length, 14);
  assert.ok(a.notes.length > 0);
});

test("smoothPath returns a valid path without NaN", () => {
  const d = smoothPath([{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 30 }]);
  assert.match(d, /^M0,10 C/);
  assert.ok(!d.includes("NaN"));
  assert.equal(smoothPath([]), "");
});
