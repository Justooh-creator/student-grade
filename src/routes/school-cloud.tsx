import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useAppData } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { useCloud, loadSchool, hasLocalBackup, uploadLocalBackup } from "@/lib/cloud";
import { SchoolAdmin } from "@/components/SchoolAdmin";
import { LicenseCard } from "@/components/LicenseCard";
import { useLicense } from "@/lib/license";

export const Route = createFileRoute("/school-cloud")({
  head: () => ({
    meta: [
      { title: "School Cloud — EduReport" },
      { name: "description", content: "Create or join your school's cloud so every teacher's marks sync live." },
      { property: "og:title", content: "School Cloud — EduReport" },
      { property: "og:description", content: "One shared, live school record for all teachers from KG 1 to Basic 9." },
    ],
  }),
  component: SchoolCloudPage,
});

function SchoolCloudPage() {
  const { school } = useAppData();
  const { user, ready } = useUser();
  const cloud = useCloud();
  const lic = useLicense(user?.id);
  const [name, setName] = useState(school.name);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const backupCount = cloud.status === "synced" ? hasLocalBackup() : 0;

  async function create() {
    if (!user || !name.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("create_school", { _name: name.trim() });
    if (error) toast.error(error.message); else { await loadSchool(user.id); toast.success("School cloud created."); }
    setBusy(false);
  }
  async function join() {
    if (!user || !code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("join_school", { _code: code.trim() });
    if (error) toast.error(error.message); else { await loadSchool(user.id); toast.success("You joined the school."); }
    setBusy(false);
  }
  async function upload() {
    if (!user) return;
    setBusy(true);
    try { const n = await uploadLocalBackup(user.id); toast.success(`Uploaded ${n} learner(s) to the school cloud.`); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }
  async function leave() {
    if (!user || !confirm("Leave this school? Records stay in the school cloud.")) return;
    await supabase.from("school_members").delete().eq("user_id", user.id);
    await loadSchool(user.id);
  }

  const card = "rounded-lg border border-border bg-card p-5";
  const input = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  const btn = "rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <h1 className="font-display text-2xl font-bold">School Cloud</h1>
        {!ready || cloud.status === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className={card}>
            <p className="text-sm">Sign in first so your records can be saved to your school's cloud.</p>
            <Link to="/auth" className={`${btn} mt-3 inline-block`}>Sign in</Link>
          </div>
        ) : cloud.schoolId ? (
          <>
            <div className={card}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Connected school</p>
              <p className="mt-1 text-lg font-bold">{cloud.schoolName || "Unnamed school"}</p>
              <p className="mt-3 text-sm">Share this School Code with your teachers:</p>
              <p className="num mt-1 text-3xl font-bold tracking-[0.3em] text-primary">{cloud.joinCode}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Status: <b>{cloud.status === "saving" ? "Saving…" : cloud.status === "offline" ? "Not saved — check internet" : "All changes saved"}</b>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Every learner, mark and school detail from KG 1 to Basic 9 now saves live for all teachers in this school.</p>
            </div>
            {cloud.role === "headteacher" ? (
              <SchoolAdmin schoolId={cloud.schoolId} schoolName={cloud.schoolName ?? ""} joinCode={cloud.joinCode ?? ""} userId={user.id} />
            ) : (
              <p className="text-sm text-muted-foreground">Your role: <b>Teacher</b>. Ask your headteacher to manage teachers.</p>
            )}
            {backupCount > 0 && (
              <div className={card}>
                <p className="text-sm font-bold">This phone had {backupCount} learner(s) before joining.</p>
                <p className="mt-1 text-sm text-muted-foreground">Upload them so the whole school can see them.</p>
                <button onClick={upload} disabled={busy} className={`${btn} mt-3`}>Upload to School Cloud</button>
              </div>
            )}
            <button onClick={leave} className="text-sm font-semibold text-destructive underline">Leave school</button>
          </>
        ) : (
          <>
            <div className={card}>
              <p className="font-bold">Register a new school</p>
              <p className="text-sm text-muted-foreground">For the headteacher. You get a School Code to give teachers.</p>
              <label className="mt-3 block text-sm font-bold">School name
                <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <button onClick={create} disabled={busy || !name.trim()} className={`${btn} mt-3`}>Create school</button>
            </div>
            <div className={card}>
              <p className="font-bold">Join an existing school</p>
              <label className="mt-3 block text-sm font-bold">School Code
                <input className={`${input} num uppercase tracking-widest`} maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 4A9F2C" />
              </label>
              <button onClick={join} disabled={busy || code.trim().length < 6} className={`${btn} mt-3`}>Join school</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
