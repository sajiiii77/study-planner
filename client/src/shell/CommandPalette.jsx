import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Plus, Timer, ListChecks, GraduationCap, Library } from "lucide-react";
import { PAGES } from "./nav.js";

const EASE = [0.22, 1, 0.36, 1];

export default function CommandPalette({ open, onClose, tasks, exams, onGo, onOpenTask, onNewTask, onSubject }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(""); setActive(0); }
  }, [open]);
  useEffect(() => setActive(0), [query]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const has = (s) => s.toLowerCase().includes(q);
    const out = [];
    [
      { id: "a-new", group: "Actions", label: "New task", hint: "N", icon: Plus, run: () => onNewTask() },
      { id: "a-focus", group: "Actions", label: "Start a focus session", icon: Timer, run: () => onGo("focus") },
    ].filter((a) => !q || has(a.label)).forEach((a) => out.push(a));
    PAGES.filter((p) => !q || has(p.label)).forEach((p) =>
      out.push({ id: `p-${p.id}`, group: "Pages", label: p.label, icon: p.icon, run: () => onGo(p.id) })
    );
    if (q) {
      tasks.filter((t) => has(t.title) || has(t.subject)).slice(0, 6).forEach((t) =>
        out.push({ id: `t-${t.id}`, group: "Tasks", label: t.title, hint: t.subject, icon: ListChecks, run: () => onOpenTask(t) })
      );
      exams.filter((x) => has(x.title) || has(x.subject)).slice(0, 4).forEach((x) =>
        out.push({ id: `e-${x.id}`, group: "Exams", label: x.title, hint: x.subject, icon: GraduationCap, run: () => onGo("calendar", { tab: "exams" }) })
      );
      [...new Set(tasks.map((t) => t.subject))].filter(has).slice(0, 4).forEach((s) =>
        out.push({ id: `s-${s}`, group: "Subjects", label: s, hint: `${tasks.filter((t) => t.subject === s).length} tasks`, icon: Library, run: () => onSubject(s) })
      );
    }
    return out.map((it, i, arr) => ({ ...it, head: i === 0 || arr[i - 1].group !== it.group }));
  }, [query, tasks, exams]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (it) => { onClose(); it.run(); };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (items.length ? (a + 1) % items.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (items.length ? (a - 1 + items.length) % items.length : 0)); }
    else if (e.key === "Enter" && items[active]) { e.preventDefault(); choose(items[active]); }
    else if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmd-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE } }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="cmd"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE } }}
            exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.14, ease: EASE } }}
          >
            <div className="cmd-input">
              <Search size={18} strokeWidth={1.75} />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Search tasks, exams, subjects, pages" aria-label="Search" />
              <span className="kbd">Esc</span>
            </div>
            <div className="cmd-list" ref={listRef} role="listbox">
              {items.length === 0 && <div className="cmd-empty">Nothing matches "{query}".</div>}
              {items.map((it, i) => (
                <div key={it.id}>
                  {it.head && <div className="cmd-group">{it.group}</div>}
                  <button className="cmd-item" role="option" aria-selected={i === active} onMouseMove={() => setActive(i)} onClick={() => choose(it)}>
                    <it.icon size={16} strokeWidth={1.75} />
                    <span className="grow">{it.label}</span>
                    {it.hint && <small>{it.hint}</small>}
                  </button>
                </div>
              ))}
            </div>
            <div className="cmd-foot"><span>Up and down to move</span><span>Enter to open</span><span>Esc to close</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
