import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { studyStats } from "../utils.js";

const MODES = {
  focus: { label: "Focus", minutes: 25 },
  short: { label: "Short break", minutes: 5 },
  long: { label: "Long break", minutes: 15 },
};
const C = 2 * Math.PI * 90; // ring circumference

export default function Focus({ tasks, sessions, logSession }) {
  const [mode, setMode] = useState("focus");
  const [left, setLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const endAt = useRef(0);

  const total = MODES[mode].minutes * 60;
  const { today, streak } = studyStats(sessions);
  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  // Tick using the real clock so it stays accurate in background tabs
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) setRunning(false);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // Timer finished: save the session and reset
  useEffect(() => {
    if (left !== 0) return;
    if (mode === "focus") logSession(MODES.focus.minutes, taskId || null);
    setLeft(total);
  }, [left]);

  useEffect(() => {
    document.title = running ? `${clock} · Focus` : "Study Planner";
    return () => { document.title = "Study Planner"; };
  }, [running, clock]);

  const choose = (m) => { setMode(m); setRunning(false); setLeft(MODES[m].minutes * 60); };
  const start = () => { endAt.current = Date.now() + left * 1000; setRunning(true); };
  const reset = () => { setRunning(false); setLeft(total); };
  const finishEarly = () => {
    const mins = Math.floor((total - left) / 60);
    setRunning(false);
    if (mins >= 1) logSession(mins, taskId || null);
    setLeft(total);
  };

  return (
    <div className="card focus">
      <div className="toolbar center">
        {Object.entries(MODES).map(([key, m]) => (
          <button key={key} className={key === mode ? "chip on" : "chip"} onClick={() => choose(key)}>{m.label}</button>
        ))}
      </div>

      <div className="ring">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="90" className="ring-bg" />
          <circle cx="100" cy="100" r="90" className="ring-fg" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - left / total) }} />
        </svg>
        <div className="ring-time" role="timer">{clock}</div>
      </div>

      {mode === "focus" && (
        <select value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={running} aria-label="Task to focus on">
          <option value="">No specific task</option>
          {tasks.filter((t) => !t.done).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      )}

      <div className="controls">
        {running
          ? <button className="btn" onClick={() => setRunning(false)}><Pause size={18} /> Pause</button>
          : <button className="btn" onClick={start}><Play size={18} /> Start</button>}
        <button className="btn ghost" onClick={reset}><RotateCcw size={18} /> Reset</button>
        {mode === "focus" && <button className="btn ghost" onClick={finishEarly}><Check size={18} /> Finish and save</button>}
      </div>

      <p className="meta">Today: {today} min · {streak}-day streak</p>
    </div>
  );
}
