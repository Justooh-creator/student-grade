import { MAX_STUDENTS_PER_CLASS, type ClassId } from "./ges";
import type { Student } from "./store";

export interface LearnerImportRow { row: number; name: string; admissionNo: string; gender: string; }
export interface ImportIssue { row: number; message: string; }
const key = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
const header = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const NAME_HEADERS = ["name", "fullname", "learnername", "studentname"];
const ADM_HEADERS = ["admissionno", "admissionnumber", "admno", "admission"];

export function parseLearnerRows(matrix: unknown[][]) {
  const first = matrix.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));
  if (first < 0) throw new Error("The register is empty.");
  const headers = (matrix[first] ?? []).map(header);
  const nameCol = headers.findIndex((h) => NAME_HEADERS.includes(h));
  const admCol = headers.findIndex((h) => ADM_HEADERS.includes(h));
  const genderCol = headers.findIndex((h) => ["gender", "sex"].includes(h));
  if (nameCol < 0) throw new Error("A Name or Learner name column is required.");
  const rows: LearnerImportRow[] = [];
  const issues: ImportIssue[] = [];
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
    rows.push({ row, name, admissionNo, gender });
  });
  return { rows, issues };
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
    id: crypto.randomUUID(), name: r.name, admissionNo: r.admissionNo, gender: r.gender,
    classId, attendance: "", scores: {}, conduct: "", interest: "", remark: "",
  }))];
}