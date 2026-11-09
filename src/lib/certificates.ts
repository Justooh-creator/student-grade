import { classRanking } from "@/lib/results";
import type { ClassId } from "@/lib/ges";
import type { Student } from "@/lib/store";

export type CertTheme = "royalblue" | "royal" | "prestige" | "modern" | "chancellor" | "elite" | "young"
  | "platinum" | "grand" | "emerald" | "minimal" | "african";

export const CERT_THEMES: { id: CertTheme; label: string; note: string }[] = [
  { id: "royalblue", label: "Royal Blue & Gold (Premium)", note: "Navy ribbons, metallic gold, laurel seal" },
  { id: "royal", label: "Royal Gold", note: "Ivory parchment, double gold border" },
  { id: "prestige", label: "Vintage Prestige", note: "Burgundy and antique gold diploma" },
  { id: "modern", label: "Modern Excellence", note: "Navy, white and gold geometric" },
  { id: "chancellor", label: "Chancellor Elegance", note: "Emerald and cream, script title" },
  { id: "elite", label: "Black & Gold Elite", note: "Deep black with metallic gold" },
  { id: "young", label: "Young Achiever", note: "Bright and friendly for little ones" },
  { id: "platinum", label: "Platinum Prestige", note: "Silver and charcoal, refined" },
  { id: "grand", label: "Grand Diploma", note: "Classic diploma with guilloché border" },
  { id: "emerald", label: "Emerald Heritage", note: "Deep green with gold filigree" },
  { id: "minimal", label: "Minimalist Signature", note: "Clean, modern, lots of white space" },
  { id: "african", label: "African Heritage", note: "Kente-inspired band, Adinkra corners" },
];

/** Display preferences only — never written back to school or learner records. */
export interface CertDisplay {
  logo: boolean; schoolName: boolean; motto: boolean; location: boolean;
  className: boolean; citation: boolean; term: boolean; academicYear: boolean; date: boolean;
  leftSignature: boolean; rightSignature: boolean; seal: boolean; watermarkBg: boolean;
}
export const DEFAULT_DISPLAY: CertDisplay = {
  logo: true, schoolName: true, motto: true, location: true, className: true, citation: true,
  term: true, academicYear: true, date: true, leftSignature: true, rightSignature: true, seal: true, watermarkBg: true,
};
export const DISPLAY_LABELS: { key: keyof CertDisplay; label: string; group: "Header" | "Text" | "Signatures" }[] = [
  { key: "logo", label: "School logo", group: "Header" },
  { key: "schoolName", label: "School name", group: "Header" },
  { key: "motto", label: "School motto", group: "Header" },
  { key: "location", label: "District & region", group: "Header" },
  { key: "className", label: "Class / designation", group: "Text" },
  { key: "citation", label: "Citation", group: "Text" },
  { key: "term", label: "Academic term", group: "Text" },
  { key: "academicYear", label: "Academic year", group: "Text" },
  { key: "date", label: "Award date", group: "Text" },
  { key: "leftSignature", label: "Left signature", group: "Signatures" },
  { key: "rightSignature", label: "Right signature", group: "Signatures" },
  { key: "seal", label: "Emblem & school stamp", group: "Signatures" },
  { key: "watermarkBg", label: "Background pattern", group: "Signatures" },
];

/** Which header lines appear, in order; hidden items leave no gap. */
export function headerLines(school: { name?: string; motto?: string; district?: string; region?: string }, d: CertDisplay) {
  const out: { kind: "name" | "motto" | "location"; text: string }[] = [];
  if (d.schoolName) out.push({ kind: "name", text: school.name?.trim() || "School Name" });
  if (d.motto && school.motto?.trim()) out.push({ kind: "motto", text: school.motto.trim() });
  const loc = [school.district, school.region].filter((x) => x?.trim()).join(", ");
  if (d.location && loc) out.push({ kind: "location", text: loc });
  return out;
}

export type SignerPreset = "ct_ht" | "aht_ht" | "prop_ht" | "ht_only" | "custom";
export const SIGNER_PRESETS: { id: SignerPreset; label: string }[] = [
  { id: "ct_ht", label: "Class Teacher & Headteacher" },
  { id: "aht_ht", label: "Assistant Headteacher & Headteacher" },
  { id: "prop_ht", label: "Proprietor & Headteacher" },
  { id: "ht_only", label: "Headteacher only" },
  { id: "custom", label: "Custom titles" },
];
/** Left/right signature titles; left is null when there is only one signer. */
export function signerTitles(p: SignerPreset, custom: { left: string; right: string }): { left: string | null; right: string } {
  switch (p) {
    case "ct_ht": return { left: "Class Teacher", right: "Headteacher" };
    case "aht_ht": return { left: "Assistant Headteacher", right: "Headteacher" };
    case "prop_ht": return { left: "Proprietor", right: "Headteacher" };
    case "ht_only": return { left: null, right: "Headteacher" };
    default: return { left: custom.left.trim() || null, right: custom.right.trim() || "Headteacher" };
  }
}

export type Medallion = "trophy" | "star" | "crest" | "rosette" | "none";
export const DEFAULT_MEDALLION: Medallion = "star";
export const EMBLEM_HEIGHT_MM = 25;
export const MEDALLIONS: { id: Medallion; label: string }[] = [
  { id: "star", label: "Gold Laurel Wreath & Star" },
  { id: "rosette", label: "Gold Rosette Ribbon & School Name" },
  { id: "crest", label: "School Crest in Laurel Wreath" },
  { id: "trophy", label: "Award Trophy in Laurel Wreath" },
  { id: "none", label: "None" },
];

/** Saved names are inherited only for the corresponding role; edits stay in the studio. */
export function certificateSignerDefaults(school: { classTeacher?: string; headTeacher?: string; classTeachers?: Record<string, string>; classTeacherSignatures?: Record<string, string> }, classId: string, preset: SignerPreset) {
  return {
    leftName: preset === "ct_ht" ? school.classTeachers?.[classId] || school.classTeacher || "" : "",
    rightName: school.headTeacher || "",
    leftSignature: preset === "ct_ht" ? school.classTeacherSignatures?.[classId] : undefined,
  };
}

export type PhotoFrame = "circle" | "oval" | "rect";
export const PHOTO_FRAMES: { id: PhotoFrame; label: string }[] = [
  { id: "circle", label: "Circular medallion" }, { id: "oval", label: "Formal oval cameo" }, { id: "rect", label: "Rectangular passport" },
];

/** Font choices with offline-safe fallbacks. "" = theme default. */
export const FONT_CHOICES: { id: string; label: string }[] = [
  { id: "", label: "Theme default" },
  { id: "'Cinzel', 'Times New Roman', serif", label: "Cinzel (classic capitals)" },
  { id: "'Playfair Display', Georgia, serif", label: "Playfair Display" },
  { id: "'Cormorant Garamond', Georgia, serif", label: "Cormorant Garamond" },
  { id: "'Great Vibes', 'Brush Script MT', cursive", label: "Great Vibes (script)" },
  { id: "'Pinyon Script', 'Brush Script MT', cursive", label: "Pinyon Script" },
  { id: "'Sora', Arial, sans-serif", label: "Sora (modern)" },
  { id: "'Manrope', Arial, sans-serif", label: "Manrope" },
  { id: "'UnifrakturMaguntia', 'Old English Text MT', Georgia, serif", label: "Gothic / Blackletter" },
];
export type CertFonts = { heading: string; name: string; award: string; citation: string };
export type CertTextSizes = Record<keyof CertFonts, number>;
export const DEFAULT_TEXT_SIZES: CertTextSizes = { heading: 1, name: 1, award: 1, citation: 1 };
export const TEXT_SIZE_CHOICES = [
  { label: "Small", value: 0.85 }, { label: "Normal", value: 1 },
  { label: "Large", value: 1.15 }, { label: "Extra Large", value: 1.3 },
];
/** Limit display-only scaling; paper dimensions and stored school data never change. */
export function certificateTextPoints(element: keyof CertFonts, portrait: boolean, scale = 1) {
  const base = { heading: portrait ? 29 : 34, name: portrait ? 32 : 40, award: 21, citation: 14 };
  return base[element] * Math.max(0.85, Math.min(1.3, Number.isFinite(scale) ? scale : 1));
}

export const CERT_HEADINGS = ["Certificate of Award", "Citation", "Citation of Honour", "Certificate of Recognition", "Certificate of Appreciation", "Certificate of Honour", "Certificate of Merit", "Certificate of Excellence", "Custom Heading"];

/** Session display is assembled from independent preferences, never by editing records. */
export function certificateSession(term: string, academicYear: string, display: CertDisplay): string {
  return [display.term && term.trim(), display.academicYear && academicYear.trim() && `${academicYear.trim()} Academic Year`].filter(Boolean).join(" · ");
}

export function certificatePresentation(heading: string): string {
  return /^citation\b/i.test(heading.trim()) ? "In honour of" : "This certificate is proudly presented to";
}

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
