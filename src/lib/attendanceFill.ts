export type DayRow = { attendance_date: string; entries: { id: string; present?: boolean }[] };

/** Parse term dates like "8th September 2026" into yyyy-MM-dd, or null. */
export function parseTermDate(text?: string): string | null {
  if (!text) return null;
  const d = new Date(text.replace(/(\d+)(st|nd|rd|th)/i, "$1"));
  if (Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Count days each learner was marked present within an optional date range. */
export function countPresentDays(rows: DayRow[], from: string | null, to: string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (from && r.attendance_date < from) continue;
    if (to && r.attendance_date > to) continue;
    for (const e of r.entries ?? []) if (e.present) out[e.id] = (out[e.id] ?? 0) + 1;
  }
  return out;
}
