import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, Pause, RotateCcw, Check, Maximize2, X } from "lucide-react";
import { fmtMinutes, subjectColor, todayISO, RANK } from "../utils.js";
import { getFocusSettings } from "../lib/settings.js";
import { buildInsights, getGoal } from "../lib/insights.js";

const EASE = [0.22, 1, 0.36, 1];

const modes = () => {
  const s = getFocusSettings();
  return {
    focus: { label: "Focus", minutes: s.focus },
    short: { label: "Short break", minutes: s.short },
    long: { label: "Long break", minutes: s.long },
  };
};

function FocusRing({ size, stroke, fraction, children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const c = size / 2;
  return (
    <div className="fc-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={stroke} />
        <circle
          className="fc-arc" cx={c} cy={c} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, fraction)))} transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <div className="fc-ring-label">{children}</div>
    </div>
  );
}

export default function Focus({ tasks, exams, sessions, logSession }) {
  const MODES = modes();
  const [mode, setMode] = useState("focus");
  const [left, setLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [cycle, setCycle] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const endAt = useRef(0);

  const total = MODES[mode].minutes * 60;
  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  const today = todayISO();
  const ins = useMemo(() => buildInsights({ tasks, exams, sessions, goal: getGoal() }), [tasks, exams, sessions]);
  const upNext = tasks
    .filter((t) => !t.done)
    .sort((a, b) => (a.due === today ? 0 : 1) - (b.due === today ? 0 : 1) || RANK[a.priority] - RANK[b.priority])
    .slice(0, 4);
  const picked = tasks.find((t) => t.id === taskId);
  const endTime = running ? new Date(endAt.current).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const switchTo = (m) => {
    setMode(m);
    setRunning(false);
    setLeft(MODES[m].minutes * 60);
  };
  const start = () => { endAt.current = Date.now() + left * 1000; setRunning(true); };
  const toggle = () => (running ? setRunning(false) : start());
  const reset = () => { setRunning(false); setLeft(total); };
  const finishEarly = () => {
    const mins = Math.floor((total - left) / 60);
    setRunning(false);
    if (mode === "focus" && mins >= 1) logSession(mins, taskId || null);
    setLeft(total);
  };

  // tick from the real clock so background tabs stay accurate
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) setRunning(false);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // a finished focus session is saved, then the next break (or focus block) is queued up
  useEffect(() => {
    if (left !== 0) return;
    if (mode === "focus") {
      logSession(MODES.focus.minutes, taskId || null);
      setCycle((c) => c + 1);
      switchTo((cycle + 1) % 4 === 0 ? "long" : "short");
    } else {
      switchTo("focus");
    }
  }, [left]);

  useEffect(() => {
    const previous = document.title;
    if (running) document.title = `${clock} · Focus`;
    return () => { document.title = previous; };
  }, [running, clock]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && immersive) setImmersive(false);
      // Space starts and pauses, unless it would activate a control the user is on
      const t = e.target;
      if (e.code === "Space" && (t === document.body || (t.closest && t.closest(".rail")))) { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const controls = (
    <div className="fc-controls">
      <button className="btn-accent fc-start" onClick={toggle}>
        {running ? <><Pause size={16} strokeWidth={2} /> Pause</> : <><Play size={16} strokeWidth={2} /> {left < total ? "Resume" : "Start"}</>}
      </button>
      <button className="dx-btn" onClick={reset}><RotateCcw size={15} strokeWidth={1.75} /> Reset</button>
      {mode === "focus" && <button className="dx-btn" onClick={finishEarly}><Check size={15} strokeWidth={1.75} /> Finish and save</button>}
    </div>
  );

  return (
    <div className="fc-grid">
      <section className="dx-card fc-main">
        <div className="fc-modes" role="group" aria-label="Timer mode">
          {Object.entries(MODES).map(([key, m]) => (
            <button key={key} aria-pressed={key === mode} onClick={() => switchTo(key)}>
              {key === mode && <motion.span layoutId="fc-pill" className="fc-pill" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <FocusRing size={280} stroke={10} fraction={left / total}>
          <span className="fc-time" role="timer">{clock}</span>
          <span className="fc-sub">{running ? `Ends at ${endTime}` : mode === "focus" ? `${MODES.focus.minutes} minute session` : "Take a breather"}</span>
        </FocusRing>

        <div className="fc-dots" role="img" aria-label={`Focus session ${(cycle % 4) + 1} of 4`}>
          {[0, 1, 2, 3].map((i) => <i key={i} className={i < cycle % 4 ? "on" : ""} />)}
        </div>

        {mode === "focus" && (
          <label className="fc-pick">
            <span>Working on</span>
            <select value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={running} aria-label="Task to focus on">
              <option value="">Nothing specific</option>
              {tasks.filter((t) => !t.done).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
        )}

        {controls}
        <button className="fc-link" onClick={() => setImmersive(true)}><Maximize2 size={14} strokeWidth={1.75} /> Open full-screen focus view</button>
        <span className="fc-hint"><span className="kbd">Space</span> starts and pauses</span>
      </section>

      <aside className="fc-side">
        <section className="dx-card">
          <header className="dx-card-head"><h3>Your focus</h3></header>
          <div className="fc-stats">
            <div><span className="dx-val">{ins.focusToday}<small>m</small></span><span className="dx-sub">today</span></div>
            <div><span className="dx-val">{fmtMinutes(ins.weekMinutes)}</span><span className="dx-sub">this week</span></div>
            <div><span className="dx-val">{ins.streak}<small>d</small></span><span className="dx-sub">streak</span></div>
          </div>
          <div className="dx-bar"><span style={{ background: "var(--accent)", transform: `scaleX(${ins.goalPct / 100})`, transformOrigin: "left", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} /></div>
          <p className="dx-sub fc-goal">{ins.goalPct}% of your weekly goal</p>
        </section>

        <section className="dx-card">
          <header className="dx-card-head"><h3>Pick what to work on</h3></header>
          {upNext.length === 0 && <p className="dx-sub">No open tasks. Add one with the New task button.</p>}
          <ul className="fc-next">
            {upNext.map((t) => (
              <li key={t.id}>
                <button aria-pressed={taskId === t.id} disabled={running} onClick={() => { setTaskId(t.id); if (mode !== "focus") switchTo("focus"); }} style={{ "--c": subjectColor(t.subject) }}>
                  <i className="dx-dot" /><span>{t.title}</span><small>{t.minutes} min</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <AnimatePresence>
        {immersive && (
          <motion.div
            className="fc-immersive" role="dialog" aria-modal="true" aria-label="Focus view"
            initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, ease: EASE } }} exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE } }}
          >
            <button className="fc-exit icon-btn" onClick={() => setImmersive(false)} aria-label="Exit focus view" autoFocus><X size={18} strokeWidth={1.75} /></button>
            <p className="fc-mode-label">{MODES[mode].label}</p>
            <FocusRing size={340} stroke={12} fraction={left / total}>
              <span className="fc-time big" role="timer">{clock}</span>
            </FocusRing>
            <p className="fc-doing">{picked ? picked.title : mode === "focus" ? "Deep focus" : "Rest"}</p>
            {controls}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
