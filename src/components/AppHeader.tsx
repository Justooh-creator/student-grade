import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { CLASS_LEVELS, type ClassId } from "@/lib/ges";
import { useAppData } from "@/lib/store";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 1 1 7.98 4.41M20.05 3.94A11.3 11.3 0 0 0 12.05.63C5.8.63.72 5.7.72 11.95c0 2 .52 3.94 1.52 5.66L.63 23.37l5.9-1.55a11.3 11.3 0 0 0 5.41 1.38h.01c6.24 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
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
  activeClass?: ClassId;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showClassJump = pathname === "/" || pathname.startsWith("/report");
  const [open, setOpen] = useState(false);
  const { students } = useAppData();
  const navClass = activeClass ?? "b4";
  const classStudents = students.filter((s) => s.classId === navClass);

  return (
    <header className="no-print border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open quick navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/25 hover:bg-primary-foreground/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div>
            <p className="font-display text-base font-semibold leading-tight sm:text-lg">
              {schoolName || "SBA Report Cards"}
            </p>
            <p className="num text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">
              GES · {term} · {year}
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5">
          {showClassJump && (
            <select
              aria-label="Quick jump to class"
              value={activeClass ?? ""}
              onChange={(e) => {
                const c = e.target.value as ClassId;
                if (c) navigate({ to: "/", search: { class: c } });
              }}
              className="h-9 rounded-md border border-primary-foreground/25 bg-primary px-2 text-xs font-semibold text-primary-foreground outline-none [&>option]:text-foreground"
            >
              <option value="" disabled>Jump to class…</option>
              {CLASS_LEVELS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md border border-primary-foreground/25 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/10"
            activeProps={{ className: "bg-primary-foreground text-primary" }}
          >
            Score entry
          </Link>
          <Link
            to="/setup"
            className="rounded-md border border-primary-foreground/25 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/10"
            activeProps={{ className: "bg-primary-foreground text-primary" }}
          >
            School setup
          </Link>
          <a href="https://wa.me/233249931038" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/25 hover:bg-primary-foreground/10">
            <WhatsAppIcon />
          </a>
          <a href="mailto:jatideku@gmail.com" aria-label="Email" className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/25 hover:bg-primary-foreground/10">
            <MailIcon />
          </a>
        </nav>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative h-full w-72 overflow-y-auto bg-card p-4 text-foreground shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Quick navigation</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground">✕</button>
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pages</p>
            <div className="mt-1 grid gap-1">
              <Link to="/" onClick={() => setOpen(false)} className="rounded px-2 py-1.5 text-sm hover:bg-muted">Score entry</Link>
              <Link to="/setup" onClick={() => setOpen(false)} className="rounded px-2 py-1.5 text-sm hover:bg-muted">School setup</Link>
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Classes</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {CLASS_LEVELS.map((c) => (
                <Link
                  key={c.id}
                  to="/"
                  search={{ class: c.id }}
                  onClick={() => setOpen(false)}
                  className={c.id === navClass ? "rounded bg-primary px-1 py-1.5 text-center text-xs font-semibold text-primary-foreground" : "rounded border border-border px-1 py-1.5 text-center text-xs hover:bg-muted"}
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Report cards · {CLASS_LEVELS.find((c) => c.id === navClass)?.name}
            </p>
            <div className="mt-1 grid gap-0.5">
              {classStudents.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">No learners yet.</p>}
              {classStudents.map((s) => (
                <Link key={s.id} to="/report/$studentId" params={{ studentId: s.id }} onClick={() => setOpen(false)} className="truncate rounded px-2 py-1.5 text-sm hover:bg-muted">
                  {s.name}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
