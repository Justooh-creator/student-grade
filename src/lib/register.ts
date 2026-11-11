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

/** Group school days into Monday–Friday weeks (index lists). */
export function weekGroups(days: string[]): number[][] {
  const weeks: number[][] = [];
  days.forEach((d, i) => {
    const wd = new Date(d + "T00:00:00Z").getUTCDay();
    if (!weeks.length || wd === 1 || (i > 0 && wd <= new Date(days[i - 1]! + "T00:00:00Z").getUTCDay())) weeks.push([]);
    weeks[weeks.length - 1]!.push(i);
  });
  return weeks;
}

export type Sex = "M" | "F" | "";
export function sexOf(gender: string): Sex {
  const g = gender.trim().toLowerCase();
  return g.startsWith("m") || g === "boy" ? "M" : g.startsWith("f") || g === "girl" ? "F" : "";
}

/** Daily boys/girls present; closed days count as zero. */
export function dailySexTotals(rows: { marks: Mark[] }[], sexes: Sex[], days: string[], closed: Record<string, string>) {
  return days.map((d, i) => {
    if (closed[d]) return { boys: 0, girls: 0 };
    let boys = 0, girls = 0;
    rows.forEach((r, k) => { if (r.marks[i] === "P") { if (sexes[k] === "M") boys++; else if (sexes[k] === "F") girls++; } });
    return { boys, girls };
  });
}

/** Weekly summary: times open (marked, not closed days), boys, girls, total attendance. */
export function weeklyTotals(weeks: number[][], days: string[], daily: { boys: number; girls: number }[], marked: Set<string>, closed: Record<string, string>) {
  let cumulative = 0;
  return weeks.map((w) => {
    const open = w.filter((i) => marked.has(days[i]!) && !closed[days[i]!]).length;
    cumulative += open;
    const boys = w.reduce((s, i) => s + daily[i]!.boys, 0);
    const girls = w.reduce((s, i) => s + daily[i]!.girls, 0);
    return { open, cumulative, boys, girls, total: boys + girls };
  });
}
