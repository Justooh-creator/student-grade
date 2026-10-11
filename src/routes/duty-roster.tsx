import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/lib/store";
import { openSms, openWhatsApp } from "@/lib/whatsapp";
import { DUTY_PRESETS, buildRosterText, mondayOf, useDutyRosters, weekLabel, type DutyEntry } from "@/lib/dutyRoster";

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
const WEEKS = 16;
const blankT = (): DutyEntry => ({ day: "All week", duty: DUTY_PRESETS[0]!, time: "", location: "", teacherId: "", teacherName: "" });
const addWeeks = (ws: string, n: number) => { const d = new Date(ws + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n * 7); return d.toISOString().slice(0, 10); };

function DutyRosterPage() {
  const { school } = useAppData();
  const { rosters, acks, acknowledge, reload, cloud, nextWeek } = useDutyRosters();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAdmin = cloud.role === "headteacher";
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [week1, setWeek1] = useState(nextWeek);
  const [plan, setPlan] = useState<Record<string, DutyEntry[]>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const weeks = Array.from({ length: WEEKS }, (_, i) => addWeeks(week1, i));

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

  // Fill the 16 weeks from saved rosters (2 blank teachers for empty weeks).
  useEffect(() => {
    const next: Record<string, DutyEntry[]> = {};
    for (const ws of Array.from({ length: WEEKS }, (_, i) => addWeeks(week1, i))) {
      const r = rosters.find((x) => x.week_start === ws);
      next[ws] = r?.entries.length ? r.entries : [blankT(), blankT()];
    }
    setPlan(next);
    setNotes(rosters.find((x) => x.week_start === week1)?.notes ?? "");
  }, [week1, rosters]);

  const updT = (ws: string, i: number, k: keyof DutyEntry, v: string) => setPlan((p) => ({
    ...p,
    [ws]: (p[ws] ?? []).map((e, j) => {
      if (j !== i) return e;
      if (k === "teacherId") return { ...e, teacherId: v, teacherName: teachers.find((t) => t.id === v)?.name ?? e.teacherName };
      return { ...e, [k]: v };
    }),
  }));

  const save = async () => {
    if (!cloud.schoolId || !cloud.userId) return;
    const rows = weeks.map((ws) => ({ ws, clean: (plan[ws] ?? []).filter((e) => e.teacherName.trim()) })).filter((x) => x.clean.length)
      .map(({ ws, clean }) => ({ school_id: cloud.schoolId!, created_by: cloud.userId!, week_start: ws, entries: clean, notes, updated_at: new Date().toISOString() }));
    if (!rows.length) { toast.error("Add at least one teacher"); return; }
    setBusy(true);
    const { error } = await supabase.from("duty_rosters").upsert(rows, { onConflict: "school_id,week_start" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} week(s) published — teachers will get reminders`);
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this roster?")) return;
    await supabase.from("duty_rosters").delete().eq("id", id);
    reload();
  };

  const draftText = weeks.map((ws, i) => {
    const names = (plan[ws] ?? []).map((e) => e.teacherName.trim()).filter(Boolean);
    return names.length ? `*Week ${i + 1}* (${weekLabel(ws)})\n• ${names.join("\n• ")}` : "";
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
            <p className="text-sm font-bold">Term duty plan (16 weeks)</p>
            <label className="grid gap-1 text-sm font-bold">Week 1 — pick the Monday
              <input type="date" className={input} value={week1} onChange={(e) => e.target.value && setWeek1(mondayOf(new Date(e.target.value + "T12:00:00")))} />
              <span className="text-xs font-normal text-muted-foreground">All 16 weeks' Monday–Friday dates fill in automatically.</span>
            </label>
            {weeks.map((ws, wi) => (
              <div key={ws} className="grid gap-2 rounded-lg border border-border p-3">
                <p className="text-sm font-bold">Week {wi + 1} <span className="font-normal text-muted-foreground">· {weekLabel(ws)}</span></p>
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
                        <button onClick={() => { setWeek1(r.week_start); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="h-8 rounded-md border border-border px-3 font-bold">Edit</button>
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
