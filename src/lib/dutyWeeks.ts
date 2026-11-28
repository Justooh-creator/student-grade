/** UTC-only helpers keep editable duty-week dates independent of device time zones. */
export function addDutyWeeks(start: string, count: number) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count * 7);
  return date.toISOString().slice(0, 10);
}
export function dutyWeekNumber(start: string, first: string) {
  return Math.max(1, Math.round((Date.parse(start) - Date.parse(first)) / 604800000) + 1);
}
export function nextDutyWeek(weeks: string[], first: string) {
  return weeks.length ? addDutyWeeks([...weeks].sort().at(-1)!, 1) : first;
}
