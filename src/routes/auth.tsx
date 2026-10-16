import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { signupNextStep } from "@/lib/accountAccess";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign up or sign in — EduReport Ghana" },
      { name: "description", content: "Create your EduReport teacher account or sign in to manage school details, learners and GES assessments." },
      { property: "og:title", content: "Sign up or sign in — EduReport Ghana" },
      { property: "og:description", content: "Your EduReport account for Ghanaian basic-school assessments and report cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "author", content: "Justice Atideku" },
      { property: "og:url", content: "https://edureportghana.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://edureportghana.com/auth" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "EduReport Ghana",
          url: "https://edureportghana.com",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web, Android",
          description:
            "School management and SBA report-card app for Ghanaian basic schools (KG 1 – Basic 9).",
          offers: { "@type": "Offer", price: "0", priceCurrency: "GHS" },
          author: {
            "@type": "Person",
            name: "Justice Atideku",
            jobTitle: "Classroom Teacher & Software Developer",
            email: "mailto:jatideku@gmail.com",
            address: { "@type": "PostalAddress", addressLocality: "South Tongu", addressCountry: "GH" },
          },
        }),
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
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

  async function openApp() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      showMessage(error?.message ?? "Please sign in to continue.", true);
      return;
    }
    await navigate({ to: "/setup", replace: true });
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
          <img src="/icon-192.png" alt="EduReport logo" className="h-12 w-12 rounded-md object-contain" />
          <div><p className="font-display text-lg font-bold">EduReport Ghana</p><p className="text-sm text-primary-foreground/80">School Management and SBA</p></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-5 py-10 sm:py-14">
        <h1 className="font-display text-3xl font-bold text-foreground">{user ? "Your account" : mode === "up" ? "Sign up" : "Welcome back"}</h1>
        {!user && <p className="mt-3 text-base text-muted-foreground">Welcome to EduReport Ghana — School Management and SBA.</p>}
        {!ready ? <p className="mt-8 flex items-center gap-2 text-muted-foreground" role="status"><LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" />Checking your account…</p> : user ? (
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
              <Button disabled={busy} className="h-12 w-full">{busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />Please wait…</> : <>{mode === "up" ? "Sign up" : "Sign in"}<ArrowRight /></>}</Button>
            </form>
            <Button variant="link" className="mt-3 h-auto w-full whitespace-normal py-2 text-center" disabled={busy} onClick={() => { setMode(mode === "in" ? "up" : "in"); showMessage(""); }}>{mode === "up" ? "Already have an account? Sign in" : "New to EduReport? Sign up"}</Button>
            {mode === "in" && <Button variant="link" className="h-auto w-full py-2 text-muted-foreground" disabled={busy} onClick={forgotPassword}>Forgot password?</Button>}
          </div>
        )}
        {msg && <p role={errorMessage ? "alert" : "status"} className={`mt-4 text-sm ${errorMessage ? "text-destructive" : "text-primary"}`}>{msg}</p>}
        {!user && <p className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">No payment required to start.<br />An active license or gift code is required to print or save report PDFs.</p>}
        {!user && <footer className="mt-6 text-center text-xs text-muted-foreground"><p>🇬🇭 EduReport Ghana — Engineered by <strong className="text-foreground">Justice Atideku</strong></p><p>Classroom Teacher &amp; Software Developer • South Tongu, Ghana</p><p className="mt-1"><a href="https://wa.me/233530887628" target="_blank" rel="noreferrer" className="font-bold text-primary underline">Chat on WhatsApp</a> • <a href="mailto:jatideku@gmail.com" className="font-bold text-primary underline">Email: Click Here</a></p></footer>}
      </main>
    </div>
  );
}
