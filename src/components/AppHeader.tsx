import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CLASS_LEVELS, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useCloud } from "@/lib/cloud";
import { useStaffNotices } from "@/lib/staffNotices";


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
  const { unread } = useStaffNotices();
  const navClass = activeClass ?? "b4";
  const [showFb, setShowFb] = useState(false);
  useEffect(() => {
    setShowFb(localStorage.getItem("edureport-fb-banner-v1") !== "dismissed");
  }, []);
  const dismissFb = () => {
    localStorage.setItem("edureport-fb-banner-v1", "dismissed");
    setShowFb(false);
  };
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
      {unread.length > 0 && !pathname.startsWith("/staff-meeting") && (
        <Link to="/staff-meeting" className="mx-auto mt-2 flex max-w-5xl items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">
          📣 {unread.length} new staff meeting notice{unread.length > 1 ? "s" : ""}: {unread[0]?.title} — tap to view
        </Link>
      )}
      {showFb && !pathname.startsWith("/feedback") && (
        <div className="mx-auto mt-2 flex max-w-5xl items-center gap-2 rounded-md bg-primary-foreground/10 px-3 py-2 text-xs font-bold">
          <Link to="/feedback" className="flex-1">💡 Help shape the next EduReport update! Tap here to share your suggestions.</Link>
          <button onClick={dismissFb} aria-label="Dismiss feedback banner" className="px-1">✕</button>
        </div>
      )}
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
                <Link to="/pta-announcement" search={{ class: navClass }} className="rounded px-2 py-1.5 text-sm font-semibold text-primary hover:bg-muted">📢 PTA Meeting Notice</Link>
                <Link to="/staff-meeting" className="rounded px-2 py-1.5 text-sm font-semibold text-primary hover:bg-muted">📣 Staff Meeting{unread.length > 0 ? ` (${unread.length} new)` : ""}</Link>
                <Link to="/feedback" className="rounded px-2 py-1.5 text-sm font-semibold text-primary hover:bg-muted">💡 Help & Feedback</Link>
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
          </aside>
        </div>
      )}
    </header>
  );
}
