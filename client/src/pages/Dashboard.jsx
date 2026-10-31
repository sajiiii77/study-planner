import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Clock, Check, Flame, Target, TrendingUp, TrendingDown, Play, Plus, CalendarDays, GraduationCap, ListChecks } from "lucide-react";
import { fmtMinutes, relativeDay, dayLabel } from "../utils.js";
import { buildInsights, getGoal, saveGoal } from "../lib/insights.js";
import useCountUp from "../useCountUp.js";
import Ring from "../components/dash/Ring.jsx";
import Sparkline from "../components/dash/Sparkline.jsx";
import Donut from "../components/dash/Donut.jsx";
import Heatmap from "../components/dash/Heatmap.jsx";
import MiniMonth from "../components/dash/MiniMonth.jsx";
import TodayTask from "../components/dash/TodayTask.jsx";
import ActivityCard from "../components/dash/ActivityCard.jsx";

const EASE = [0.22, 1, 0.36, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } };

// The entrance sequence plays once per visit to the app, not on every return to the dashboard
let seen = false;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

function Bar({ value, play, color = "var(--accent)" }) {
  return (
    <div className="dx-bar">
      <motion.span
        style={{ background: color, transformOrigin: "left" }}
        initial={play ? { scaleX: 0 } : false}
        animate={{ scaleX: Math.min(1, Math.max(0, value)) }}
        transition={{ duration: 0.8, ease: EASE }}
      />
    </div>
  );
}

export default function Dashboard({ user, tasks, exams, sessions, updateTask, openTask, goTo }) {
  const [play] = useState(() => !seen);
  useEffect(() => { seen = true; }, []);
  const [goal, setGoal] = useState(getGoal);
  const ins = useMemo(() => buildInsights({ tasks, exams, sessions, goal }), [tasks, exams, sessions, goal]);

  const cTotal = useCountUp(ins.totalMinutes);
  const cDone = useCountUp(ins.doneCount);
  const cStreak = useCountUp(ins.streak);
  const cGoal = useCountUp(ins.goalPct);
  const shown = (counted, real) => (play ? counted : real);

  const changeGoal = (e) => {
    const v = Math.max(1, Math.min(60, Number(e.target.value) || 1));
    setGoal(v);
    saveGoal(v);
  };
  const toggle = (t) => updateTask(t.id, { done: !t.done });
  const up = ins.deltaPct !== null && ins.deltaPct >= 0;
  const subjectTotal = ins.subjects.reduce((s, x) => s + x.minutes, 0) || 1;
  const grouped = ins.upcoming.slice(0, 6);

  return (
    <motion.div className="dx" variants={container} initial={play ? "hidden" : false} animate="show">
      {/* hero */}
      <motion.section className="dx-hero" variants={item}>
        <p className="dx-date">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h2>{greeting()}, {user.name.split(" ")[0]}</h2>
        <p className="dx-summary">{ins.summary}</p>
        <p className="dx-quote">{ins.message}</p>
        <div className="dx-actions">
          <button className="btn-accent" onClick={() => goTo("focus")}><Play size={15} strokeWidth={2} /> Start focus session</button>
          <button className="dx-btn" onClick={() => openTask()}><Plus size={15} strokeWidth={1.75} /> New task</button>
          <button className="dx-btn" onClick={() => goTo("calendar")}><CalendarDays size={15} strokeWidth={1.75} /> Plan week</button>
        </div>
      </motion.section>

      <motion.section className="dx-card dx-todayring" variants={item}>
        <Ring value={ins.dueToday.length ? ins.todayDone / ins.dueToday.length : 0} size={116} stroke={9} play={play}>
          <strong className="dx-val">{ins.todayDone}/{ins.dueToday.length}</strong>
          <span>done today</span>
        </Ring>
        <div className="dx-nextup">
          <small>{ins.nextUp ? "Next up" : "All clear"}</small>
          <strong>{ins.nextUp ? ins.nextUp.title : ins.dueToday.length ? "Everything for today is done" : "Nothing due today"}</strong>
          {ins.nextUp && <span>{ins.nextUp.subject}, {ins.nextUp.minutes} min</span>}
        </div>
      </motion.section>

      {/* statistics */}
      <motion.article className="dx-card dx-stat" variants={item}>
        <div className="dx-stat-head"><span className="dx-ico"><Clock size={16} strokeWidth={1.75} /></span><span>Total study time</span></div>
        <div className="dx-stat-row"><span className="dx-val">{fmtMinutes(shown(cTotal, ins.totalMinutes))}</span></div>
        <Sparkline values={ins.last14.map((d) => d.minutes)} play={play} />
        <span className={up ? "dx-delta up" : "dx-delta down"}>
          {ins.deltaPct === null ? "Log a session to start tracking" : (<>{up ? <TrendingUp size={13} strokeWidth={2} /> : <TrendingDown size={13} strokeWidth={2} />}{up ? "+" : ""}{ins.deltaPct}% vs last week</>)}
        </span>
      </motion.article>

      <motion.article className="dx-card dx-stat" variants={item}>
        <div className="dx-stat-head"><span className="dx-ico"><Check size={16} strokeWidth={2} /></span><span>Completed tasks</span></div>
        <div className="dx-stat-row"><span className="dx-val">{shown(cDone, ins.doneCount)}<small>/{tasks.length}</small></span></div>
        <Bar value={ins.pct / 100} play={play} />
        <span className="dx-sub">{ins.pct}% complete, {ins.open.length} left</span>
      </motion.article>

      <motion.article className="dx-card dx-stat" variants={item}>
        <div className="dx-stat-head"><span className="dx-ico amber"><Flame size={16} strokeWidth={1.75} /></span><span>Study streak</span></div>
        <div className="dx-stat-row"><span className="dx-val">{shown(cStreak, ins.streak)}<small> {ins.streak === 1 ? "day" : "days"}</small></span></div>
        <div className="dx-pips" aria-label="Last 14 days">{ins.last14.map((d) => <i key={d.key} className={d.minutes ? "on" : ""} title={d.key} />)}</div>
        <span className="dx-sub">Best streak {ins.bestStreak} {ins.bestStreak === 1 ? "day" : "days"}</span>
      </motion.article>

      <motion.article className="dx-card dx-stat" variants={item}>
        <div className="dx-stat-head"><span className="dx-ico"><Target size={16} strokeWidth={1.75} /></span><span>Weekly productivity</span></div>
        <div className="dx-stat-row">
          <span className="dx-val">{shown(cGoal, ins.goalPct)}%</span>
          <Ring value={ins.goalPct / 100} size={52} stroke={6} play={play} />
        </div>
        <span className="dx-sub">{fmtMinutes(ins.weekMinutes)} of {goal}h goal</span>
      </motion.article>

      {/* activity and schedule */}
      <motion.div className="dx-span8" variants={item}>
        <ActivityCard thisWeek={ins.thisWeek} lastWeek={ins.lastWeek} todayIdx={ins.todayIdx} weekMinutes={ins.weekMinutes} deltaPct={ins.deltaPct} play={play} />
      </motion.div>

      <motion.section className="dx-card dx-schedule" variants={item}>
        <header className="dx-card-head">
          <h3>Upcoming schedule</h3>
          <button className="link-btn" onClick={() => goTo("calendar")}>Open calendar</button>
        </header>
        <MiniMonth tasks={tasks} exams={exams} onPick={() => goTo("calendar")} />
        <ul className="dx-timeline">
          {grouped.length === 0 && <li className="dx-empty">Nothing planned for the next 7 days.</li>}
          {grouped.map((u) => (
            <li key={u.id}>
              <span className={u.kind === "exam" ? "dx-tl-ico exam" : "dx-tl-ico"}>{u.kind === "exam" ? <GraduationCap size={14} strokeWidth={1.75} /> : <ListChecks size={14} strokeWidth={1.75} />}</span>
              <div><strong>{u.title}</strong><small>{u.subject}, {relativeDay(u.date)}{u.minutes ? `, ${u.minutes} min` : ""}</small></div>
              <span className="dx-in">{u.n === 1 ? "Tomorrow" : `In ${u.n}d`}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* tasks and attention */}
      <motion.section className="dx-card dx-tasks" variants={item}>
        <header className="dx-card-head">
          <div><h3>Today's tasks</h3><span className="dx-sub">{ins.todayDone} of {ins.dueToday.length} due today done{ins.overdue.length ? `, ${ins.overdue.length} overdue` : ""}</span></div>
          <button className="link-btn" onClick={() => goTo("tasks")}>All tasks</button>
        </header>
        <Bar value={ins.dueToday.length ? ins.todayDone / ins.dueToday.length : 0} play={play} />
        <ul className="dx-task-list">
          {ins.todayList.map((t) => <TodayTask key={t.id} task={t} today={ins.today} onToggle={toggle} onEdit={openTask} />)}
        </ul>
        {ins.todayList.length === 0 && (
          <div className="dx-empty-block">
            <strong>Nothing due today</strong>
            <span>Pick a task for today from your list, or plan the week.</span>
            <button className="dx-btn" onClick={() => openTask(null, { due: ins.today })}><Plus size={15} strokeWidth={1.75} /> Add a task for today</button>
          </div>
        )}
      </motion.section>

      <motion.section className="dx-card dx-attention" variants={item}>
        <header className="dx-card-head"><h3>Needs attention</h3></header>
        {ins.attention.length === 0 && <div className="dx-empty-block"><strong>All good</strong><span>No overdue work, and your exams are covered.</span></div>}
        <ul>
          {ins.attention.slice(0, 5).map((a) => (
            <li key={a.id}>
              <button className="dx-att" data-kind={a.kind} onClick={() => goTo(a.go[0], a.go[1])}>
                <span className="dx-att-bar" />
                <span><strong>{a.title}</strong><small>{a.text}</small></span>
              </button>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* insights */}
      <motion.h3 className="dx-section" variants={item}>Productivity insights</motion.h3>

      <motion.section className="dx-card dx-consistency" variants={item}>
        <header className="dx-card-head"><h3>Study consistency, last 12 weeks</h3></header>
        <div className="dx-consistency-top"><span className="dx-val">{Math.round((ins.studied14 / 14) * 100)}%</span><span className="dx-sub">You studied on {ins.studied14} of the last 14 days</span></div>
        <Heatmap cells={ins.heat} />
      </motion.section>

      <motion.section className="dx-card dx-subjects" variants={item}>
        <header className="dx-card-head"><h3>Subject distribution</h3></header>
        {ins.subjects.length === 0 ? (
          <div className="dx-empty-block"><strong>No subjects yet</strong><span>Tasks you add will appear here.</span></div>
        ) : (
          <div className="dx-subjects-body">
            <Donut size={124} stroke={15} play={play} segments={ins.subjects.map((s) => ({ label: s.name, value: s.minutes, color: s.color }))}>
              <strong className="dx-val">{ins.subjects.length}</strong><span>{ins.subjects.length === 1 ? "subject" : "subjects"}</span>
            </Donut>
            <ul>
              {ins.subjects.map((s) => (
                <li key={s.name}>
                  <button disabled={s.other} onClick={() => goTo("tasks", { subject: s.name })}>
                    <i style={{ background: s.color }} /><span>{s.name}</span><b>{Math.round((s.minutes / subjectTotal) * 100)}%</b>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      <motion.section className="dx-card dx-goal" variants={item}>
        <header className="dx-card-head"><h3>Weekly goal</h3></header>
        <div className="dx-goal-top"><span className="dx-val">{fmtMinutes(ins.weekMinutes)}</span><span className="dx-sub">of {goal}h</span></div>
        <Bar value={ins.goalPct / 100} play={play} />
        <p className="dx-sub">{ins.goalPct >= 100 ? "Goal reached. Nice work." : `${ins.perDay} min a day gets you there by Sunday.`}</p>
        <label className="dx-goal-edit">Weekly goal <input type="number" min="1" max="60" value={goal} onChange={changeGoal} aria-label="Weekly goal in hours" /> hours</label>
      </motion.section>
    </motion.div>
  );
}
