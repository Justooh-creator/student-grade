import { getClassLevel, type ClassId } from "./ges";
import { isJhsClass } from "./qaRules";
import { JHS_SUBJECTS } from "./dynamicJhs";

export const GHANAIAN_LANGUAGES = ["Asante Twi", "Akuapem Twi", "Fante", "Eʋegbe", "Ga", "Dangme", "Dagbani", "Dagaare", "Gonja", "Kasem", "Nzema"] as const;
export function qaSubjects(classId: ClassId): string[] {
  if (isJhsClass(classId)) return JHS_SUBJECTS.map((s) => s.includes("Ghanaian Language") ? "Ghanaian Language" : s);
  return [...getClassLevel(classId).subjects];
}
export function qaBankSubject(subject: string, language: string): string {
  if (subject === "Numeracy") return "Mathematics";
  if (subject === "Ghanaian Language") return `Ghanaian Language (${language})`;
  return subject;
}
/** Separate lettered parts while retaining the introduction and original wording. */
export function theoryParts(question: string): string[] {
  return question.split(/\s*(?=\([a-z]\)\s)/).map((s) => s.trim()).filter(Boolean);
}