import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker } from "@/components/ClassPicker";
import { PrintButton } from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/store";
import { validateClassSearch } from "@/lib/classSearch";
import { getClassLevel, isKg, isJhs } from "@/lib/ges";
import { buildBroadsheet } from "@/lib/broadsheet";

export const Route = createFileRoute("/_authenticated/broadsheet")({
  validateSearch: validateClassSearch,
  head: () => ({ meta: [
    { title: "Class Broadsheet — EduReport Ghana" },
    { name: "description", content: "Class and stream master score sheets with SBA, exam marks, grades and positions." },
    { property: "og:title", content: "Class Broadsheet — EduReport Ghana" },
    { property: "og:description", content: "Private class master score sheets for Ghanaian basic schools." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: BroadsheetPage,
});

const mark = (n: number | null | undefined) => n == null ? "—" : Number(n.toFixed(1));

function BroadsheetPage() {
  const { school, students } = useAppData();
  const classId = Route.useSearch().class ?? "b4";
  const navigate = useNavigate();
  const level = getClassLevel(classId);
  const kg = isKg(classId);
  const jhs = isJhs(classId);
  const rows = buildBroadsheet(students, classId);
  const groups = kg ? [level.subjects] : Array.from({ length: Math.ceil(level.subjects.length / 3) }, (_, i) => level.subjects.slice(i * 3, i * 3 + 3));
  const fields = ["Raw SBA /100", "SBA /50", "Raw Exam /100", "Exam /50", "Total /100", "Grade"];

  return <div className="min-h-screen bg-background pb-8">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
    <main className="mx-auto max-w-7xl px-4">
      <div className="no-print"><ClassPicker value={classId} onChange={(c) => navigate({ to: "/broadsheet", search: { class: c } })} />
        <div className="my-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-bold">{level.name} · Class Broadsheet</h1><div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/class-report/$classId" params={{ classId }}>Report cards</Link></Button>{rows.length > 0 && <PrintButton label="Print / Save broadsheet as PDF (landscape)" />}</div></div>
      </div>
      {!rows.length ? <p className="py-10 text-center text-muted-foreground">No learners in {level.name} yet.</p> : <div className="broadsheet-pages space-y-6 overflow-x-auto">{groups.map((subjects, index) => <section className="broadsheet-page bg-paper text-foreground" key={index}>
        <div className="mb-2 flex items-end justify-between gap-4"><div><h2 className="font-display text-base font-bold">{school.name || "EduReport Ghana"}</h2><p className="text-xs">{level.name} · {school.academicYear} · {school.term} · {rows.length} learners</p></div><p className="text-xs">Master Score Sheet · {index + 1} / {groups.length}</p></div>
        <table className="broadsheet-table"><thead><tr><th rowSpan={kg ? 1 : 2}>No.</th><th rowSpan={kg ? 1 : 2} className="learner-name">Learner / Admission no.</th>{subjects.map((subject) => <th key={subject} colSpan={kg ? 1 : 6}>{subject}</th>)}{!kg && <><th rowSpan={2}>Total</th><th rowSpan={2}>Average</th><th rowSpan={2}>Position</th>{jhs && <th rowSpan={2}>Best Six</th>}</>}</tr>{!kg && <tr>{subjects.flatMap((subject) => fields.map((field) => <th key={subject + field}>{field}</th>))}</tr>}</thead>
          <tbody>{rows.map(({ student, result, position }, i) => <tr key={student.id}><td>{i + 1}</td><th className="learner-name">{student.name}{student.admissionNo && <span className="block font-normal">{student.admissionNo}</span>}</th>{subjects.flatMap((subject) => {
            const r = result.subjects.find((s) => s.subject === subject);
            if (kg) return [<td key={subject}>{r?.level ?? "—"}</td>];
            return [r?.sbaRaw, r?.sba, r?.examRaw, r?.exam, r?.total, r?.grade].map((v, n) => <td key={subject + n}>{mark(v)}</td>);
          })}{!kg && <><td>{result.gradedCount ? mark(result.totalMarks) : "—"}</td><td>{result.gradedCount ? mark(result.average) : "—"}</td><td>{position ?? "—"}</td>{jhs && <td>{result.bestSix?.subjects.length === 6 ? result.bestSix.aggregate : "—"}</td>}</>}</tr>)}</tbody>
        </table>
        {kg && <p className="mt-2 text-xs">Gold · Silver · Bronze</p>}
        <div className="mt-3 flex justify-between text-xs"><span>Class teacher: {school.classTeachers?.[classId] || "________________"}</span><span>Headteacher: {school.headTeacher || "________________"}</span></div>
      </section>)}</div>}
    </main>
  </div>;
}