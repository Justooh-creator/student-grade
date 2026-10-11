import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ClassPicker } from "@/components/ClassPicker";
import { getClassLevel } from "@/lib/ges";
import { validateClassSearch } from "@/lib/classSearch";
import { useAppData } from "@/lib/store";
import { buildMidtermSummary, midtermSmsLink, midtermWhatsAppLink, openSms, openWhatsApp } from "@/lib/whatsapp";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/midterm-progress")({
  validateSearch: validateClassSearch,
  head: () => ({
    meta: [
      { title: "Mid-Term WhatsApp Check-In — EduReport" },
      { name: "description", content: "Send free mid-term progress updates to parents on WhatsApp." },
      { property: "og:title", content: "Mid-Term WhatsApp Check-In — EduReport" },
      { property: "og:description", content: "Keep parents informed mid-term with a one-tap WhatsApp progress note." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MidtermPage,
});

function MidtermPage() {
  const { school, students } = useAppData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const classId = search.class ?? "b4";
  const level = getClassLevel(classId);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const list = useMemo(() => students.filter((s) => s.classId === classId), [students, classId]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
      <main className="mx-auto max-w-3xl px-4">
        <ClassPicker value={classId} onChange={(c) => navigate({ to: "/midterm-progress", search: { class: c } })} />
        <section className="mt-5 rounded-xl border border-border bg-card p-4">
          <h1 className="font-display text-lg font-bold">💬 Mid-Term WhatsApp Check-In</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send each parent a short progress note with the marks entered so far. Free for everyone.
          </p>
          <label className="mt-3 block text-xs font-bold">Extra note for all parents (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Mid-term tests start next week."
            className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-primary"
          />
        </section>
        <section className="mt-4 rounded-xl border border-border bg-card p-2">
          <p className="px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{level.name} · {list.length} learner(s)</p>
          {mounted && list.length === 0 && <p className="p-3 text-sm text-muted-foreground">No learners in this class yet.</p>}
          {mounted && list.map((s) => {
            const href = midtermWhatsAppLink(s, school, note);
            const sms = midtermSmsLink(s, school, note);
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
                  <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{buildMidtermSummary(s, school, note)}</pre>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
