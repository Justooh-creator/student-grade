import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker } from "@/components/ClassPicker";
import { PrintButton } from "@/components/PaymentGate";
import { CertificateSheet, type CertData } from "@/components/CertificateSheet";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useLicense } from "@/lib/license";
import { getClassLevel, type ClassId } from "@/lib/ges";
import { AWARD_PRESETS, CERT_THEMES, POSITION_AWARD, defaultCitation, topLearners, type CertTheme } from "@/lib/certificates";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [
    { title: "Awards & Certificates — EduReport Ghana" },
    { name: "description", content: "Design and print A4 landscape award certificates for deserving learners." },
    { property: "og:title", content: "Awards & Certificates — EduReport Ghana" },
    { property: "og:description", content: "Beautiful school award certificates with different font styles." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: CertificatesPage,
});

const input = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function CertificatesPage() {
  const { school, students } = useAppData();
  const { user } = useUser();
  const lic = useLicense(user?.id);
  const [classId, setClassId] = useState<ClassId>("b4");
  const [theme, setTheme] = useState<CertTheme>("royal");
  const [mode, setMode] = useState<"single" | "top3">("single");
  const [studentId, setStudentId] = useState("");
  const [award, setAward] = useState<string>(AWARD_PRESETS[0]);
  const [custom, setCustom] = useState("");
  const [citation, setCitation] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  const className = getClassLevel(classId).name;
  const inClass = students.filter((s) => s.classId === classId);
  const awardTitle = award === "Custom Award" ? custom || "Special Award" : award;

  const occasion = `${school.term} · ${school.academicYear} Academic Year`;
  const certs: CertData[] = mode === "top3"
    ? topLearners(students, classId).map(({ student, position }) => ({
        recipient: "learner" as const, name: student.name, line1: className, award: POSITION_AWARD[position] ?? "", citation: citation || defaultCitation("Position"), date, occasion, leftSigner: "Class Teacher" }))
    : [{ recipient: "learner" as const, name: inClass.find((s) => s.id === studentId)?.name ?? "", line1: className, award: awardTitle, citation: citation || defaultCitation(awardTitle), date, occasion, leftSigner: "Class Teacher" }];

  return <div className="min-h-screen bg-background pb-8">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
    <main className="mx-auto max-w-5xl px-4">
      <div className="no-print space-y-3 py-4">
        <h1 className="font-display text-2xl font-bold">🏅 Awards & Certificates</h1>
        <ClassPicker value={classId} onChange={(c) => { setClassId(c); setStudentId(""); }} />
        <div className="flex gap-2">
          <button onClick={() => setMode("single")} className={`h-9 rounded-md px-3 text-sm font-semibold ${mode === "single" ? "bg-primary text-primary-foreground" : "border border-border"}`}>One learner</button>
          <button onClick={() => setMode("top3")} className={`h-9 rounded-md px-3 text-sm font-semibold ${mode === "top3" ? "bg-primary text-primary-foreground" : "border border-border"}`}>Top 3 in class (auto)</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {mode === "single" && <>
            <label className="text-sm font-semibold">Learner
              <select className={input} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Choose learner…</option>
                {inClass.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></label>
            <label className="text-sm font-semibold">Award
              <select className={input} value={award} onChange={(e) => setAward(e.target.value)}>
                {AWARD_PRESETS.map((a) => <option key={a}>{a}</option>)}
              </select></label>
            {award === "Custom Award" && <label className="text-sm font-semibold">Award title
              <input className={input} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Best Reader" /></label>}
          </>}
          <label className="text-sm font-semibold">Font style
            <select className={input} value={theme} onChange={(e) => setTheme(e.target.value as CertTheme)}>
              {CERT_THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select></label>
          <label className="text-sm font-semibold">Date
            <input className={input} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-sm font-semibold sm:col-span-2">Citation (optional)
            <input className={input} value={citation} onChange={(e) => setCitation(e.target.value)} placeholder="Leave blank to use the standard wording" /></label>
        </div>
        {mode === "top3" && certs.length === 0 && <p className="text-sm text-muted-foreground">No marks entered for this class yet, so positions can't be worked out.</p>}
        <PrintButton label="Print / Save certificates as PDF" classId={classId} />
      </div>
      <div className="certificate-pages overflow-x-auto">
        {certs.map((c, i) => <CertificateSheet key={i} data={c} school={school} theme={theme} watermark={!lic.loading && !lic.canPrint} />)}
      </div>
    </main>
  </div>;
}
