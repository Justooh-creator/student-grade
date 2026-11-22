/** Recycle-bin windows; the database's restore_deleted_student enforces the same numbers. */
export const HEAD_RESTORE_DAYS = 14;
export const KEEP_DAYS = 30;
const DAY = 86400000;

export function daysSince(deletedAt: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(deletedAt).getTime()) / DAY));
}

/** Whole days left before the saved copy is permanently removed (0 = today is the last day). */
export function daysUntilPurge(deletedAt: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(deletedAt).getTime() + KEEP_DAYS * DAY - now) / DAY));
}

/** Whether a headteacher may still restore it themselves. */
export function headCanRestore(deletedAt: string, now = Date.now()): boolean {
  return now - new Date(deletedAt).getTime() <= HEAD_RESTORE_DAYS * DAY;
}
