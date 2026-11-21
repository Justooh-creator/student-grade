import { MAX_STUDENTS_PER_CLASS, type ClassId } from "./ges";
import type { Student } from "./store";

export interface LearnerImportRow { row: number; name: string; admissionNo: string; gender: string; dob?: string }
export interface ImportIssue { row: number; message: string; }
const key = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
const header = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const NAME_HEADERS = ["name", "fullname", "learnername", "studentname"];
const ADM_HEADERS = ["admissionno", "admissionnumber", "admno", "admission"];
const DOB_HEADERS = ["dateofbirth", "dob", "birthdate", "dateofbirthddmmyyyy", "dobddmmyyyy", "birthday", "datebirth"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Reads a register date of birth as ISO "YYYY-MM-DD". Slashed dates are day-first (DD/MM/YYYY) as written in
 * Ghanaian registers; Excel dates and serial numbers are accepted too. "" when blank, null when unreadable.
 */
export function parseDob(value: unknown, today: Date = new Date()): string | null {
  if (value === null || value === undefined) return "";
  const iso = (y: number, m: number, d: number) => {
    const t = new Date(Date.UTC(y, m - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
    if (y < 1990 || t.getTime() > today.getTime()) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  const serial = (n: number) => {
    if (!Number.isFinite(n) || n < 30000 || n > 80000) return null;
    const t = new Date(Math.round((n - 25569) * 86400000));
    return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  };
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : iso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  if (typeof value === "number") return serial(value);
  // Handwritten registers are often read back as "21 / 5 / 14" or "10/3/15." — tidy the separators first.
  const s = String(value).trim().replace(/(\d)\s*([-/.])\s*(?=\d)/g, "$1$2").replace(/[.,]+$/, "");
  if (!s) return "";
  if (/^\d{5}$/.test(s)) return serial(Number(s));
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(s);
  if (m) { const y = Number(m[3]); return iso(y < 100 ? 2000 + y : y, Number(m[2]), Number(m[1])); }
  m = /^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})\.?,?[\s-]+(\d{4})$/i.exec(s);
  if (m) { const mo = MONTHS.indexOf((m[2] ?? "").slice(0, 3).toLowerCase()); return mo < 0 ? null : iso(Number(m[3]), mo + 1, Number(m[1])); }
  m = /^([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i.exec(s);
  if (m) { const mo = MONTHS.indexOf((m[1] ?? "").slice(0, 3).toLowerCase()); return mo < 0 ? null : iso(Number(m[3]), mo + 1, Number(m[2])); }
  return null;
}

export function parseLearnerRows(matrix: unknown[][]) {
  const first = matrix.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));
  if (first < 0) throw new Error("The register is empty.");
  const headers = (matrix[first] ?? []).map(header);
  const nameCol = headers.findIndex((h) => NAME_HEADERS.includes(h));
  const admCol = headers.findIndex((h) => ADM_HEADERS.includes(h));
  const genderCol = headers.findIndex((h) => ["gender", "sex"].includes(h));
  const dobCol = headers.findIndex((h) => DOB_HEADERS.includes(h));
  if (nameCol < 0) throw new Error("A Name or Learner name column is required.");
  const rows: LearnerImportRow[] = [];
  const issues: ImportIssue[] = [];
  /** Rows that still import but with a field left blank. */
  const notes: ImportIssue[] = [];
  matrix.slice(first + 1).forEach((cells, i) => {
    const row = first + i + 2;
    if (cells.every((cell) => !String(cell ?? "").trim())) return;
    const name = String(cells[nameCol] ?? "").trim().replace(/\s+/g, " ");
    const admissionNo = admCol < 0 ? "" : String(cells[admCol] ?? "").trim();
    const rawGender = genderCol < 0 ? "" : key(String(cells[genderCol] ?? ""));
    const gender = ["m", "male", "boy"].includes(rawGender) ? "Male" : ["f", "female", "girl"].includes(rawGender) ? "Female" : "";
    if (!name || name.length > 200) { issues.push({ row, message: "Name is required (maximum 200 characters)." }); return; }
    if (admissionNo.length > 100) { issues.push({ row, message: "Admission number is too long." }); return; }
    if (rawGender && !gender) { issues.push({ row, message: "Gender must be Male/Female or M/F, or blank." }); return; }
    const dob = dobCol < 0 ? "" : parseDob(cells[dobCol]);
    if (dob === null) notes.push({ row, message: "Date of birth not recognised — left blank. Use DD/MM/YYYY, e.g. 14/05/2019." });
    rows.push({ row, name, admissionNo, gender, ...(dob ? { dob } : {}) });
  });
  return { rows, issues, notes };
}

/** Append-only, class/stream-scoped. Existing learner marks are never overwritten. */
export function planLearnerImport(rows: LearnerImportRow[], existing: Student[], classId: ClassId) {
  const inClass = existing.filter((s) => s.classId === classId);
  const names = new Set(inClass.map((s) => key(s.name)));
  const admissions = new Set(inClass.filter((s) => s.admissionNo).map((s) => key(s.admissionNo)));
  const accepted: LearnerImportRow[] = [];
  const skipped: ImportIssue[] = [];
  rows.forEach((row) => {
    if (names.has(key(row.name)) || (row.admissionNo && admissions.has(key(row.admissionNo)))) {
      skipped.push({ row: row.row, message: "Duplicate name or admission number — skipped." }); return;
    }
    names.add(key(row.name));
    if (row.admissionNo) admissions.add(key(row.admissionNo));
    accepted.push(row);
  });
  const remaining = Math.max(0, MAX_STUDENTS_PER_CLASS - inClass.length);
  return { accepted, skipped, remaining, overCapacity: accepted.length > remaining };
}

export function appendLearnerImport(existing: Student[], rows: LearnerImportRow[], classId: ClassId, canEdit: boolean): Student[] {
  if (!canEdit) throw new Error("This class is view only.");
  const plan = planLearnerImport(rows, existing, classId);
  if (plan.overCapacity) throw new Error(`This class has room for ${plan.remaining} learners (35 maximum). No learners were imported.`);
  return [...existing, ...plan.accepted.map((r): Student => ({
    id: crypto.randomUUID(), name: r.name, admissionNo: r.admissionNo, gender: r.gender, ...(r.dob ? { dob: r.dob } : {}),
    classId, attendance: "", scores: {}, conduct: "", interest: "", remark: "",
  }))];
}