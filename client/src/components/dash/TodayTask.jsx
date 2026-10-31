import { motion } from "motion/react";
import { Clock, Pencil } from "lucide-react";
import { subjectColor } from "../../utils.js";

const EASE = [0.22, 1, 0.36, 1];

export default function TodayTask({ task: t, today, onToggle, onEdit }) {
  const overdue = !t.done && t.due && t.due < today;
  return (
    <motion.li layout="position" transition={{ duration: 0.25, ease: EASE }} className={t.done ? "dx-task is-done" : "dx-task"} style={{ "--c": subjectColor(t.subject) }}>
      <button className="dx-check" role="checkbox" aria-checked={t.done} aria-label={`Mark ${t.title} ${t.done ? "not done" : "done"}`} onClick={() => onToggle(t)}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
            initial={false} animate={{ pathLength: t.done ? 1 : 0, opacity: t.done ? 1 : 0 }} transition={{ duration: 0.2, ease: EASE }}
          />
        </svg>
      </button>
      <div className="dx-task-main">
        <span className="dx-task-title">{t.title}</span>
        <span className="dx-task-meta">
          <span className="dx-chip"><i className="dx-dot" />{t.subject}</span>
          <span className="dx-meta"><Clock size={12} strokeWidth={1.75} />{t.minutes} min</span>
          {overdue ? <span className="dx-late">Overdue</span> : <span className="dx-meta">Due today</span>}
        </span>
      </div>
      <span className={`dx-prio ${t.priority}`}>{t.priority}</span>
      <button className="dx-icon" onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`}><Pencil size={14} strokeWidth={1.75} /></button>
    </motion.li>
  );
}
