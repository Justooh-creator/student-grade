import type { LessonNote } from "@/lib/lessonNotes";
import { classDisplayName } from "@/lib/ges";

export function LessonNoteSheet({ note }: { note: LessonNote }) {
  const field = (label: string, text: string, span = 1) => <td colSpan={span}><strong>{label}{text ? ": " : ""}</strong>{text || "________________"}</td>;
  return <article className="lesson-paper" aria-label="A4 lesson note">
    <header><h2>{note.schoolName || "Weekly Lesson Note"}</h2><p>{note.title || `${note.subject} — Weekly Lesson Note`}</p></header>
    <table className="lesson-metadata"><tbody>
      <tr>{field("Week Ending", note.weekEnding)}{field("Day", note.day)}{field("Subject", note.subject)}</tr>
      <tr>{field("Duration", `${note.duration} mins`, 2)}{field("Strand", note.strand)}</tr>
      <tr>{field("Class", classDisplayName(note.classId))}{field("Class Size", note.classSize)}{field("Sub Strand", note.subStrand)}</tr>
      <tr>{field("Content Standard", note.contentStandard)}{field("Indicator", note.indicator)}{field("Lesson", note.lesson)}</tr>
      <tr>{field("Performance Indicator", note.performanceIndicator, 2)}{field("Core Competencies", note.competencies)}</tr>
      <tr>{field("New Words", note.newWords, 3)}</tr><tr>{field("Reference", note.reference, 3)}</tr>
    </tbody></table>
    <table className="lesson-activities"><colgroup><col className="lesson-activity-column" /><col /><col /></colgroup>
      <thead><tr><th>Activities for Learning &amp; Assessment</th><th>Resources</th><th>Progression</th></tr></thead>
      <tbody>
        <tr><td><h3>Starter ({note.starterMinutes} mins)</h3><p>{note.starter}</p></td><td>{note.resources}</td><td>{note.progression}</td></tr>
        <tr><td><h3>Main ({note.mainMinutes} mins)</h3><p>{note.main}</p><h3>Assessment</h3><p>{note.assessment}</p></td><td /><td /></tr>
        <tr><td><h3>Reflection ({note.reflectionMinutes} mins)</h3><p>{note.reflection}</p></td><td /><td /></tr>
        <tr><td colSpan={3}><h3>Homework / Project Work / Community Engagement Suggestions</h3><p>{note.homework}</p></td></tr>
        <tr><td colSpan={3}><h3>Cross-Curriculum Links / Cross-Cutting Issues</h3><p>{note.crossCurriculum}</p></td></tr>
        <tr><td colSpan={3}><h3>Potential Misconceptions / Student Learning Difficulties</h3><p>{note.misconceptions}</p></td></tr>
      </tbody>
    </table>
    <footer><b>VETTED BY</b> {note.vettedBy || "……………………"} <b>SIGN</b> {note.signature || "……………………"} <b>DATE</b> {note.vettedDate || "……………………"}</footer>
  </article>;
}