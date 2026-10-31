// Preferences kept in this browser
const FOCUS_KEY = "cadence-focus";
export const DEFAULT_FOCUS = { focus: 25, short: 5, long: 15 };

export const getFocusSettings = () => {
  try { return { ...DEFAULT_FOCUS, ...JSON.parse(localStorage.getItem(FOCUS_KEY) || "{}") }; } catch { return { ...DEFAULT_FOCUS }; }
};
export const saveFocusSettings = (s) => {
  try { localStorage.setItem(FOCUS_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
};
