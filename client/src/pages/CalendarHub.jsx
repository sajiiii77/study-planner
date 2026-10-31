import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, startOfWeek } from "../utils.js";
import WeekView from "./WeekView.jsx";
import MonthView from "./MonthView.jsx";
import Exams from "./Exams.jsx";

const TABS = [["week", "Week"], ["month", "Month"], ["exams", "Exams"]];
const fmt = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

// Study Calendar: week, month and exams in one place
export default function CalendarHub({ initialTab, ...props }) {
  const [tab, setTab] = useState(initialTab || "week");
  const [anchor, setAnchor] = useState(() => new Date());
  const step = (dir) => setAnchor((a) => (tab === "month" ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : addDays(a, dir * 7)));
  const start = startOfWeek(anchor);
  const label = tab === "month" ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : `${fmt(start)} to ${fmt(addDays(start, 6))}`;

  return (
    <>
      <div className="cx-cal-head">
        <div className="cx-seg" role="group" aria-label="Calendar view">
          {TABS.map(([key, name]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{name}</button>)}
        </div>
        {tab !== "exams" && (
          <div className="cx-nav">
            <button className="icon-btn" onClick={() => step(-1)} aria-label={tab === "month" ? "Previous month" : "Previous week"}><ChevronLeft size={16} strokeWidth={1.75} /></button>
            <strong>{label}</strong>
            <button className="icon-btn" onClick={() => step(1)} aria-label={tab === "month" ? "Next month" : "Next week"}><ChevronRight size={16} strokeWidth={1.75} /></button>
            <button className="cx-pill" onClick={() => setAnchor(new Date())}>Today</button>
          </div>
        )}
      </div>
      {tab === "week" && <WeekView anchor={anchor} {...props} />}
      {tab === "month" && <MonthView anchor={anchor} {...props} />}
      {tab === "exams" && <Exams {...props} />}
    </>
  );
}
