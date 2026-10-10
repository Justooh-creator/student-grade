import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import {
  getClassLevel,
  nextClassName,
  ordinal,
  teacherRemarkFor,
} from "@/lib/ges";
import { classRanking, computeStudentResult } from "@/lib/results";
import { useAppData } from "@/lib/store";
import { ReportSheet } from "@/components/ReportSheet";
import { openWhatsApp, whatsAppLink } from "@/lib/whatsapp";

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
        content: "A4 GES terminal report card with KG performance levels and Basic 1–9 SBA, exam, totals and grades.",
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
  const wa = whatsAppLink(student, students, school);
  const remark = student.remark?.trim() || teacherRemarkFor(result.average);

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
          {wa ? <a href={wa} onClick={(e) => { e.preventDefault(); openWhatsApp(wa); }} className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-primary">Send via WhatsApp</a> : <span className="text-xs text-muted-foreground">Add parent phone in Student Details to send via WhatsApp</span>}
          <Link to="/class-report/$classId" params={{ classId: student.classId }} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Print whole class</Link>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-10">
        <ReportSheet student={student} students={students} school={school} />
      </div>
    </div>
  );
}
