import { useState } from "react";
import { api } from "./api.js";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      onAuth(await api(`/${mode === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify(form) }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="auth">
      <h1>Study planner</h1>
      <p className="sub">{mode === "login" ? "Log in to see your tasks and exams." : "Create an account to keep your plan in one place."}</p>
      <form className="stack" onSubmit={submit}>
        {mode === "register" && <input placeholder="Name" value={form.name} onChange={set("name")} aria-label="Name" />}
        <input type="email" placeholder="Email" value={form.email} onChange={set("email")} aria-label="Email" />
        <input type="password" placeholder="Password (6+ characters)" value={form.password} onChange={set("password")} aria-label="Password" />
        <button>{mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <button className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </main>
  );
}
