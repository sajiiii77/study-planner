import { motion } from "motion/react";
import { Clock, Pencil, Trash2, CalendarDays } from "lucide-react";
import { subjectColor, relativeDay } from "../utils.js";
import CheckButton from "./CheckButton.jsx";

const EASE = [0.22, 1, 0.36, 1];

export default function TaskItem({ task: t, today, showDue, onToggle, onEdit, onDelete }) {
  const overdue = !t.done && t.due && t.due < today;
  return (
    <motion.li layout="position" transition={{ duration: 0.25, ease: EASE }} className={t.done ? "cx-row is-done" : "cx-row"} style={{ "--c": subjectColor(t.subject) }}>
      <CheckButton done={t.done} label={`Mark ${t.title} ${t.done ? "not done" : "done"}`} onClick={() => onToggle(t)} />
      <div className="cx-main">
        <button className="cx-title" onClick={() => onEdit(t)}>{t.title}</button>
        <span className="cx-meta">
          <span className="dx-chip"><i className="dx-dot" />{t.subject}</span>
          <span className="dx-meta"><Clock size={12} strokeWidth={1.75} />{t.minutes} min</span>
          {showDue && <span className="dx-meta"><CalendarDays size={12} strokeWidth={1.75} />{relativeDay(t.due)}</span>}
          {overdue && <span className="dx-late">Overdue</span>}
        </span>
      </div>
      <span className={`dx-prio ${t.priority}`}>{t.priority}</span>
      <span className="cx-actions">
        <button className="dx-icon" onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`}><Pencil size={14} strokeWidth={1.75} /></button>
        <button className="dx-icon danger" onClick={() => onDelete(t)} aria-label={`Delete ${t.title}`}><Trash2 size={14} strokeWidth={1.75} /></button>
      </span>
    </motion.li>
  );
}
