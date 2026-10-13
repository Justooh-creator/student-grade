import { useEffect, useState } from "react";
import { getClassLevel, isJhs, isKg, schoolClassIds, type ClassId } from "./ges";
import type { School } from "./store";

export const TT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export type Period = { start: string; end: string; label: string; isBreak?: boolean };
/** cells[day][periodIndex] = subject */
export type Timetable = { periods: Period[]; cells: Record<string, string[]> };

const BREAKS = ["Assembly / Worship", "Snack Break", "Lunch Break", "Closing / Dismissal"];
const isBreakLabel = (s: string) => BREAKS.includes(s);

function slots(kind: "kg" | "primary" | "jhs"): Period[] {
  const kg: Period[] = [
    { start: "08:00", end: "08:30", label: "Assembly / Worship", isBreak: true },
    { start: "08:30", end: "09:10", label: "P1" },
    { start: "09:10", end: "09:50", label: "P2" },
    { start: "09:50", end: "10:20", label: "Snack Break", isBreak: true },
    { start: "10:20", end: "11:00", label: "P3" },
    { start: "11:00", end: "11:40", label: "P4" },
    { start: "11:40", end: "12:30", label: "Lunch Break", isBreak: true },
    { start: "12:30", end: "13:10", label: "P5" },
    { start: "13:10", end: "13:30", label: "Closing / Dismissal", isBreak: true },
  ];
  const std: Period[] = [
    { start: "07:30", end: "08:00", label: "Assembly / Worship", isBreak: true },
    { start: "08:00", end: "09:00", label: "P1" },
    { start: "09:00", end: "10:00", label: "P2" },
    { start: "10:00", end: "10:30", label: "Snack Break", isBreak: true },
    { start: "10:30", end: "11:30", label: "P3" },
    { start: "11:30", end: "12:30", label: "P4" },
    { start: "12:30", end: "13:10", label: "Lunch Break", isBreak: true },
    { start: "13:10", end: "14:10", label: "P5" },
    { start: "14:10", end: "15:00", label: kind === "jhs" ? "P6" : "Closing / Dismissal", isBreak: kind !== "jhs" },
  ];
  return kind === "kg" ? kg : std;
}

/** Default GES/NaCCA-style weekly timetable for a class (school can edit). */
export function defaultTimetable(classId: ClassId): Timetable {
  const kind = isKg(classId) ? "kg" : isJhs(classId) ? "jhs" : "primary";
  const periods = slots(kind);
  const subs = getClassLevel(classId).subjects;
  const core = subs.slice(0, 2); // English & Maths come daily
  const others = subs.slice(2);
  const cells: Record<string, string[]> = {};
  let k = 0;
  TT_DAYS.forEach((day, di) => {
    let lesson = 0;
    cells[day] = periods.map((p) => {
      if (p.isBreak) return p.label;
      const idx = lesson++;
      if (idx < core.length) return core[(idx + di) % core.length]!;
      return others[k++ % others.length]!;
    });
  });
  return { periods, cells };
}

export function getTimetable(school: School, classId: ClassId): Timetable {
  return school.timetables?.[classId] ?? defaultTimetable(classId);
}

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };
export const fmt12 = (t: string) => { const m = toMin(t); const h = Math.floor(m / 60); return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

export type LessonAlert = { classId: ClassId; className: string; subject: string; start: string; minutes: number };

/** Basic 7–9 lessons the given teacher is assigned to, starting within `within` minutes. */
export function upcomingLessons(school: School, userId: string | null | undefined, now = new Date(), within = 10): LessonAlert[] {
  if (!userId) return [];
  const day = TT_DAYS[now.getDay() - 1];
  if (!day) return [];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out: LessonAlert[] = [];
  for (const c of CLASS_LEVELS) {
    if (!isJhs(c.id)) continue;
    const subs = school.subjectAssignments?.[c.id] ?? {};
    const tt = getTimetable(school, c.id);
    tt.periods.forEach((p, i) => {
      const subject = tt.cells[day]?.[i] ?? "";
      if (p.isBreak || !subject || isBreakLabel(subject)) return;
      if (!(subs[subject] ?? []).includes(userId)) return;
      const diff = toMin(p.start) - nowMin;
      if (diff >= 0 && diff <= within) out.push({ classId: c.id, className: c.name, subject, start: p.start, minutes: diff });
    });
  }
  return out;
}

/** Re-checks every 30s and fires a phone notification once per lesson (if allowed). */
export function useLessonAlerts(school: School, userId: string | null | undefined) {
  const [alerts, setAlerts] = useState<LessonAlert[]>([]);
  useEffect(() => {
    if (!userId) { setAlerts([]); return; }
    const tick = () => {
      const list = upcomingLessons(school, userId);
      setAlerts(list);
      const today = new Date().toDateString();
      for (const a of list) {
        const key = `edureport-lesson-${today}-${a.classId}-${a.start}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "1");
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted")
            new Notification("Lesson reminder", { body: `${a.className} — ${a.subject} begins at ${fmt12(a.start)}` });
        } catch { /* ignore */ }
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [school, userId]);
  return alerts;
}
