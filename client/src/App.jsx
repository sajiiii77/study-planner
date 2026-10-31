import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Auth from "./Auth.jsx";
import useData from "./useData.js";
import { studyStats } from "./utils.js";
import TaskModal from "./components/TaskModal.jsx";
import ExamModal from "./components/ExamModal.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
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
import Subjects from "./pages/Subjects.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";

function Shell({ user, onLogout, theme, onToggleTheme }) {
  const [view, setView] = useState({ page: "dashboard", tab: null, subject: null, n: 0 });
  const [modal, setModal] = useState(null);
  const [palette, setPalette] = useState(false);
  const [examModal, setExamModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
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
  const askDelete = (kind, item) =>
    setConfirm({
      title: `Delete "${item.title}"?`,
      text: kind === "task" ? "This task will be removed from your plan." : "This exam and its countdown will be removed.",
      onConfirm: () => (kind === "task" ? data.deleteTask(item.id) : data.deleteExam(item.id)),
    });
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
      case "tasks": return <Tasks {...data} openTask={openTask} onDeleteTask={(t) => askDelete("task", t)} initialSubject={view.subject} />;
      case "calendar": return <CalendarHub {...data} openTask={openTask} openExam={() => setExamModal(true)} onDeleteExam={(x) => askDelete("exam", x)} initialTab={view.tab} />;
      case "focus": return <Focus {...data} />;
      case "subjects": return <Subjects {...data} goTo={go} openTask={openTask} />;
      case "analytics": return <Analytics {...data} />;
      case "settings": return <Settings {...data} user={user} theme={theme} onToggleTheme={onToggleTheme} onLogout={onLogout} confirm={setConfirm} />;
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
      <AnimatePresence>
        {modal && (
          <TaskModal
            key="task-modal"
            task={modal.task}
            preset={modal.preset}
            subjects={[...new Set(data.tasks.map((t) => t.subject))]}
            onSave={save}
            onDelete={(task) => { setModal(null); askDelete("task", task); }}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {examModal && (
          <ExamModal key="exam-modal" subjects={[...new Set([...data.tasks.map((t) => t.subject), ...data.exams.map((x) => x.subject)])]} onSave={data.addExam} onClose={() => setExamModal(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirm && <ConfirmDialog key="confirm" {...confirm} onClose={() => setConfirm(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {data.toast && (
          <motion.div
            key={data.toast.message}
            className={`toast ${data.toast.type}`}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
          >
            {data.toast.message}
          </motion.div>
        )}
      </AnimatePresence>
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
