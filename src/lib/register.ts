import type { AttendanceEntry } from "./attendance";

/** School days (Mon–Fri) of a month, as yyyy-MM-dd strings. */
export function schoolDays(year: number, month: number): string[] {
  const days: string[] = [];
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let d = 1; d <= last; d++) {
    const wd = new Date(Date.UTC(year, month, d)).getUTCDay();
    if (wd !== 0 && wd !== 6) days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

export type Mark = "P" | "A" | "";
/** Build per-learner marks: "P" present, "A" absent on a saved day, "" when the day was not marked. */
export function registerMarks(learnerIds: string[], days: string[], saved: Record<string, AttendanceEntry[]>) {
  return learnerIds.map((id) => {
    const marks: Mark[] = days.map((day) => {
      const entries = saved[day];
      if (!entries) return "";
      const e = entries.find((x) => x.id === id);
      return e ? (e.present ? "P" : "A") : "";
    });
    return { id, marks, present: marks.filter((m) => m === "P").length, absent: marks.filter((m) => m === "A").length };
  });
}
