import { useState } from "react";
import Modal from "./Modal.jsx";
import { iso, addDays } from "../utils.js";

export default function ExamModal({ subjects, onSave, onClose }) {
  const [form, setForm] = useState({ title: "", subject: "", date: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const soon = [["In 1 week", 7], ["In 2 weeks", 14], ["In 1 month", 30]];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Give the exam a name"); return; }
    if (!form.date) { setError("Pick the exam date"); return; }
    setSaving(true);
    const ok = await onSave({ ...form, title: form.title.trim() });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal title="Add exam" onClose={onClose} width={480}>
      <form onSubmit={submit} noValidate>
        <div className="mdl-body">
          <div className="fld">
            <label htmlFor="em-title">Exam</label>
            <input id="em-title" autoFocus value={form.title} onChange={(e) => { set("title", e.target.value); setError(""); }} placeholder="e.g. Midterm" />
          </div>
          <div className="fld">
            <label htmlFor="em-subject">Subject</label>
            <input id="em-subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Databases" />
            {subjects.length > 0 && (
              <div className="qchips">
                {subjects.slice(0, 8).map((s) => (
                  <button type="button" key={s} className="qchip" aria-pressed={form.subject === s} onClick={() => set("subject", s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <div className="fld">
            <span className="lbl">Date</span>
            <div className="qchips">
              {soon.map(([label, n]) => {
                const v = iso(addDays(new Date(), n));
                return <button type="button" key={label} className="qchip" aria-pressed={form.date === v} onClick={() => { set("date", v); setError(""); }}>{label}</button>;
              })}
              <input type="date" className="qdate" value={form.date} onChange={(e) => { set("date", e.target.value); setError(""); }} aria-label="Exam date" />
            </div>
            {error && <span className="fld-error" role="alert">{error}</span>}
          </div>
        </div>
        <div className="mdl-foot">
          <span className="grow" />
          <button type="button" className="dx-btn" onClick={onClose}>Cancel</button>
          <button className="btn-accent" disabled={saving}>Add exam</button>
        </div>
      </form>
    </Modal>
  );
}
