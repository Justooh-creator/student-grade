import { getClassLevel } from "./ges";
import type { LessonNote } from "./lessonNotes";

export const LESSON_PAGE = { widthMm: 210, heightMm: 297, widthDxa: 11906, heightDxa: 16838, marginDxa: 567 };
export type LessonSchool = { name: string; academicYear: string };

function details(note: LessonNote): string[][] {
  return [
    ["Class", getClassLevel(note.classId).name, "Subject", note.subject],
    ["Term / Week", `Term ${note.term} · Week ${note.week}`, "Date", note.date],
    ["Duration", note.duration, "Class size", note.classSize],
    ["Strand", note.strand, "Sub-strand", note.subStrand],
  ];
}
function standards(note: LessonNote): string[][] {
  return [
    ["Content standard", note.contentStandard], ["Indicator", note.indicator],
    ["Performance indicator", note.performanceIndicator],
    ["Core competencies", note.competencies.join("; ")],
    ["Keywords", note.keywords], ["T/L resources", note.resources],
  ];
}
function activities(note: LessonNote): string[][] {
  return [["Phase 1: Starter (10 mins)", note.starter], ["Phase 2: New Learning (40 mins)", note.main],
    ["Phase 3: Reflection (10 mins)", note.plenary], ["Teacher’s reflection", note.reflection]];
}
function filename(note: LessonNote, extension: string) {
  return `Lesson-note-${note.classId}-${note.subject.replace(/[^a-z0-9]+/gi, "-")}-T${note.term}-W${note.week}.${extension}`;
}
async function download(blob: Blob, name: string) {
  const file = new File([blob], name, { type: blob.type });
  // Native sharing supports saving files in Android browsers and WebViews.
  if (/Android/i.test(navigator.userAgent) && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: name });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function createLessonPdf(note: LessonNote, school: LessonSchool): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ unit: "mm", format: [LESSON_PAGE.widthMm, LESSON_PAGE.heightMm] });
  pdf.setProperties({ title: `${note.subject} lesson note — EduReport` });
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(14);
  pdf.text(school.name || "School", 105, 15, { align: "center" });
  pdf.setFontSize(10);
  pdf.text(`NaCCA Standard-Based Lesson Note | ${school.academicYear}`, 105, 21, { align: "center" });
  let y = 25;
  const table = (body: string[][], widths: number[], head?: string[][]) => {
    autoTable(pdf, {
      startY: y, margin: { top: 10, right: 10, bottom: 12, left: 10 },
      theme: "grid", body, head, rowPageBreak: "avoid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 2, textColor: 20, lineColor: 30, lineWidth: 0.2, overflow: "linebreak" },
      headStyles: { fillColor: 235, textColor: 20, fontStyle: "bold" },
      columnStyles: Object.fromEntries(widths.map((width, index) => [index, { cellWidth: width, ...(index % 2 === 0 ? { fontStyle: "bold" as const } : {}) }])),
      didDrawPage: (data) => { y = data.cursor?.y ?? y; },
    });
    y += 3;
  };
  table(details(note), [42, 53, 42, 53]);
  table(standards(note), [42, 148]);
  table(activities(note), [42, 148], [["Phase / Duration", "Learners’ Activities"]]);
  table([[`Teacher: ${note.teacher}`, "Signature:", "Date:"], ["Vetted by (Headteacher):", "Signature:", "Date:"]], [90, 55, 45]);
  return pdf.output("blob");
}

export async function createLessonWord(note: LessonNote, school: LessonSchool): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType } = await import("docx");
  const contentWidth = LESSON_PAGE.widthDxa - 2 * LESSON_PAGE.marginDxa;
  const border = { style: BorderStyle.SINGLE, size: 4, color: "333333" };
  const paragraph = (text: string, bold = false) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text, bold })] });
  const table = (rows: string[][], proportions: number[], header = false) => {
    const widths = proportions.map((p) => Math.floor(contentWidth * p));
    widths[widths.length - 1] += contentWidth - widths.reduce((a, b) => a + b, 0);
    return new Table({ width: { size: contentWidth, type: WidthType.DXA }, columnWidths: widths,
      rows: rows.map((row, ri) => new TableRow({ cantSplit: true, tableHeader: header && ri === 0,
        children: row.map((text, ci) => new TableCell({ width: { size: widths[ci], type: WidthType.DXA },
          borders: { top: border, bottom: border, left: border, right: border },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          ...(header && ri === 0 ? { shading: { fill: "EBEBEB", type: ShadingType.CLEAR } } : {}),
          children: text.split(/\r?\n/).map((line) => paragraph(line, (header && ri === 0) || ci % 2 === 0)),
        })),
      })),
    });
  };
  const doc = new Document({ styles: { default: { document: { run: { font: "Arial", size: 22 } } } }, sections: [{
    properties: { page: { size: { width: LESSON_PAGE.widthDxa, height: LESSON_PAGE.heightDxa },
      margin: { top: LESSON_PAGE.marginDxa, right: LESSON_PAGE.marginDxa, bottom: LESSON_PAGE.marginDxa, left: LESSON_PAGE.marginDxa } } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: school.name || "School", bold: true, size: 28 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 }, children: [new TextRun({ text: `NaCCA Standard-Based Lesson Note · ${school.academicYear}`, bold: true })] }),
      table(details(note), [0.22, 0.28, 0.22, 0.28]), paragraph(""), table(standards(note), [0.22, 0.78]), paragraph(""),
      table([["Phase / Duration", "Learners’ Activities"], ...activities(note)], [0.22, 0.78], true), paragraph(""),
      table([[`Teacher: ${note.teacher}`, "Signature:", "Date:"], ["Vetted by (Headteacher):", "Signature:", "Date:"]], [0.48, 0.28, 0.24]),
    ],
  }] });
  return Packer.toBlob(doc);
}
export async function exportLessonNote(format: "pdf" | "docx", note: LessonNote, school: LessonSchool) {
  const blob = format === "pdf" ? await createLessonPdf(note, school) : await createLessonWord(note, school);
  await download(blob, filename(note, format));
}