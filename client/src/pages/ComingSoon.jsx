import { Sparkles } from "lucide-react";

export default function ComingSoon({ title, onBack }) {
  return (
    <div className="placeholder">
      <span className="ico"><Sparkles size={22} strokeWidth={1.75} /></span>
      <h2>{title} is on its way</h2>
      <p>This page arrives in a later step of the redesign. Your tasks, calendar, exams and focus timer all work from the other pages.</p>
      <button className="btn ghost" onClick={onBack}>Back to dashboard</button>
    </div>
  );
}
