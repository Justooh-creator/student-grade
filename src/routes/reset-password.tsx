import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — EduReport" },
      { name: "description", content: "Choose a new password for your EduReport teacher account." },
      { property: "og:title", content: "Set new password — EduReport" },
      { property: "og:description", content: "Recover your EduReport school cloud account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setMsg("The two passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg(error.message);
    else navigate({ to: "/school-cloud" });
  }

  return (
    <main className="mx-auto max-w-sm px-4 pt-[calc(env(safe-area-inset-top)+3rem)]">
      <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-6">
        <h1 className="font-display text-xl font-bold">Set a new password</h1>
        <input required type="password" minLength={6} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        <input required type="password" minLength={6} placeholder="Type it again" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
        {msg && <p className="text-xs text-destructive">{msg}</p>}
        <button disabled={busy} className="h-10 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : "Save new password"}
        </button>
      </form>
    </main>
  );
}
