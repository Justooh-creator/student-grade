import { isKg, type ClassId } from "./ges";
import { classRanking } from "./results";
import type { Student } from "./store";

export function buildBroadsheet(students: Student[], classId: ClassId) {
  const ranking = classRanking(students, classId);
  const kg = isKg(classId);
  return ranking.entries.map(({ student, result }) => ({
    student, result,
    position: kg || !result.gradedCount ? null : ranking.positions.get(student.id) ?? null,
  }));
}
export type BroadsheetRow = ReturnType<typeof buildBroadsheet>[number];

export interface SubjectSummary {
  subject: string;
  highest: number | null;
  /** Every learner who shares the highest total (ties are all named). */
  top: string[];
  average: number | null;
  graded: number;
}

/** Highest total, top learner(s) and class average for one subject; ungraded learners are ignored. */
export function subjectSummary(rows: BroadsheetRow[], subject: string): SubjectSummary {
  const graded = rows.flatMap(({ student, result }) => {
    const total = result.subjects.find((s) => s.subject === subject)?.total;
    return total == null ? [] : [{ name: student.name, total }];
  });
  if (!graded.length) return { subject, highest: null, top: [], average: null, graded: 0 };
  const highest = Math.max(...graded.map((g) => g.total));
  const sum = graded.reduce((a, g) => a + g.total, 0);
  return {
    subject,
    highest,
    top: graded.filter((g) => g.total === highest).map((g) => g.name),
    average: Math.round((sum / graded.length) * 10) / 10,
    graded: graded.length,
  };
}

export interface SubjectMeritRow {
  student: Student;
  sba: number | null;
  exam: number | null;
  total: number | null;
  grade: number | null;
  position: number | null;
}

/** Full 1st-to-last ranking for one subject using GES tie-breaking; ungraded learners appear at the bottom. */
export function subjectMeritList(rows: BroadsheetRow[], subject: string): SubjectMeritRow[] {
  const items = rows.map(({ student, result }) => {
    const r = result.subjects.find((s) => s.subject === subject);
    return { student, sba: r?.sba ?? null, exam: r?.exam ?? null, total: r?.total ?? null, grade: r?.grade ?? null };
  });
  const graded = items.filter((x) => x.total != null).sort((a, b) => b.total! - a.total! || a.student.name.localeCompare(b.student.name, undefined, { sensitivity: "base" }));
  const ungraded = items.filter((x) => x.total == null).sort((a, b) => a.student.name.localeCompare(b.student.name, undefined, { sensitivity: "base" }));
  let pos = 0;
  const ranked: SubjectMeritRow[] = graded.map((item, i) => {
    if (i === 0 || item.total !== graded[i - 1]!.total) pos = i + 1;
    return { ...item, position: pos };
  });
  return [...ranked, ...ungraded.map((u) => ({ ...u, position: null }))];
}
