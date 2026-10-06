import { getClassLevel, gradeFor, isJhs, isKg, kgLevelByName, type ClassId } from "./ges";
import type { Student } from "./store";

export interface SubjectResult {
  subject: string;
  sba: number | null;
  exam: number | null;
  sbaRaw: number | null;
  examRaw: number | null;
  total: number | null;
  grade: number | null;
  /** KG only: Gold / Silver / Bronze */
  level?: string;
  remark: string;
}

export interface StudentResult {
  subjects: SubjectResult[];
  gradedCount: number;
  totalMarks: number;
  average: number;
  aggregate: number;
  /** Basic 7–9 only: English + Maths + better of Science/Social + 3 best electives. */
  bestSix: { subjects: { subject: string; grade: number }[]; aggregate: number } | null;
}

export function computeStudentResult(student: Student): StudentResult {
  const level = getClassLevel(student.classId);
  const kg = isKg(student.classId);
  const subjects: SubjectResult[] = level.subjects.map((subject) => {
    const entry = student.scores[subject];
    if (kg) {
      const l = kgLevelByName(entry?.level);
      return { subject, sba: null, exam: null, sbaRaw: null, examRaw: null, total: null, grade: null, level: l?.level, remark: l?.descriptor ?? "—" };
    }
    const sba = entry?.sba ?? null;
    const exam = entry?.exam ?? null;
    const sbaRaw = entry?.sbaRaw ?? null;
    const examRaw = entry?.examRaw ?? null;
    if (sba === null && exam === null) {
      return { subject, sba, exam, sbaRaw, examRaw, total: null, grade: null, remark: "—" };
    }
    const total = Math.round(((sba ?? 0) + (exam ?? 0)) * 10) / 10;
    const band = gradeFor(total);
    return { subject, sba, exam, sbaRaw, examRaw, total, grade: band.grade, remark: band.remark };
  });

  const graded = subjects.filter((s) => (kg ? !!s.level : s.total !== null));
  const totalMarks0 = graded.reduce((sum, s) => sum + (s.total ?? 0), 0);
  const totalMarks = Math.round(totalMarks0 * 10) / 10;
  const aggregate = kg ? 0 : graded.reduce((sum, s) => sum + (s.grade ?? 0), 0);

  let bestSix: StudentResult["bestSix"] = null;
  if (isJhs(student.classId)) {
    const g = new Map(graded.map((r) => [r.subject, r.grade!]));
    const pick: { subject: string; grade: number }[] = [];
    for (const c of ["English Language", "Mathematics"]) if (g.has(c)) pick.push({ subject: c, grade: g.get(c)! });
    const sci = ["Integrated Science", "Social Studies"].filter((c) => g.has(c)).map((c) => ({ subject: c, grade: g.get(c)! }));
    sci.sort((a, b) => a.grade - b.grade);
    if (sci[0]) pick.push(sci[0]);
    const used = new Set(pick.map((p) => p.subject));
    const electives = [...g.entries()].filter(([s]) => !used.has(s)).map(([subject, grade]) => ({ subject, grade })).sort((a, b) => a.grade - b.grade).slice(0, 3);
    pick.push(...electives);
    bestSix = { subjects: pick, aggregate: pick.reduce((a, p) => a + p.grade, 0) };
  }

  return {
    bestSix,
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
