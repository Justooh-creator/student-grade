import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { CLASS_LEVELS, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";
import { useUser } from "@/lib/auth";
import { useCloud } from "@/lib/cloud";
import { useStaffNotices } from "@/lib/staffNotices";


const tabBase = "whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold sm:text-sm";
const tabIdle = `${tabBase} border-transparent text-primary-foreground/70 hover:text-primary-foreground`;
const tabActive = `${tabBase} border-accent text-primary-foreground`;

const rowCls = (active: boolean) =>
  `group flex items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
    active ? "border-accent/40 bg-accent/10" : "border-transparent hover:border-border hover:bg-muted"
  }`;

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      <span aria-hidden className="h-px w-4 bg-accent" />
      {children}
    </p>
  );
}

function RowCell({ icon, title, desc, note }: { icon: string; title: string; desc: string; note?: string }) {
  return (
    <>
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rotate-45 border border-accent/70 transition-all duration-200 group-hover:rotate-[135deg] group-hover:bg-accent/40"
      />
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-base">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted-foreground">{desc}</span>
      </span>
      {note ? (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
          {note}
        </span>
      ) : null}
    </>
  );
}

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
            className="relative flex h-full w-[19rem] max-w-[86vw] flex-col bg-card text-foreground shadow-2xl"
          >
            <div className="flex-1 overflow-y-auto p-4 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold">Quick navigation</p>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <SectionLabel>Pages</SectionLabel>
              <nav className="mt-2 grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/school-cloud" className={rowCls(pathname.startsWith("/school-cloud"))}>
                  <RowCell icon="☁️" title="School Cloud" desc="Join your school, sync records, assign teachers" />
                </Link>
                <Link to="/setup" search={{ class: navClass }} className={rowCls(pathname.startsWith("/setup"))}>
                  <RowCell icon="🏫" title="School Details" desc="Name, motto, EMIS code, logo, school dates" />
                </Link>
                <Link to="/students" search={{ class: navClass }} className={rowCls(pathname.startsWith("/students"))}>
                  <RowCell icon="🎓" title="Student Details" desc="Add learners, photos, parents and phone numbers" />
                </Link>
                <Link to="/" search={{ class: navClass }} className={rowCls(pathname === "/")}>
                  <RowCell icon="📝" title="SBA Details" desc="Class tests, project, group work and exam marks" />
                </Link>
                <Link
                  to="/class-report/$classId"
                  params={{ classId: navClass }}
                  className={rowCls(pathname.startsWith("/class-report") || pathname.startsWith("/report"))}
                >
                  <RowCell icon="📄" title="Report" desc="Preview, save PDF or print the whole class" />
                </Link>
                <Link to="/midterm-progress" search={{ class: navClass }} className={rowCls(pathname.startsWith("/midterm-progress"))}>
                  <RowCell icon="💬" title="Mid-Term WhatsApp" desc="Send parents a mid-term progress check-in" />
                </Link>
                <Link to="/pta-announcement" search={{ class: navClass }} className={rowCls(pathname.startsWith("/pta-announcement"))}>
                  <RowCell icon="📢" title="PTA Meeting Notice" desc="Invite parents to the meeting, class by class" />
                </Link>
                <Link to="/staff-meeting" className={rowCls(pathname.startsWith("/staff-meeting"))}>
                  <RowCell
                    icon="📣"
                    title="Staff Meeting"
                    desc="Notices to every teacher, with read receipts"
                    note={unread.length > 0 ? `${unread.length} new` : undefined}
                  />
                </Link>
                <Link to="/feedback" className={rowCls(pathname.startsWith("/feedback"))}>
                  <RowCell icon="💡" title="Help & Feedback" desc="Suggestions, bug reports and WhatsApp support" />
                </Link>
                <Link to="/auth" className={rowCls(pathname.startsWith("/auth"))}>
                  <RowCell
                    icon="👤"
                    title={user ? "Account" : "Sign in"}
                    desc={user ? "License, subscription and password recovery" : "Sign in to sync and activate EduReport"}
                  />
                </Link>
              </nav>

              <SectionLabel>Learners · {CLASS_LEVELS.find((c) => c.id === navClass)?.name}</SectionLabel>
              <div className="mt-2 grid gap-0.5">
                {classStudents.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">No learners yet.</p>}
                {classStudents.map((s) => (
                  <Link
                    key={s.id}
                    to="/"
                    search={{ class: navClass, student: s.id }}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full border border-primary/60 transition-colors group-hover:bg-primary" />
                    <span className="truncate text-sm">{s.name}</span>
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
