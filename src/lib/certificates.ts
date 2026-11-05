import { classRanking } from "@/lib/results";
import type { ClassId } from "@/lib/ges";
import type { Student } from "@/lib/store";

export type CertTheme = "royal" | "prestige" | "modern" | "chancellor" | "elite" | "young";

export const CERT_THEMES: { id: CertTheme; label: string; note: string }[] = [
  { id: "royal", label: "Royal Gold", note: "Ivory parchment, double gold border" },
  { id: "prestige", label: "Vintage Prestige", note: "Burgundy and antique gold diploma" },
  { id: "modern", label: "Modern Excellence", note: "Navy, white and gold geometric" },
  { id: "chancellor", label: "Chancellor Elegance", note: "Emerald and cream, script title" },
  { id: "elite", label: "Black & Gold Elite", note: "Deep black with metallic gold" },
  { id: "young", label: "Young Achiever", note: "Bright and friendly for little ones" },
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

export const STAFF_AWARD_PRESETS = [
  "Best Teacher of the Term",
  "Most Dedicated Teacher",
  "Most Innovative Teacher",
  "Best Performing Teacher",
  "Outstanding Leadership",
  "Excellence in Classroom Management",
  "Best Subject Teacher",
  "Most Punctual Staff",
  "Outstanding Contribution to Education",
  "Long Service Award",
  "Teacher of the Year",
  "Custom Award",
] as const;

export function defaultCitation(award: string): string {
  if (award.includes("Position")) return "in recognition of outstanding academic performance and dedication to learning";
  if (award.startsWith("Best in")) return "for exceptional excellence and distinction in this subject";
  if (award === "Perfect Attendance") return "for regular and punctual attendance throughout the term";
  return "in recognition of exemplary character, effort and contribution to school life";
}

export function defaultStaffCitation(award: string): string {
  if (award === "Long Service Award") return "in grateful recognition of loyal and dedicated years of service to the school";
  if (award === "Most Punctual Staff") return "for exemplary punctuality, reliability and commitment to duty";
  return "in appreciation of outstanding dedication, professionalism and contribution to teaching and learning";
}

/** Who may generate certificates: independent teachers, or school headteacher / assistant / admin. */
export const CERT_ROLES = ["headteacher", "assistant_headteacher", "admin"];
export function canMakeCertificates(inSchool: boolean, role?: string) {
  return !inSchool || CERT_ROLES.includes(role ?? "");
}

export type PaperId = "A4" | "A3" | "A2" | "A1" | "A0" | "custom";
/** Long × short edge in mm. */
export const PAPERS: Record<Exclude<PaperId, "custom">, [number, number]> = {
  A4: [297, 210], A3: [420, 297], A2: [594, 420], A1: [841, 594], A0: [1189, 841],
};

/** Page size in mm for a paper choice and orientation. */
export function paperSize(paper: PaperId, orientation: "landscape" | "portrait", custom: { w: number; h: number; unit: "mm" | "in" }) {
  if (paper === "custom") {
    const k = custom.unit === "in" ? 25.4 : 1;
    const w = Math.min(Math.max(custom.w * k, 100), 2000);
    const h = Math.min(Math.max(custom.h * k, 100), 2000);
    return { w: Math.round(w), h: Math.round(h) };
  }
  const [long, short] = PAPERS[paper];
  return orientation === "landscape" ? { w: long, h: short } : { w: short, h: long };
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
