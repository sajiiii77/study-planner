import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Settings, Moon, LogOut } from "lucide-react";
import { initials } from "../utils.js";
import useDismiss from "./useDismiss.js";

export default function ProfileMenu({ user, theme, onToggleTheme, onGo, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, () => setOpen(false), open);
  const run = (fn) => () => { setOpen(false); fn(); };

  return (
    <div className="pop-anchor" ref={ref}>
      <button className="avatar-btn" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        {initials(user.name)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="pop menu" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <div className="menu-user"><strong>{user.name}</strong><span>{user.email}</span></div>
            <button className="menu-item" onClick={run(() => onGo("settings"))}><Settings size={16} strokeWidth={1.75} /> Settings</button>
            <button className="menu-item" role="switch" aria-checked={theme === "dark"} onClick={onToggleTheme}>
              <Moon size={16} strokeWidth={1.75} /><span className="grow">Dark theme</span><span className="switch" data-on={theme === "dark"} />
            </button>
            <button className="menu-item" onClick={run(onLogout)}><LogOut size={16} strokeWidth={1.75} /> Log out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
