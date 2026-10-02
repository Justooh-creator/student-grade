import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker } from "@/components/ClassPicker";
import { CAT_PARTS, EXAM_MAX, GRADE_BANDS, SBA_MAX, getClassLevel, ordinal, usesCat } from "@/lib/ges";
import { classRanking, computeStudentResult } from "@/lib/results";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/")({
  validateSearch: validateClassSearch,
  head: () => ({
    meta: [
      { title: "SBA Details — GES Score Entry" },
      { name: "description", content: "Enter SBA (30) and exam (70) marks for KG 1 to Basic 9 using GES curriculum subjects." },
      { property: "og:title", content: "SBA Details — GES Score Entry" },
      { property: "og:description", content: "GES subjects roll out automatically by class. Grades 1 to 9, printable A4 report cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { school, students, setScore, setRawScore, setCatScore } = useAppData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const classId = search.class ?? "b4";
  const level = getClassLevel(classId);
  const cat = usesCat(classId);
  const classStudents = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const ranking = useMemo(() => classRanking(students, classId), [students, classId]);
  const selected = classStudents.find((s) => s.id === search.student) ?? classStudents[0] ?? null;
  const result = selected ? computeStudentResult(selected) : null;
  const idx = selected ? classStudents.indexOf(selected) : -1;
  const go = (id: string) => navigate({ to: "/", search: { class: classId, student: id } });

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
      <main className="mx-auto max-w-5xl px-4">
        {!school.name && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
            <p className="text-sm">Add your school name, term and signatories so they print on every report card.</p>
            <Link to="/setup" search={{ class: classId }} className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90">Open School Details</Link>
          </div>
        )}
        <ClassPicker value={classId} onChange={(c) => navigate({ to: "/", search: { class: c } })} />

        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          {classStudents.length === 0 || !selected || !result ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No learners in {level.name} yet.</p>
              <Link to="/students" search={{ class: classId }} className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add learners in Student Details</Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="block min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Select learner</span>
                  <div className="mt-1 flex gap-1.5">
                    <button disabled={idx <= 0} onClick={() => go(classStudents[idx - 1]!.id)} aria-label="Previous learner" className="h-10 w-10 rounded-md border border-border disabled:opacity-40">‹</button>
                    <select
                      value={selected.id}
                      onChange={(e) => go(e.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm font-semibold outline-none focus:border-primary"
                    >
                      {classStudents.map((s, i) => (
                        <option key={s.id} value={s.id}>{i + 1}. {s.name}{s.admissionNo ? ` (${s.admissionNo})` : ""}</option>
                      ))}
                    </select>
                    <button disabled={idx >= classStudents.length - 1} onClick={() => go(classStudents[idx + 1]!.id)} aria-label="Next learner" className="h-10 w-10 rounded-md border border-border disabled:opacity-40">›</button>
                  </div>
                </label>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Average</p>
                    <p className="num text-lg font-semibold text-primary">{result.average.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Position</p>
                    <p className="num text-lg font-semibold text-accent">{result.gradedCount ? ordinal(ranking.positions.get(selected.id) ?? 1) : "—"}</p>
                  </div>
                </div>
              </div>

              {cat ? (
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="bg-muted/60 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-3 py-2 text-left font-bold">Subject</th>
                      {CAT_PARTS.map((p) => (<th key={p.key} className="px-1 py-2 text-center font-bold">{p.short} /{p.max}</th>))}
                      <th className="px-1 py-2 text-center font-bold">SBA raw /100</th>
                      <th className="px-1 py-2 text-center font-bold">SBA /50</th>
                      <th className="px-1 py-2 text-center font-bold">Exam raw /100</th>
                      <th className="px-1 py-2 text-center font-bold">Exam /50</th>
                      <th className="px-1 py-2 text-center font-bold">Total /100</th>
                      <th className="px-1 py-2 text-center font-bold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjects.map((row) => {
                      const e = selected.scores[row.subject];
                      return (
                      <tr key={row.subject} className="border-t border-border">
                        <td className="px-3 py-1.5 font-medium">{row.subject}</td>
                        {CAT_PARTS.map((p) => (
                          <td key={p.key} className="px-1 py-1.5 text-center"><ScoreInput max={p.max} value={e?.[p.key] ?? null} onChange={(v) => setCatScore(selected.id, row.subject, p.key, v)} /></td>
                        ))}
                        <td className="num px-1 py-1.5 text-center text-muted-foreground">{row.sbaRaw ?? "—"}</td>
                        <td className="num px-1 py-1.5 text-center">{row.sba ?? "—"}</td>
                        <td className="px-1 py-1.5 text-center"><ScoreInput max={100} value={e?.examRaw ?? null} onChange={(v) => setCatScore(selected.id, row.subject, "examRaw", v)} /></td>
                        <td className="num px-1 py-1.5 text-center">{row.exam ?? "—"}</td>
                        <td className="num px-1 py-1.5 text-center font-semibold">{row.total ?? "—"}</td>
                        <td className="px-2 py-1.5 text-center">
                          {row.grade ? (
                            <span className={row.grade <= 3 ? "num inline-block min-w-6 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground" : row.grade <= 6 ? "num inline-block min-w-6 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground" : "num inline-block min-w-6 rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground"}>{row.grade}</span>
                          ) : (<span className="text-muted-foreground">—</span>)}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-primary/5 text-sm font-semibold">
                      <td className="px-3 py-2" colSpan={9}>Total marks{result.bestSix ? <> · Best Six aggregate <span className="num text-accent">{result.bestSix.subjects.length === 6 ? result.bestSix.aggregate : "—"}</span></> : null}</td>
                      <td className="num px-1 py-2 text-center">{result.totalMarks}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              ) : (
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-muted/60 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <th className="px-3 py-2 text-left font-semibold">Subject</th>
                      <th className="px-2 py-2 text-center font-semibold">SBA /{SBA_MAX}</th>
                      <th className="px-2 py-2 text-center font-semibold">Exam raw /100</th>
                      <th className="px-2 py-2 text-center font-semibold">Exam {EXAM_MAX}%</th>
                      <th className="px-2 py-2 text-center font-semibold">Total /100</th>
                      <th className="px-2 py-2 text-center font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subjects.map((row) => (
                      <tr key={row.subject} className="border-t border-border">
                        <td className="px-3 py-1.5 font-medium">{row.subject}</td>
                        <td className="px-2 py-1.5 text-center"><ScoreInput max={SBA_MAX} value={row.sba} onChange={(v) => setScore(selected.id, row.subject, "sba", v)} /></td>
                        <td className="px-2 py-1.5 text-center"><ScoreInput max={100} value={selected.scores[row.subject]?.examRaw ?? null} onChange={(v) => setRawScore(selected.id, row.subject, "exam", v)} /></td>
                        <td className="num px-2 py-1.5 text-center text-muted-foreground">{row.exam ?? "—"}</td>
                        <td className="num px-2 py-1.5 text-center font-semibold">{row.total ?? "—"}</td>
                        <td className="px-2 py-1.5 text-center">
                          {row.grade ? (
                            <span className={row.grade <= 3 ? "num inline-block min-w-6 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground" : row.grade <= 6 ? "num inline-block min-w-6 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground" : "num inline-block min-w-6 rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground"}>{row.grade}</span>
                          ) : (<span className="text-muted-foreground">—</span>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-primary/5 text-sm font-semibold">
                      <td className="px-3 py-2">Total marks · aggregate <span className="num text-accent">{result.aggregate}</span></td>
                      <td colSpan={3} />
                      <td className="num px-2 py-2 text-center">{result.totalMarks}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link to="/students" search={{ class: classId }} className="flex h-11 items-center justify-center rounded-md border border-border text-sm font-semibold hover:bg-muted">Edit student details</Link>
                <Link to="/class-report/$classId" params={{ classId }} className="flex h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90">View {level.name} report cards</Link>
              </div>
            </>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">GES grading system</h2>
          <p className="mt-1 text-xs text-muted-foreground">Grade 1 is the highest, grade 9 the lowest.</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9">
            {GRADE_BANDS.map((b) => (
              <div key={b.grade} className="rounded-md border border-border px-2 py-2 text-center">
                <p className="num text-base font-semibold text-primary">{b.grade}</p>
                <p className="num text-[10px] text-muted-foreground">{b.min}–{b.max}</p>
                <p className="mt-0.5 text-[10px] leading-tight">{b.remark}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ScoreInput({
  value,
  max,
  onChange,
}: {
  value: number | null;
  max: number;
  onChange: (v: number | null) => void;
}) {
  const [invalid, setInvalid] = useState(false);
  return (
    <input
      inputMode="numeric"
      value={value === null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        if (raw === "") {
          setInvalid(false);
          return onChange(null);
        }
        const n = Number(raw);
        if (n > max) {
          setInvalid(true);
          return onChange(null);
        }
        setInvalid(false);
        onChange(n);
      }}
      aria-invalid={invalid}
      title={invalid ? `Maximum is ${max}` : undefined}
      className={`num h-9 w-16 rounded-md border bg-background text-center text-sm outline-none focus:ring-2 ${invalid ? "border-2 border-destructive focus:border-destructive focus:ring-destructive/30" : "border-border focus:border-primary focus:ring-primary/20"}`}
      placeholder={invalid ? `≤${max}` : "—"}
    />
  );
}
