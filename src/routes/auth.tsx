import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Teacher sign in — SBA Report Cards" },
      { name: "description", content: "Sign in so you can send Basic 7–9 records to another teacher instantly." },
      { property: "og:title", content: "Teacher sign in — SBA Report Cards" },
      { property: "og:description", content: "Teacher accounts for sharing JHS learner records." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { school } = useAppData();
  const { user } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
      });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Account created. Check your email to confirm, then sign in.");
      else navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else navigate({ to: "/" });
    }
    setBusy(false);
  }

  const input = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-sm px-4 py-10">
        {user ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm">Signed in as <strong>{user.email}</strong></p>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}
              className="mt-4 h-10 w-full rounded-md border border-border text-sm font-semibold hover:bg-muted"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-6">
            <h1 className="font-display text-xl font-bold">{mode === "in" ? "Teacher sign in" : "Create teacher account"}</h1>
            <p className="text-xs text-muted-foreground">Needed to send Basic 7–9 records to another teacher.</p>
            {mode === "up" && (
              <input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
            )}
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            <input required type="password" minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            {msg && <p className="text-xs text-destructive">{msg}</p>}
            <button disabled={busy} className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
            <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }} className="w-full text-xs text-primary underline">
              {mode === "in" ? "New teacher? Create an account" : "Already have an account? Sign in"}
            </button>
            {mode === "in" && (
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) { setMsg("Type your email above first, then tap Forgot password."); return; }
                  setBusy(true);
                  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
                  setMsg(error ? error.message : "Check your email for a link to set a new password.");
                  setBusy(false);
                }}
                className="w-full text-xs font-semibold text-muted-foreground underline"
              >
                Forgot password?
              </button>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
