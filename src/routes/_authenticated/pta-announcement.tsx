import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ReopenPicker } from "@/components/DatePicker";
import { ClassPicker } from "@/components/ClassPicker";
import { getClassLevel } from "@/lib/ges";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData } from "@/lib/store";
import { buildPtaAnnouncement, openSms, openWhatsApp, ptaSmsLink, ptaWhatsAppLink, type PtaMeeting } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/pta-announcement")({
  validateSearch: validateClassSearch,
  head: () => ({
    meta: [
      { title: "PTA Meeting Notice — EduReport" },
      { name: "description", content: "Send PTA meeting announcements to all parents in a class on WhatsApp or SMS." },
      { property: "og:title", content: "PTA Meeting Notice — EduReport" },
      { property: "og:description", content: "Announce PTA meetings to parents class by class with one tap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PtaPage,
});

const inputCls = "mt-1 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-primary";

function PtaPage() {
  const { school, students } = useAppData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const classId = search.class ?? "b4";
  const level = getClassLevel(classId);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [meeting, setMeeting] = useState<PtaMeeting>({
    title: "PTA Meeting",
    date: "",
    time: "",
    venue: school.name ? `${school.name} — School Compound` : "",
    agenda: "",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const list = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);
  const set = (k: keyof PtaMeeting) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setMeeting((m) => ({ ...m, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
      <main className="mx-auto max-w-3xl px-4">
        <ClassPicker value={classId} onChange={(c) => navigate({ to: "/pta-announcement", search: { class: c } })} />
        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <h1 className="font-display text-lg font-bold">📢 PTA Meeting Notice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the meeting details once, then send the announcement to every parent in the class on WhatsApp — or SMS if the number is not on WhatsApp.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold sm:col-span-2">
              Meeting title
              <input value={meeting.title} onChange={set("title")} className={inputCls} />
            </label>
            <label className="block text-xs font-bold">
              Date
              <ReopenPicker placeholder="Pick meeting date" value={meeting.date} onChange={(v) => setMeeting((m) => ({ ...m, date: v }))} />
            </label>
            <label className="block text-xs font-bold">
              Time
              <input value={meeting.time} onChange={set("time")} placeholder="e.g. 10:00 a.m." className={inputCls} />
            </label>
            <label className="block text-xs font-bold sm:col-span-2">
              Venue
              <input value={meeting.venue} onChange={set("venue")} placeholder="e.g. School Assembly Hall" className={inputCls} />
            </label>
            <label className="block text-xs font-bold sm:col-span-2">
              Agenda (optional)
              <textarea value={meeting.agenda} onChange={set("agenda")} rows={2} placeholder="e.g. School fees, BECE preparation, new uniforms" className={inputCls} />
            </label>
          </div>
        </section>
        <section className="mt-4 rounded-xl border border-border bg-card p-2">
          <p className="px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-foreground">{level.name} · {list.length} learner(s)</p>
          {mounted && list.length === 0 && <p className="p-3 text-sm text-muted-foreground">No learners in this class yet.</p>}
          {mounted && list.map((s) => {
            const href = ptaWhatsAppLink(s, school, meeting);
            const sms = ptaSmsLink(s, school, meeting);
            return (
              <div key={s.id} className="border-t border-border px-2 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <p className="num text-xs text-muted-foreground">{s.parentPhone || "No parent phone"}</p>
                  </div>
                  <button onClick={() => setPreview(preview === s.id ? null : s.id)} className="h-8 rounded-md border border-border px-3 text-xs font-bold hover:bg-muted">
                    {preview === s.id ? "Hide" : "Preview"}
                  </button>
                  {href ? (
                    <>
                      <button onClick={() => openWhatsApp(href)} className="h-8 rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-90">
                        Send WhatsApp
                      </button>
                      {sms && (
                        <button onClick={() => openSms(sms)} title="If this number is not on WhatsApp, send the same message as a text message instead." className="h-8 rounded-md border border-border px-3 text-xs font-bold hover:bg-muted">
                          SMS
                        </button>
                      )}
                    </>
                  ) : (
                    <Link to="/students" search={{ class: classId }} className="text-xs font-bold text-primary hover:underline">Add phone</Link>
                  )}
                </div>
                {preview === s.id && (
                  <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{buildPtaAnnouncement(s, school, meeting)}</pre>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
