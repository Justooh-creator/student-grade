import { toast } from "sonner";
import { KG_RATINGS, kgProgress, unratedKeys, type KgRatingCode } from "@/lib/kgMilestones";
import type { Student } from "@/lib/store";

/** Quick-tap VG / G / NI / NSA ratings for the current term's KG progress checklist. */
export function KgChecklist({ student, term, onSet }: { student: Student; term: string; onSet: (levels: Record<string, string | null>) => void }) {
  const progress = kgProgress(student, term);
  const remaining = unratedKeys(student, term);
  const tone: Record<KgRatingCode, string> = {
    VG: "border-primary bg-primary text-primary-foreground",
    G: "border-emerald-600 bg-emerald-600 text-white",
    NI: "border-amber-500 bg-amber-500 text-white",
    NSA: "border-destructive bg-destructive text-destructive-foreground",
  };
  return (
    <div className="mt-4 rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2">
        <p className="text-sm font-bold">{term} progress checklist · <span className="num">{progress.rated} / {progress.rows.length}</span> rated</p>
        <button
          type="button"
          disabled={remaining.length === 0}
          onClick={() => { onSet(Object.fromEntries(remaining.map((k) => [k, "G"]))); toast.success(`${remaining.length} item(s) marked Good`); }}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground hover:opacity-90 disabled:opacity-40"
        >
          Mark remaining as Good
        </button>
      </div>
      <ol className="divide-y divide-border">
        {progress.rows.map((row) => (
          <li key={row.key} className="grid gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="min-w-0 text-sm"><span className="num mr-1 font-bold text-muted-foreground">{row.n}.</span>{row.text}</p>
            <div className="flex shrink-0 gap-1" role="group" aria-label={`Rating for item ${row.n}`}>
              {KG_RATINGS.map((r) => {
                const on = row.rating === r.code;
                return (
                  <button
                    key={r.code}
                    type="button"
                    title={r.label}
                    aria-pressed={on}
                    onClick={() => onSet({ [row.key]: on ? null : r.code })}
                    className={`h-9 min-w-11 rounded-md border px-2 text-xs font-bold ${on ? tone[r.code] : "border-border bg-background hover:bg-muted"}`}
                  >
                    {r.code}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground">Tap a rating to choose it, tap it again to clear. {KG_RATINGS.map((r) => `${r.code} – ${r.label}`).join(" · ")}</p>
    </div>
  );
}
