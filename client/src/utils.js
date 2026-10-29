export const RANK = { high: 0, medium: 1, low: 2 };

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (s) => new Date(s + "T00:00:00");
export const todayISO = () => iso(new Date());

// Monday of the week that contains date d
export const startOfWeek = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const daysUntil = (s) => Math.round((parse(s) - new Date().setHours(0, 0, 0, 0)) / 86400000);
export const dayLabel = (s) =>
  s ? parse(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }) : "No due date";
export const fmtMinutes = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

// Today's focus minutes and the current study streak, from [{date, minutes}]
export const studyStats = (sessions) => {
  const byDate = Object.fromEntries(sessions.map((s) => [s.date, s.minutes]));
  let d = new Date();
  if (!byDate[iso(d)]) d = addDays(d, -1); // the streak is still alive if you haven't studied yet today
  let streak = 0;
  while (byDate[iso(d)] > 0) {
    streak++;
    d = addDays(d, -1);
  }
  return { today: byDate[todayISO()] || 0, streak, byDate };
};
