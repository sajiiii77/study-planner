import { useEffect, useRef, useState } from "react";
import { Download, LogOut, Trash2 } from "lucide-react";
import { initials, todayISO } from "../utils.js";
import { getGoal, saveGoal } from "../lib/insights.js";
import { getFocusSettings, saveFocusSettings, DEFAULT_FOCUS } from "../lib/settings.js";

const SHORTCUTS = [
  ["N", "New task"],
  ["Ctrl K or /", "Search everything"],
  ["Esc", "Close a dialog or menu"],
  ["Left and right arrows", "Inspect a day on a chart"],
  ["Ctrl Enter", "Save the task dialog"],
];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || lo));

export default function Settings({ user, theme, onToggleTheme, onLogout, tasks, exams, sessions, deleteTask, confirm }) {
  const [goal, setGoal] = useState(getGoal);
  const [focus, setFocus] = useState(getFocusSettings);
  const [saved, setSaved] = useState("");
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (text) => {
    setSaved(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(""), 1600);
  };
  const changeGoal = (v) => { const h = clamp(v, 1, 60); setGoal(h); saveGoal(h); flash("Goal saved"); };
  const changeFocus = (key, v, lo, hi) => {
    const next = { ...focus, [key]: clamp(v, lo, hi) };
    setFocus(next);
    saveFocusSettings(next);
    flash("Timer saved");
  };

  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email }, tasks, exams, focusMinutesByDay: sessions };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadence-export-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Export downloaded");
  };

  const done = tasks.filter((t) => t.done);
  const clearDone = () =>
    confirm({
      title: `Delete ${done.length} completed ${done.length === 1 ? "task" : "tasks"}?`,
      text: "Finished tasks will be removed for good. Your focus history and exams are not affected.",
      confirmLabel: "Delete",
      onConfirm: async () => { for (const t of done) await deleteTask(t.id); },
    });

  return (
    <div className="st-wrap">
      <div className="cx-top"><div><h2>Settings</h2><p>Preferences are saved in this browser</p></div><span className="st-saved" role="status">{saved}</span></div>

      <section className="dx-card st-card">
        <div className="st-head"><h3>Profile</h3><p>The details you registered with.</p></div>
        <div className="st-profile">
          <span className="avatar-btn st-avatar">{initials(user.name)}</span>
          <div><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="dx-btn" onClick={onLogout}><LogOut size={15} strokeWidth={1.75} /> Log out</button>
        </div>
      </section>

      <section className="dx-card st-card">
        <div className="st-head"><h3>Weekly study goal</h3><p>Drives the progress rings and the goal card on your dashboard.</p></div>
        <div className="st-controls">
          <div className="qchips">
            {[5, 10, 15, 20, 25].map((h) => <button key={h} className="qchip" aria-pressed={goal === h} onClick={() => changeGoal(h)}>{h}h</button>)}
          </div>
          <input type="range" min="1" max="40" value={Math.min(goal, 40)} onChange={(e) => changeGoal(e.target.value)} aria-label="Weekly goal in hours" className="st-range" />
          <label className="st-num">Hours per week <input type="number" min="1" max="60" value={goal} onChange={(e) => changeGoal(e.target.value)} /></label>
        </div>
      </section>

      <section className="dx-card st-card">
        <div className="st-head"><h3>Focus timer</h3><p>Session lengths in minutes. Applies the next time you open Focus Mode.</p></div>
        <div className="st-controls row">
          <label className="st-num">Focus <input type="number" min="5" max="120" value={focus.focus} onChange={(e) => changeFocus("focus", e.target.value, 5, 120)} /></label>
          <label className="st-num">Short break <input type="number" min="1" max="30" value={focus.short} onChange={(e) => changeFocus("short", e.target.value, 1, 30)} /></label>
          <label className="st-num">Long break <input type="number" min="5" max="60" value={focus.long} onChange={(e) => changeFocus("long", e.target.value, 5, 60)} /></label>
          <button className="dx-btn" onClick={() => { setFocus({ ...DEFAULT_FOCUS }); saveFocusSettings({ ...DEFAULT_FOCUS }); flash("Timer reset"); }}>Reset</button>
        </div>
      </section>

      <section className="dx-card st-card">
        <div className="st-head"><h3>Appearance</h3><p>Animations follow your device setting for reduced motion.</p></div>
        <div className="cx-seg" role="group" aria-label="Theme">
          <button aria-pressed={theme === "dark"} onClick={() => theme !== "dark" && onToggleTheme()}>Dark</button>
          <button aria-pressed={theme === "light"} onClick={() => theme !== "light" && onToggleTheme()}>Light</button>
        </div>
      </section>

      <section className="dx-card st-card">
        <div className="st-head"><h3>Keyboard shortcuts</h3></div>
        <ul className="st-keys">{SHORTCUTS.map(([k, d]) => <li key={k}><span>{d}</span><span className="kbd">{k}</span></li>)}</ul>
      </section>

      <section className="dx-card st-card">
        <div className="st-head"><h3>Your data</h3><p>{tasks.length} tasks, {exams.length} exams and your focus history.</p></div>
        <div className="st-controls row">
          <button className="dx-btn" onClick={exportData}><Download size={15} strokeWidth={1.75} /> Export as JSON</button>
          <button className="dx-btn danger" disabled={!done.length} onClick={clearDone}><Trash2 size={15} strokeWidth={1.75} /> Delete completed tasks ({done.length})</button>
        </div>
      </section>
    </div>
  );
}
