import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { FingerprintSetting } from "@/components/FingerprintSetting";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useCloud } from "@/lib/cloud";
import { getTheme, setTheme, type ThemeChoice } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EduReport Ghana" },
      { name: "description", content: "Choose dark mode, set up fingerprint unlock and manage your EduReport preferences." },
      { property: "og:title", content: "Settings — EduReport Ghana" },
      { property: "og:description", content: "Appearance, fingerprint unlock and account preferences for teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const THEMES: { id: ThemeChoice; label: string; desc: string }[] = [
  { id: "light", label: "☀️ Light", desc: "Bright paper look" },
  { id: "dark", label: "🌙 Dark", desc: "Easy on the eyes at night" },
  { id: "system", label: "📱 Phone default", desc: "Follow your phone setting" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 font-display text-base font-bold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function SettingsPage() {
  const { school } = useAppData();
  const { user } = useUser();
  const cloud = useCloud();
  const [theme, setChoice] = useState<ThemeChoice>("light");
  useEffect(() => setChoice(getTheme()), []);

  const choose = (t: ThemeChoice) => { setTheme(t); setChoice(t); };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <h1 className="font-display text-xl font-bold">⚙️ Settings</h1>

        <Section title="Appearance">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => choose(t.id)}
                className={`rounded-lg border-2 p-2 text-left transition-colors ${theme === t.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="block text-xs text-muted-foreground">{t.desc}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Printed reports and certificates always stay on white paper.</p>
        </Section>

        <Section title="Security: Fingerprint & Face Unlock">
          {user ? <FingerprintSetting userId={user.id} email={user.email ?? ""} /> : <p className="text-sm text-muted-foreground">Sign in to use fingerprint or face unlock.</p>}
          <p className="mt-2 text-xs text-muted-foreground">Uses your phone's own fingerprint or face recognition — whichever is set up. Your face and fingerprint stay inside your phone; EduReport never receives them.</p>
        </Section>

        <Section title="Account">
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Email</dt><dd className="truncate font-semibold">{user?.email ?? "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">School</dt><dd className="truncate font-semibold">{school.name || "—"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Role</dt><dd className="font-semibold capitalize">{cloud.role ?? "—"}</dd></div>
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button asChild variant="outline"><Link to="/auth">License & password</Link></Button>
            <Button asChild variant="outline"><Link to="/school-cloud">School Cloud</Link></Button>
          </div>
        </Section>

        <Section title="App">
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>🔄 Refresh app</Button>
          <p className="mt-2 text-xs text-muted-foreground">Use this if something looks out of date. Your saved records are not affected.</p>
        </Section>

        <Section title="Help & About">
          <p className="text-sm">🇬🇭 EduReport Ghana — A Product of <strong>JA EduTech Solutions</strong></p>
          <p className="mt-1 text-sm">
            <a href="https://wa.me/233530887628" target="_blank" rel="noreferrer" className="font-bold text-primary underline">Chat on WhatsApp</a>{" • "}
            <a href="mailto:support@edureportghana.com" className="font-bold text-primary underline">support@edureportghana.com</a>
          </p>
        </Section>
      </main>
    </div>
  );
}
