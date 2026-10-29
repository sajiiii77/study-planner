import { useState } from "react";
import { Trash2 } from "lucide-react";
import { dayLabel, daysUntil } from "../utils.js";

const empty = { title: "", subject: "", date: "" };

export default function Exams({ exams, addExam, deleteExam }) {
  const [form, setForm] = useState(empty);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (await addExam(form)) setForm(empty);
  };
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <form className="card exam-form" onSubmit={submit}>
        <input placeholder="Exam name (e.g. Midterm)" value={form.title} onChange={set("title")} aria-label="Exam name" />
        <input placeholder="Subject" value={form.subject} onChange={set("subject")} aria-label="Subject" />
        <input type="date" value={form.date} onChange={set("date")} aria-label="Exam date" />
        <button>Add exam</button>
      </form>

      {sorted.length === 0 && <p className="empty">No exams yet. Add one to start the countdown.</p>}
      <div className="exams">
        {sorted.map((x) => {
          const n = daysUntil(x.date);
          return (
            <div key={x.id} className={n >= 0 && n <= 7 ? "card exam soon" : "card exam"}>
              <strong>{n < 0 ? "Passed" : n === 0 ? "Today" : n}</strong>
              {n > 0 && <span> {n === 1 ? "day" : "days"}</span>}
              <p>{x.title}</p>
              <small>{x.subject} · {dayLabel(x.date)}</small>
              <button className="icon-btn corner" onClick={() => deleteExam(x.id)} aria-label={`Delete ${x.title}`}><Trash2 size={16} /></button>
            </div>
          );
        })}
      </div>
    </>
  );
}
