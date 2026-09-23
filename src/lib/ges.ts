export type ClassId =
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
  return CLASS_LEVELS.find((c) => c.id === id) ?? CLASS_LEVELS[0]!;
}

export function nextClassName(id: ClassId): string {
  const index = CLASS_LEVELS.findIndex((c) => c.id === id);
  if (index < 0 || index === CLASS_LEVELS.length - 1) return "Completed Basic 9";
  return CLASS_LEVELS[index + 1]!.name;
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
