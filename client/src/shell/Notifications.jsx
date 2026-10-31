import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Clock, CalendarDays, GraduationCap } from "lucide-react";
import { buildNotifications } from "../lib/notifications.js";
import useDismiss from "./useDismiss.js";

const KEY = "cadence-read";
const ICONS = { overdue: Clock, today: CalendarDays, exam: GraduationCap };

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

export default function Notifications({ tasks, exams, onOpenTask, onGo }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(load);
  const ref = useRef(null);
  const items = useMemo(() => buildNotifications(tasks, exams), [tasks, exams]);
  const unread = items.filter((n) => !read.includes(n.id)).length;
  useDismiss(ref, () => setOpen(false), open);

  const save = (ids) => {
    setRead(ids);
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
  };
  const markAll = () => save(items.map((n) => n.id));
  const choose = (n) => {
    save([...new Set([...read, n.id])]);
    setOpen(false);
    if (n.task) onOpenTask(n.task);
    else onGo("calendar", { tab: "exams" });
  };

  return (
    <div className="pop-anchor" ref={ref}>
      <button className="icon-btn" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Bell size={17} strokeWidth={1.75} />
        {unread > 0 && <span className="badge-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="pop" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <div className="pop-head">
              <span>Notifications</span>
              {unread > 0 && <button className="link-btn" onClick={markAll}>Mark all read</button>}
            </div>
            {items.length === 0 ? (
              <div className="pop-empty">You are all caught up.</div>
            ) : (
              <div className="notif-list">
                {items.map((n) => {
                  const Icon = ICONS[n.kind];
                  return (
                    <button key={n.id} className={read.includes(n.id) ? "notif-item" : "notif-item unread"} data-kind={n.kind} onClick={() => choose(n)}>
                      <span className="notif-ico"><Icon size={15} strokeWidth={1.75} /></span>
                      <span><strong>{n.title}</strong><span className="t">{n.text}</span></span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
