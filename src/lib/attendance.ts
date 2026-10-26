import { allClassIds, classDisplayName } from "./ges";

export interface AttendanceEntry { id: string; name: string; admissionNo: string; present: boolean; unpaid?: boolean }
export interface AttendanceAccess { started_at: string | null; expires_at: string | null; allowed: boolean; licensed: boolean }
export const EARLY_ATTENDANCE_CLASSES = ["creche", "nursery1", "nursery2"] as const;
export function attendanceClasses(streams = 1): string[] {
  const count = Math.min(3, Math.max(1, Math.round(streams || 1)));
  return [...EARLY_ATTENDANCE_CLASSES.flatMap((id) => count === 1 ? [id] : ["a", "b", "c"].slice(0, count).map((s) => id + s)), ...allClassIds(count)];
}
export function attendanceClassName(id: string): string {
  const match = /^(creche|nursery1|nursery2)([abc])?$/.exec(id);
  if (!match) return classDisplayName(id);
  const name = match[1] === "creche" ? "Crèche" : match[1] === "nursery1" ? "Nursery 1" : "Nursery 2";
  return name + (match[2]?.toUpperCase() ?? "");
}
export function isEarlyAttendanceClass(id: string): boolean { return /^(creche|nursery1|nursery2)([abc])?$/.test(id); }
export function attendanceSummary(entries: AttendanceEntry[]) {
  const present = entries.filter((entry) => entry.present).length;
  return { present, absent: entries.length - present, total: entries.length };
}
export function attendanceTrialAllowed(started: string | null, licensed: boolean, now: number): boolean {
  return licensed || started === null || now < Date.parse(started) + 14 * 24 * 60 * 60 * 1000;
}