import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel, BorderStyle } from "docx";
import type { LessonNote } from "./lessonNotes";
import { classDisplayName } from "./ges";

const A4 = { width: 11906, height: 16838 };
const rule = { style: BorderStyle.SINGLE, size: 4 };
const para = (text: string, bold = false) => new Paragraph({ children: [new TextRun({ text, bold, size: 22 })], spacing: { after: 80 } });
const cell = (label: string, text: string, span = 1) => new TableCell({ columnSpan: span, children: [para(label, true), ...text.split("\n").map((line) => para(line))] });

export function lessonWordDocument(note: LessonNote): Document {
  const row = (...cells: TableCell[]) => new TableRow({ children: cells });
  const table = (rows: TableRow[]) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows, borders: { top: rule, bottom: rule, left: rule, right: rule, insideHorizontal: rule, insideVertical: rule } });
  return new Document({ sections: [{ properties: { page: { size: A4, margin: { top: 680, bottom: 680, left: 680, right: 680 } } }, children: [
    new Paragraph({ text: note.schoolName || "Weekly Lesson Note", heading: HeadingLevel.HEADING_1 }),
    para(note.title || `${note.subject} — Weekly Lesson Note`, true),
    table([
      row(cell("Week Ending", note.weekEnding), cell("Day", note.day), cell("Subject", note.subject)),
      row(cell("Duration", `${note.duration} minutes`, 2), cell("Strand", note.strand)),
      row(cell("Class", classDisplayName(note.classId)), cell("Class Size", note.classSize), cell("Sub Strand", note.subStrand)),
      row(cell("Content Standard", note.contentStandard), cell("Indicator", note.indicator), cell("Lesson", note.lesson)),
      row(cell("Performance Indicator", note.performanceIndicator, 2), cell("Core Competencies", note.competencies)),
      row(cell("New Words", note.newWords, 3)), row(cell("Reference", note.reference, 3)),
    ]), para(""),
    table([
      row(cell("Activities for Learning & Assessment", ""), cell("Resources", ""), cell("Progression", "")),
      row(cell(`Starter (${note.starterMinutes} mins)`, note.starter), cell("", note.resources), cell("", note.progression)),
      row(cell(`Main (${note.mainMinutes} mins)`, `${note.main}\n\nAssessment\n${note.assessment}`), cell("", ""), cell("", "")),
      row(cell(`Reflection (${note.reflectionMinutes} mins)`, note.reflection), cell("", ""), cell("", "")),
      row(cell("Homework / Project Work / Community Engagement Suggestions", note.homework, 3)),
      row(cell("Cross-Curriculum Links / Cross-Cutting Issues", note.crossCurriculum, 3)),
      row(cell("Potential Misconceptions / Student Learning Difficulties", note.misconceptions, 3)),
    ]), para(""), para(`VETTED BY: ${note.vettedBy || "________________"}   SIGN: ${note.signature || "________________"}   DATE: ${note.vettedDate || "________________"}`, true),
  ] }] });
}

export async function createLessonWordBlob(note: LessonNote): Promise<Blob> { return Packer.toBlob(lessonWordDocument(note)); }