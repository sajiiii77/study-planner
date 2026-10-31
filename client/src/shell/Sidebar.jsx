import { motion } from "motion/react";
import { Flame } from "lucide-react";
import Logo from "./Logo.jsx";
import { PAGES } from "./nav.js";

export default function Sidebar({ page, onGo, streak }) {
  return (
    <aside className="rail">
      <Logo />
      <nav className="rail-nav" aria-label="Main">
        {PAGES.map(({ id, label, short, icon: Icon }) => {
          const on = id === page;
          return (
            <button key={id} className="rail-item" aria-current={on ? "page" : undefined} onClick={() => onGo(id)}>
              {on && <motion.span layoutId="rail-pill" className="rail-pill" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
              <Icon size={17} strokeWidth={1.75} />
              <span className="full">{label}</span>
              <span className="short">{short}</span>
            </button>
          );
        })}
      </nav>
      <div className="rail-foot">
        <div className="streak-chip">
          <Flame size={18} strokeWidth={1.75} />
          <div>
            <strong>{streak ? `${streak}-day streak` : "No streak yet"}</strong>
            <span>{streak ? "Keep it going" : "Finish a focus session"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
