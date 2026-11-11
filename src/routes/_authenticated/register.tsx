import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCloud } from "@/lib/cloud";
import { useAppData } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { attendanceClasses, attendanceClassName, type AttendanceEntry } from "@/lib/attendance";
import { schoolDays, registerMarks } from "@/lib/register";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({ meta: [
    { title: "Monthly Class Register — EduReport Ghana" },
    { name: "description", content: "Printable GES monthly attendance register built from daily marking." },
    { property: "og:title", content: "Monthly Class Register — EduReport Ghana" },
    { property: "og:description", content: "Print filled or blank A4 class attendance registers." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: RegisterPage,
});

interface Learner { id: string; name: string; admissionNo: string; gender: string }

function RegisterPage() {
  const cloud = useCloud();
  const { school } = useAppData();
  const classes = attendanceClasses(school.streams);
  const [classId, setClassId] = useState(classes.includes("kg1") ? "kg1" : classes[0] ?? "kg1");
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [blank, setBlank] = useState(false);
  const [y, m] = month.split("-").map(Number) as [number, number];
  const days = schoolDays(y, m - 1);
  const q = useQuery({
    queryKey: ["register", cloud.schoolId, classId, month],
    enabled: Boolean(cloud.schoolId),
    queryFn: async () => {
      const sid = cloud.schoolId!;
      const [saved, pupils, early] = await Promise.all([
        supabase.from("daily_attendance").select("attendance_date,entries").eq("school_id", sid).eq("class_id", classId).gte("attendance_date", days[0]!).lte("attendance_date", days[days.length - 1]!),
        supabase.from("school_students").select("id,data").eq("school_id", sid).eq("class_id", classId),
        supabase.from("attendance_early_learners").select("id,name,admission_no").eq("school_id", sid).eq("class_id", classId),
      ]);
      for (const r of [saved, pupils, early]) if (r.error) throw new Error(r.error.message);
      const learners: Learner[] = [
        ...(pupils.data ?? []).map((p) => { const d = p.data as { name?: string; admissionNo?: string; gender?: string }; return { id: p.id, name: d.name ?? "", admissionNo: d.admissionNo ?? "", gender: d.gender ?? "" }; }),
        ...(early.data ?? []).map((p) => ({ id: p.id, name: p.name, admissionNo: p.admission_no, gender: "" })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      const byDay: Record<string, AttendanceEntry[]> = {};
      for (const row of saved.data ?? []) byDay[row.attendance_date] = row.entries as unknown as AttendanceEntry[];
      return { learners, byDay };
    },
  });
  const learners = q.data?.learners ?? [];
  const rows = registerMarks(learners.map((l) => l.id), days, blank ? {} : q.data?.byDay ?? {});
  const dayTotals = days.map((_, i) => rows.filter((r) => r.marks[i] === "P").length);
  const blankRows = Math.max(0, 35 - learners.length > 5 ? 5 : 35 - learners.length);

  return <div className="min-h-screen bg-background pb-16">
    <div className="no-print"><AppHeader schoolName={school.name} term={school.term} year={school.academicYear} /></div>
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="no-print">
        <div className="flex items-center gap-3"><ClipboardList className="h-7 w-7 text-primary" /><h1 className="font-display text-2xl font-bold">Class Register</h1></div>
        <p className="mt-1 text-sm text-muted-foreground">Mark attendance every day in <Link to="/attendance" className="text-primary underline">Daily Attendance</Link>. This page builds the monthly register from those marks.</p>
        {!cloud.schoolId ? <p className="mt-6">Join School Cloud to open your class register. <Link to="/school-cloud" className="text-primary underline">School Cloud</Link></p> : <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">Class<select className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3" value={classId} onChange={(e) => setClassId(e.target.value)}>{classes.map((id) => <option key={id} value={id}>{attendanceClassName(id)}</option>)}</select></label>
            <label className="text-sm font-semibold">Month<Input className="mt-2 h-11" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => { setBlank(false); setTimeout(() => window.print(), 50); }} disabled={!q.data}><Printer />Print filled</Button>
            <Button variant="outline" onClick={() => { setBlank(true); setTimeout(() => window.print(), 50); }} disabled={!q.data}><Printer />Print blank</Button>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} /> Show blank sheet (to mark with pen)</label>
        </>}
      </div>
      {q.isPending && cloud.schoolId ? <p className="py-10">Loading register…</p> : q.error ? <p className="py-6 text-destructive">{q.error.message}</p> : q.data && <div className="mt-6 overflow-x-auto">
        <div className="register-page print-sheet-lite bg-white p-3 text-black">
          <div className="text-center"><p className="text-base font-bold uppercase">{school.name || "School"}</p><p className="text-xs">GHANA EDUCATION SERVICE · CLASS ATTENDANCE REGISTER</p><p className="text-xs font-semibold">{attendanceClassName(classId)} · {format(new Date(y, m - 1, 1), "MMMM yyyy")} · {school.term ? `Term ${school.term}` : ""} {school.academicYear}</p></div>
          <table className="register-table mt-2">
            <thead><tr><th>No.</th><th className="reg-name">Name of Learner</th><th>Sex</th>{days.map((d) => <th key={d}><div>{format(new Date(d + "T00:00"), "EEEEE")}</div><div>{Number(d.slice(8))}</div></th>)}<th>P</th><th>A</th></tr></thead>
            <tbody>
              {learners.map((l, i) => { const r = rows[i]!; return <tr key={l.id}><td>{i + 1}</td><td className="reg-name">{l.name}</td><td>{l.gender ? l.gender[0]!.toUpperCase() : ""}</td>{r.marks.map((mk, j) => <td key={j} className={mk === "A" ? "reg-absent" : ""}>{mk === "P" ? "✓" : mk === "A" ? "○" : ""}</td>)}<td>{blank ? "" : r.present}</td><td>{blank ? "" : r.absent}</td></tr>; })}
              {Array.from({ length: blankRows }, (_, i) => <tr key={"b" + i}><td>{learners.length + i + 1}</td><td className="reg-name" /><td />{days.map((d) => <td key={d} />)}<td /><td /></tr>)}
              <tr className="font-bold"><td colSpan={3} className="reg-name">Total present</td>{dayTotals.map((t, i) => <td key={i}>{blank || !q.data.byDay[days[i]!] ? "" : t}</td>)}<td /><td /></tr>
            </tbody>
          </table>
          <div className="mt-2 flex justify-between text-[10px]"><span>✓ Present &nbsp; ○ Absent</span><span>Class Teacher: ____________________ Sign: ________</span><span>Head Teacher: ____________________ Sign: ________</span></div>
        </div>
      </div>}
    </main>
  </div>;
}
