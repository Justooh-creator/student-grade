import { getClassLevel, gradeFor, type ClassId } from "./ges";
import type { Student } from "./store";

export interface SubjectResult {
  subject: string;
  sba: number | null;
  exam: number | null;
  total: number | null;
  grade: number | null;
  remark: string;
}

export interface StudentResult {
  subjects: SubjectResult[];
  gradedCount: number;
  totalMarks: number;
  average: number;
  aggregate: number;
}

export function computeStudentResult(student: Student): StudentResult {
  const level = getClassLevel(student.classId);
  const subjects: SubjectResult[] = level.subjects.map((subject) => {
    const entry = student.scores[subject];
    const sba = entry?.sba ?? null;
    const exam = entry?.exam ?? null;
    if (sba === null && exam === null) {
      return { subject, sba, exam, total: null, grade: null, remark: "—" };
    }
    const total = (sba ?? 0) + (exam ?? 0);
    const band = gradeFor(total);
    return { subject, sba, exam, total, grade: band.grade, remark: band.remark };
  });

  const graded = subjects.filter((s) => s.total !== null);
  const totalMarks = graded.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const aggregate = graded.reduce((sum, s) => sum + (s.grade ?? 0), 0);

  return {
    subjects,
    gradedCount: graded.length,
    totalMarks,
    average: graded.length ? totalMarks / graded.length : 0,
    aggregate,
  };
}

export function classRanking(students: Student[], classId: ClassId) {
  const inClass = students.filter((s) => s.classId === classId);
  const scored = inClass.map((s) => ({ student: s, result: computeStudentResult(s) }));
  const sorted = [...scored].sort((a, b) => b.result.totalMarks - a.result.totalMarks);

  const positions = new Map<string, number>();
  sorted.forEach((entry, index) => {
    const previous = sorted[index - 1];
    if (previous && previous.result.totalMarks === entry.result.totalMarks) {
      positions.set(entry.student.id, positions.get(previous.student.id) ?? index + 1);
    } else {
      positions.set(entry.student.id, index + 1);
    }
  });

  const withMarks = scored.filter((s) => s.result.gradedCount > 0);
  const classAverage = withMarks.length
    ? withMarks.reduce((sum, s) => sum + s.result.average, 0) / withMarks.length
    : 0;

  return { entries: scored, positions, classSize: inClass.length, classAverage };
}
