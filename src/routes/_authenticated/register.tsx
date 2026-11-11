import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, Fragment, type ReactNode } from "react";
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
import { registerDays, registerMarks, weekGroups, sexOf, dailySexTotals, weeklyTotals } from "@/lib/register";

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
  const days = registerDays(y, m - 1);
  const [paper, setPaper] = useState<"A4" | "A3">("A4");
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
  const blankRows = Math.max(0, 35 - learners.length > 5 ? 5 : 35 - learners.length);
  const weeks = weekGroups(days);
  const closedKey = `edureport-register-closed:${cloud.schoolId ?? "local"}:${month}`;
  const [closed, setClosed] = useState<Record<string, string>>({});
  useEffect(() => { try { setClosed(JSON.parse(localStorage.getItem(closedKey) || "{}")); } catch { setClosed({}); } }, [closedKey]);
  const [cDate, setCDate] = useState(""); const [cReason, setCReason] = useState("");
  const saveClosed = (next: Record<string, string>) => { setClosed(next); localStorage.setItem(closedKey, JSON.stringify(next)); };
  const sexes = learners.map((l) => sexOf(l.gender));
  const daily = dailySexTotals(rows, sexes, days, closed);
  const marked = new Set(Object.keys(q.data?.byDay ?? {}));
  const weekly = weeklyTotals(weeks, days, daily, marked, closed);
  const show = (i: number) => !blank && marked.has(days[i]!) && !closed[days[i]!];
  const weekSum = (r: { marks: string[] }, w: number[]) => w.filter((i) => !closed[days[i]!]).filter((i) => r.marks[i] === "P").length;
  const totalRows = learners.length + blankRows + 1;
  const dayCells = (render: (i: number) => ReactNode, wkCell: (w: number[], wi: number) => ReactNode) => weeks.map((w, wi) => <Fragment key={wi}>{w.map((i) => <Fragment key={i}>{render(i)}</Fragment>)}{wkCell(w, wi)}</Fragment>);
  const closedCell = (i: number, rowIdx: number) => closed[days[i]!] ? (rowIdx === 0 ? <td rowSpan={totalRows} className="reg-closed"><span>{closed[days[i]!]}</span></td> : null) : undefined;

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
          <div className="mt-4 rounded-md border border-border p-3">
            <p className="text-sm font-semibold">School closed / incident days</p>
            <p className="text-xs text-muted-foreground">e.g. Founders' Day, National CPD Day, Holiday. It is written down the day's column.</p>
            <div className="mt-2 grid grid-cols-[1fr_1.4fr_auto] gap-2">
              <Input type="date" min={days[0]} max={days[days.length - 1]} value={cDate} onChange={(e) => setCDate(e.target.value)} />
              <Input placeholder="Reason" value={cReason} onChange={(e) => setCReason(e.target.value)} />
              <Button type="button" disabled={!days.includes(cDate) || !cReason.trim()} onClick={() => { saveClosed({ ...closed, [cDate]: cReason.trim() }); setCDate(""); setCReason(""); }}>Add</Button>
            </div>
            {Object.keys(closed).length > 0 && <ul className="mt-2 space-y-1 text-sm">{Object.entries(closed).sort().map(([d, r]) => <li key={d} className="flex items-center justify-between"><span>{format(new Date(d + "T00:00"), "EEE d MMM")} — {r}</span><button className="text-destructive underline" onClick={() => { const n = { ...closed }; delete n[d]; saveClosed(n); }}>Remove</button></li>)}</ul>}
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm"><span className="font-semibold">Paper</span>{(["A4", "A3"] as const).map((p) => <Button key={p} size="sm" type="button" variant={paper === p ? "default" : "outline"} onClick={() => setPaper(p)}>{p} landscape</Button>)}</div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} /> Show blank sheet (to mark with pen)</label>
        </>}
      </div>
      {q.isPending && cloud.schoolId ? <p className="py-10">Loading register…</p> : q.error ? <p className="py-6 text-destructive">{q.error.message}</p> : q.data && <div className="mt-6 overflow-x-auto">
        <div className={`register-page ${paper === "A3" ? "register-a3" : ""} print-sheet-lite bg-white p-3 text-black`}>
          <div className="text-center"><p className="text-base font-bold uppercase">{school.name || "School"}</p><p className="text-xs">GHANA EDUCATION SERVICE · CLASS ATTENDANCE REGISTER</p><p className="text-xs font-semibold">{attendanceClassName(classId)} · {format(new Date(y, m - 1, 1), "MMMM yyyy")}{days.length ? ` (${format(new Date(days[0] + "T00:00"), "d MMM")} – ${format(new Date(days[days.length - 1] + "T00:00"), "d MMM")})` : ""} · {school.term ? `Term ${school.term}` : ""} {school.academicYear}</p></div>
          <table className="register-table mt-2">
            <thead>
              <tr><th rowSpan={2}>No.</th><th rowSpan={2} className="reg-name">Name of Learner</th><th rowSpan={2}>Sex</th>{weeks.map((w, wi) => <th key={wi} colSpan={w.length + 1}>Week {wi + 1}</th>)}<th rowSpan={2}>P</th><th rowSpan={2}>A</th></tr>
              <tr>{dayCells((i) => <th><div>{format(new Date(days[i] + "T00:00"), "EEEEE")}</div><div>{Number(days[i]!.slice(8))}</div></th>, (_, wi) => <th key={"t" + wi} className="reg-wk">Tot</th>)}</tr>
            </thead>
            <tbody>
              {learners.map((l, k) => { const r = rows[k]!; return <tr key={l.id}><td>{k + 1}</td><td className="reg-name">{l.name}</td><td>{sexes[k]}</td>{dayCells((i) => { const c = closedCell(i, k); if (c !== undefined) return c; const mk = r.marks[i]; return <td className={mk === "A" ? "reg-absent" : ""}>{mk === "P" ? "✓" : mk === "A" ? "○" : ""}</td>; }, (w, wi) => <td key={"t" + wi} className="reg-wk">{blank ? "" : weekSum(r, w)}</td>)}<td>{blank ? "" : r.present}</td><td>{blank ? "" : r.absent}</td></tr>; })}
              {Array.from({ length: blankRows }, (_, b) => <tr key={"b" + b}><td>{learners.length + b + 1}</td><td className="reg-name" /><td />{dayCells((i) => { const c = closedCell(i, learners.length + b); return c !== undefined ? c : <td />; }, (_, wi) => <td key={"t" + wi} className="reg-wk" />)}<td /><td /></tr>)}
              <tr><td colSpan={3} className="reg-name" />{dayCells((i) => { const c = closedCell(i, totalRows - 1); return c !== undefined ? c : <td />; }, (_, wi) => <td key={"t" + wi} className="reg-wk" />)}<td /><td /></tr>
              <tr className="font-bold"><td colSpan={3} className="reg-name">Daily present — Boys</td>{dayCells((i) => <td>{show(i) ? daily[i]!.boys : ""}</td>, (_, wi) => <td key={"t" + wi} className="reg-wk">{blank ? "" : weekly[wi]!.boys}</td>)}<td /><td /></tr>
              <tr className="font-bold"><td colSpan={3} className="reg-name">Daily present — Girls</td>{dayCells((i) => <td>{show(i) ? daily[i]!.girls : ""}</td>, (_, wi) => <td key={"t" + wi} className="reg-wk">{blank ? "" : weekly[wi]!.girls}</td>)}<td /><td /></tr>
              <tr className="font-bold"><td colSpan={3} className="reg-name">Daily present — Total</td>{dayCells((i) => <td>{show(i) ? daily[i]!.boys + daily[i]!.girls : ""}</td>, (_, wi) => <td key={"t" + wi} className="reg-wk">{blank ? "" : weekly[wi]!.total}</td>)}<td /><td /></tr>
            </tbody>
          </table>
          <table className="register-table reg-summary mt-3">
            <thead><tr><th>Weekly totals</th><th>Dates</th><th>Times open</th><th>Cumulative</th><th>Boys</th><th>Girls</th><th>Total attendance</th></tr></thead>
            <tbody>{weekly.map((w, wi) => <tr key={wi}><td className="font-bold">Week {wi + 1}</td><td>{format(new Date(days[weeks[wi]![0]!] + "T00:00"), "d MMM")} – {format(new Date(days[weeks[wi]![weeks[wi]!.length - 1]!] + "T00:00"), "d MMM")}</td><td>{blank ? "" : w.open}</td><td>{blank ? "" : w.cumulative}</td><td>{blank ? "" : w.boys}</td><td>{blank ? "" : w.girls}</td><td className="font-bold">{blank ? "" : w.total}</td></tr>)}</tbody>
          </table>
          <div className="mt-2 flex justify-between text-[10px]"><span>✓ Present &nbsp; ○ Absent</span><span>Class Teacher: ____________________ Sign: ________</span><span>Head Teacher: ____________________ Sign: ________</span></div>
        </div>
      </div>}
    </main>
  </div>;
}
