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