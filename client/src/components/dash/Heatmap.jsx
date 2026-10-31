import { fmtMinutes } from "../../utils.js";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// 12 weeks, one column per week, Monday at the top
export default function Heatmap({ cells }) {
  return (
    <div className="dx-heat-wrap"><div className="dx-heat-row">
      <div className="dx-heat-days" aria-hidden="true">{DAYS.map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="dx-heat" role="img" aria-label="Study activity over the last 12 weeks">
        {cells.map((c) => (
          <span
            key={c.key}
            className="dx-cell"
            data-l={c.level}
            data-future={c.future || undefined}
            title={`${c.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${c.minutes ? fmtMinutes(c.minutes) : "no study"}`}
          />
        ))}
      </div>
      </div>
      <div className="dx-legend" aria-hidden="true">Less{[0, 1, 2, 3, 4].map((l) => <i key={l} className="dx-cell" data-l={l} />)}More</div>
    </div>
  );
}
