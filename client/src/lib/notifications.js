import { todayISO, daysUntil, dayLabel } from "../utils.js";

// Notifications are derived from your real tasks and exams; nothing is stored on the server.
export function buildNotifications(tasks, exams) {
  const today = todayISO();
  const list = [];

  exams.forEach((x) => {
    const n = daysUntil(x.date);
    if (n >= 0 && n <= 7) {
      list.push({
        id: `exam:${x.id}:${n}`,
        kind: "exam",
        title: x.title,
        text: n === 0 ? `${x.subject}, today` : n === 1 ? `${x.subject}, tomorrow` : `${x.subject}, in ${n} days`,
      });
    }
  });
  tasks.filter((t) => !t.done && t.due && t.due < today).forEach((t) =>
    list.push({ id: `overdue:${t.id}`, kind: "overdue", title: t.title, text: `Overdue since ${dayLabel(t.due)}`, task: t })
  );
  tasks.filter((t) => !t.done && t.due === today).forEach((t) =>
    list.push({ id: `today:${t.id}:${today}`, kind: "today", title: t.title, text: `Due today, ${t.minutes} min`, task: t })
  );
  return list;
}
