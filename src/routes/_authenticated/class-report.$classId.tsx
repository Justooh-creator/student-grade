import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ReportSheet } from "@/components/ReportSheet";
import { PrintButton } from "@/components/PaymentGate";
import { ClassTransfer } from "@/components/ClassTransfer";
import { ClassWhatsAppShare } from "@/components/ClassWhatsAppShare";
import { getClassLevel, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/auth";
import { useLicense } from "@/lib/license";
import { ScrollJump } from "@/components/ScrollJump";

export const Route = createFileRoute("/_authenticated/class-report/$classId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const { user } = useUser();
  const lic = useLicense(user?.id);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const level = getClassLevel(classId as ClassId);
  const list = students.filter((s) => s.classId === classId);

  if (!mounted) return <div className="p-10 text-center text-sm text-muted-foreground">Loading report cards…</div>;

  return (
    <div className="min-h-screen bg-background pb-6">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId as ClassId} />
      <div className="no-print mx-auto my-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4">
        <Link to="/sba-details" search={{ class: classId as ClassId }} className="text-sm font-semibold text-primary hover:underline">
          ← Back to score entry
        </Link>
        <p className="text-sm font-semibold">{level?.name} · {list.length} report card(s)</p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto [&>*]:shrink-0 max-sm:[&_button]:h-9 max-sm:[&_button]:px-2.5 max-sm:[&_button]:text-xs max-sm:[&_a]:h-9 max-sm:[&_a]:px-2.5 max-sm:[&_a]:text-xs">
          <ClassTransfer classId={classId} className={level.name} />
          <Button asChild variant="outline"><Link to="/broadsheet" search={{ class: classId as ClassId }}>Class Broadsheet</Link></Button>
          {list.length > 0 && <PrintButton classId={classId} reportCards />}
          <ClassWhatsAppShare classId={classId} className={level.name} />
        </div>
      </div>
      <ScrollJump firstId={list[0] && `report-${list[0].id}`} lastId={list.at(-1) && `report-${list.at(-1)!.id}`} />
      <div className="overflow-x-auto px-4 pb-10">
        {list.length === 0 && <p className="text-center text-sm text-muted-foreground">No learners in this class yet.</p>}
        {list.map((s) => (
          <div key={s.id} id={`report-${s.id}`} className="scroll-mt-24"><ReportSheet student={s} students={students} school={school} watermark={!lic.loading && !lic.canPrint} /></div>
        ))}
      </div>
    </div>
  );
}
