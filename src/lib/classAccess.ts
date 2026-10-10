import type { School } from "./store";
import { isJhs, type ClassId } from "./ges";

export interface AccessInput {
  inSchool: boolean;
  role?: string | undefined;
  userId?: string | undefined;
  assignments?: School["classAssignments"] | undefined;
  subjectAssignments?: School["subjectAssignments"] | undefined;
  classId: string;
}

function hasSubjectAssignments(input: AccessInput): boolean {
  const subs = input.subjectAssignments?.[input.classId];
  return !!subs && Object.values(subs).some((l) => l.length > 0);
}

/**
 * Who may edit a class:
 * - not in a school cloud (independent / offline) → yes
 * - headteacher → yes, every class
 * - Basic 7–9 with subject assignments → only teachers assigned to at least
 *   one subject of that class (or the assigned class teacher); others view only
 * - class with no assigned teachers yet → yes (keeps old schools working)
 * - otherwise only teachers assigned to that class; others view only
 */
export function canEditClass(input: AccessInput): boolean {
  const { inSchool, role, userId, assignments, classId } = input;
  if (!inSchool) return true;
  if (role === "headteacher") return true;
  if (isJhs(classId as ClassId) && hasSubjectAssignments(input)) {
    const subs = input.subjectAssignments![classId]!;
    if (userId && (assignments?.[classId] ?? []).includes(userId)) return true;
    return !!userId && Object.values(subs).some((l) => l.includes(userId));
  }
  const list = assignments?.[classId] ?? [];
  if (list.length === 0) return true;
  return !!userId && list.includes(userId);
}

/**
 * Who may enter marks for one subject:
 * - KG–Basic 6 → same as the class rule
 * - Basic 7–9 with subject assignments → the class teacher (classAssignments)
 *   edits every subject; other teachers edit only their assigned subjects
 * - Basic 7–9 with no subject assignments yet → same as the class rule
 */
export function canEditSubject(input: AccessInput & { subject: string }): boolean {
  const { inSchool, role, userId, assignments, classId, subject } = input;
  if (!inSchool) return true;
  if (role === "headteacher") return true;
  if (!isJhs(classId as ClassId) || !hasSubjectAssignments(input)) return canEditClass(input);
  if (userId && (assignments?.[classId] ?? []).includes(userId)) return true;
  return !!userId && (input.subjectAssignments?.[classId]?.[subject] ?? []).includes(userId);
}
