import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CLASS_LEVELS, EXAM_MAX, GRADE_BANDS, SBA_MAX, getClassLevel, type ClassId } from "@/lib/ges";
import { classRanking, computeStudentResult } from "@/lib/results";
import { useAppData } from "@/lib/store";
import { ordinal } from "@/lib/ges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SBA Report Cards — GES Score Entry" },
      {
        name: "description",
        content:
          "Enter SBA (30) and exam (70) marks for KG 1 to Basic 9 using GES curriculum subjects and print A4 report cards.",
      },
      { property: "og:title", content: "SBA Report Cards — GES Score Entry" },
      {
        property: "og:description",
        content: "GES subjects roll out automatically by class. Grades 1 to 9, printable A4 report cards.",
      },
    ],
  }),
  component: Index,
});

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Index() {
  const { school, students, setSchool, addStudent, updateStudent, removeStudent, setScore } = useAppData();
  const [classId, setClassId] = useState<ClassId>("b4");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newAdmission, setNewAdmission] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  const level = getClassLevel(classId);
  const classStudents = useMemo(
    () => students.filter((s) => s.classId === classId),
    [students, classId],
  );
  const ranking = useMemo(() => classRanking(students, classId), [students, classId]);

  const selected = classStudents.find((s) => s.id === selectedId) ?? classStudents[0] ?? null;
  const result = selected ? computeStudentResult(selected) : null;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-base font-semibold leading-tight sm:text-lg">
              {school.name || "SBA Report Cards"}
            </p>
            <p className="num text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">
              GES · {school.term} · {school.academicYear}
            </p>
          </div>
          <button
            onClick={() => setShowSetup((v) => !v)}
            className="rounded-md border border-primary-foreground/30 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/10"
          >
            {showSetup ? "Close setup" : "School setup"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        {showSetup && (
          <section className="mt-5 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">School and term details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              These details appear on every report card.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="School name" value={school.name} onChange={(v) => setSchool({ name: v })} placeholder="e.g. Adukrom Basic School" />
              <Field label="Address" value={school.address} onChange={(v) => setSchool({ address: v })} placeholder="P.O. Box 12, Koforidua" />
              <Field label="Term" value={school.term} onChange={(v) => setSchool({ term: v })} />
              <Field label="Academic year" value={school.academicYear} onChange={(v) => setSchool({ academicYear: v })} />
              <Field label="Class teacher" value={school.classTeacher} onChange={(v) => setSchool({ classTeacher: v })} />
              <Field label="Head teacher" value={school.headTeacher} onChange={(v) => setSchool({ headTeacher: v })} />
              <Field label="Days school reopens" value={school.reopeningDate} onChange={(v) => setSchool({ reopeningDate: v })} placeholder="6th January 2026" />
              <Field label="Total attendance days" value={school.totalAttendance} onChange={(v) => setSchool({ totalAttendance: v })} />
            </div>
          </section>
        )}

        <section className="mt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Class
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-11">
            {CLASS_LEVELS.map((c) => {
              const active = c.id === classId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setClassId(c.id);
                    setSelectedId(null);
                  }}
                  className={
                    active
                      ? "rounded-md bg-primary px-2 py-2.5 text-sm font-semibold text-primary-foreground"
                      : "rounded-md border border-border bg-card px-2 py-2.5 text-sm font-medium text-foreground hover:border-primary/40"
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {level.stage} · {level.subjects.length} subjects rolled out automatically · SBA {SBA_MAX} +
            Exam {EXAM_MAX} = 100
          </p>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">
              {level.name} learners <span className="num text-muted-foreground">({classStudents.length})</span>
            </h2>
            <div className="mt-3 space-y-2">
              <Field label="Learner name" value={newName} onChange={setNewName} placeholder="Full name" />
              <Field label="Admission no." value={newAdmission} onChange={setNewAdmission} placeholder="Optional" />
              <button
                onClick={() => {
                  if (!newName.trim()) return;
                  addStudent(newName.trim(), classId, newAdmission.trim());
                  setNewName("");
                  setNewAdmission("");
                }}
                className="h-10 w-full rounded-md bg-accent text-sm font-semibold text-accent-foreground hover:opacity-90"
              >
                Add learner
              </button>
            </div>

            <ul className="mt-4 space-y-1.5">
              {classStudents.length === 0 && (
                <li className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  No learners in {level.name} yet.
                </li>
              )}
              {classStudents.map((s) => {
                const active = selected?.id === s.id;
                const pos = ranking.positions.get(s.id);
                return (
                  <li key={s.id}>
                    <div
                      className={
                        active
                          ? "flex items-center gap-2 rounded-md border border-primary bg-primary/5 px-3 py-2"
                          : "flex items-center gap-2 rounded-md border border-border px-3 py-2"
                      }
                    >
                      <button onClick={() => setSelectedId(s.id)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        <p className="num truncate text-[10px] text-muted-foreground">
                          {s.admissionNo || "no admission no."}
                          {pos && computeStudentResult(s).gradedCount > 0 ? ` · ${ordinal(pos)}` : ""}
                        </p>
                      </button>
                      <Link
                        to="/report/$studentId"
                        params={{ studentId: s.id }}
                        className="rounded border border-border px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5"
                      >
                        Report
                      </Link>
                      <button
                        onClick={() => removeStudent(s.id)}
                        className="rounded px-1.5 py-1 text-[11px] text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${s.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            {!selected || !result ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Add a learner to start entering SBA and exam marks.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{selected.name}</h2>
                    <p className="num text-[11px] text-muted-foreground">
                      {level.name} · {selected.admissionNo || "—"}
                    </p>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Average</p>
                      <p className="num text-lg font-semibold text-primary">{result.average.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Position</p>
                      <p className="num text-lg font-semibold text-accent">
                        {result.gradedCount ? ordinal(ranking.positions.get(selected.id) ?? 1) : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Field
                    label="Days present"
                    value={selected.attendance}
                    onChange={(v) => updateStudent(selected.id, { attendance: v })}
                    placeholder={`out of ${school.totalAttendance || "—"}`}
                  />
                  <Field
                    label="Attitude / conduct"
                    value={selected.conduct}
                    onChange={(v) => updateStudent(selected.id, { conduct: v })}
                    placeholder="Respectful and punctual"
                  />
                </div>

                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[440px] text-sm">
                    <thead>
                      <tr className="bg-muted/60 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="px-3 py-2 text-left font-semibold">Subject</th>
                        <th className="px-2 py-2 text-center font-semibold">SBA /30</th>
                        <th className="px-2 py-2 text-center font-semibold">Exam /70</th>
                        <th className="px-2 py-2 text-center font-semibold">Total</th>
                        <th className="px-2 py-2 text-center font-semibold">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjects.map((row) => (
                        <tr key={row.subject} className="border-t border-border">
                          <td className="px-3 py-1.5 font-medium">{row.subject}</td>
                          <td className="px-2 py-1.5 text-center">
                            <ScoreInput
                              max={SBA_MAX}
                              value={row.sba}
                              onChange={(v) => setScore(selected.id, row.subject, "sba", v)}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <ScoreInput
                              max={EXAM_MAX}
                              value={row.exam}
                              onChange={(v) => setScore(selected.id, row.subject, "exam", v)}
                            />
                          </td>
                          <td className="num px-2 py-1.5 text-center font-semibold">
                            {row.total ?? "—"}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {row.grade ? (
                              <span
                                className={
                                  row.grade <= 3
                                    ? "num inline-block min-w-6 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground"
                                    : row.grade <= 6
                                      ? "num inline-block min-w-6 rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground"
                                      : "num inline-block min-w-6 rounded bg-destructive px-1.5 py-0.5 text-xs font-semibold text-destructive-foreground"
                                }
                              >
                                {row.grade}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-primary/5 text-sm font-semibold">
                        <td className="px-3 py-2">
                          Total marks · aggregate <span className="num text-accent">{result.aggregate}</span>
                        </td>
                        <td colSpan={2} />
                        <td className="num px-2 py-2 text-center">{result.totalMarks}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Link
                  to="/report/$studentId"
                  params={{ studentId: selected.id }}
                  className="mt-4 flex h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Open A4 report card
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">GES grading system</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Grade 1 is the highest, grade 9 the lowest.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9">
            {GRADE_BANDS.map((b) => (
              <div key={b.grade} className="rounded-md border border-border px-2 py-2 text-center">
                <p className="num text-base font-semibold text-primary">{b.grade}</p>
                <p className="num text-[10px] text-muted-foreground">
                  {b.min}–{b.max}
                </p>
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
  return (
    <input
      inputMode="numeric"
      value={value === null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        if (raw === "") return onChange(null);
        onChange(Math.min(max, Number(raw)));
      }}
      className="num h-9 w-16 rounded-md border border-border bg-background text-center text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      placeholder="—"
    />
  );
}
