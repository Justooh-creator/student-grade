import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CLASS_LEVELS, type ClassId } from "@/lib/ges";

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

  return (
    <header className="no-print border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="font-display text-base font-semibold leading-tight sm:text-lg">
            {schoolName || "SBA Report Cards"}
          </p>
          <p className="num text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">
            GES · {term} · {year}
          </p>
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
              <option value="" disabled>
                Jump to class…
              </option>
              {CLASS_LEVELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
        </nav>
      </div>
    </header>
  );
}
