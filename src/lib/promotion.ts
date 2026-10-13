import { CLASS_LEVELS, type ClassId } from "./ges";
import type { Student } from "./store";

export function nextClassId(id: ClassId): ClassId | null {
  const i = CLASS_LEVELS.findIndex((c) => c.id === id);
  if (i < 0 || i === CLASS_LEVELS.length - 1) return null;
  return CLASS_LEVELS[i + 1]!.id;
}

export function nextAcademicYear(year: string): string {
  const m = /^(\d{4})\s*\/\s*(\d{4})$/.exec(year.trim());
  if (!m) return year;
  return `${Number(m[1]) + 1}/${Number(m[2]) + 1}`;
}

export interface RolloverSummary {
  promoted: number;
  retained: number;
  completed: number;
  undecided: Student[];
}

export function rolloverSummary(students: Student[]): RolloverSummary {
  let promoted = 0, retained = 0, completed = 0;
  const undecided: Student[] = [];
  for (const s of students) {
    const p = s.promotion ?? "tbd";
    if (p === "tbd") undecided.push(s);
    else if (p === "retained") retained++;
    else if (nextClassId(s.classId) === null) completed++;
    else promoted++;
  }
  return { promoted, retained, completed, undecided };
}

/** Fresh start for a new year: keep identity (name, admission no., photo, parent phone), clear term work. */
function freshTerm(s: Student, classId: ClassId): Student {
  const { promotion: _p, fees: _f, headRemark: _h, ...rest } = s;
  return { ...rest, classId, attendance: "", scores: {}, conduct: "", interest: s.interest, remark: "" };
}

/** Promoted → next class; retained → same class; promoted Basic 9 → leaves the register (completed). Undecided learners must be resolved first. */
export function rolloverStudents(students: Student[]): Student[] {
  const out: Student[] = [];
  for (const s of students) {
    const p = s.promotion ?? "tbd";
    if (p === "tbd") throw new Error("Decide promotion for every learner first.");
    if (p === "retained") { out.push(freshTerm(s, s.classId)); continue; }
    const next = nextClassId(s.classId);
    if (next) out.push(freshTerm(s, next));
  }
  return out;
}
