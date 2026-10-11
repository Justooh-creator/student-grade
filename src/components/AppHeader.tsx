import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { CLASS_LEVELS, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useCloud } from "@/lib/cloud";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 1 1 7.98 4.41M20.05 3.94A11.3 11.3 0 0 0 12.05.63C5.8.63.72 5.7.72 11.95c0 2 .52 3.94 1.52 5.66L.63 23.37l5.9-1.55a11.3 11.3 0 0 0 5.41 1.38h.01c6.24 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

const tabBase = "whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold sm:text-sm";
const tabIdle = `${tabBase} border-transparent text-primary-foreground/70 hover:text-primary-foreground`;
const tabActive = `${tabBase} border-accent text-primary-foreground`;

export function AppHeader({
  schoolName,
  term,
  year,
  activeClass,
}: {
  schoolName: string;
  term: string;
  year: string;
  activeClass?: ClassId | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { students } = useAppData();
  const { user } = useUser();
  const cloud = useCloud();
  const navClass = activeClass ?? "b4";
  const classStudents = students.filter((s) => s.classId === navClass);

  const tabs = [
    { key: "setup", label: "School Details", active: pathname.startsWith("/setup") },
    { key: "students", label: "Student Details", active: pathname.startsWith("/students") },
    { key: "sba", label: "SBA Details", active: pathname === "/" },
    { key: "report", label: "Report", active: pathname.startsWith("/class-report") || pathname.startsWith("/report") },
  ] as const;

  return (
    <header className="no-print border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+2rem)]">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open quick navigation"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/25 hover:bg-primary-foreground/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <div className="flex-1">
          <p className="font-display text-base font-bold leading-tight sm:text-lg">{schoolName || "SBA Report Cards"}</p>
          <p className="num text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">GES · {term} · {year}</p>
        </div>
        <Link to="/school-cloud" className="rounded-full border border-primary-foreground/25 px-2.5 py-1 text-[11px] font-bold">
          {cloud.status === "synced" ? "● Cloud saved" : cloud.status === "saving" ? "○ Saving…" : cloud.status === "offline" ? "! Not saved" : cloud.status === "no-school" ? "Join school cloud" : cloud.status === "loading" ? "…" : "Offline mode"}
        </Link>
      </div>
      <nav className="mx-auto mt-2 flex max-w-5xl overflow-x-auto px-2">
        {tabs.map((t) => {
          const cls = t.active ? tabActive : tabIdle;
          if (t.key === "setup") return <Link key={t.key} to="/setup" search={{ class: navClass }} className={cls}>{t.label}</Link>;
          if (t.key === "students") return <Link key={t.key} to="/students" search={{ class: navClass }} className={cls}>{t.label}</Link>;
          if (t.key === "sba") return <Link key={t.key} to="/" search={{ class: navClass }} className={cls}>{t.label}</Link>;
          return <Link key={t.key} to="/class-report/$classId" params={{ classId: navClass }} className={cls}>{t.label}</Link>;
        })}
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full w-72 flex-col bg-card text-foreground shadow-xl"
          >
            <div className="flex-1 overflow-y-auto p-4 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold">Quick navigation</p>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground">✕</button>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Pages</p>
              <div className="mt-1 grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/school-cloud" className="rounded px-2 py-1.5 text-sm font-semibold hover:bg-muted">School Cloud</Link>
                <Link to="/setup" search={{ class: navClass }} className="rounded px-2 py-1.5 text-sm hover:bg-muted">School Details</Link>
                <Link to="/students" search={{ class: navClass }} className="rounded px-2 py-1.5 text-sm hover:bg-muted">Student Details</Link>
                <Link to="/" search={{ class: navClass }} className="rounded px-2 py-1.5 text-sm hover:bg-muted">SBA Details</Link>
                <Link to="/class-report/$classId" params={{ classId: navClass }} className="rounded px-2 py-1.5 text-sm hover:bg-muted">Report</Link>
                <Link to="/midterm-progress" search={{ class: navClass }} className="rounded px-2 py-1.5 text-sm font-semibold text-primary hover:bg-muted">💬 Mid-Term WhatsApp</Link>
                <Link to="/auth" className="rounded px-2 py-1.5 text-sm hover:bg-muted">{user ? "Account" : "Sign in"}</Link>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Classes</p>
              <select
                aria-label="Choose class"
                value={navClass}
                onChange={(e) => {
                  setOpen(false);
                  navigate({ to: "/", search: { class: e.target.value as ClassId } });
                }}
                className="mt-1 h-10 w-full rounded-md border border-border bg-card px-2 text-sm font-semibold outline-none focus:border-primary"
              >
                {CLASS_LEVELS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Learners · {CLASS_LEVELS.find((c) => c.id === navClass)?.name}
              </p>
              <div className="mt-1 grid gap-0.5">
                {classStudents.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">No learners yet.</p>}
                {classStudents.map((s) => (
                  <Link key={s.id} to="/" search={{ class: navClass, student: s.id }} onClick={() => setOpen(false)} className="truncate rounded px-2 py-1.5 text-sm hover:bg-muted">
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
            <p className="border-t border-border pt-3 text-center text-xs font-bold">Contacts</p>
            <div className="flex items-center justify-center gap-3 p-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <a href="https://wa.me/233249931038" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90">
                <WhatsAppIcon />
              </a>
              <a href="mailto:jatideku@gmail.com" aria-label="Email" className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90">
                <MailIcon />
              </a>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
