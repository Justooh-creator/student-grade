import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker, TextField } from "@/components/ClassPicker";
import { PresetField } from "@/components/PresetField";
import { CONDUCT_PRESETS, HEAD_REMARK_PRESETS, INTEREST_PRESETS, MAX_STUDENTS_PER_CLASS, REMARK_PRESETS, getClassLevel } from "@/lib/ges";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData, type Student } from "@/lib/store";
import { passportPhoto, extractSignature } from "@/lib/images";
import { ClassLock } from "@/components/ClassLock";
import { openWhatsApp, whatsAppLink } from "@/lib/whatsapp";
import { useUser } from "@/lib/auth";
import { useLicense } from "@/lib/license";
import { toast } from "sonner";

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
  const { school, students, addStudent, updateStudent, removeStudent, setSchool } = useAppData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready: authReady } = useUser();
  const lic = useLicense(user?.id);
  const waLocked = authReady && !lic.loading && !lic.canPrint;
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
        <ClassLock classId={classId}>

        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-[220px] flex-1">
              <TextField
                label={`${level.name} class teacher`}
                value={school.classTeachers?.[classId] ?? ""}
                onChange={(v) => setSchool({ classTeachers: { ...(school.classTeachers ?? {}), [classId]: v } })}
                placeholder="Name of class teacher (shown on report cards)"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{level.name} teacher's signature</span>
              <p className="text-[11px] text-muted-foreground">Photo of the signature on white paper — only the ink is kept.</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-background">
                  {school.classTeacherSignatures?.[classId]
                    ? <img src={school.classTeacherSignatures[classId]} alt={`${level.name} teacher signature`} className="max-h-full max-w-full object-contain" />
                    : <span className="text-[10px] text-muted-foreground">No signature</span>}
                </div>
                <label className="cursor-pointer rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                  Camera
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setSchool({ classTeacherSignatures: { ...(school.classTeacherSignatures ?? {}), [classId]: await extractSignature(f) } }); }} />
                </label>
                <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-xs font-bold hover:bg-muted">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setSchool({ classTeacherSignatures: { ...(school.classTeacherSignatures ?? {}), [classId]: await extractSignature(f) } }); }} />
                </label>
                {school.classTeacherSignatures?.[classId] && (
                  <button onClick={() => setSchool({ classTeacherSignatures: { ...(school.classTeacherSignatures ?? {}), [classId]: "" } })} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <h1 className="text-sm font-bold">Add learner to {level.name}</h1>
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
                <div className="flex items-center gap-3">
                  <label className="flex h-14 w-12 cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-border bg-background text-[9px] font-bold text-muted-foreground" title="Add passport photo">
                    {s.photo ? <img src={s.photo} alt={`${s.name} passport`} className="h-full w-full object-cover" /> : "+ Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) updateStudent(s.id, { photo: await passportPhoto(f) }); }} />
                  </label>
                  <div>
                    <p className="text-sm font-bold"><span className="num text-muted-foreground">{i + 1}.</span> {s.name}</p>
                    {s.photo && <button onClick={() => updateStudent(s.id, { photo: "" })} className="text-[10px] text-muted-foreground hover:text-destructive">Remove photo</button>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to="/" search={{ class: classId, student: s.id }} className="rounded border border-border px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5">Enter SBA</Link>
                  {(() => { const wa = whatsAppLink(s, students, school); return wa ? <a href={wa} onClick={(e) => { e.preventDefault(); if (waLocked) { toast.error("WhatsApp sharing needs an active license. Tap to activate."); navigate({ to: "/school-cloud" }); return; } openWhatsApp(wa); }} title={waLocked ? "WhatsApp sharing needs an active license. Tap to activate." : undefined} className={`rounded border border-border px-2 py-1 text-[11px] font-semibold hover:bg-primary/5 ${waLocked ? "text-muted-foreground" : "text-primary"}`}>{waLocked ? "🔒 WhatsApp" : "WhatsApp report"}</a> : null; })()}
                  <button onClick={() => removeStudent(s.id)} className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive" aria-label={`Remove ${s.name}`}>✕</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <TextField label="Name" value={s.name} onChange={(v) => updateStudent(s.id, { name: v })} />
                <TextField label="Admission no." value={s.admissionNo} onChange={(v) => updateStudent(s.id, { admissionNo: v })} />
                <TextField label="Days present" value={s.attendance} onChange={(v) => updateStudent(s.id, { attendance: v })} placeholder={`out of ${school.totalAttendance || "—"}`} />
                <TextField label="Parent / guardian phone" value={s.parentPhone ?? ""} onChange={(v) => updateStudent(s.id, { parentPhone: v })} placeholder="e.g. 0241234567" />
                <PresetField label="Attitude / conduct" value={s.conduct} presets={CONDUCT_PRESETS} onChange={(v) => updateStudent(s.id, { conduct: v })} placeholder="Select conduct" />
                <PresetField label="Interest / hobby" value={s.interest} presets={INTEREST_PRESETS} onChange={(v) => updateStudent(s.id, { interest: v })} placeholder="Select interest" />
                <PresetField label="Class teacher's remark" value={s.remark ?? ""} presets={REMARK_PRESETS} onChange={(v) => updateStudent(s.id, { remark: v })} placeholder="Auto remark from average" />
                <PresetField label="Headteacher's remark" value={s.headRemark ?? ""} presets={HEAD_REMARK_PRESETS} onChange={(v) => updateStudent(s.id, { headRemark: v })} placeholder="Select headteacher's remark" />
              </div>
              <details className="mt-2 rounded-lg border border-border bg-background/50 px-3 py-2">
                <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Fees / accounts (optional — prints on report card when filled)</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <TextField label="Fees owed (arrears)" value={s.fees?.arrears ?? ""} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), arrears: v } })} placeholder="e.g. 120" />
                  <TextField label="Levies" value={s.fees?.levies ?? ""} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), levies: v } })} placeholder="e.g. 30" />
                  <TextField label="Next-term fees" value={s.fees?.nextTerm ?? ""} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), nextTerm: v } })} placeholder="e.g. 150" />
                </div>
              </details>
            </div>
          ))}
        </section>
        </ClassLock>
      </main>
    </div>
  );
}
