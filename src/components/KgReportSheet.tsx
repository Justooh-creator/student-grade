import { Fragment } from "react";
import { getClassLevel, nextClassName } from "@/lib/ges";
import { KG_RATINGS, kgProgress } from "@/lib/kgMilestones";
import { ageLabel, formatDob } from "@/lib/age";
import { filledFeeLines } from "@/lib/reportLayout";
import type { School, Student } from "@/lib/store";

/** KG 1–2 "Kindergarten Learners Progress Report": term checklist rated VG / G / NI / NSA on one A4 page. */
export function KgReportSheet({ student, school, watermark = false }: { student: Student; school: School; watermark?: boolean }) {
  const level = getClassLevel(student.classId);
  const progress = kgProgress(student, school.term);
  const feeLines = filledFeeLines(student.fees);
  const compact = feeLines.length > 0;
  // KG sheets carry up to 21 checklist rows, so spacing stays tight enough that the signatures always
  // fit on one printed page (A4, and Letter on phones that default to it).
  const gap = compact ? "mt-1.5" : "mt-2";
  const remarkGap = "space-y-0.5";
  const rowPad = compact || progress.rows.length > 20 ? "py-[0.5mm]" : "py-[0.8mm]";
  const termWord = ({ 1: "One", 2: "Two", 3: "Three" } as const)[(Number(/[123]/.exec(school.term)?.[0]) || 1) as 1 | 2 | 3];
  const promotion = school.term === "Term 3"
    ? student.promotion === "promoted" ? nextClassName(student.classId) : student.promotion === "retained" ? `Retained in ${level.name}` : "To be decided"
    : "—";
  const field = (label: string, value: string, bold = true) => (
    <p className="min-w-0"><span className="font-bold">{label}: </span><span className={bold ? "font-bold" : ""}>{value || "—"}</span></p>
  );
  return (
    <div style={{ breakAfter: "page", pageBreakAfter: "always" }} className="print-sheet sheet-a4 relative mx-auto mb-6 flex flex-col overflow-hidden border border-rule px-[11mm] py-[7mm] text-[#1b1a16] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
      {watermark && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="-rotate-[35deg] whitespace-nowrap border-4 border-destructive/30 px-6 py-2 text-[20pt] font-black tracking-wider text-destructive/30">UNOFFICIAL PREVIEW • LICENSE REQUIRED TO PRINT</span>
        </div>
      )}
      <div className="relative border-b-2 border-[#1b1a16] pb-2 text-center">
        {school.logo && <img src={school.logo} alt="School logo" className="absolute left-0 top-0 h-[19mm] w-[19mm] object-contain" />}
        <div className="absolute right-0 top-0 flex h-[24mm] w-[20mm] items-center justify-center overflow-hidden border border-[#1b1a16]">
          {student.photo ? <img src={student.photo} alt="Learner passport" className="h-full w-full object-cover" /> : <span className="px-1 text-[7pt] font-bold uppercase leading-tight text-[#1b1a16]/45">Affix passport photo</span>}
        </div>
        <div className="mx-[24mm] min-h-[24mm]">
          <h1 className="font-display text-[17pt] font-bold uppercase tracking-[0.06em]">{school.name || "School Name"}</h1>
          {school.motto?.trim() && <p className="text-[9pt] font-bold italic">“{school.motto.trim()}”</p>}
          <p className="text-[9pt] font-bold">{school.address || "School address"}</p>
          {school.contactPhone?.trim() && <p className="num text-[9pt] font-bold">School contact: {school.contactPhone.trim()}</p>}
          {(school.district || school.region) && <p className="text-[9pt] font-bold">{[school.district && `${school.district} District`, school.region && `${school.region} Region`].filter(Boolean).join(" · ")}</p>}
          <p className="mt-1 text-[11pt] font-bold uppercase tracking-[0.08em]">Kindergarten Learners Progress Report</p>
        </div>
      </div>

      <div className={`${gap} grid grid-cols-2 gap-x-6 gap-y-0.5 text-[9.5pt]`}>
        {field("Learner name", student.name)}
        {field("Term", `${termWord} · ${school.academicYear}`)}
        {field("Class", level.name)}
        {field("Sex", student.gender ?? "")}
        {field("Date of birth", formatDob(student.dob))}
        {field("Age", ageLabel(student.dob))}
        {field("Vacation date", school.vacationDate ?? "")}
        {field("Next term begins", school.reopeningDate)}
      </div>

      <div className={`${gap} flex flex-wrap gap-x-4 text-[8.5pt]`}>
        <span className="font-bold">Rating scale:</span>
        {KG_RATINGS.map((r) => <span key={r.code}><b>{r.code}</b> – {r.label}</span>)}
      </div>

      <table className={`${gap} w-full border-collapse text-[8.5pt]`}>
        <thead>
          <tr className="bg-[#1b1a16] text-white">
            <th className="border border-[#1b1a16] px-2 py-1 text-left font-bold">Assessment</th>
            {KG_RATINGS.map((r) => <th key={r.code} className="w-[11mm] border border-[#1b1a16] px-1 py-1 text-center font-bold">{r.code}</th>)}
          </tr>
        </thead>
        <tbody>
          {progress.rows.map((row) => (
            <tr key={row.key}>
              <td className={`border border-rule px-2 ${rowPad} leading-tight`}><span className="num font-bold">{row.n}.</span> {row.text}</td>
              {KG_RATINGS.map((r) => <td key={r.code} className={`border border-rule text-center ${rowPad} text-[9pt] font-bold leading-none`}>{row.rating === r.code ? "✓" : ""}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`${gap} ${remarkGap} text-[9pt]`}>
        <div className="grid grid-cols-2 gap-x-6">
          <p><span className="font-bold">Attendance: </span><span className="num">{student.attendance || "—"}</span> <span className="font-bold">out of </span><span className="num">{school.totalAttendance || "—"}</span></p>
          <p><span className="font-bold">Promoted to: </span><span className="font-bold">{promotion}</span></p>
        </div>
        <p><span className="font-bold">Conduct: </span>{student.conduct || "—"}</p>
        <p><span className="font-bold">Interest: </span>{student.interest || "—"}</p>
        <p><span className="font-bold">Facilitator's remarks: </span>{student.remark?.trim() || "—"}</p>
        {student.headRemark?.trim() && <p><span className="font-bold">Headteacher's remarks: </span>{student.headRemark.trim()}</p>}
      </div>

      {feeLines.length > 0 && (() => {
        const total = feeLines.reduce<number>((a, p) => a + (p.n ?? 0), 0);
        const cell = (label: string, value: string) => (
          <div className="border border-rule px-2 py-0.5">
            <p className="text-[7.5pt] font-bold uppercase tracking-[0.1em]">{label}</p>
            <p className="num font-bold">GH₵ {value.trim()}</p>
          </div>
        );
        return (
          <div className={`${gap} border border-[#1b1a16] text-[8.5pt]`}>
            <p className="border-b border-[#1b1a16] bg-[#1b1a16] px-2 py-1 text-[8pt] font-bold uppercase tracking-[0.14em] text-white">Fees / Accounts</p>
            <div className="grid grid-cols-4">
              {feeLines.map((p, i) => <Fragment key={i}>{cell(p.label, p.value)}</Fragment>)}
              {cell("Total", total.toFixed(2).replace(/\.00$/, ""))}
            </div>
          </div>
        );
      })()}

      <div className="mt-auto flex shrink-0 items-end justify-between gap-4 pt-2 text-[8.5pt]">
        <div className="w-[60mm]">
          <div className="flex h-[12mm] items-end justify-center">
            {school.classTeacherSignatures?.[student.classId] && <img src={school.classTeacherSignatures[student.classId]} alt="Facilitator signature" className="max-h-[12mm] max-w-[55mm] object-contain" />}
          </div>
          <div className="border-t border-[#1b1a16] pt-1 font-bold">Facilitator — {school.classTeachers?.[student.classId]?.trim() || school.classTeacher || "—"}</div>
        </div>
        <div className="flex flex-1 items-end justify-center">
          {school.stamp && <img src={school.stamp} alt="School stamp" className="max-h-[16mm] max-w-[34mm] object-contain" />}
        </div>
        <div className="w-[60mm] text-center">
          <div className="flex h-[12mm] items-end justify-center">
            {school.signature && <img src={school.signature} alt="Head teacher signature" className="max-h-[12mm] max-w-[55mm] object-contain" />}
          </div>
          <div className="border-t border-[#1b1a16] pt-1 font-bold">Head Teacher{school.headTeacher ? ` — ${school.headTeacher}` : ""}</div>
        </div>
      </div>
    </div>
  );
}
