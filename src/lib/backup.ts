import type { AppData } from "@/lib/store";

export const BACKUP_FORMAT = "edureport-backup";
export const BACKUP_VERSION = 1;

export function buildBackup(data: AppData, now = new Date()) {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: now.toISOString(), data };
}

/** Validate a backup file's text; returns the records or throws a readable error. */
export function parseBackup(text: string): AppData {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("This file is not a valid EduReport backup."); }
  const b = raw as { format?: string; version?: number; data?: Partial<AppData> };
  if (!b || b.format !== BACKUP_FORMAT || !b.data) throw new Error("This file is not an EduReport backup.");
  if ((b.version ?? 0) > BACKUP_VERSION) throw new Error("This backup was made by a newer version of EduReport.");
  const { school, students } = b.data;
  if (!school || typeof school !== "object" || !Array.isArray(students)) throw new Error("The backup file is incomplete.");
  if (students.some((s) => !s || typeof s.id !== "string" || typeof s.name !== "string")) throw new Error("Some learner records in the backup are damaged.");
  return { school, students } as AppData;
}
