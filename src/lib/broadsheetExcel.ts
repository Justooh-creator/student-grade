import { getClassLevel, isJhs, isKg, type ClassId } from "./ges";
import { KG_RATINGS, kgMilestones, kgProgress } from "./kgMilestones";
import { subjectSummary, type BroadsheetRow } from "./broadsheet";

type Cell = { value?: string | number; fontWeight?: "bold"; columnSpan?: number; backgroundColor?: string; textColor?: string; align?: "left" | "center" | "right"; wrap?: boolean } | null;
export type SheetRows = Cell[][];

interface SchoolInfo { name?: string; academicYear?: string; term?: string; headTeacher?: string; classTeachers?: Record<string, string> }

const head = (value: string, columnSpan = 1): Cell => ({ value, fontWeight: "bold", backgroundColor: "#1E3A8A", textColor: "#FFFFFF", align: "center", wrap: true, ...(columnSpan > 1 ? { columnSpan } : {}) });
const spanned = (cell: Cell, span: number): Cell[] => [cell, ...Array<Cell>(span - 1).fill(null)];
const num = (n: number | null | undefined): Cell => (n == null ? { value: "—", align: "center" } : { value: Math.round(n * 10) / 10, align: "center" });
const bold = (value: string): Cell => ({ value, fontWeight: "bold" });

/** Pure sheet layout for the class master score sheet (tested; no browser APIs). */
export function broadsheetRows(rows: BroadsheetRow[], classId: ClassId, school: SchoolInfo): { data: SheetRows; widths: number[] } {
  const level = getClassLevel(classId);
  const title = [bold(school.name || "EduReport Ghana")];
  const sub = [{ value: `${level.name} · ${school.academicYear ?? ""} · ${school.term ?? ""} · ${rows.length} learners · Master Score Sheet` } as Cell];
  const footer: Cell[][] = [[], [{ value: `Class teacher: ${school.classTeachers?.[classId] || "________________"}` }], [{ value: `Headteacher: ${school.headTeacher || "________________"}` }]];

  if (isKg(classId)) {
    const items = kgMilestones(classId, school.term);
    const header = [head("No."), head("Learner"), head("Admission no."), ...items.map((m) => head(String(m.n))), ...KG_RATINGS.map((r) => head(r.code)), head("Rated")];
    const body = rows.map(({ student }, i) => {
      const p = kgProgress(student, school.term);
      return [num(i + 1), bold(student.name), { value: student.admissionNo || "" }, ...p.rows.map((r) => ({ value: r.rating ?? "—", align: "center" as const })), ...KG_RATINGS.map((r) => num(p.counts[r.code])), { value: `${p.rated}/${p.rows.length}`, align: "center" as const }];
    });
    const key = [[], [bold(KG_RATINGS.map((r) => `${r.code} – ${r.label}`).join(" · "))], ...items.map((m) => [{ value: `${m.n}. ${m.text}` } as Cell])];
    return { data: [title, sub, [], header, ...body, ...key, ...footer], widths: [5, 28, 14, ...items.map(() => 5), ...KG_RATINGS.map(() => 6), 7] };
  }

  const jhs = isJhs(classId);
  const subjects = level.subjects;
  const fields = ["Raw SBA /100", "SBA /50", "Raw Exam /100", "Exam /50", "Total /100", "Grade"];
  const tail = ["Total", "Average", "Position", ...(jhs ? ["Best Six"] : [])];
  const header1 = [head("No."), head("Learner"), head("Admission no."), ...subjects.flatMap((s) => spanned(head(s, 6), 6)), ...tail.map((t) => head(t))];
  const header2 = [head(""), head(""), head(""), ...subjects.flatMap(() => fields.map((f) => head(f))), ...tail.map(() => head(""))];
  const body = rows.map(({ student, result, position }, i) => [
    num(i + 1), bold(student.name), { value: student.admissionNo || "" },
    ...subjects.flatMap((subject) => {
      const r = result.subjects.find((s) => s.subject === subject);
      return [r?.sbaRaw, r?.sba, r?.examRaw, r?.exam, r?.total, r?.grade].map(num);
    }),
    result.gradedCount ? num(result.totalMarks) : num(null),
    result.gradedCount ? num(result.average) : num(null),
    num(position),
    ...(jhs ? [result.bestSix?.subjects.length === 6 ? num(result.bestSix.aggregate) : num(null)] : []),
  ]);
  const summaryHead = [head("Subject"), head("Highest mark /100"), head("Top learner(s)"), head("Class average /100"), head("Learners graded")];
  const summary = subjects.map((s) => {
    const sm = subjectSummary(rows, s);
    return [bold(s), num(sm.highest), { value: sm.top.join(", ") || "—", wrap: true }, num(sm.average), num(sm.graded)];
  });
  const widths = [5, 28, 14, ...subjects.flatMap(() => [8, 7, 8, 7, 8, 6]), ...tail.map(() => 9)];
  return { data: [title, sub, [], header1, header2, ...body, [], [bold("Subject summary · Top performers")], summaryHead, ...summary, ...footer], widths };
}

export function broadsheetFileName(className: string, year?: string, term?: string) {
  return `${[className, "Broadsheet", year, term].filter(Boolean).join(" ")}.xlsx`.replace(/[\\/:*?"<>|]+/g, "-");
}

/** Builds and downloads the .xlsx in the browser; the writer library loads only when tapped. */
export async function downloadBroadsheetXlsx(rows: BroadsheetRow[], classId: ClassId, school: SchoolInfo) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const { data, widths } = broadsheetRows(rows, classId, school);
  const name = getClassLevel(classId).name;
  await writeXlsxFile(data, { sheet: name.slice(0, 31), orientation: "landscape", columns: widths.map((width) => ({ width })) }, { fontFamily: "Arial", fontSize: 10 }).toFile(broadsheetFileName(name, school.academicYear, school.term));
}
