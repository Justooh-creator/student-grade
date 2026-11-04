import { classRanking } from "@/lib/results";
import type { ClassId } from "@/lib/ges";
import type { Student } from "@/lib/store";

export type CertTheme = "royal" | "prestige" | "modern" | "chancellor";

export const CERT_THEMES: { id: CertTheme; label: string }[] = [
  { id: "royal", label: "Royal Academic" },
  { id: "prestige", label: "Classic Prestige" },
  { id: "modern", label: "Modern Excellence" },
  { id: "chancellor", label: "Chancellor Script" },
];

export const AWARD_PRESETS = [
  "First Position in Class",
  "Second Position in Class",
  "Third Position in Class",
  "Best in Mathematics",
  "Best in English Language",
  "Best in Science",
  "Perfect Attendance",
  "Most Disciplined Learner",
  "Neatest Learner",
  "Outstanding Leadership",
  "Most Improved Learner",
  "Custom Award",
] as const;

export function defaultCitation(award: string): string {
  if (award.includes("Position")) return "in recognition of outstanding academic performance and dedication to learning";
  if (award.startsWith("Best in")) return "for exceptional excellence and distinction in this subject";
  if (award === "Perfect Attendance") return "for regular and punctual attendance throughout the term";
  return "in recognition of exemplary character, effort and contribution to school life";
}

/** Top three learners (1st, 2nd, 3rd) by total marks; ties share a position. */
export function topLearners(students: Student[], classId: ClassId, count = 3) {
  const r = classRanking(students, classId);
  return r.entries
    .filter((e) => e.result.gradedCount > 0)
    .map((e) => ({ student: e.student, position: r.positions.get(e.student.id) ?? 0 }))
    .filter((e) => e.position >= 1 && e.position <= count)
    .sort((a, b) => a.position - b.position);
}

export const POSITION_AWARD = ["", "First Position in Class", "Second Position in Class", "Third Position in Class"];
