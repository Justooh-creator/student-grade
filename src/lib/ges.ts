export type BaseClassId =
  | "kg1"
  | "kg2"
  | "b1"
  | "b2"
  | "b3"
  | "b4"
  | "b5"
  | "b6"
  | "b7"
  | "b8"
  | "b9";

/** Class ids may carry a stream suffix — "b1a", "b1b", "b1c" — for schools running parallel classes (Basic 1A, Basic 1B, …). */
export type ClassId = BaseClassId | `${BaseClassId}a` | `${BaseClassId}b` | `${BaseClassId}c`;

export const STREAM_LETTERS = ["a", "b", "c"] as const;
export type StreamLetter = (typeof STREAM_LETTERS)[number];

const CLASS_ID_RE = /^(kg1|kg2|b[1-9])([abc])?$/;

export function parseClassId(id: string): { base: BaseClassId; stream: StreamLetter | null } | null {
  const m = CLASS_ID_RE.exec(id.trim());
  if (!m) return null;
  return { base: m[1] as BaseClassId, stream: (m[2] as StreamLetter | undefined) ?? null };
}

export function isValidClassId(id: string): boolean {
  return CLASS_ID_RE.test(id.trim());
}

export function baseClassId(id: string): BaseClassId {
  return parseClassId(id)?.base ?? "kg1";
}

export function classStream(id: string): StreamLetter | null {
  return parseClassId(id)?.stream ?? null;
}

/** All class ids for a stream setting: 11 levels × stream count, in order. */
export function allClassIds(streams = 1): ClassId[] {
  const n = Math.min(3, Math.max(1, Math.round(streams || 1)));
  return CLASS_LEVELS.flatMap((c) =>
    n === 1 ? [c.id] : STREAM_LETTERS.slice(0, n).map((s) => `${c.id}${s}` as ClassId),
  );
}

export function schoolClassIds(school: { streams?: number }): ClassId[] {
  return allClassIds(school.streams ?? 1);
}

/** e.g. "b1a" → "Basic 1A". */
export function classDisplayName(id: string): string {
  const parsed = parseClassId(id);
  const base = parsed?.base ?? "kg1";
  const name = CLASS_LEVELS.find((c) => c.id === base)?.name ?? "KG 1";
  return parsed?.stream ? `${name}${parsed.stream.toUpperCase()}` : name;
}

/** Compact picker label: "b1a" → "B1A", "kg2b" → "KG2B", "b4" → "Basic 4". */
export function classShortLabel(id: string): string {
  const parsed = parseClassId(id);
  const base = parsed?.base ?? "kg1";
  const short = base === "kg1" ? "KG1" : base === "kg2" ? "KG2" : `B${base.slice(1)}`;
  return parsed?.stream ? `${short}${parsed.stream.toUpperCase()}` : short;
}

export interface ClassLevel {
  id: ClassId;
  name: string;
  stage: "Kindergarten" | "Lower Primary" | "Upper Primary" | "Junior High";
  subjects: string[];
}

const KG_SUBJECTS = [
  "Language and Literacy",
  "Numeracy",
  "Our World Our People",
  "Creative Arts",
  "Physical Development",
  "Music and Movement",
];

const LOWER_PRIMARY_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Science",
  "Our World Our People",
  "Religious and Moral Education",
  "Creative Arts",
  "Ghanaian Language",
  "Physical Education",
  "Computing",
];

const UPPER_PRIMARY_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Science",
  "History",
  "Our World Our People",
  "Religious and Moral Education",
  "Creative Arts",
  "Ghanaian Language",
  "Physical Education",
  "Computing",
];

const JHS_SUBJECTS = [
  "English Language",
  "Mathematics",
  "Integrated Science",
  "Social Studies",
  "Religious and Moral Education",
  "Ghanaian Language",
  "Career Technology",
  "Computing",
  "Creative Arts and Design",
  "French",
];

export const CLASS_LEVELS: ClassLevel[] = [
  { id: "kg1", name: "KG 1", stage: "Kindergarten", subjects: KG_SUBJECTS },
  { id: "kg2", name: "KG 2", stage: "Kindergarten", subjects: KG_SUBJECTS },
  { id: "b1", name: "Basic 1", stage: "Lower Primary", subjects: LOWER_PRIMARY_SUBJECTS },
  { id: "b2", name: "Basic 2", stage: "Lower Primary", subjects: LOWER_PRIMARY_SUBJECTS },
  { id: "b3", name: "Basic 3", stage: "Lower Primary", subjects: LOWER_PRIMARY_SUBJECTS },
  { id: "b4", name: "Basic 4", stage: "Upper Primary", subjects: UPPER_PRIMARY_SUBJECTS },
  { id: "b5", name: "Basic 5", stage: "Upper Primary", subjects: UPPER_PRIMARY_SUBJECTS },
  { id: "b6", name: "Basic 6", stage: "Upper Primary", subjects: UPPER_PRIMARY_SUBJECTS },
  { id: "b7", name: "Basic 7", stage: "Junior High", subjects: JHS_SUBJECTS },
  { id: "b8", name: "Basic 8", stage: "Junior High", subjects: JHS_SUBJECTS },
  { id: "b9", name: "Basic 9", stage: "Junior High", subjects: JHS_SUBJECTS },
];

export function getClassLevel(id: ClassId): ClassLevel {
  const base = CLASS_LEVELS.find((c) => c.id === baseClassId(id)) ?? CLASS_LEVELS[0]!;
  const valid = isValidClassId(id);
  return { ...base, id: valid ? id : base.id, name: valid ? classDisplayName(id) : base.name };
}

export function nextClassName(id: ClassId): string {
  const { base, stream } = parseClassId(id) ?? { base: baseClassId(id), stream: null };
  const index = CLASS_LEVELS.findIndex((c) => c.id === base);
  if (index < 0 || index === CLASS_LEVELS.length - 1) return "Completed Basic 9";
  const next = CLASS_LEVELS[index + 1]!;
  return stream ? `${next.name}${stream.toUpperCase()}` : next.name;
}

export interface GradeBand {
  grade: number;
  min: number;
  max: number;
  remark: string;
}

/** GES basic school grading: 1 is highest, 9 is lowest. */
export const GRADE_BANDS: GradeBand[] = [
  { grade: 1, min: 80, max: 100, remark: "Excellent" },
  { grade: 2, min: 70, max: 79, remark: "Very Good" },
  { grade: 3, min: 65, max: 69, remark: "Good" },
  { grade: 4, min: 60, max: 64, remark: "Credit" },
  { grade: 5, min: 55, max: 59, remark: "Credit" },
  { grade: 6, min: 50, max: 54, remark: "Average" },
  { grade: 7, min: 45, max: 49, remark: "Pass" },
  { grade: 8, min: 40, max: 44, remark: "Weak Pass" },
  { grade: 9, min: 0, max: 39, remark: "Fail" },
];

export const SBA_MAX = 30;
export const EXAM_MAX = 70;

export function gradeFor(total: number): GradeBand {
  const rounded = Math.round(total);
  return GRADE_BANDS.find((b) => rounded >= b.min && rounded <= b.max) ?? GRADE_BANDS[GRADE_BANDS.length - 1]!;
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function teacherRemarkFor(average: number): string {
  if (average >= 80) return "An excellent term's work. Keep up this outstanding effort.";
  if (average >= 70) return "A very good performance. Sustain this level of commitment.";
  if (average >= 60) return "A good result. More attention to detail will lift the grades further.";
  if (average >= 50) return "An average performance. Consistent study at home is needed.";
  return "Below expectation. Serious effort and close support are required next term.";
}

export const CONDUCT_PRESETS = [
  "Respectful and well behaved",
  "Punctual and regular",
  "Hardworking and dedicated",
  "Obedient and cooperative",
  "Neat and organised",
  "Friendly and helpful to others",
  "Quiet but attentive",
  "Needs to improve punctuality",
  "Talkative in class",
  "Needs to be more serious",
];

export const REMARK_PRESETS = [
  "Excellent performance. Keep it up!",
  "Very good work. Aim higher.",
  "Good performance. Can do better.",
  "Satisfactory. More effort needed.",
  "Fair performance. Must work harder.",
  "Weak performance. Needs serious attention.",
  "Has improved greatly this term.",
  "Promising learner. Keep working hard.",
];

export const MAX_STUDENTS_PER_CLASS = 35;

export const HEAD_REMARK_PRESETS = [
  "Excellent results. Keep it up!",
  "Very good performance. Well done.",
  "Good work. Aim higher next term.",
  "Satisfactory. Put in more effort.",
  "Can do better with more seriousness.",
  "Weak performance. Needs extra support at home.",
  "Promoted. Keep working hard.",
  "Has shown great improvement this term.",
];

export const INTEREST_PRESETS = [
  "Football", "Reading", "Drawing and art", "Music and singing", "Drama", "Athletics",
  "Science and experiments", "Computing / ICT", "Mathematics puzzles", "Debating",
  "Cultural dance", "Volleyball", "Handwork and crafts", "Gardening",
];

/** Basic 1–9 use the CAT structure: 4 SBA parts (raw /100 → 50%) + exam (raw /100 → 50%). KG uses performance levels only. */
export const CAT_PARTS = [
  { key: "test1", label: "Class Test 1", short: "Test 1", max: 20 },
  { key: "test2", label: "Class Test 2", short: "Test 2", max: 20 },
  { key: "project", label: "Project Work", short: "Project", max: 30 },
  { key: "group", label: "Group Work", short: "Group", max: 30 },
] as const;
export type CatPart = (typeof CAT_PARTS)[number]["key"];
export const CAT_SBA_MAX = 50;
export const CAT_EXAM_MAX = 50;
export function usesCat(id: ClassId): boolean {
  const base = baseClassId(id);
  return base !== "kg1" && base !== "kg2";
}
export function isJhs(id: ClassId): boolean {
  const base = baseClassId(id);
  return base === "b7" || base === "b8" || base === "b9";
}
export function isKg(id: ClassId): boolean {
  const base = baseClassId(id);
  return base === "kg1" || base === "kg2";
}

/** KG 1–2 authentic continuous assessment (NaCCA): teacher selects a level per learning area. No SBA/Exam formula, no numeric grade or aggregate. */
export const KG_LEVELS = [
  { level: "Gold", code: "G", descriptor: "High level of proficiency; transfers learning confidently and flexibly" },
  { level: "Silver", code: "S", descriptor: "Sufficient fundamental knowledge and skills; transfers learning independently" },
  { level: "Bronze", code: "B", descriptor: "Approaching proficiency; may need guidance or support" },
] as const;
export type KgLevel = (typeof KG_LEVELS)[number];
export type KgLevelName = KgLevel["level"];
export function kgLevelByName(name: string | null | undefined): KgLevel | null {
  return KG_LEVELS.find((l) => l.level === name) ?? null;
}
