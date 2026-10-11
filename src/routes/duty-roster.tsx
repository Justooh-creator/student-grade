import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/lib/store";
import { openSms, openWhatsApp } from "@/lib/whatsapp";
import { DUTY_DAYS, DUTY_PRESETS, buildRosterText, mondayOf, useDutyRosters, weekLabel, type DutyEntry } from "@/lib/dutyRoster";

export const Route = createFileRoute("/duty-roster")({
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
const blank = (): DutyEntry => ({ day: "Monday", duty: DUTY_PRESETS[1]!, time: "", location: "", teacherId: "", teacherName: "" });

function DutyRosterPage() {
  const { school } = useAppData();
  const { rosters, acks, acknowledge, reload, cloud, nextWeek } = useDutyRosters();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAdmin = cloud.role === "headteacher";
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [week, setWeek] = useState(nextWeek);
  const [entries, setEntries] = useState<DutyEntry[]>([blank()]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

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

  // Load existing roster for the chosen week into the editor.
  useEffect(() => {
    const r = rosters.find((x) => x.week_start === week);
    setEntries(r ? r.entries : [blank()]);
    setNotes(r?.notes ?? "");
  }, [week, rosters]);

  const upd = (i: number, k: keyof DutyEntry, v: string) => setEntries((es) => es.map((e, j) => {
    if (j !== i) return e;
    if (k === "teacherId") return { ...e, teacherId: v, teacherName: teachers.find((t) => t.id === v)?.name ?? e.teacherName };
    return { ...e, [k]: v };
  }));

  const save = async () => {
    if (!cloud.schoolId || !cloud.userId) return;
    const clean = entries.filter((e) => e.teacherName.trim() && e.duty.trim());
    if (!clean.length) { toast.error("Add at least one teacher and duty"); return; }
    setBusy(true);
    const { error } = await supabase.from("duty_rosters").upsert(
      { school_id: cloud.schoolId, created_by: cloud.userId, week_start: week, entries: clean, notes, updated_at: new Date().toISOString() },
      { onConflict: "school_id,week_start" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Roster published — assigned teachers will get a reminder");
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this roster?")) return;
    await supabase.from("duty_rosters").delete().eq("id", id);
    reload();
  };

  const draftText = buildRosterText({ week_start: week, entries, notes }, school?.name);

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
            <p className="text-sm font-bold">Plan a week</p>
            <label className="grid gap-1 text-sm font-bold">Week starting (Monday)
              <input type="date" className={input} value={week} onChange={(e) => e.target.value && setWeek(mondayOf(new Date(e.target.value + "T12:00:00")))} />
              <span className="text-xs font-normal text-muted-foreground">{weekLabel(week)}</span>
            </label>
            {entries.map((e, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-2">
                <select className={input} value={e.teacherId} onChange={(ev) => upd(i, "teacherId", ev.target.value)}>
                  <option value="">Type name below / pick teacher…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input className={input} placeholder="Teacher name" value={e.teacherName} onChange={(ev) => upd(i, "teacherName", ev.target.value)} />
                <select className={input} value={e.day} onChange={(ev) => upd(i, "day", ev.target.value)}>
                  {[...DUTY_DAYS, "All week"].map((d) => <option key={d}>{d}</option>)}
                </select>
                <input className={input} list="duty-presets" placeholder="Duty" value={e.duty} onChange={(ev) => upd(i, "duty", ev.target.value)} />
                <input type="time" className={input} value={e.time} onChange={(ev) => upd(i, "time", ev.target.value)} />
                <input className={input} placeholder="Location, e.g. Main gate" value={e.location} onChange={(ev) => upd(i, "location", ev.target.value)} />
                <button onClick={() => setEntries((es) => es.filter((_, j) => j !== i))} className="h-9 rounded-md border border-border text-sm font-bold text-destructive sm:col-span-2">Remove</button>
              </div>
            ))}
            <datalist id="duty-presets">{DUTY_PRESETS.map((d) => <option key={d} value={d} />)}</datalist>
            <button onClick={() => setEntries((es) => [...es, blank()])} className="h-10 rounded-md border border-border text-sm font-bold hover:bg-muted">+ Add duty</button>
            <textarea className={`${input} h-16 py-2`} placeholder="Note to staff (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={save} className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? "Publishing…" : "Publish & remind teachers"}</button>
              <button onClick={() => openWhatsApp(`https://wa.me/?text=${encodeURIComponent(draftText)}`)} className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted">WhatsApp group</button>
              <button onClick={() => openSms(`sms:?body=${encodeURIComponent(draftText)}`)} className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted">SMS</button>
            </div>
          </section>
        )}

        {mounted && cloud.schoolId && (
          <section className="mt-4 grid gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">Rosters</p>
            {rosters.length === 0 && <p className="text-sm text-muted-foreground">No duty roster yet.</p>}
            {rosters.map((r) => {
              const seen = acks.filter((a) => a.roster_id === r.id);
              const mineAssigned = r.entries.some((e) => e.teacherId === cloud.userId);
              const acked = seen.some((a) => a.user_id === cloud.userId);
              return (
                <article key={r.id} className="rounded-xl border border-border bg-card p-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{buildRosterText(r, school?.name)}</pre>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {isAdmin && <span className="font-bold">✓ Acknowledged by {seen.length}</span>}
                    {mineAssigned && !acked && <button onClick={() => acknowledge(r.id)} className="h-8 rounded-md bg-primary px-3 font-bold text-primary-foreground">Acknowledge my duty</button>}
                    {mineAssigned && acked && <span className="font-bold text-primary">✓ Acknowledged</span>}
                    {isAdmin && (
                      <>
                        <button onClick={() => setWeek(r.week_start)} className="h-8 rounded-md border border-border px-3 font-bold">Edit</button>
                        <button onClick={() => openWhatsApp(`https://wa.me/?text=${encodeURIComponent(buildRosterText(r, school?.name))}`)} className="h-8 rounded-md border border-border px-3 font-bold">WhatsApp</button>
                        <button onClick={() => remove(r.id)} className="h-8 rounded-md border border-border px-3 font-bold text-destructive">Delete</button>
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
