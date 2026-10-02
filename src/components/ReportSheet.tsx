import {
  EXAM_MAX, SBA_MAX, getClassLevel, usesCat, nextClassName, ordinal, teacherRemarkFor,
} from "@/lib/ges";
import { classRanking, computeStudentResult } from "@/lib/results";
import type { School, Student } from "@/lib/store";

export function ReportSheet({ student, students, school }: { student: Student; students: Student[]; school: School }) {
  const level = getClassLevel(student.classId);
  const result = computeStudentResult(student);
  const ranking = classRanking(students, student.classId);
  const position = ranking.positions.get(student.id) ?? 1;
  const cat = usesCat(student.classId);
  const remark = student.remark?.trim() || teacherRemarkFor(result.average);
  return (
        <div style={{ breakAfter: "page", pageBreakAfter: "always" }} className="print-sheet sheet-a4 mx-auto mb-6 border border-rule px-[14mm] py-[12mm] text-[#1b1a16] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
          <div className="relative border-b-2 border-[#1b1a16] pb-2 text-center">
            {school.logo && (
              <img src={school.logo} alt="School logo" className="absolute left-0 top-0 h-[22mm] w-[22mm] object-contain" />
            )}
            <h1 className="font-display text-[18pt] font-bold uppercase tracking-[0.08em]">
              {school.name || "School Name"}
            </h1>
            <p className="text-[9pt]">{school.address || "School address"}</p>
            {(school.district || school.region) && (
              <p className="text-[9pt]">
                {[school.district && `${school.district} District`, school.region && `${school.region} Region`].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="num mt-1 text-[9pt] font-semibold uppercase tracking-[0.18em]">
              Terminal Report — {school.term} · {school.academicYear}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[10pt]">
            <p>
              <span className="text-[#1b1a16]/55">Name: </span>
              <span className="font-semibold">{student.name}</span>
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Class: </span>
              <span className="font-semibold">{level.name}</span>
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Admission No.: </span>
              <span className="num">{student.admissionNo || "—"}</span>
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Position in class: </span>
              <span className="num font-semibold">
                {ordinal(position)} of {ranking.classSize}
              </span>
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Attendance: </span>
              <span className="num">
                {student.attendance || "—"} / {school.totalAttendance || "—"} days
              </span>
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Promoted to: </span>
              <span className="font-semibold">{nextClassName(student.classId)}</span>
            </p>
          </div>

          <table className="mt-4 w-full border-collapse text-[9.5pt]">
            <thead>
              <tr className="bg-[#1b1a16] text-white">
                <th className="border border-[#1b1a16] px-2 py-1 text-left font-semibold">Subject</th>
                {cat && <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">SBA Raw (100)</th>}
                <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">
                  SBA ({cat ? 50 : SBA_MAX})
                </th>
                {cat && <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">Exam Raw (100)</th>}
                <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">
                  Exam ({cat ? 50 : EXAM_MAX})
                </th>
                <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">Total (100)</th>
                <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">Grade</th>
                <th className="border border-[#1b1a16] px-2 py-1 text-left font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody>
              {result.subjects.map((row) => (
                <tr key={row.subject}>
                  <td className="border border-rule px-2 py-[3px]">{row.subject}</td>
                  {cat && <td className="num border border-rule px-1 py-[3px] text-center">{row.sbaRaw ?? "—"}</td>}
                  <td className="num border border-rule px-1 py-[3px] text-center">{row.sba ?? "—"}</td>
                  {cat && <td className="num border border-rule px-1 py-[3px] text-center">{row.examRaw ?? "—"}</td>}
                  <td className="num border border-rule px-1 py-[3px] text-center">{row.exam ?? "—"}</td>
                  <td className="num border border-rule px-1 py-[3px] text-center font-semibold">
                    {row.total ?? "—"}
                  </td>
                  <td className="num border border-rule px-1 py-[3px] text-center font-semibold">
                    {row.grade ?? "—"}
                  </td>
                  <td className="border border-rule px-2 py-[3px]">{row.remark}</td>
                </tr>
              ))}
              <tr className="bg-[#1b1a16]/[0.06] font-semibold">
                <td className="border border-rule px-2 py-1">Total / Aggregate</td>
                {cat && <td className="border border-rule" />}
                <td className="num border border-rule px-1 py-1 text-center">
                  {Math.round(result.subjects.reduce((sum, r) => sum + (r.sba ?? 0), 0) * 10) / 10}
                </td>
                {cat && <td className="border border-rule" />}
                <td className="num border border-rule px-1 py-1 text-center">
                  {Math.round(result.subjects.reduce((sum, r) => sum + (r.exam ?? 0), 0) * 10) / 10}
                </td>
                <td className="num border border-rule px-1 py-1 text-center">{result.totalMarks}</td>
                <td className="num border border-rule px-1 py-1 text-center">{result.aggregate}</td>
                <td className="num border border-rule px-2 py-1">
                  Average {result.average.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>

          {result.bestSix && (
            <div className="mt-3 border border-[#1b1a16] px-2 py-1.5 text-[9pt]">
              <p className="font-bold uppercase tracking-[0.12em]">
                Best Six aggregate: <span className="num">{result.bestSix.subjects.length === 6 ? result.bestSix.aggregate : "—"}</span>
              </p>
              <p className="mt-0.5">
                {result.bestSix.subjects.map((b) => `${b.subject} (${b.grade})`).join(" · ") || "—"}
              </p>
              <p className="mt-0.5 text-[7.5pt] text-[#1b1a16]/55">School-computed aggregate: English, Mathematics, better of Science/Social Studies + 3 best other subjects.</p>
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2 text-[9pt]">
            <div className="border border-rule px-2 py-1.5 text-center">
              <p className="text-[7.5pt] uppercase tracking-[0.12em] text-[#1b1a16]/55">Subjects marked</p>
              <p className="num text-[12pt] font-semibold">{result.gradedCount}</p>
            </div>
            <div className="border border-rule px-2 py-1.5 text-center">
              <p className="text-[7.5pt] uppercase tracking-[0.12em] text-[#1b1a16]/55">Class average</p>
              <p className="num text-[12pt] font-semibold">{ranking.classAverage.toFixed(1)}</p>
            </div>
            <div className="border border-rule px-2 py-1.5 text-center">
              <p className="text-[7.5pt] uppercase tracking-[0.12em] text-[#1b1a16]/55">Learner average</p>
              <p className="num text-[12pt] font-semibold">{result.average.toFixed(1)}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-[9.5pt]">
            <p>
              <span className="text-[#1b1a16]/55">Attitude / Conduct: </span>
              {student.conduct || "—"}
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Interest: </span>
              {student.interest || "—"}
            </p>
            <p>
              <span className="text-[#1b1a16]/55">Class teacher's remark: </span>
              {remark}
            </p>
            <p>
              <span className="text-[#1b1a16]/55">School reopens: </span>
              {school.reopeningDate || "—"}
            </p>
          </div>

          <div className="mt-8 flex items-end justify-between text-[8.5pt]">
            <div className="w-[60mm] border-t border-[#1b1a16] pt-1 text-center">
              Class Teacher{school.classTeacher ? ` — ${school.classTeacher}` : ""}
            </div>
            <div className="w-[60mm] border-t border-[#1b1a16] pt-1 text-center">
              Head Teacher{school.headTeacher ? ` — ${school.headTeacher}` : ""}
            </div>
          </div>

          <p className="num mt-4 text-center text-[7.5pt] uppercase tracking-[0.16em] text-[#1b1a16]/45">
            Grading: 1 (80–100) highest · 9 (0–39) lowest · {cat ? "SBA 50 + Exam 50 = 100" : "SBA 30 + Exam 70 = 100"}
          </p>
        </div>
  );
}
