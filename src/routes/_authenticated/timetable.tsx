import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/lib/store";
import { useCloud } from "@/lib/cloud";
import { CLASS_LEVELS, getClassLevel, schoolClassIds, type ClassId } from "@/lib/ges";
import { TT_DAYS, defaultTimetable, fmt12, getTimetable, type Timetable } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Class Timetable — EduReport" },
      { name: "description", content: "GES/NaCCA class timetables for KG 1 to Basic 9 with weekly and daily views." },
      { property: "og:title", content: "Class Timetable — EduReport" },
      { property: "og:description", content: "Weekly and daily GES school timetables with lesson reminders for JHS subject teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TimetablePage,
});

const inp = "w-full rounded border border-border bg-card px-1.5 py-1 text-sm";

function TimetablePage() {
  const { school, setSchool } = useAppData();
  const cloud = useCloud();
  const [classId, setClassId] = useState<ClassId>("b7");
  const [view, setView] = useState<"weekly" | "daily">("weekly");
  const [day, setDay] = useState<string>("Monday");
  const [edit, setEdit] = useState(false);
  const [tt, setTt] = useState<Timetable>(() => defaultTimetable("b7"));
  const canEdit = !cloud.schoolId || cloud.role === "headteacher";
  const classList = schoolClassIds(school);
  if (!classList.includes(classId)) {
    const fallback = classList.find((c) => c.startsWith("b7")) ?? classList[0]!;
    setClassId(fallback);
    setTt(getTimetable(school, fallback));
  }

  useEffect(() => {
    const d = TT_DAYS[new Date().getDay() - 1];
    if (d) setDay(d);
    if (window.innerWidth < 640) setView("daily");
  }, []);
  useEffect(() => { setTt(getTimetable(school, classId)); setEdit(false); }, [classId, school]);

  const subjects = getClassLevel(classId).subjects;
  const setCell = (d: string, i: number, v: string) => setTt((t) => ({ ...t, cells: { ...t.cells, [d]: (t.cells[d] ?? []).map((x, j) => (j === i ? v : x)) } }));
  const setPer = (i: number, k: "start" | "end", v: string) => setTt((t) => ({ ...t, periods: t.periods.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));
  const save = () => { setSchool({ timetables: { ...(school.timetables ?? {}), [classId]: tt } }); setEdit(false); toast.success("Timetable saved"); };
  const addSlot = (isBreak: boolean) => setTt((t) => {
    const last = t.periods[t.periods.length - 1];
    const start = last?.end ?? "14:00";
    const [h, m] = start.split(":").map(Number);
    const endMin = (h ?? 14) * 60 + (m ?? 0) + (isBreak ? 20 : 40);
    const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const label = isBreak ? (prompt("Break name", "Third Break") || "Third Break") : `P${t.periods.filter((p) => !p.isBreak).length + 1}`;
    const cells = Object.fromEntries(TT_DAYS.map((d) => [d, [...(t.cells[d] ?? []), isBreak ? label : "Free / Library"]]));
    return { periods: [...t.periods, { start, end, label, isBreak }], cells };
  });
  const delSlot = (i: number) => setTt((t) => ({
    periods: t.periods.filter((_, j) => j !== i),
    cells: Object.fromEntries(TT_DAYS.map((d) => [d, (t.cells[d] ?? []).filter((_, j) => j !== i)])),
  }));
  const reset = () => { setTt(defaultTimetable(classId)); toast("GES default loaded — tap Save to keep it"); };
  const askNotify = async () => {
    if (typeof Notification === "undefined") { toast("Reminders will show inside the app"); return; }
    const r = await Notification.requestPermission();
    toast(r === "granted" ? "Lesson reminders turned on" : "Reminders will show inside the app");
  };

  const cell = (d: string, i: number) => {
    const v = tt.cells[d]?.[i] ?? "";
    const p = tt.periods[i]!;
    if (!edit || p.isBreak) return <span className={p.isBreak ? "italic text-muted-foreground" : "font-semibold"}>{v}</span>;
    return (
      <select className={inp} value={v} onChange={(e) => setCell(d, i, e.target.value)}>
        {[v, ...subjects.filter((s) => s !== v), "Free / Library"].map((s) => <option key={s}>{s}</option>)}
      </select>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
        <h1 className="text-2xl font-bold">📅 Class Timetable</h1>
        <div className="no-print flex flex-wrap items-center gap-2">
          <select aria-label="Select class" className="h-11 rounded-md border border-border bg-card px-3 font-bold" value={classId} onChange={(e) => setClassId(e.target.value as ClassId)}>
            {schoolClassIds(school).map(getClassLevel).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex overflow-hidden rounded-md border border-border">
            {(["weekly", "daily"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-2 font-bold ${view === v ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                {v === "weekly" ? "Weekly" : "Daily"}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="rounded-md border border-border bg-card px-3 py-2 font-bold">🖨 Print</button>
          {canEdit && !edit && <button onClick={() => setEdit(true)} className="rounded-md border border-border bg-card px-3 py-2 font-bold">✏️ Edit</button>}
          {edit && <>
            <button onClick={save} className="rounded-md bg-primary px-3 py-2 font-bold text-primary-foreground">Save</button>
            <button onClick={() => addSlot(false)} className="rounded-md border border-border bg-card px-3 py-2 font-bold">+ Add period</button>
            <button onClick={() => addSlot(true)} className="rounded-md border border-border bg-card px-3 py-2 font-bold">+ Add break</button>
            <button onClick={reset} className="rounded-md border border-border bg-card px-3 py-2 font-bold">Load GES default</button>
            <button onClick={() => { setTt(getTimetable(school, classId)); setEdit(false); }} className="px-3 py-2 font-bold">Cancel</button>
          </>}
        </div>
        {getClassLevel(classId).stage === "Junior High" && (
          <p className="no-print rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            Subject teachers assigned in School Cloud get a reminder 10 minutes before their lesson.{" "}
            <button onClick={askNotify} className="font-bold underline">Turn on phone reminders</button>
          </p>
        )}

        {view === "daily" && (
          <div className="no-print flex gap-1 overflow-x-auto">
            {TT_DAYS.map((d) => (
              <button key={d} onClick={() => setDay(d)} className={`rounded-md px-3 py-2 font-bold ${day === d ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>{d}</button>
            ))}
          </div>
        )}

        <div className="print-sheet-tt">
          <p className="hidden text-center text-lg font-bold print:block">{school.name} — {getClassLevel(classId).name} Timetable</p>
          {view === "weekly" ? (
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary">
                    <th className="border border-border p-2 text-left font-bold">Time</th>
                    {TT_DAYS.map((d) => <th key={d} className="border border-border p-2 font-bold">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tt.periods.map((p, i) => (
                    <tr key={i} className={p.isBreak ? "bg-muted" : ""}>
                      <td className="whitespace-nowrap border border-border p-2 font-bold">
                        {edit ? <div className="flex gap-1"><input type="time" className={inp} value={p.start} onChange={(e) => setPer(i, "start", e.target.value)} /><input type="time" className={inp} value={p.end} onChange={(e) => setPer(i, "end", e.target.value)} /><button onClick={() => delSlot(i)} aria-label="Delete slot" className="px-1 font-bold text-destructive">✕</button></div>
                          : `${fmt12(p.start)} – ${fmt12(p.end)}`}
                      </td>
                      {TT_DAYS.map((d) => <td key={d} className="border border-border p-2 text-center">{cell(d, i)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-2">
              {tt.periods.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-md border border-border p-3 ${p.isBreak ? "bg-muted" : "bg-card"}`}>
                  <div className={edit ? "w-32 shrink-0 space-y-1" : "w-28 shrink-0 font-bold"}>
                    {edit ? (
                      <>
                        <input type="time" aria-label="Period start time" className={inp} value={p.start} onChange={(e) => setPer(i, "start", e.target.value)} />
                        <input type="time" aria-label="Period end time" className={inp} value={p.end} onChange={(e) => setPer(i, "end", e.target.value)} />
                        <button onClick={() => delSlot(i)} className="text-xs font-bold text-destructive">✕ Delete</button>
                      </>
                    ) : (
                      <>{fmt12(p.start)}<br /><span className="text-sm text-muted-foreground">to {fmt12(p.end)}</span></>
                    )}
                  </div>
                  <div className="flex-1 text-lg">{cell(day, i)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
