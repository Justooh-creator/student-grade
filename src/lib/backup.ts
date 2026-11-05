import type { AppData } from "@/lib/store";
import { keepLocalSchoolImages, keepLocalStudentPhoto, stripSchoolImages, stripStudentImages } from "@/lib/store";

export const BACKUP_FORMAT = "edureport-backup";
export const BACKUP_VERSION = 2;

/** Backups are plain JSON text records — photos, logos, signatures and stamps are never included. */
export function buildBackup(data: AppData, now = new Date(), schoolId: string | null = null) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    schoolId,
    data: { school: stripSchoolImages(data.school), students: data.students.map(stripStudentImages) },
  };
}

export type ParsedBackup = AppData & { schoolId: string | null };

/** Validate a backup file's text; returns the records or throws a readable error. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("This file is not a valid EduReport backup."); }
  const b = raw as { format?: string; version?: number; schoolId?: string | null; data?: Partial<AppData> };
  if (!b || b.format !== BACKUP_FORMAT || !b.data) throw new Error("This file is not an EduReport backup.");
  if ((b.version ?? 0) > BACKUP_VERSION) throw new Error("This backup was made by a newer version of EduReport.");
  const { school, students } = b.data;
  if (!school || typeof school !== "object" || !Array.isArray(students)) throw new Error("The backup file is incomplete.");
  if (students.some((s) => !s || typeof s.id !== "string" || typeof s.name !== "string")) throw new Error("Some learner records in the backup are damaged.");
  return { school, students, schoolId: typeof b.schoolId === "string" ? b.schoolId : null } as ParsedBackup;
}

/** Refuse restoring another school's backup into this school. */
export function assertSameSchool(backupSchoolId: string | null, currentSchoolId: string | null) {
  if (backupSchoolId && currentSchoolId && backupSchoolId !== currentSchoolId) {
    throw new Error("This backup belongs to a different school and cannot be restored here.");
  }
}

/** Restore text records while keeping images already saved on this device. */
export function mergeRestore(current: AppData, backup: AppData): AppData {
  const byId = new Map(current.students.map((s) => [s.id, s]));
  return {
    ...current,
    school: keepLocalSchoolImages(current.school, stripSchoolImages(backup.school)),
    students: backup.students.map((s) => keepLocalStudentPhoto(byId.get(s.id), stripStudentImages(s))),
  };
}
