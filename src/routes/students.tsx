import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker, TextField } from "@/components/ClassPicker";
import { PresetField } from "@/components/PresetField";
import { CONDUCT_PRESETS, INTEREST_PRESETS, MAX_STUDENTS_PER_CLASS, REMARK_PRESETS, getClassLevel } from "@/lib/ges";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData, type Student } from "@/lib/store";

export const Route = createFileRoute("/students")({
  validateSearch: validateClassSearch,
  head: () => ({
    meta: [
      { title: "Student Details — SBA Report Cards" },
      { name: "description", content: "Add learners per class (max 35) with admission number, attendance, conduct, interest and remarks." },
      { property: "og:title", content: "Student Details — SBA Report Cards" },
      { property: "og:description", content: "Manage learners for KG 1 to Basic 9 report cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { school, students, addStudent, updateStudent, removeStudent } = useAppData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const classId = search.class ?? "b4";
  const level = getClassLevel(classId);
  const list = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const [name, setName] = useState("");
  const [adm, setAdm] = useState("");
  const full = list.length >= MAX_STUDENTS_PER_CLASS;

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
      <main className="mx-auto max-w-5xl px-4">
        <ClassPicker value={classId} onChange={(c) => navigate({ to: "/students", search: { class: c } })} />

        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <h1 className="text-sm font-semibold">Add learner to {level.name}</h1>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <TextField label="Learner name" value={name} onChange={setName} placeholder="Full name" />
            <TextField label="Admission no." value={adm} onChange={setAdm} placeholder="Optional" />
            <button
              disabled={full}
              onClick={() => {
                if (!name.trim() || full) return;
                addStudent(name.trim(), classId, adm.trim());
                setName("");
                setAdm("");
              }}
              className="h-10 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {full ? "Class full (35 max)" : "Add learner"}
            </button>
          </div>
          <p className="num mt-2 text-[10px] text-muted-foreground">{list.length} / {MAX_STUDENTS_PER_CLASS} learners</p>

        </section>

        <section className="mt-5 space-y-3">
          {list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No learners in {level.name} yet.</p>
          )}
          {list.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold"><span className="num text-muted-foreground">{i + 1}.</span> {s.name}</p>
                <div className="flex gap-2">
                  <Link to="/" search={{ class: classId, student: s.id }} className="rounded border border-border px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5">Enter SBA</Link>
                  <button onClick={() => removeStudent(s.id)} className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive" aria-label={`Remove ${s.name}`}>✕</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <TextField label="Name" value={s.name} onChange={(v) => updateStudent(s.id, { name: v })} />
                <TextField label="Admission no." value={s.admissionNo} onChange={(v) => updateStudent(s.id, { admissionNo: v })} />
                <TextField label="Days present" value={s.attendance} onChange={(v) => updateStudent(s.id, { attendance: v })} placeholder={`out of ${school.totalAttendance || "—"}`} />
                <PresetField label="Attitude / conduct" value={s.conduct} presets={CONDUCT_PRESETS} onChange={(v) => updateStudent(s.id, { conduct: v })} placeholder="Select conduct" />
                <PresetField label="Interest / hobby" value={s.interest} presets={INTEREST_PRESETS} onChange={(v) => updateStudent(s.id, { interest: v })} placeholder="Select interest" />
                <PresetField label="Class teacher's remark" value={s.remark ?? ""} presets={REMARK_PRESETS} onChange={(v) => updateStudent(s.id, { remark: v })} placeholder="Auto remark from average" />
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
