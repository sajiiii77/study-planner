import { LayoutDashboard, ListChecks, CalendarDays, Library, Timer, Activity, Settings } from "lucide-react";

export const PAGES = [
  { id: "dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard, sub: "Your study overview" },
  { id: "tasks", label: "My Tasks", short: "Tasks", icon: ListChecks, sub: "Everything on your plate" },
  { id: "calendar", label: "Study Calendar", short: "Calendar", icon: CalendarDays, sub: "Plan your week and track exams" },
  { id: "subjects", label: "Subjects", short: "Subjects", icon: Library, sub: "Progress by subject" },
  { id: "focus", label: "Focus Mode", short: "Focus", icon: Timer, sub: "One session at a time" },
  { id: "analytics", label: "Analytics", short: "Analytics", icon: Activity, sub: "How you study" },
  { id: "settings", label: "Settings", short: "Settings", icon: Settings, sub: "Preferences and account" },
];
