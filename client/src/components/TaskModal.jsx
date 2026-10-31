import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "./Modal.jsx";
import { iso, addDays, startOfWeek, todayISO } from "../utils.js";

const PRIORITIES = [["high", "High"], ["medium", "Medium"], ["low", "Low"]];
const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function TaskModal({ task, preset, subjects, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() =>
    task
      ? { title: task.title, subject: task.subject, due: task.due, minutes: task.minutes, priority: task.priority }
      : { title: "", subject: "", due: "", minutes: 30, priority: "medium", ...preset }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const today = todayISO();
  const days = [["Today", today], ["Tomorrow", iso(addDays(new Date(), 1))], ["Next week", iso(addDays(startOfWeek(new Date()), 7))], ["No date", ""]];

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) { setError("Give your task a name"); return; }
    setSaving(true);
    const ok = await onSave({ ...form, title: form.title.trim(), minutes: Number(form.minutes) || 30 });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={submit} onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && submit(e)} noValidate>
        <div className="mdl-body">
          <div className="fld">
            <label htmlFor="tm-title">What do you need to study?</label>
            <input id="tm-title" autoFocus value={form.title} aria-invalid={!!error} onChange={(e) => { set("title", e.target.value); setError(""); }} placeholder="e.g. Chapter 4 practice problems" />
            {error && <span className="fld-error" role="alert">{error}</span>}
          </div>

          <div className="fld">
            <label htmlFor="tm-subject">Subject</label>
            <input id="tm-subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Databases" />
            {subjects.length > 0 && (
              <div className="qchips">
                {subjects.slice(0, 8).map((s) => (
                  <button type="button" key={s} className="qchip" aria-pressed={form.subject === s} onClick={() => set("subject", s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className="fld">
            <span className="lbl">Study on</span>
            <div className="qchips">
              {days.map(([label, value]) => (
                <button type="button" key={label} className="qchip" aria-pressed={form.due === value} onClick={() => set("due", value)}>{label}</button>
              ))}
              <input type="date" className="qdate" value={form.due} onChange={(e) => set("due", e.target.value)} aria-label="Pick a date" />
            </div>
          </div>

          <div className="fld">
            <span className="lbl">Time needed</span>
            <div className="qchips">
              {DURATIONS.map((m) => (
                <button type="button" key={m} className="qchip" aria-pressed={Number(form.minutes) === m} onClick={() => set("minutes", m)}>{m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`}</button>
              ))}
              <input type="number" className="qnum" min="5" step="5" value={form.minutes} onChange={(e) => set("minutes", e.target.value)} aria-label="Minutes" />
            </div>
          </div>

          <div className="fld">
            <span className="lbl">Priority</span>
            <div className="prio-seg" role="group" aria-label="Priority">
              {PRIORITIES.map(([value, label]) => (
                <button type="button" key={value} className={`prio-btn ${value}`} aria-pressed={form.priority === value} onClick={() => set("priority", value)}><i />{label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mdl-foot">
          {task && <button type="button" className="dx-btn danger" onClick={() => onDelete(task)}><Trash2 size={15} strokeWidth={1.75} /> Delete</button>}
          <span className="grow" />
          <button type="button" className="dx-btn" onClick={onClose}>Cancel</button>
          <button className="btn-accent" disabled={saving}>{task ? "Save changes" : "Add task"}</button>
        </div>
      </form>
    </Modal>
  );
}
