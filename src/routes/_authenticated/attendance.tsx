import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Save, Users, UserCheck, UserX, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCloud } from "@/lib/cloud";
import { useAppData } from "@/lib/store";
import { canEditClass } from "@/lib/classAccess";
import { supabase } from "@/integrations/supabase/client";
import { attendanceClasses, attendanceClassName, attendanceSummary, isEarlyAttendanceClass, type AttendanceEntry, type AttendanceAccess } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [
    { title: "Daily Attendance — EduReport Ghana" },
    { name: "description", content: "Private school daily attendance register from Crèche and Nursery to Basic 9." },
    { property: "og:title", content: "Daily Attendance — EduReport Ghana" },
    { property: "og:description", content: "School attendance registers and saved daily roll calls." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AttendancePage,
});

function AttendancePage() {
  const cloud = useCloud();
  const { school } = useAppData();
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("kg1");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const classes = attendanceClasses(school.streams);
  useEffect(() => { if (!classes.includes(classId)) { setClassId(classes[0] ?? "kg1"); setDirty(false); } }, [classId, classes.join(",")]);
  const queryKey = ["attendance", cloud.schoolId, classId, date];
  const register = useQuery({
    queryKey,
    enabled: Boolean(cloud.schoolId),
    queryFn: async () => {
      const schoolId = cloud.schoolId;
      if (!schoolId) throw new Error("Join School Cloud first");
      const [saved, pupils, early, access] = await Promise.all([
        supabase.from("daily_attendance").select("*").eq("school_id", schoolId).eq("class_id", classId).eq("attendance_date", date).maybeSingle(),
        supabase.from("school_students").select("id,data").eq("school_id", schoolId).eq("class_id", classId),
        supabase.from("attendance_early_learners").select("*").eq("school_id", schoolId).eq("class_id", classId).order("name"),
        supabase.rpc("attendance_access", { _school: schoolId }),
      ]);
      for (const response of [saved, pupils, early, access]) if (response.error) throw new Error(response.error.message);
      const roster: AttendanceEntry[] = [
        ...(pupils.data ?? []).map((p) => { const data = p.data as { name?: string; admissionNo?: string }; return { id: p.id, name: data.name ?? "", admissionNo: data.admissionNo ?? "", present: false }; }),
        ...(early.data ?? []).map((p) => ({ id: p.id, name: p.name, admissionNo: p.admission_no, present: false })),
      ].sort((a,b) => a.name.localeCompare(b.name));
      return { saved: saved.data, roster, access: access.data as unknown as AttendanceAccess };
    },
  });
  useEffect(() => {
    if (register.data && !dirty) setEntries(register.data.saved ? register.data.saved.entries as unknown as AttendanceEntry[] : register.data.roster);
  }, [register.data, dirty]);
  const editable = canEditClass({ inSchool: Boolean(cloud.schoolId), role: cloud.role, userId: cloud.userId, assignments: school.classAssignments, subjectAssignments: school.subjectAssignments, classId });
  const allowed = register.data?.access.allowed ?? false;
  const save = useMutation({
    mutationFn: async () => {
      const schoolId = cloud.schoolId;
      if (!schoolId) throw new Error("Join School Cloud first");
      const { error } = await supabase.rpc("save_daily_attendance_fees", { _school: schoolId, _class: classId, _date: date, _present_ids: entries.filter((e) => e.present).map((e) => e.id), _unpaid_ids: entries.filter((e) => e.present && e.unpaid).map((e) => e.id) });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => { setDirty(false); await queryClient.invalidateQueries({ queryKey }); toast.success("Attendance saved to School Cloud"); },
    onError: (error) => toast.error(error.message),
  });
  const earlyChange = useMutation({
    mutationFn: async (id?: string) => {
      const schoolId = cloud.schoolId;
      if (!schoolId) throw new Error("Join School Cloud first");
      const result = id ? await supabase.from("attendance_early_learners").delete().eq("id", id).eq("school_id", schoolId)
        : await supabase.from("attendance_early_learners").insert({ school_id: schoolId, class_id: classId, name: name.trim(), admission_no: admissionNo.trim() });
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: async () => { setName(""); setAdmissionNo(""); await queryClient.invalidateQueries({ queryKey }); toast.success("Class register updated"); },
    onError: (error) => toast.error(error.message),
  });
  const summary = attendanceSummary(entries);
  const busy = save.isPending || earlyChange.isPending;
  function changeSelection(nextClass: string, nextDate: string) {
    if (dirty && !window.confirm("Discard unsaved attendance changes?")) return;
    setDirty(false); setEntries([]); setClassId(nextClass); setDate(nextDate);
  }
  const saved = register.data?.saved;
  const currentIds = new Set(register.data?.roster.map((p) => p.id));
  const rosterChanged = Boolean(saved && (entries.length !== currentIds.size || entries.some((e) => !currentIds.has(e.id))));
  return <div className="min-h-screen bg-background pb-16">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center gap-3"><Users className="h-7 w-7 text-primary" /><h1 className="font-display text-2xl font-bold">Daily Attendance</h1></div>
      {!cloud.schoolId ? <div className="mt-6 border-y border-border py-6"><p>{cloud.status === "loading" ? "Loading your school…" : "Join School Cloud to open your school’s attendance register."}</p><Button asChild variant="outline" className="mt-4"><Link to="/school-cloud">School Cloud</Link></Button></div> : <>
        {cloud.role === "headteacher" && <Button asChild variant="outline" className="mt-4"><Link to="/fees">💰 Owner Cash Register</Link></Button>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Class<select className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3" aria-label="Attendance class" value={classId} disabled={busy} onChange={(e) => changeSelection(e.target.value, date)}>{classes.map((id) => <option key={id} value={id}>{attendanceClassName(id)}</option>)}</select></label>
          <label className="text-sm font-semibold">Date<Input aria-label="Attendance date" className="mt-2 h-11" type="date" max={format(new Date(), "yyyy-MM-dd")} value={date} disabled={busy} onChange={(e) => { if (e.target.value) changeSelection(classId, e.target.value); }} /></label>
        </div>
        {register.isPending ? <p role="status" className="py-10">Loading register…</p> : register.error ? <div role="alert" className="py-6 text-destructive">{register.error.message}<Button className="ml-3" variant="outline" onClick={() => register.refetch()}>Retry</Button></div> : <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 text-sm text-muted-foreground">
            <p>{saved ? `Saved ${format(new Date(saved.updated_at), "d MMM, h:mm a")}` : "Not yet saved"}{dirty ? " · Unsaved changes" : ""}</p>
            <p>{register.data?.access.licensed ? "School license active" : register.data?.access.expires_at ? `Trial ${allowed ? "ends" : "ended"} ${format(new Date(register.data.access.expires_at), "d MMM yyyy, h:mm a")}` : "14-day trial starts with your first saved attendance"}</p>
          </div>
          {!editable && <p className="mt-4 text-muted-foreground">View only — this class is assigned to another teacher.</p>}
          {!allowed && <div role="alert" className="mt-4 border-l-4 border-accent bg-muted p-4">Your school’s attendance trial has ended. <Link to="/auth" className="font-semibold text-primary underline">Activate School Cloud</Link> to continue saving.</div>}
          {isEarlyAttendanceClass(classId) && editable && <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) earlyChange.mutate(undefined); }} className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm font-semibold">Learner name<Input aria-label="Learner name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} required maxLength={150} disabled={busy || dirty} /></label>
            <label className="text-sm font-semibold">Admission no. (optional)<Input aria-label="Admission number" className="mt-2" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} maxLength={100} disabled={busy || dirty} /></label>
            <Button type="submit" disabled={busy || dirty || (register.data?.roster.length ?? 0) >= 35 || !name.trim()}><Plus />Add learner</Button>
          </form>}
          {rosterChanged && <div className="mt-4 border-l-4 border-accent bg-muted p-3 text-sm">The class list has changed since this attendance was saved. <Button variant="link" disabled={busy || !editable} onClick={() => { const old = new Map(entries.map((e) => [e.id,e.present])); setEntries((register.data?.roster ?? []).map((e) => ({ ...e, present: old.get(e.id) ?? false }))); setDirty(true); }}>Use current class list</Button></div>}
          <div className="my-5 grid grid-cols-3 border-y border-border py-4">
            {[{ label: "Present", value: summary.present, icon: UserCheck }, { label: "Absent", value: summary.absent, icon: UserX }, { label: "Total", value: summary.total, icon: Users }].map(({label,value,icon:Icon}) => <div key={label} className="text-center"><Icon className="mx-auto mb-1 h-5 w-5 text-primary" /><p className="num text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>)}
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant="outline" disabled={!editable || !allowed || busy || !entries.length || rosterChanged} onClick={() => { setEntries(entries.map((e) => ({ ...e, present: true }))); setDirty(true); }}><CheckCheck />Mark All Present</Button>
            <Button variant="ghost" disabled={!editable || !allowed || busy || !entries.length} onClick={() => { setEntries(entries.map((e) => ({ ...e, present: false }))); setDirty(true); }}>Clear</Button>
          </div>
          {!entries.length && <div className="border border-dashed border-border py-10 text-center text-muted-foreground">No learners in {attendanceClassName(classId)}.{!isEarlyAttendanceClass(classId) && <p className="mt-3"><Link to="/students" className="text-primary underline">Open Student Details</Link></p>}</div>}
          <div className="divide-y divide-border border-y border-border">{entries.map((entry, i) => <div key={entry.id} className={`flex min-h-16 items-center gap-3 px-2 py-3 ${entry.present ? "bg-primary/5" : "bg-background"}`}>
            <Checkbox id={`present-${entry.id}`} aria-label={`Present: ${entry.name}`} checked={entry.present} disabled={!editable || !allowed || busy || rosterChanged} onCheckedChange={(checked) => { setEntries(entries.map((e) => e.id === entry.id ? { ...e, present: checked === true, unpaid: checked === true ? e.unpaid : false } : e)); setDirty(true); }} className="h-6 w-6 shrink-0" />
            <label htmlFor={`present-${entry.id}`} className="min-w-0 flex-1 cursor-pointer"><span className="block break-words font-semibold"><span className="mr-2 text-muted-foreground">{i + 1}.</span>{entry.name}</span>{entry.admissionNo && <span className="text-xs text-muted-foreground">{entry.admissionNo}</span>}</label>
            {entry.present ? <button type="button" aria-pressed={Boolean(entry.unpaid)} disabled={!editable || !allowed || busy || rosterChanged} onClick={() => { setEntries(entries.map((e) => e.id === entry.id ? { ...e, unpaid: !e.unpaid } : e)); setDirty(true); }} className={`rounded-full border px-3 py-1 text-xs font-semibold ${entry.unpaid ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}>{entry.unpaid ? "No money today" : "Paid"}</button> : <span className="text-xs font-semibold text-muted-foreground">Absent</span>}
            {isEarlyAttendanceClass(classId) && editable && !saved && <Button size="icon" variant="ghost" aria-label={`Remove ${entry.name}`} disabled={busy || dirty} onClick={() => { if (window.confirm(`Remove ${entry.name} from this class?`)) earlyChange.mutate(entry.id); }}><Trash2 /></Button>}
          </div>)}</div>
          <div className="sticky bottom-0 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background py-4"><p className="text-sm text-muted-foreground">{attendanceClassName(classId)} · {summary.present} present</p><Button size="lg" disabled={!editable || !allowed || busy || !entries.length || !dirty || rosterChanged} onClick={() => save.mutate()}><Save />{save.isPending ? "Saving…" : "Save Attendance"}</Button></div>
        </>}
      </>}
    </main>
  </div>;
}