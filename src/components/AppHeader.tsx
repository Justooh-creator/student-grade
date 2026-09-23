import { Link } from "@tanstack/react-router";

export function AppHeader({ schoolName, term, year }: { schoolName: string; term: string; year: string }) {
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
        <nav className="flex items-center gap-1.5">
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
