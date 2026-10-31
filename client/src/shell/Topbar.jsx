import { Search, Plus } from "lucide-react";
import Notifications from "./Notifications.jsx";
import ProfileMenu from "./ProfileMenu.jsx";

export default function Topbar({ title, sub, user, theme, tasks, exams, onSearch, onNewTask, onOpenTask, onGo, onToggleTheme, onLogout }) {
  const date = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return (
    <header className="appbar">
      <div className="appbar-title"><h1>{title}</h1><p>{sub}</p></div>
      <button className="search-btn" onClick={onSearch} aria-label="Search">
        <Search size={16} strokeWidth={1.75} />
        <span className="search-text">Search tasks, exams, subjects</span>
        <span className="kbd">Ctrl K</span>
      </button>
      <div className="appbar-right">
        <span className="date-chip">{date}</span>
        <Notifications tasks={tasks} exams={exams} onOpenTask={onOpenTask} onGo={onGo} />
        <button className="btn-accent" onClick={onNewTask}>
          <Plus size={16} strokeWidth={2} /><span className="label">New task</span><span className="kbd">N</span>
        </button>
        <ProfileMenu user={user} theme={theme} onToggleTheme={onToggleTheme} onGo={onGo} onLogout={onLogout} />
      </div>
    </header>
  );
}
