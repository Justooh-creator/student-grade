import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { signupNextStep } from "@/lib/accountAccess";
import { Button } from "@/components/ui/button";

export function AuthPage() {
  const { user, ready } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("edureport:remember-email");
    if (saved) setEmail(saved);
    else if (localStorage.getItem("edureport:remember-off")) setRemember(false);
  }, []);

  function saveRemember() {
    if (remember) { localStorage.setItem("edureport:remember-email", email.trim()); localStorage.removeItem("edureport:remember-off"); }
    else { localStorage.removeItem("edureport:remember-email"); localStorage.setItem("edureport:remember-off", "1"); }
  }

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) {
      void navigate({ to: "/reset-password", hash: window.location.hash, replace: true });
    }
  }, [navigate]);

  function showMessage(message: string, error = false) {
    setMsg(message);
    setErrorMessage(error);
  }

  const [entering, setEntering] = useState(false);
  async function openApp() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      showMessage("Please sign in to continue.", true);
      return;
    }
    setEntering(true);
    await navigate({ to: "/", replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    showMessage("");
    saveRemember();
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth`, data: { display_name: name.trim() } },
        });
        if (error) showMessage(error.message, true);
        else if (signupNextStep(data.session) === "confirm-email") {
          showMessage("Check your email to confirm your account, then sign in.");
          setMode("in");
          setPassword("");
        } else await openApp();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) showMessage(error.message, true);
        else await openApp();
      }
    } catch {
      showMessage("Could not connect. Check your internet and try again.", true);
    } finally { setBusy(false); }
  }

  async function forgotPassword() {
    if (!email.trim()) { showMessage("Enter your email address first.", true); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      showMessage(error ? error.message : "Check your email for a link to set a new password.", Boolean(error));
    } catch { showMessage("Could not send the email. Please try again.", true); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) { showMessage(error.message, true); return; }
      await navigate({ to: "/auth", replace: true });
    } finally { setBusy(false); }
  }

  const input = "mt-1.5 h-12 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary px-6 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <img src="/icon-192.png" alt="EduReport logo" className="h-14 w-14 rounded-md object-contain" />
          <div><p className="font-display text-2xl font-black tracking-tight sm:text-3xl">EduReport Ghana</p><p className="text-sm font-medium text-primary-foreground/90">School Management and SBA</p></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-5 py-10 sm:py-14">
        {!user && <p className="font-display text-3xl font-black tracking-tight text-primary sm:text-4xl">EduReport Ghana</p>}
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{user ? "Your account" : mode === "up" ? "Create Free Account" : "Welcome back"}</h1>
        {!user && <p className="mt-3 text-base text-muted-foreground">{mode === "up" ? "Official GES terminal report cards and SBA for KG 1 to Basic 9." : "Sign in to access your school records, SBA, and report cards."}</p>}
        {!user && (() => { const pill = "rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary whitespace-nowrap"; return <div className="mt-4 space-y-2 text-sm font-semibold"><div className="flex justify-between gap-2"><span className={pill}>🇬🇭 GES Standard</span><span className={pill}>⚡ Works Offline</span></div><div className="flex justify-center"><span className={pill}>📱 Phone &amp; Laptop</span></div></div>; })()}
        {!ready || entering ? <p className="mt-8 flex items-center gap-2 text-muted-foreground" role="status"><LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" />{entering ? "Opening EduReport…" : "Checking your account…"}</p> : user ? (
          <div className="mt-7 space-y-4">
            <p className="break-all text-sm text-muted-foreground">Signed in as <strong className="text-foreground">{user.email}</strong></p>
            <Button className="h-12 w-full" onClick={openApp} disabled={busy}>Continue to EduReport<ArrowRight /></Button>
            <Button variant="outline" className="h-12 w-full" onClick={signOut} disabled={busy}><LogOut />Sign out</Button>
          </div>
        ) : (
          <div className="mt-7">
            <form onSubmit={submit} className="space-y-4">
              {mode === "up" && <label className="block text-sm font-semibold">👤 Your name<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>}
              <label className="block text-sm font-semibold">📧 Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
              <label className="relative block text-sm font-semibold">🔒 Password<button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute bottom-2 right-3 text-xl">{showPw ? "🙈" : "👁️"}</button><input required type={showPw ? "text" : "password"} minLength={6} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input} /></label>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-primary" />Remember me</label>
              <Button disabled={busy} className="h-12 w-full">{busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />Please wait…</> : <>{mode === "up" ? "Create Free Account" : "Sign in"}<ArrowRight /></>}</Button>
            </form>
            <Button variant="link" className="mt-3 h-auto w-full whitespace-normal py-2 text-center" disabled={busy} onClick={() => { setMode(mode === "in" ? "up" : "in"); showMessage(""); }}>{mode === "up" ? "Already have an account? Sign in" : "New to EduReport? Sign up"}</Button>
            {mode === "in" && <Button variant="link" className="h-auto w-full py-2 text-muted-foreground" disabled={busy} onClick={forgotPassword}>Forgot password?</Button>}
          </div>
        )}
        {msg && <p role={errorMessage ? "alert" : "status"} className={`mt-4 text-sm ${errorMessage ? "text-destructive" : "text-primary"}`}>{msg}</p>}
        {!user && <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">No payment required to start.<br />An active license or gift code is required to print or save report PDFs.</p>}
        {!user && <footer className="mt-6 text-center text-xs text-muted-foreground"><p>🇬🇭 EduReport Ghana — Engineered by <strong className="text-foreground">Justice Atideku</strong></p><p>A Teacher &amp; Software Developer • South Tongu, Ghana</p><p className="mt-1"><a href="https://wa.me/233530887628" target="_blank" rel="noreferrer" className="font-bold text-primary underline">Chat on WhatsApp</a> • <a href="mailto:jatideku@gmail.com" className="font-bold text-primary underline">Email: Click Here</a></p></footer>}
        <p className="mt-4 text-center text-sm"><Link to="/privacy" className="text-primary underline">Privacy Policy</Link></p>
      </main>
    </div>
  );
}
