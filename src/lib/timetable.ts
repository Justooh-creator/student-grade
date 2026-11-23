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
  // KG closes at 1:00 PM
  const kg: Period[] = [
    { start: "08:00", end: "08:30", label: "Assembly / Worship", isBreak: true },
    { start: "08:30", end: "09:10", label: "P1" },
    { start: "09:10", end: "09:50", label: "P2" },
    { start: "09:50", end: "10:20", label: "Snack Break", isBreak: true },
    { start: "10:20", end: "11:00", label: "P3" },
    { start: "11:00", end: "11:40", label: "P4" },
    { start: "11:40", end: "12:10", label: "Lunch Break", isBreak: true },
    { start: "12:10", end: "12:40", label: "P5" },
    { start: "12:40", end: "13:00", label: "Closing / Dismissal", isBreak: true },
  ];
  // Primary closes at 1:30 PM
  const primary: Period[] = [
    { start: "07:30", end: "08:00", label: "Assembly / Worship", isBreak: true },
    { start: "08:00", end: "08:50", label: "P1" },
    { start: "08:50", end: "09:40", label: "P2" },
    { start: "09:40", end: "10:10", label: "Snack Break", isBreak: true },
    { start: "10:10", end: "11:00", label: "P3" },
    { start: "11:00", end: "11:50", label: "P4" },
    { start: "11:50", end: "12:20", label: "Lunch Break", isBreak: true },
    { start: "12:20", end: "13:10", label: "P5" },
    { start: "13:10", end: "13:30", label: "Closing / Dismissal", isBreak: true },
  ];
  // JHS closes at 3:00 PM
  const jhs: Period[] = [
    { start: "07:30", end: "08:00", label: "Assembly / Worship", isBreak: true },
    { start: "08:00", end: "09:00", label: "P1" },
    { start: "09:00", end: "10:00", label: "P2" },
    { start: "10:00", end: "10:30", label: "Snack Break", isBreak: true },
    { start: "10:30", end: "11:30", label: "P3" },
    { start: "11:30", end: "12:30", label: "P4" },
    { start: "12:30", end: "13:10", label: "Lunch Break", isBreak: true },
    { start: "13:10", end: "14:10", label: "P5" },
    { start: "14:10", end: "15:00", label: "P6" },
  ];
  return kind === "kg" ? kg : kind === "jhs" ? jhs : primary;
}

export type TimetableLevel = "kg" | "primary" | "jhs";
export const levelOf = (classId: ClassId): TimetableLevel => (isKg(classId) ? "kg" : isJhs(classId) ? "jhs" : "primary");
export const LEVEL_NAMES: Record<TimetableLevel, string> = { kg: "Kindergarten", primary: "Primary", jhs: "Junior High" };
/** Standard opening and closing time per level (schools can change them). */
export const LEVEL_HOURS: Record<TimetableLevel, { open: string; close: string }> = {
  kg: { open: "08:00", close: "13:00" },
  primary: { open: "07:30", close: "13:30" },
  jhs: { open: "07:30", close: "15:00" },
};

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/**
 * Move a timetable to new opening/closing times. Breaks keep their length;
 * lessons stretch or shrink to fill the day; times round to 5 minutes.
 * Returns null when the times are invalid or too short for the breaks.
 */
export function retimeTimetable(tt: Timetable, open: string, close: string): Timetable | null {
  const ps = tt.periods;
  const first = ps[0];
  const last = ps[ps.length - 1];
  if (!first || !last || !/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close)) return null;
  const o = toMin(open), c = toMin(close);
  if (c <= o) return null;
  let fixed = 0, lessons = 0;
  ps.forEach((p, i) => {
    const d = Math.max(0, toMin(p.end) - toMin(p.start));
    const gap = i === 0 ? 0 : Math.max(0, toMin(p.start) - toMin(ps[i - 1]!.end));
    fixed += gap;
    if (p.isBreak) fixed += d; else lessons += d;
  });
  const room = c - o - fixed;
  if (lessons === 0 || room < 5) return null;
  const factor = room / lessons;
  const r5 = (m: number) => Math.round(m / 5) * 5;
  let cur = o;
  const periods = ps.map((p, i) => {
    const d = Math.max(0, toMin(p.end) - toMin(p.start));
    const gap = i === 0 ? 0 : Math.max(0, toMin(p.start) - toMin(ps[i - 1]!.end));
    const s0 = cur + gap;
    cur = s0 + (p.isBreak ? d : d * factor);
    const end = i === ps.length - 1 ? c : r5(cur);
    return { ...p, start: hhmm(r5(s0)), end: hhmm(end) };
  });
  return { periods, cells: tt.cells };
}

/** Who may edit a class timetable: offline users, the headteacher, or a teacher assigned to that class. */
export function canEditTimetable(input: { inSchool: boolean; role?: string | undefined; userId?: string | undefined; assignments?: Record<string, string[]> | undefined; classId: string }): boolean {
  if (!input.inSchool) return true;
  if (input.role === "headteacher") return true;
  return !!input.userId && (input.assignments?.[input.classId] ?? []).includes(input.userId);
}

/** Default GES/NaCCA-style weekly timetable for a class (school can edit). */
export function defaultTimetable(classId: ClassId): Timetable {
  const periods = slots(levelOf(classId));
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
  for (const c of schoolClassIds(school)) {
    if (!isJhs(c)) continue;
    const subs = school.subjectAssignments?.[c] ?? {};
    const tt = getTimetable(school, c);
    tt.periods.forEach((p, i) => {
      const subject = tt.cells[day]?.[i] ?? "";
      if (p.isBreak || !subject || isBreakLabel(subject)) return;
      if (!(subs[subject] ?? []).includes(userId)) return;
      const diff = toMin(p.start) - nowMin;
      if (diff >= 0 && diff <= within) out.push({ classId: c, className: getClassLevel(c).name, subject, start: p.start, minutes: diff });
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
