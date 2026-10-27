import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { type ClassId } from "@/lib/ges";
import { useUser } from "@/lib/auth";
import { useCloud } from "@/lib/cloud";
import { useStaffNotices } from "@/lib/staffNotices";
import { useDutyRosters } from "@/lib/dutyRoster";
import { useAppData } from "@/lib/store";
import { fmt12, useLessonAlerts } from "@/lib/timetable";


const tabBase = "whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold sm:text-sm";
const tabIdle = `${tabBase} border-transparent text-primary-foreground/70 hover:text-primary-foreground`;
const tabActive = `${tabBase} border-accent text-primary-foreground`;

const rowCls = (active: boolean) =>
  `group flex items-center gap-3 rounded-lg border border-l-4 px-2.5 py-2 text-left transition-colors ${
    active
      ? "is-active border-primary/50 border-l-primary bg-primary/10 shadow-sm"
      : "border-transparent hover:border-border hover:bg-muted"
  }`;

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      <span aria-hidden className="h-px w-4 bg-accent" />
      {children}
    </p>
  );
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICON = {
  cloud: (
    <Svg>
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 11.2 3.9 3.9 0 0 0 7 19h10.5Z" />
    </Svg>
  ),
  school: (
    <Svg>
      <path d="M4 10.5 12 5l8 5.5V20H4Z" />
      <path d="M9.5 20v-5h5v5" />
    </Svg>
  ),
  cap: (
    <Svg>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />
    </Svg>
  ),
  pencil: (
    <Svg>
      <path d="M4 20h4L18 10l-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </Svg>
  ),
  file: (
    <Svg>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h5" />
    </Svg>
  ),
  chat: (
    <Svg>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5.2A8 8 0 1 1 21 12Z" />
    </Svg>
  ),
  megaphone: (
    <Svg>
      <path d="M4 9v6h3l8 4V5L7 9H4Z" />
      <path d="M18 10a3 3 0 0 1 0 4" />
    </Svg>
  ),
  people: (
    <Svg>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.2A6 6 0 0 1 21 20" />
    </Svg>
  ),
  bulb: (
    <Svg>
      <path d="M9.5 18h5" />
      <path d="M10.5 21h3" />
      <path d="M12 3a6 6 0 0 0-3.4 10.9c.6.5.9 1.2.9 1.9V16h5v-.2c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3Z" />
    </Svg>
  ),
  user: (
    <Svg>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Svg>
  ),
};

function RowCell({ icon, title, desc, note }: { icon: ReactNode; title: string; desc: string; note?: string | undefined }) {
  return (
    <>
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rotate-45 border border-accent/70 transition-all duration-200 group-hover:rotate-[135deg] group-hover:bg-accent/40 group-[.is-active]:border-primary group-[.is-active]:bg-primary"
      />
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary group-[.is-active]:border-primary group-[.is-active]:bg-primary group-[.is-active]:text-primary-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold leading-tight tracking-tight group-[.is-active]:text-primary">{title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-muted-foreground">{desc}</span>
      </span>
      {note ? (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[12px] font-bold text-accent-foreground">
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
  const { user } = useUser();
  const cloud = useCloud();
  const { unread } = useStaffNotices();
  const { reminders: dutyReminders, nextWeek } = useDutyRosters();
  const { school: appSchool } = useAppData();
  const lessonAlerts = useLessonAlerts(appSchool, cloud.schoolId ? cloud.userId : null);
  const navClass = activeClass ?? "b4";
  const [showFb, setShowFb] = useState(false);
  useEffect(() => {
    setShowFb(localStorage.getItem("edureport-fb-banner-v1") !== "dismissed");
  }, []);
  const dismissFb = () => {
    localStorage.setItem("edureport-fb-banner-v1", "dismissed");
    setShowFb(false);
  };

  const tabs = [
    { key: "setup", label: "School Details", active: pathname.startsWith("/setup") },
    { key: "students", label: "Student Details", active: pathname.startsWith("/students") },
    { key: "sba", label: "SBA Details", active: (pathname === "/" || pathname === "/sba-details") },
    { key: "report", label: "Report", active: pathname.startsWith("/class-report") || pathname.startsWith("/report") },
  ] as const;

  return (
    <header className="no-print border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+2rem)]">
        <Button
          onClick={() => setOpen(true)}
          aria-label="Open quick navigation"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/25 hover:bg-primary-foreground/10"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </Button>
        <div className="flex-1">
          <p className="font-display text-base font-bold leading-tight sm:text-lg">{schoolName || "SBA Report Cards"}</p>
          <p className="num text-[12px] uppercase tracking-[0.18em] text-primary-foreground/60">GES · {term} · {year}</p>
        </div>
        <Link to="/school-cloud" className="rounded-full border border-primary-foreground/25 px-2.5 py-1 text-[13px] font-bold">
          {cloud.status === "synced" ? "● Cloud saved" : cloud.status === "saving" ? "○ Saving…" : cloud.status === "offline" ? "! Not saved" : cloud.status === "no-school" ? "Join school cloud" : cloud.status === "loading" ? "…" : "Offline mode"}
        </Link>
      </div>
      {unread.length > 0 && !pathname.startsWith("/staff-meeting") && (
        <Link to="/staff-meeting" className="mx-auto mt-2 flex max-w-5xl items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">
          📣 {unread.length} new staff meeting notice{unread.length > 1 ? "s" : ""}: {unread[0]?.title} — tap to view
        </Link>
      )}
      {lessonAlerts.map((a) => (
        <Link key={a.classId + a.start} to="/timetable" className="mx-auto mt-2 flex max-w-5xl items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">
          🔔 Lesson reminder: {a.className} — {a.subject} begins at {fmt12(a.start)}{a.minutes > 0 ? ` (in ${a.minutes} min)` : " (now)"}
        </Link>
      ))}
      {dutyReminders.length > 0 && !pathname.startsWith("/duty-roster") && (
        <Link to="/duty-roster" className="mx-auto mt-2 flex max-w-5xl items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">
          🗓️ You are on duty {dutyReminders[0]?.week_start === nextWeek ? "next week" : "this week"} — tap to view and acknowledge
        </Link>
      )}
      {showFb && !pathname.startsWith("/feedback") && (
        <div className="mx-auto mt-2 flex max-w-5xl items-center gap-2 rounded-md bg-primary-foreground/10 px-3 py-2 text-xs font-bold">
          <Link to="/feedback" className="flex-1">💡 Help shape the next EduReport update! Tap here to share your suggestions.</Link>
          <Button onClick={dismissFb} aria-label="Dismiss feedback banner" className="px-1">✕</Button>
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
                <Button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                >
                  ✕
                </Button>
              </div>

              <SectionLabel>Quick links</SectionLabel>
              <nav className="mt-2 grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/school-cloud" className={rowCls(pathname.startsWith("/school-cloud"))}>
                  <RowCell icon={ICON.cloud} title="School Cloud" desc="Join your school and sync records" />
                </Link>
              </nav>
              <Accordion type="single" collapsible defaultValue={pathname.startsWith("/qa-hub") || pathname.startsWith("/lesson-notes") ? "learning" : ["/staff-meeting", "/timetable", "/duty-roster", "/pta-announcement"].some((p) => pathname.startsWith(p)) ? "staff" : pathname.startsWith("/auth") || pathname.startsWith("/feedback") ? "account" : "records"}>
                <AccordionItem value="records">
                  <AccordionTrigger className="font-bold text-primary">Learners & Reports</AccordionTrigger>
                  <AccordionContent><nav className="grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/setup" search={{ class: navClass }} className={rowCls(pathname.startsWith("/setup"))}>
                  <RowCell icon={ICON.school} title="School Details" desc="Name, motto, EMIS code, logo" />
                </Link>
                <Link to="/students" search={{ class: navClass }} className={rowCls(pathname.startsWith("/students"))}>
                  <RowCell icon={ICON.cap} title="Student Details" desc="Learners, photos, parent numbers" />
                </Link>
                <Link to="/attendance" className={rowCls(pathname.startsWith("/attendance"))}>
                  <RowCell icon={ICON.people} title="Daily Attendance" desc="Daily class register and history" />
                </Link>
                <Link to="/" search={{ class: navClass }} className={rowCls((pathname === "/" || pathname === "/sba-details"))}>
                  <RowCell icon={ICON.pencil} title="SBA Details" desc="Tests, project, group, exam marks" />
                </Link>
                <Link
                  to="/class-report/$classId"
                  params={{ classId: navClass }}
                  className={rowCls(pathname.startsWith("/class-report") || pathname.startsWith("/report"))}
                >
                  <RowCell icon={ICON.file} title="Report" desc="Preview, save PDF, print class" />
                </Link>
                <Link to="/midterm-progress" search={{ class: navClass }} className={rowCls(pathname.startsWith("/midterm-progress"))}>
                  <RowCell icon={ICON.chat} title="Mid-Term WhatsApp" desc="Progress check-in to parents" />
                </Link>
                <Link to="/broadsheet" search={{ class: navClass }} className={rowCls(pathname.startsWith("/broadsheet"))}>
                  <RowCell icon={ICON.file} title="Class Broadsheet" desc="Master marks, grades and positions" />
                </Link>
                  </nav></AccordionContent>
                </AccordionItem>
                <AccordionItem value="learning">
                  <AccordionTrigger className="font-bold text-primary">Teaching & Learning</AccordionTrigger>
                  <AccordionContent><nav className="grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/qa-hub" className={rowCls(pathname.startsWith("/qa-hub"))}>
                  <RowCell icon={ICON.file} title="📚 Q&A Hub" desc="Quizzes, exam papers, marking schemes" />
                </Link>
                <Link to="/lesson-notes" className={rowCls(pathname.startsWith("/lesson-notes"))}>
                  <RowCell icon={ICON.pencil} title="Lesson Notes" desc="Weekly preparation, A4 PDF and Word" />
                </Link>
                  </nav></AccordionContent>
                </AccordionItem>
                <AccordionItem value="staff">
                  <AccordionTrigger className="font-bold text-primary">Staff & Communication {unread.length + dutyReminders.length > 0 && <span className="ml-2 rounded-full bg-accent px-2 text-xs text-accent-foreground">{unread.length + dutyReminders.length} new</span>}</AccordionTrigger>
                  <AccordionContent><nav className="grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/pta-announcement" search={{ class: navClass }} className={rowCls(pathname.startsWith("/pta-announcement"))}>
                  <RowCell icon={ICON.megaphone} title="PTA Meeting Notice" desc="Invite parents, class by class" />
                </Link>
                <Link to="/staff-meeting" className={rowCls(pathname.startsWith("/staff-meeting"))}>
                  <RowCell
                    icon={ICON.people}
                    title="Staff Meeting"
                    desc="Notices to all teachers"
                    note={unread.length > 0 ? `${unread.length} new` : undefined}
                  />
                </Link>
                <Link to="/timetable" className={rowCls(pathname.startsWith("/timetable"))}>
                  <RowCell icon={ICON.file} title="Class Timetable" desc="GES schedule, weekly & daily view" />
                </Link>
                <Link to="/duty-roster" className={rowCls(pathname.startsWith("/duty-roster"))}>
                  <RowCell
                    icon={ICON.people}
                    title="Duty Roster"
                    desc="Weekly teachers on duty"
                    note={dutyReminders.length > 0 ? `${dutyReminders.length} new` : undefined}
                  />
                </Link>
                  </nav></AccordionContent>
                </AccordionItem>
                <AccordionItem value="account">
                  <AccordionTrigger className="font-bold text-primary">Account & Support</AccordionTrigger>
                  <AccordionContent><nav className="grid gap-1" onClick={() => setOpen(false)}>
                <Link to="/feedback" className={rowCls(pathname.startsWith("/feedback"))}>
                  <RowCell icon={ICON.bulb} title="Help & Support" desc="Suggestions and support from JA EduTech Solutions" />
                </Link>
                <Link to="/auth" className={rowCls(pathname.startsWith("/auth"))}>
                  <RowCell
                    icon={ICON.user}
                    title={user ? "Account" : "Sign in"}
                    desc={user ? "License, plan, password recovery" : "Sign in to sync and activate"}
                  />
                </Link>
                  </nav></AccordionContent>
                </AccordionItem>
              </Accordion>
              <footer className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <p>🇬🇭 EduReport Ghana</p>
                <p>A Product of <strong className="text-foreground">JA EduTech Solutions</strong></p>
                <p>Practical digital tools for Ghanaian schools • South Tongu, Ghana</p>
                <p className="mt-1"><a href="https://wa.me/233530887628" target="_blank" rel="noreferrer" className="font-bold text-primary underline">Chat on WhatsApp</a> • <a href="mailto:jatideku@gmail.com" className="font-bold text-primary underline">Email: Click Here</a></p>
              </footer>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
