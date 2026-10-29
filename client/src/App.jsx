import { useEffect, useState } from "react";
import { LayoutDashboard, CalendarDays, ListChecks, GraduationCap, Timer, Sun, Moon, LogOut } from "lucide-react";
import Auth from "./Auth.jsx";
import useData from "./useData.js";
import Dashboard from "./pages/Dashboard.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import Tasks from "./pages/Tasks.jsx";
import Exams from "./pages/Exams.jsx";
import Focus from "./pages/Focus.jsx";

const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "exams", label: "Exams", icon: GraduationCap },
];

function Shell({ user, onLogout, theme, toggleTheme }) {
  const [page, setPage] = useState("dashboard");
  const data = useData(onLogout);
  const current = PAGES.find((p) => p.id === page);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Study<span>Planner</span></div>
        <nav aria-label="Main">
          {PAGES.map(({ id, label, icon: Icon }) => (
            <button key={id} className={id === page ? "nav on" : "nav"} onClick={() => setPage(id)}>
              <Icon size={18} /> <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="content">
        <header className="topbar">
          <h1>{current.label}</h1>
          <div className="actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="who">{user.name}</span>
            <button className="icon-btn" onClick={onLogout} aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </header>

        <main>
          {data.loading ? (
            <div className="skeleton-grid" aria-label="Loading">
              {[0, 1, 2, 3].map((i) => <div key={i} className="card skeleton" />)}
            </div>
          ) : (
            <div className="page" key={page}>
              {page === "dashboard" && <Dashboard user={user} {...data} goTo={setPage} />}
              {page === "calendar" && <CalendarPage {...data} />}
              {page === "tasks" && <Tasks {...data} />}
              {page === "focus" && <Focus {...data} />}
              {page === "exams" && <Exams {...data} />}
            </div>
          )}
        </main>
      </div>

      {data.toast && <div className={`toast ${data.toast.type}`} role="status">{data.toast.message}</div>}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  return user ? (
    <Shell user={user} onLogout={logout} theme={theme} toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />
  ) : (
    <Auth onAuth={login} />
  );
}

