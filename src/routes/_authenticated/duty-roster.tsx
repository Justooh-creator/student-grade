import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/lib/store";
import { openSms, openWhatsApp } from "@/lib/whatsapp";
import { addDutyWeeks, dutyWeekNumber, nextDutyWeek } from "@/lib/dutyWeeks";
import { DUTY_PRESETS, buildRosterText, mondayOf, useDutyRosters, weekLabel, type DutyEntry } from "@/lib/dutyRoster";

export const Route = createFileRoute("/_authenticated/duty-roster")({
  head: () => ({
    meta: [
      { title: "Teachers' Duty Roster — EduReport" },
      { name: "description", content: "Plan weekly teacher duties and remind every teacher on duty next week." },
      { property: "og:title", content: "Teachers' Duty Roster — EduReport" },
      { property: "og:description", content: "Weekly duty roster with automatic in-app reminders for teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DutyRosterPage,
});

const input = "h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary";
const WEEKS = 16;
const blankT = (): DutyEntry => ({ day: "", duty: DUTY_PRESETS[0]!, time: "", location: "", teacherId: "", teacherName: "" });
const addWeeks = addDutyWeeks;

function DutyRosterPage() {
  const { school, students } = useAppData();
  const { rosters, acks, acknowledge, reload, cloud, nextWeek, loaded } = useDutyRosters();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAdmin = cloud.role === "headteacher";
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [week1, setWeek1] = useState(nextWeek);
  const [plan, setPlan] = useState<Record<string, DutyEntry[]>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [weeks, setWeeks] = useState(() => Array.from({ length: WEEKS }, (_, i) => addWeeks(nextWeek, i)));
  const initializedSchool = useRef<string | null>(null);
  const orderedRosters = [...rosters].sort((a, b) => a.week_start.localeCompare(b.week_start));
  const weekNumber = (ws: string) => rosters.find((r) => r.week_start === ws)?.week_number ?? dutyWeekNumber(ws, week1);

  useEffect(() => {
    if (!cloud.schoolId) return;
    (async () => {
      const { data: m } = await supabase.from("school_members").select("user_id").eq("school_id", cloud.schoolId!);
      const ids = (m ?? []).map((x) => x.user_id);
      if (!ids.length) return;
      const { data: p } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
      setTeachers((p ?? []).map((x) => ({ id: x.id, name: x.display_name || x.email })));
    })();
  }, [cloud.schoolId]);

  // Hydrate once per school, so live updates cannot erase an unfinished plan.
  useEffect(() => {
    if (!loaded || !cloud.schoolId || initializedSchool.current === cloud.schoolId) return;
    initializedSchool.current = cloud.schoolId;
    const saved = [...rosters].sort((a, b) => a.week_start.localeCompare(b.week_start));
    const first = saved[0]?.week_start ?? nextWeek;
    const dates = saved.length ? saved.map((r) => r.week_start) : Array.from({ length: WEEKS }, (_, i) => addWeeks(first, i));
    setWeek1(first);
    setWeeks(dates);
    setPlan(Object.fromEntries(dates.map((ws) => [ws, saved.find((r) => r.week_start === ws)?.entries ?? [blankT(), blankT()]])));
    setNotes(saved[0]?.notes ?? "");
  }, [rosters, loaded, cloud.schoolId, nextWeek]);

  const startPlan = (first: string) => {
    const dates = Array.from({ length: weeks.length || WEEKS }, (_, i) => addWeeks(first, i));
    setWeek1(first); setWeeks(dates);
    setPlan(Object.fromEntries(dates.map((ws) => [ws, rosters.find((r) => r.week_start === ws)?.entries ?? [blankT(), blankT()]])));
    setNotes(rosters.find((r) => r.week_start === first)?.notes ?? "");
  };
  const addWeek = () => {
    const ws = nextDutyWeek(weeks, week1);
    setWeeks((current) => [...current, ws]);
    setPlan((current) => ({ ...current, [ws]: [blankT(), blankT()] }));
  };

  const updT = (ws: string, i: number, k: keyof DutyEntry, v: string) => setPlan((p) => ({
    ...p,
    [ws]: (p[ws] ?? []).map((e, j) => {
      if (j !== i) return e;
      if (k === "teacherId") return { ...e, teacherId: v, teacherName: teachers.find((t) => t.id === v)?.name ?? e.teacherName };
      return { ...e, [k]: v };
    }),
  }));

  const STUDENT_DUTY = "Senior Student on Duty";
  const autoStudents = () => {
    const pool = (prefix: string) => students.filter((s) => s.classId.startsWith(prefix));
    const pick = (list: typeof students, g: string, n: number) => {
      const l = list.filter((s) => (s.gender ?? "").toLowerCase().startsWith(g));
      return l.length ? l[n % l.length] : undefined;
    };
    const groups = [{ p: "b6", tag: "B6" }, { p: "b9", tag: "B9" }].map((g) => ({ ...g, list: pool(g.p) })).filter((g) => g.list.length);
    if (!groups.length) { toast.error("Add Basic 6 or Basic 9 learners (with gender) first"); return; }
    setPlan((prev) => {
      const next = { ...prev };
      weeks.forEach((ws, wi) => {
        const kept = (next[ws] ?? []).filter((e) => e.duty !== STUDENT_DUTY);
        const add: DutyEntry[] = [];
        for (const g of groups) for (const sex of ["m", "f"]) {
          const s = pick(g.list, sex, wi);
          if (s) add.push({ day: "", duty: STUDENT_DUTY, time: "", location: "", teacherId: "", teacherName: `${s.name} (${g.tag})` });
        }
        next[ws] = [...kept, ...add];
      });
      return next;
    });
    toast.success("Senior students assigned — 1 boy + 1 girl per class each week");
  };

  const save = async () => {
    if (!isAdmin || !cloud.schoolId || !cloud.userId) return;
    const rows = weeks.map((ws) => ({ ws, clean: (plan[ws] ?? []).filter((e) => e.teacherName.trim()) })).filter((x) => x.clean.length)
      .map(({ ws, clean }) => ({ school_id: cloud.schoolId!, created_by: cloud.userId!, week_start: ws, week_number: weekNumber(ws), entries: clean, notes, updated_at: new Date().toISOString() }));
    if (!rows.length) { toast.error("Add at least one teacher"); return; }
    setBusy(true);
    const { error } = await supabase.from("duty_rosters").upsert(rows, { onConflict: "school_id,week_start" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} week(s) published — teachers will get reminders`);
    reload();
  };

  const removeWeek = async (ws: string) => {
    if (!isAdmin || !cloud.schoolId || !confirm("Delete this duty week? Assigned teachers will no longer receive its reminders.")) return;
    const saved = rosters.find((r) => r.week_start === ws);
    if (saved) {
      setBusy(true);
      const { error, data } = await supabase.from("duty_rosters").delete().eq("id", saved.id).eq("school_id", cloud.schoolId).select("id");
      setBusy(false);
      if (error || !data?.length) { toast.error("Could not delete this week. Try again."); return; }
      void reload();
    }
    setWeeks((current) => current.filter((date) => date !== ws));
    setPlan((current) => { const next = { ...current }; delete next[ws]; return next; });
    toast.success("Duty week deleted.");
  };

  const draftText = weeks.map((ws) => {
    const names = (plan[ws] ?? []).map((e) => e.teacherName.trim() ? (e.duty === "Senior Student on Duty" ? `🎓 ${e.teacherName.trim()} (student)` : e.teacherName.trim()) : "").filter(Boolean);
    return names.length ? `*Week ${weekNumber(ws)}* (${weekLabel(ws)})\n• ${names.join("\n• ")}` : "";
  }).filter(Boolean).join("\n\n");
  const shareText = `🗓️ *TEACHERS' DUTY ROSTER*${school?.name ? ` — ${school.name}` : ""}\n\n${draftText}${notes ? `\n\n${notes}` : ""}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="font-display text-xl font-bold">🗓️ Teachers' Duty Roster</h1>
        {mounted && !cloud.schoolId && (
          <p className="mt-3 rounded-lg border border-border bg-card p-3 text-sm">
            The duty roster works inside a School Cloud. <Link to="/school-cloud" className="font-bold text-primary">Open School Cloud</Link> to create or join your school.
          </p>
        )}

        {mounted && cloud.schoolId && isAdmin && (
          <section className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-bold">Term duty plan ({weeks.length} weeks)</p>
            <label className="grid gap-1 text-sm font-bold">Week 1 — pick the Monday
              <input type="date" className={input} value={week1} onChange={(e) => e.target.value && startPlan(mondayOf(new Date(e.target.value + "T12:00:00")))} />
              <span className="text-xs font-normal text-muted-foreground">Monday–Friday dates fill automatically. Add or delete weeks to fit your term.</span>
            </label>
            {weeks.map((ws) => (
              <div key={ws} className="grid gap-2 rounded-lg border border-border p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"><div><p className="inline-block rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">WEEK {weekNumber(ws)}</p><p className="mt-1 text-xs text-muted-foreground">{weekLabel(ws)}</p></div><button disabled={busy} onClick={() => void removeWeek(ws)} className="rounded-md border border-border px-2 py-1 text-xs font-bold text-destructive">✕ Delete Week</button></div>
                {(plan[ws] ?? []).map((e, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <select className={input} value={e.teacherId} onChange={(ev) => updT(ws, i, "teacherId", ev.target.value)}>
                      <option value="">Pick teacher…</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input className={input} placeholder={`Teacher ${i + 1} name`} value={e.teacherName} onChange={(ev) => updT(ws, i, "teacherName", ev.target.value)} />
                    <button onClick={() => setPlan((p) => ({ ...p, [ws]: (p[ws] ?? []).filter((_, j) => j !== i) }))} className="h-10 rounded-md border border-border px-2 text-sm font-bold text-destructive" aria-label="Remove teacher">✕</button>
                  </div>
                ))}
                <button onClick={() => setPlan((p) => ({ ...p, [ws]: [...(p[ws] ?? []), blankT()] }))} className="h-9 rounded-md border border-border text-sm font-bold hover:bg-muted">+ Add teacher</button>
              </div>
            ))}
            <button disabled={busy} onClick={addWeek} className="h-10 rounded-md border border-primary text-sm font-bold text-primary">+ Add Week</button>
            <button onClick={autoStudents} className="h-10 rounded-md border border-primary text-sm font-bold text-primary hover:bg-muted">🎲 Auto-Assign Senior Students (Basic 6 & 9)</button>
            <textarea className={`${input} h-16 py-2`} placeholder="Note to staff (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={save} className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? "Publishing…" : "Publish & remind teachers"}</button>
              <button onClick={() => openWhatsApp(`https://wa.me/?text=${encodeURIComponent(shareText)}`)} className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted">WhatsApp group</button>
              <button onClick={() => openSms(`sms:?body=${encodeURIComponent(shareText)}`)} className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted">SMS</button>
            </div>
          </section>
        )}

        {mounted && cloud.schoolId && (
          <section className="mt-4 grid gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">Rosters</p>
            {rosters.length === 0 && <p className="text-sm text-muted-foreground">No duty roster yet.</p>}
            {orderedRosters.map((r, index) => {
              const numbered = { ...r, week_number: r.week_number ?? index + 1 };
              const seen = acks.filter((a) => a.roster_id === r.id);
              const mineAssigned = r.entries.some((e) => e.teacherId === cloud.userId);
              const acked = seen.some((a) => a.user_id === cloud.userId);
              return (
                <article key={r.id} className="rounded-xl border border-border bg-card p-3">
                  <p className="mb-2 inline-block rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">WEEK {numbered.week_number}</p><p className="mb-2 text-xs text-muted-foreground">{weekLabel(r.week_start)}</p>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{buildRosterText(numbered, school?.name)}</pre>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {isAdmin && <span className="font-bold">✓ Acknowledged by {seen.length}</span>}
                    {mineAssigned && !acked && <button onClick={() => acknowledge(r.id)} className="h-8 rounded-md bg-primary px-3 font-bold text-primary-foreground">Acknowledge my duty</button>}
                    {mineAssigned && acked && <span className="font-bold text-primary">✓ Acknowledged</span>}
                    {isAdmin && (
                      <>
                        <button onClick={() => { setWeek1(r.week_start); setWeeks([r.week_start]); setPlan({ [r.week_start]: r.entries }); setNotes(r.notes); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="h-8 rounded-md border border-border px-3 font-bold">Edit</button>
                        <button onClick={() => openWhatsApp(`https://wa.me/?text=${encodeURIComponent(buildRosterText(numbered, school?.name))}`)} className="h-8 rounded-md border border-border px-3 font-bold">WhatsApp</button>
                        <button disabled={busy} onClick={() => void removeWeek(r.week_start)} className="h-8 rounded-md border border-border px-3 font-bold text-destructive">Delete</button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
