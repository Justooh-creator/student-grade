import { CameraButton } from "@/components/CameraCapture";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker, TextField } from "@/components/ClassPicker";
import { PresetField } from "@/components/PresetField";
import { CONDUCT_PRESETS, HEAD_REMARK_PRESETS, INTEREST_PRESETS, MAX_STUDENTS_PER_CLASS, REMARK_PRESETS, getClassLevel } from "@/lib/ges";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData, type Student } from "@/lib/store";
import { passportPhoto, extractSignature } from "@/lib/images";
import { ClassLock } from "@/components/ClassLock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LearnerImport } from "@/components/LearnerImport";
import { useCloud } from "@/lib/cloud";
import { supabase } from "@/integrations/supabase/client";
import { countPresentDays, parseTermDate, type DayRow } from "@/lib/attendanceFill";
import { canCustomHeadRemark } from "@/lib/headteacher";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/students")({
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
  const classId = search.class ?? "b4";
  const level = getClassLevel(classId);
  const list = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const [name, setName] = useState("");
  const [adm, setAdm] = useState("");
  const full = list.length >= MAX_STUDENTS_PER_CLASS;
  const cloud = useCloud();
  const { user } = useUser();
  const [myName, setMyName] = useState("");
  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (active) setMyName(data?.display_name ?? ""); });
    return () => { active = false; };
  }, [user]);
  const headCanCustom = canCustomHeadRemark(myName, school.headTeacher);
  const [filling, setFilling] = useState(false);
  async function fillAttendance() {
    if (!cloud.schoolId) { toast.error("Join School Cloud to use Daily Attendance marks."); return; }
    if (list.some((s) => s.attendance) && !window.confirm("Replace the days present already typed for this class with the Daily Attendance totals? You can still edit them after.")) return;
    setFilling(true);
    const { data, error } = await supabase.from("daily_attendance").select("attendance_date,entries").eq("school_id", cloud.schoolId).eq("class_id", classId);
    setFilling(false);
    if (error) { toast.error(error.message); return; }
    const counts = countPresentDays((data ?? []) as unknown as DayRow[], parseTermDate(school.reopeningDate), parseTermDate(school.vacationDate));
    if (!data?.length) { toast.error("No Daily Attendance saved for this class yet."); return; }
    list.forEach((s) => updateStudent(s.id, { attendance: String(counts[s.id] ?? 0) }));
    toast.success(`Days present filled for ${list.length} learner(s). You can still edit any number.`);
  }

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
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-foreground">{level.name} teacher's signature</span>
              <p className="text-[13px] text-muted-foreground">Photo of the signature on white paper — only the ink is kept.</p>
              <div className="mt-1 flex flex-nowrap items-center gap-2">
                <div className="flex h-12 w-24 shrink-0 sm:w-32 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-background">
                  {school.classTeacherSignatures?.[classId]
                    ? <img src={school.classTeacherSignatures[classId]} alt={`${level.name} teacher signature`} className="max-h-full max-w-full object-contain" />
                    : <span className="text-[12px] text-muted-foreground">No signature</span>}
                </div>
                <CameraButton className="cursor-pointer rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90" onFile={async (f) => { setSchool({ classTeacherSignatures: { ...(school.classTeacherSignatures ?? {}), [classId]: await extractSignature(f) } }); }}>
                  Camera
                </CameraButton>
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
          <p className="num mt-2 text-[12px] text-muted-foreground">{list.length} / {MAX_STUDENTS_PER_CLASS} learners</p>
          <LearnerImport classId={classId} />
          {list.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" disabled={filling} onClick={fillAttendance}>{filling ? "Counting…" : "📅 Fill days present from Daily Attendance"}</Button>
            <span className="text-xs text-muted-foreground">Counts marks between reopening and vacation dates. You can still type over any number.</span>
          </div>}
        </section>

        <section className="mt-5 space-y-3">
          {list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No learners in {level.name} yet.</p>
          )}
          {list.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                  <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-border bg-background text-center text-[11px] font-bold text-muted-foreground">
                    {s.photo ? <img src={s.photo} alt={`${s.name} passport`} className="h-full w-full object-cover" /> : "No photo"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold"><span className="num text-muted-foreground">{i + 1}.</span> {s.name}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeStudent(s.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Remove ${s.name}`}>✕</Button>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                      <CameraButton className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-primary px-1 text-[12px] sm:px-2 sm:text-[13px] font-bold text-primary-foreground hover:opacity-90" title="Learner passport photo" onFile={async (f) => { { updateStudent(s.id, { photo: await passportPhoto(f) }); toast.success("Photo added to report card"); } }}>📷 Snap</CameraButton>
                      <Button asChild variant="outline" className="h-9 whitespace-nowrap px-1 text-[12px] font-bold sm:px-2 sm:text-[13px]">
                      <label>
                        🖼 Upload
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { updateStudent(s.id, { photo: await passportPhoto(f) }); toast.success("Photo added to report card"); } }} />
                      </label>
                      </Button>
                      <Button asChild variant="outline" className="h-9 whitespace-nowrap px-1 text-[12px] font-semibold text-primary sm:px-2 sm:text-[13px]">
                        <Link to="/sba-details" search={{ class: classId, student: s.id }}>SBA</Link>
                      </Button>
                      {s.photo && <button onClick={() => updateStudent(s.id, { photo: "" })} className="col-span-3 text-left text-[12px] sm:col-span-1 sm:text-[13px] text-muted-foreground hover:text-destructive">Remove</button>}
                    </div>
                  </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <TextField label="Name" value={s.name} onChange={(v) => updateStudent(s.id, { name: v })} />
                <TextField label="Admission no." value={s.admissionNo} onChange={(v) => updateStudent(s.id, { admissionNo: v })} />
                <label className="block text-sm font-bold">Gender (optional)<select value={s.gender ?? ""} onChange={(e) => updateStudent(s.id, { gender: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 font-normal"><option value="">Not specified</option><option>Female</option><option>Male</option></select></label>
                <TextField label="Days present" value={s.attendance} onChange={(v) => updateStudent(s.id, { attendance: v })} placeholder={`out of ${school.totalAttendance || "—"}`} />
                <TextField label="Parent / guardian phone" value={s.parentPhone ?? ""} onChange={(v) => updateStudent(s.id, { parentPhone: v })} placeholder="e.g. 0241234567" />
                <PresetField label="Attitude / conduct" value={s.conduct} presets={CONDUCT_PRESETS} onChange={(v) => updateStudent(s.id, { conduct: v })} placeholder="Select conduct" />
                <PresetField label="Interest / hobby" value={s.interest} presets={INTEREST_PRESETS} onChange={(v) => updateStudent(s.id, { interest: v })} placeholder="Select interest" />
                <PresetField label="Class teacher's remark" value={s.remark ?? ""} presets={REMARK_PRESETS} onChange={(v) => updateStudent(s.id, { remark: v })} placeholder="Auto remark from average" />
                <PresetField label="Headteacher's remark" value={s.headRemark ?? ""} presets={HEAD_REMARK_PRESETS} onChange={(v) => updateStudent(s.id, { headRemark: v })} placeholder="Select headteacher's remark" allowCustom={headCanCustom} />
                {!headCanCustom && (
                  <p className="-mt-1 text-[11px] text-muted-foreground">
                    Only the headteacher named in School Details can type a custom remark.
                  </p>
                )}
              </div>
              <details className="mt-2 rounded-lg border border-border bg-background/50 px-3 py-2">
                <summary className="cursor-pointer text-[13px] font-bold uppercase tracking-[0.12em] text-foreground">Fees / accounts (optional — only filled items print on the report card)</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <TextField label="Fees owed (arrears)" value={s.fees?.arrears ?? ""} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), arrears: v } })} placeholder="e.g. 120" />
                  <TextField label="Levies" value={s.fees?.levies ?? ""} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), levies: v } })} placeholder="e.g. 30" />
                  <TextField label="Next-term fees" value={s.fees?.nextTerm ?? ""} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), nextTerm: v } })} placeholder="e.g. 150" />
                </div>
                {(s.fees?.items ?? []).map((item, idx) => (
                  <div key={idx} className="mt-2 flex items-end gap-2">
                    <div className="flex-1">
                      <TextField label="Item name" value={item.label} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), items: (s.fees?.items ?? []).map((it, i) => i === idx ? { ...it, label: v } : it) } })} placeholder="e.g. PTA dues" />
                    </div>
                    <div className="w-28">
                      <TextField label="Amount" value={item.amount} onChange={(v) => updateStudent(s.id, { fees: { ...(s.fees ?? {}), items: (s.fees?.items ?? []).map((it, i) => i === idx ? { ...it, amount: v } : it) } })} placeholder="e.g. 25" />
                    </div>
                    <button onClick={() => updateStudent(s.id, { fees: { ...(s.fees ?? {}), items: (s.fees?.items ?? []).filter((_, i) => i !== idx) } })} className="mb-1 rounded px-2 py-1 text-[13px] text-muted-foreground hover:text-destructive" aria-label={`Remove fee item ${item.label || idx + 1}`}>✕</button>
                  </div>
                ))}
                <button onClick={() => updateStudent(s.id, { fees: { ...(s.fees ?? {}), items: [...(s.fees?.items ?? []), { label: "", amount: "" }] } })} className="mt-2 rounded border border-dashed border-border px-3 py-1.5 text-[13px] font-bold text-primary hover:bg-primary/5">+ Add another fee (PTA, class fees, exam fees…)</button>
              </details>
            </div>
          ))}
        </section>
        </ClassLock>
      </main>
    </div>
  );
}
