import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const SUPPORT_WHATSAPP = "233249931038";
const CATEGORIES = ["Feature Request", "Grading/Report Suggestion", "Problem / Bug Report", "General Feedback"];

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback & Suggestions — EduReport" },
      { name: "description", content: "Share your recommendations and suggestions to help improve EduReport for Ghanaian teachers." },
      { property: "og:title", content: "Feedback & Suggestions — EduReport" },
      { property: "og:description", content: "Tell the EduReport team what to add or improve." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

type Row = { id: string; created_at: string; sender_name: string; school_name: string; phone: string; category: string; message: string; status: string };

function FeedbackPage() {
  const { school } = useAppData();
  const { user } = useUser();
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState(school.name ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const loadRows = async () => {
    const { data } = await supabase.from("app_feedback").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as Row[]) ?? []);
  };

  useEffect((): void => {
    if (!user) return;
    supabase.rpc("is_developer").then(({ data }) => {
      if (data) { setIsDev(true); loadRows(); }
    });
  }, [user]);

  const waText = `Hi EduReport Team, my name is ${name || "a teacher"}${schoolName ? ` from ${schoolName}` : ""}.\n${category}: ${message || "Here is my recommendation for the app: "}`;
  const waUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(waText)}`;

  const submit = async () => {
    if (message.trim().length < 3) { toast.error("Please type your suggestion first."); return; }
    setBusy(true);
    const { error } = await supabase.from("app_feedback").insert({
      user_id: user?.id ?? null, sender_name: name.trim(), school_name: schoolName.trim(), phone: phone.trim(), category, message: message.trim(),
    });
    setBusy(false);
    if (error) { toast.error("Could not send. Check your internet or use WhatsApp."); return; }
    toast.success("Thank you! Your suggestion has been sent.");
    setMessage("");
    if (isDev) loadRows();
  };

  const mark = async (id: string, status: string) => {
    await supabase.from("app_feedback").update({ status }).eq("id", id);
    loadRows();
  };

  const input = "h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary";
  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <section className="rounded-lg border border-border bg-card p-4">
          <h1 className="font-display text-lg font-bold">💡 Feedback & Suggestions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Help shape the next EduReport update. Tell us what works, what is difficult, and what you would like added.</p>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-bold">Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold">Your suggestion
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={3000} rows={5} placeholder="e.g. Please add a column for homework marks…" className="w-full rounded-md border border-border bg-card p-3 text-sm font-normal outline-none focus:border-primary" />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-bold">Your name (optional)<input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={input} /></label>
              <label className="grid gap-1 text-xs font-bold">School (optional)<input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} maxLength={200} className={input} /></label>
              <label className="grid gap-1 text-xs font-bold">Phone (optional)<input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} inputMode="tel" className={input} /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={submit} disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Submit in app"}</button>
              <a href={waUrl} target="_blank" rel="noreferrer" className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">Send via WhatsApp</a>
            </div>
          </div>
        </section>

        {isDev && (
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-display text-base font-bold">Developer inbox ({rows.length})</h2>
            <div className="mt-3 grid gap-2">
              {rows.length === 0 && <p className="text-sm text-muted-foreground">No suggestions yet.</p>}
              {rows.map((r) => (
                <div key={r.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold">{r.category}</span>
                    <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{r.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{[r.sender_name, r.school_name, r.phone].filter(Boolean).join(" · ") || "Anonymous"}</p>
                  <button onClick={() => mark(r.id, r.status === "done" ? "new" : "done")} className="mt-2 text-xs font-bold text-primary">
                    {r.status === "done" ? "✓ Reviewed — mark as new" : "Mark as reviewed"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
