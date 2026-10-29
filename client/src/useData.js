import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { addDays, iso, todayISO } from "./utils.js";

export default function useData(onLogout) {
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const notify = (message, type = "ok") => {
    clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3000);
  };

  // Runs an API action, shows a toast, and returns false if it failed
  const run = async (fn, okMessage) => {
    try {
      const result = await fn();
      if (okMessage) notify(okMessage);
      return result ?? true;
    } catch (err) {
      if (err.status === 401) onLogout();
      else notify(err.message || "Something went wrong", "error");
      return false;
    }
  };

  const loadSessions = async () => {
    const days = await api(`/sessions?from=${iso(addDays(new Date(), -30))}`);
    setSessions(days);
  };

  useEffect(() => {
    Promise.all([api("/tasks"), api("/exams"), loadSessions()])
      .then(([t, e]) => { setTasks(t); setExams(e); })
      .catch((err) => (err.status === 401 ? onLogout() : notify("Can't reach the server", "error")))
      .finally(() => setLoading(false));
  }, []);

  const addTask = (form) =>
    run(async () => {
      const t = await api("/tasks", { method: "POST", body: JSON.stringify(form) });
      setTasks((p) => [...p, t]);
      return t;
    }, "Task added");

  const updateTask = (id, changes) =>
    run(async () => {
      const t = await api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
      setTasks((p) => p.map((x) => (x.id === id ? t : x)));
      return t;
    });

  const deleteTask = (id) =>
    run(async () => {
      await api(`/tasks/${id}`, { method: "DELETE" });
      setTasks((p) => p.filter((x) => x.id !== id));
    }, "Task deleted");

  const addExam = (form) =>
    run(async () => {
      const x = await api("/exams", { method: "POST", body: JSON.stringify(form) });
      setExams((p) => [...p, x]);
      return x;
    }, "Exam added");

  const deleteExam = (id) =>
    run(async () => {
      await api(`/exams/${id}`, { method: "DELETE" });
      setExams((p) => p.filter((x) => x.id !== id));
    }, "Exam deleted");

  const logSession = (minutes, taskId) =>
    run(async () => {
      await api("/sessions", { method: "POST", body: JSON.stringify({ minutes, taskId, date: todayISO() }) });
      await loadSessions();
    }, "Focus session saved");

  return { tasks, exams, sessions, loading, toast, logSession, addTask, updateTask, deleteTask, addExam, deleteExam };
}
