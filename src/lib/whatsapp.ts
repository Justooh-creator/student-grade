import { getClassLevel, isJhs, isKg, ordinal, teacherRemarkFor } from "./ges";
import { classRanking, computeStudentResult } from "./results";
import type { School, Student } from "./store";

/** Normalise a Ghana phone number to WhatsApp international digits (e.g. 0241234567 -> 233241234567). */
export function normalizeGhanaPhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0") && d.length === 10) d = "233" + d.slice(1);
  else if (d.length === 9) d = "233" + d;
  if (d.length < 11 || d.length > 15) return null;
  return d;
}

export function buildWhatsAppSummary(student: Student, students: Student[], school: School): string {
  const level = getClassLevel(student.classId);
  const result = computeStudentResult(student);
  const kg = isKg(student.classId);
  const lines: string[] = [];
  lines.push(`*${school.name || "School"}* — Terminal Report`);
  lines.push(`${school.term} · ${school.academicYear}`);
  lines.push("");
  lines.push(`Learner: *${student.name}*`);
  lines.push(`Class: ${level.name}`);
  if (student.attendance) lines.push(`Attendance: ${student.attendance}${school.totalAttendance ? ` / ${school.totalAttendance}` : ""}`);
  lines.push("");
  if (kg) {
    lines.push("*Learning areas*");
    for (const s of result.subjects) lines.push(`• ${s.subject}: ${s.level || "—"}`);
  } else {
    const ranking = classRanking(students, student.classId);
    const pos = ranking.positions.get(student.id);
    lines.push("*Subjects*");
    for (const s of result.subjects) {
      if (s.total == null) continue;
      lines.push(`• ${s.subject}: ${s.total}${isJhs(student.classId) && s.grade != null ? ` (Grade ${s.grade})` : ""}`);
    }
    lines.push("");
    lines.push(`Average: ${result.average.toFixed(1)}`);
    if (pos) lines.push(`Position: ${ordinal(pos)} of ${ranking.size ?? students.filter((x) => x.classId === student.classId).length}`);
    if (result.bestSix) lines.push(`Best Six aggregate: ${result.bestSix.aggregate}`);
  }
  lines.push("");
  if (student.conduct) lines.push(`Conduct: ${student.conduct}`);
  const remark = student.remark?.trim() || (kg ? "" : teacherRemarkFor(result.average));
  if (remark) lines.push(`Teacher's remark: ${remark}`);
  if (student.headRemark) lines.push(`Headteacher's remark: ${student.headRemark}`);
  if (school.reopeningDate) lines.push(`Reopening date: ${school.reopeningDate}`);
  return lines.join("\n");
}

export function whatsAppLink(student: Student, students: Student[], school: School): string | null {
  const phone = normalizeGhanaPhone(student.parentPhone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppSummary(student, students, school))}`;
}
