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
    if (pos) lines.push(`Position: ${ordinal(pos)} of ${ranking.classSize}`);
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

/**
 * Open a wa.me link reliably. In the Android WebView, target="_blank" opens a
 * blank white window, so there we navigate the same tab and let Android hand
 * the link to the WhatsApp app. In normal browsers we open a new tab.
 */
export function openWhatsApp(href: string) {
  const ua = navigator.userAgent || "";
  const isAndroidWebView = /Android/.test(ua) && (/; wv\)/.test(ua) || typeof (window as unknown as { AndroidBridge?: unknown }).AndroidBridge !== "undefined");
  if (isAndroidWebView) {
    window.location.href = href;
  } else {
    window.open(href, "_blank", "noopener,noreferrer");
  }
}

/** Mid-term progress check-in (free for everyone). Shows only marks entered so far. */
export function buildMidtermSummary(student: Student, school: School, note?: string): string {
  const level = getClassLevel(student.classId);
  const kg = isKg(student.classId);
  const lines: string[] = [];
  lines.push(`*${school.name || "School"}* — Mid-Term Progress Update`);
  lines.push(`${school.term} · ${school.academicYear}`);
  lines.push("");
  lines.push(`Dear Parent/Guardian, here is *${student.name}*'s progress so far in ${level.name}.`);
  if (student.attendance) lines.push(`Attendance so far: ${student.attendance}`);
  lines.push("");
  const rows: string[] = [];
  for (const [subject, sc] of Object.entries(student.scores ?? {})) {
    if (kg) {
      if (sc.level) rows.push(`• ${subject}: ${sc.level}`);
      continue;
    }
    const parts: string[] = [];
    if (sc.test1 != null) parts.push(`Test 1 ${sc.test1}/20`);
    if (sc.test2 != null) parts.push(`Test 2 ${sc.test2}/20`);
    if (sc.group != null) parts.push(`Group work ${sc.group}/30`);
    if (sc.project != null) parts.push(`Project ${sc.project}/30`);
    if (parts.length) rows.push(`• ${subject}: ${parts.join(", ")}`);
  }
  if (rows.length) {
    lines.push(kg ? "*Learning areas*" : "*Class assessments so far*");
    lines.push(...rows);
  } else {
    lines.push("Class assessments are still in progress.");
  }
  if (student.conduct) {
    lines.push("");
    lines.push(`Conduct: ${student.conduct}`);
  }
  if (note?.trim()) {
    lines.push("");
    lines.push(note.trim());
  }
  lines.push("");
  lines.push("Thank you for supporting your ward's learning. Please keep encouraging them at home.");
  return lines.join("\n");
}

export function midtermWhatsAppLink(student: Student, school: School, note?: string): string | null {
  const phone = normalizeGhanaPhone(student.parentPhone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildMidtermSummary(student, school, note))}`;
}
