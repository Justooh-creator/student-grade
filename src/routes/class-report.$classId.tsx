import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ReportSheet } from "@/components/ReportSheet";
import { PrintButton } from "@/components/PaymentGate";
import { ClassTransfer } from "@/components/ClassTransfer";
import { ClassWhatsAppShare } from "@/components/ClassWhatsAppShare";
import { getClassLevel, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/class-report/$classId")({
  head: () => ({
    meta: [
      { title: "Class Report Cards — SBA Report Cards" },
      { name: "description", content: "Print or save every learner's A4 report card in a class at once." },
      { property: "og:title", content: "Class Report Cards — SBA Report Cards" },
      { property: "og:description", content: "All A4 GES report cards for one class in a single PDF." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClassReportPage,
});

function ClassReportPage() {
  const { classId } = Route.useParams();
  const { school, students } = useAppData();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const level = getClassLevel(classId as ClassId);
  const list = students.filter((s) => s.classId === classId);

  if (!mounted) return <div className="p-10 text-center text-sm text-muted-foreground">Loading report cards…</div>;

  return (
    <div className="min-h-screen bg-background pb-6">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId as ClassId} />
      <div className="no-print mx-auto my-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4">
        <Link to="/" search={{ class: classId as ClassId }} className="text-sm font-semibold text-primary hover:underline">
          ← Back to score entry
        </Link>
        <p className="text-sm font-semibold">{level?.name} · {list.length} report card(s)</p>
        <div className="flex flex-wrap items-center gap-2">
          <ClassWhatsAppShare classId={classId} className={level.name} />
          <ClassTransfer classId={classId} className={level.name} />
          {list.length > 0 && <PrintButton />}
        </div>
      </div>
      <div className="overflow-x-auto px-4 pb-10">
        {list.length === 0 && <p className="text-center text-sm text-muted-foreground">No learners in this class yet.</p>}
        {list.map((s) => (
          <ReportSheet key={s.id} student={s} students={students} school={school} />
        ))}
      </div>
    </div>
  );
}
