import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, CalendarDays, Timer, Activity } from "lucide-react";
import { api } from "./api.js";
import Logo from "./shell/Logo.jsx";

const EASE = [0.22, 1, 0.36, 1];
// a tiny static week, color-coded by subject
const MINI = [
  [["#F2704B", 62], ["#3B9BE8", 34]],
  [["#17B183", 46]],
  [["#9B72F8", 78], ["#F2704B", 30]],
  [["#E8497F", 40], ["#17B183", 54]],
  [["#3B9BE8", 64]],
];
const POINTS = [[CalendarDays, "A weekly calendar you can drag tasks around"], [Timer, "A focus timer that builds your study streak"], [Activity, "Analytics that show how you really study"]];

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const register = mode === "register";
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: "" }); setError(""); };

  const validate = () => {
    const e = {};
    if (register && !form.name.trim()) e.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email address";
    if (form.password.length < (register ? 6 : 1)) e.password = register ? "Use at least 6 characters" : "Enter your password";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      onAuth(await api(register ? "/register" : "/login", { method: "POST", body: JSON.stringify(form) }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setErrors({}); setError(""); };

  return (
    <div className="au-wrap">
      <section className="au-hero">
        <Logo />
        <div>
          <h1>Your whole semester, in rhythm.</h1>
          <p className="lead">Tasks, exams and focus time in one planner, color-coded by subject.</p>
        </div>
        <div className="au-week" aria-hidden="true">
          {MINI.map((col, i) => <div key={i}>{col.map(([c, h], j) => <i key={j} style={{ "--c": c, "--h": `${h}px` }} />)}</div>)}
        </div>
        <ul className="au-points">{POINTS.map(([Icon, text]) => <li key={text}><Icon size={18} strokeWidth={1.75} />{text}</li>)}</ul>
      </section>

      <section className="au-side">
        <motion.div className="au-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          <div className="au-brand-mobile"><Logo /></div>
          <div className="au-tabs" role="tablist" aria-label="Log in or create an account">
            {[["login", "Log in"], ["register", "Create account"]].map(([key, label]) => (
              <button key={key} role="tab" aria-selected={mode === key} onClick={() => switchMode(key)}>
                {mode === key && <motion.span layoutId="au-pill" className="au-pill" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
                <span>{label}</span>
              </button>
            ))}
          </div>
          <h2>{register ? "Create your account" : "Welcome back"}</h2>
          <p className="au-sub">{register ? "It takes under a minute." : "Log in to pick up where you left off."}</p>

          <form onSubmit={submit} noValidate>
            <AnimatePresence initial={false}>
              {register && (
                <motion.div key="name" style={{ overflow: "hidden" }} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: EASE }}>
                  <div className="au-field">
                    <label htmlFor="au-name">Name</label>
                    <input id="au-name" className="au-input" value={form.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />
                    {errors.name && <span className="fld-error" role="alert">{errors.name}</span>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="au-field">
              <label htmlFor="au-email">Email</label>
              <input id="au-email" className="au-input" type="email" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errors.email} />
              {errors.email && <span className="fld-error" role="alert">{errors.email}</span>}
            </div>
            <div className="au-field">
              <label htmlFor="au-pass">Password</label>
              <div className="au-pass">
                <input id="au-pass" className="au-input" type={show ? "text" : "password"} value={form.password} onChange={set("password")} autoComplete={register ? "new-password" : "current-password"} aria-invalid={!!errors.password} placeholder={register ? "At least 6 characters" : ""} />
                <button type="button" className="au-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}</button>
              </div>
              {errors.password && <span className="fld-error" role="alert">{errors.password}</span>}
            </div>
            {error && <p className="au-error" role="alert">{error}</p>}
            <button className="btn-accent au-submit" disabled={busy}>{busy ? (register ? "Creating account…" : "Logging in…") : register ? "Create account" : "Log in"}</button>
          </form>
        </motion.div>
      </section>
    </div>
  );
}
