import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Auth from "./Auth.jsx";
import useData from "./useData.js";
import { studyStats } from "./utils.js";
import TaskModal from "./components/TaskModal.jsx";
import Sidebar from "./shell/Sidebar.jsx";
import Topbar from "./shell/Topbar.jsx";
import CommandPalette from "./shell/CommandPalette.jsx";
import DashboardSkeleton from "./shell/Skeleton.jsx";
import { PAGES } from "./shell/nav.js";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import CalendarHub from "./pages/CalendarHub.jsx";
import Focus from "./pages/Focus.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

function Shell({ user, onLogout, theme, onToggleTheme }) {
  const [view, setView] = useState({ page: "dashboard", tab: null, subject: null, n: 0 });
  const [modal, setModal] = useState(null);
  const [palette, setPalette] = useState(false);
  const data = useData(onLogout);
  const { streak } = studyStats(data.sessions);
  const current = PAGES.find((p) => p.id === view.page);

  // go("calendar", { tab: "exams" }) or go("tasks", { subject: "Databases" })
  const go = (page, extra = {}) => {
    if (page === "exams") { page = "calendar"; extra = { tab: "exams" }; }
    setView((v) => ({
      page,
      tab: extra.tab ?? null,
      subject: extra.subject ?? null,
      n: extra.tab || extra.subject ? v.n + 1 : v.n,
    }));
  };
  const openTask = (task = null, preset = {}) => setModal({ task, preset });
  const save = (form) => (modal.task ? data.updateTask(modal.task.id, form, "Task updated") : data.addTask(form));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "n") { e.preventDefault(); openTask(); }
      if (e.key === "/") { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const page = () => {
    switch (view.page) {
      case "dashboard": return <Dashboard user={user} {...data} openTask={openTask} goTo={go} />;
      case "tasks": return <Tasks {...data} openTask={openTask} initialSubject={view.subject} />;
      case "calendar": return <CalendarHub {...data} openTask={openTask} initialTab={view.tab} />;
      case "focus": return <Focus {...data} />;
      default: return <ComingSoon title={current.label} onBack={() => go("dashboard")} />;
    }
  };

  return (
    <div className="shell">
      <Sidebar page={view.page} onGo={go} streak={streak} />
      <div className="stage">
        <Topbar
          title={current.label}
          sub={current.sub}
          user={user}
          theme={theme}
          tasks={data.tasks}
          exams={data.exams}
          onSearch={() => setPalette(true)}
          onNewTask={() => openTask()}
          onOpenTask={openTask}
          onGo={go}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />
        <main className="view">
          {data.loading ? (
            <DashboardSkeleton />
          ) : (
            <motion.div
              key={`${view.page}:${view.n}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {page()}
            </motion.div>
          )}
        </main>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        tasks={data.tasks}
        exams={data.exams}
        onGo={go}
        onOpenTask={openTask}
        onNewTask={() => openTask()}
        onSubject={(subject) => go("tasks", { subject })}
      />
      {modal && (
        <TaskModal
          task={modal.task}
          preset={modal.preset}
          subjects={[...new Set(data.tasks.map((t) => t.subject))]}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}
      {data.toast && <div className={`toast ${data.toast.type}`} role="status">{data.toast.message}</div>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [theme, setTheme] = useState(() => localStorage.getItem("cadence-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cadence-theme", theme);
  }, [theme]);

  // Switch themes without every color animating at once
  const toggleTheme = () => {
    const root = document.documentElement;
    root.setAttribute("data-theme-switching", "");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
  };

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return user ? <Shell user={user} onLogout={logout} theme={theme} onToggleTheme={toggleTheme} /> : <Auth onAuth={login} />;
}
