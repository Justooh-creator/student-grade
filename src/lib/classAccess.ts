import type { School } from "./store";

export interface AccessInput {
  inSchool: boolean;
  role?: string | undefined;
  userId?: string | undefined;
  assignments?: School["classAssignments"] | undefined;
  classId: string;
}

/**
 * Who may edit a class:
 * - not in a school cloud (independent / offline) → yes
 * - headteacher → yes, every class
 * - class with no assigned teachers yet → yes (keeps old schools working)
 * - otherwise only teachers assigned to that class; others view only
 */
export function canEditClass({ inSchool, role, userId, assignments, classId }: AccessInput): boolean {
  if (!inSchool) return true;
  if (role === "headteacher") return true;
  const list = assignments?.[classId] ?? [];
  if (list.length === 0) return true;
  return !!userId && list.includes(userId);
}
