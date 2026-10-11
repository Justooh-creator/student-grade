import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAppData } from "@/lib/store";
import { openSms, openWhatsApp } from "@/lib/whatsapp";
import { buildStaffNoticeText, useStaffNotices } from "@/lib/staffNotices";

export const Route = createFileRoute("/staff-meeting")({
  head: () => ({
    meta: [
      { title: "Staff Meeting Notice — EduReport" },
      { name: "description", content: "Headteachers send staff meeting notices to every teacher in the school cloud." },
      { property: "og:title", content: "Staff Meeting Notice — EduReport" },
      { property: "og:description", content: "Notify all teachers in your school cloud about staff meetings instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffMeetingPage,
});

const input = "h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary";

function StaffMeetingPage() {
  const { school } = useAppData();
  const { notices, reads, acknowledge, reload, cloud } = useStaffNotices();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAdmin = cloud.role === "headteacher";
  const [f, setF] = useState({ title: "", meeting_date: "", meeting_time: "", venue: "", agenda: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const senderName = school.headTeacher ? `${school.headTeacher} (Headteacher)` : "Headteacher";
  const draftText = buildStaffNoticeText({ ...f, sender_name: senderName }, school?.name);

  const send = async () => {
    if (!cloud.schoolId || !cloud.userId) return;
    if (!f.title.trim()) { toast.error("Add a meeting title"); return; }
    setBusy(true);
    const { error } = await supabase.from("staff_notices").insert({ ...f, school_id: cloud.schoolId, created_by: cloud.userId, sender_name: senderName });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notice sent to all teachers in the school cloud");
    setF({ title: "", meeting_date: "", meeting_time: "", venue: "", agenda: "", notes: "" });
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this notice?")) return;
    await supabase.from("staff_notices").delete().eq("id", id);
    reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="font-display text-xl font-bold">📣 Staff Meeting Notice</h1>
        {mounted && !cloud.schoolId && (
          <p className="mt-3 rounded-lg border border-border bg-card p-3 text-sm">
            Staff notices work inside a School Cloud. <Link to="/school-cloud" className="font-bold text-primary">Open School Cloud</Link> to create or join your school.
          </p>
        )}

        {mounted && cloud.schoolId && isAdmin && (
          <section className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-bold">New notice to all teachers</p>
            <input className={input} placeholder="Meeting title, e.g. End-of-Term Review" value={f.title} onChange={set("title")} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className={input} value={f.meeting_date} onChange={set("meeting_date")} />
              <input type="time" className={input} value={f.meeting_time} onChange={set("meeting_time")} />
            </div>
            <input className={input} placeholder="Venue, e.g. Staff Common Room" value={f.venue} onChange={set("venue")} />
            <textarea className={`${input} h-24 py-2`} placeholder="Agenda (one item per line)" value={f.agenda} onChange={set("agenda")} />
            <textarea className={`${input} h-16 py-2`} placeholder="Extra note, e.g. Come with your SBA registers" value={f.notes} onChange={set("notes")} />
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={send} className="h-10 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
                {busy ? "Sending…" : "Send to all teachers"}
              </button>
              <button onClick={() => openWhatsApp(`https://wa.me/?text=${encodeURIComponent(draftText)}`)} className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted">
                Share to WhatsApp group
              </button>
              <button onClick={() => openSms(`sms:?body=${encodeURIComponent(draftText)}`)} className="h-10 rounded-md border border-border px-4 text-sm font-bold hover:bg-muted">
                SMS
              </button>
            </div>
          </section>
        )}

        {mounted && cloud.schoolId && (
          <section className="mt-4 grid gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">Notices</p>
            {notices.length === 0 && <p className="text-sm text-muted-foreground">No staff notices yet.</p>}
            {notices.map((n) => {
              const seen = reads.filter((r) => r.notice_id === n.id);
              const mine = seen.some((r) => r.user_id === cloud.userId) || n.created_by === cloud.userId;
              return (
                <article key={n.id} className="rounded-xl border border-border bg-card p-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{buildStaffNoticeText(n, school?.name)}</pre>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                    {isAdmin && <span className="font-bold">✓ Seen by {seen.length} teacher(s)</span>}
                    {!mine && (
                      <button onClick={() => acknowledge(n.id)} className="h-8 rounded-md bg-primary px-3 font-bold text-primary-foreground">Mark as seen</button>
                    )}
                    {mine && !isAdmin && <span className="font-bold text-primary">✓ Seen</span>}
                    {isAdmin && (
                      <>
                        <button onClick={() => openWhatsApp(`https://wa.me/?text=${encodeURIComponent(buildStaffNoticeText(n, school?.name))}`)} className="h-8 rounded-md border border-border px-3 font-bold">WhatsApp</button>
                        <button onClick={() => remove(n.id)} className="h-8 rounded-md border border-border px-3 font-bold text-destructive">Delete</button>
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
