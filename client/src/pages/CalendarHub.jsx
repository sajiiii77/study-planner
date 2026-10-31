import { useState } from "react";
import CalendarPage from "./CalendarPage.jsx";
import Exams from "./Exams.jsx";

// Study Calendar: the week view plus exam countdowns
export default function CalendarHub({ initialTab, ...props }) {
  const [tab, setTab] = useState(initialTab || "week");
  return (
    <>
      <div className="hub-tabs" role="tablist" aria-label="Calendar views">
        <button role="tab" aria-selected={tab === "week"} onClick={() => setTab("week")}>Week</button>
        <button role="tab" aria-selected={tab === "exams"} onClick={() => setTab("exams")}>Exams</button>
      </div>
      {tab === "week" ? <CalendarPage {...props} /> : <Exams {...props} />}
    </>
  );
}
