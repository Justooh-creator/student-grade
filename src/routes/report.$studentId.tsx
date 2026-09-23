import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  EXAM_MAX,
  SBA_MAX,
  getClassLevel,
  nextClassName,
  ordinal,
  teacherRemarkFor,
} from "@/lib/ges";
import { classRanking, computeStudentResult } from "@/lib/results";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/report/$studentId")({
  head: () => ({
    meta: [
      { title: "Report Card — SBA Report Cards" },
      {
        name: "description",
        content: "Printable A4 GES terminal report card showing SBA, exam, totals, grades and position.",
      },
      { property: "og:title", content: "Report Card — SBA Report Cards" },
      {
        property: "og:description",
        content: "A4 GES terminal report card with SBA 30, exam 70, totals and grades 1 to 9.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { studentId } = Route.useParams();
  const { school, students, updateStudent } = useAppData();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const student = students.find((s) => s.id === studentId) ?? null;
  const level = student ? getClassLevel(student.classId) : null;
  const result = useMemo(() => (student ? computeStudentResult(student) : null), [student]);
  const ranking = useMemo(
    () => (student ? classRanking(students, student.classId) : null),
    [students, student],
  );

  if (!mounted) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Loading report card…</div>;
  }

  if (!student || !level || !result || !ranking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground">This learner could not be found.</p>
        <Link to="/" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Back to score entry
        </Link>
      </div>
    );
  }

  const position = ranking.positions.get(student.id) ?? 1;
  const remark = teacherRemarkFor(result.average);

  return (
    <div className="min-h-screen bg-background pb-6">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <div className="no-print mx-auto my-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          ← Back to score entry
        </Link>
        <div className="flex items-center gap-2">
          <input
            value={student.interest}
            onChange={(e) => updateStudent(student.id, { interest: e.target.value })}
            placeholder="Interest / hobby"
            className="h-10 w-48 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => window.print()}
            className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Print / Save as PDF (A4)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-10">
        <div className="print-sheet sheet-a4 mx-auto border border-rule px-[14mm] py-[12mm] text-[#1b1a16] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)]">
          <div className="border-b-2 border-[#1b1a16] pb-2 text-center">
            <h1 className="font-display text-[18pt] font-bold uppercase tracking-[0.08em]">
              {school.name || "School Name"}
            </h1>
            <p className="text-[9pt]">{school.address || "School address"}</p>
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
                <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">
                  SBA ({SBA_MAX})
                </th>
                <th className="border border-[#1b1a16] px-1 py-1 text-center font-semibold">
                  Exam ({EXAM_MAX})
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
                  <td className="num border border-rule px-1 py-[3px] text-center">{row.sba ?? "—"}</td>
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
                <td className="num border border-rule px-1 py-1 text-center">
                  {result.subjects.reduce((sum, r) => sum + (r.sba ?? 0), 0)}
                </td>
                <td className="num border border-rule px-1 py-1 text-center">
                  {result.subjects.reduce((sum, r) => sum + (r.exam ?? 0), 0)}
                </td>
                <td className="num border border-rule px-1 py-1 text-center">{result.totalMarks}</td>
                <td className="num border border-rule px-1 py-1 text-center">{result.aggregate}</td>
                <td className="num border border-rule px-2 py-1">
                  Average {result.average.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>

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
            Grading: 1 (80–100) highest · 9 (0–39) lowest · SBA 30 + Exam 70 = 100
          </p>
        </div>
      </div>
    </div>
  );
}
