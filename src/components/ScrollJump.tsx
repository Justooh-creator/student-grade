import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";

/** Floating buttons to jump to the first or last learner on long lists. */
export function ScrollJump({ firstId, lastId }: { firstId?: string; lastId?: string }) {
  if (!firstId || !lastId) return null;
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const cls = "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90";
  return (
    <div className="no-print fixed bottom-5 right-4 z-30 flex flex-col gap-2">
      <button type="button" aria-label="Go to first learner" title="First learner" className={cls} onClick={() => go(firstId)}><ArrowUpToLine className="h-5 w-5" /></button>
      <button type="button" aria-label="Go to last learner" title="Last learner" className={cls} onClick={() => go(lastId)}><ArrowDownToLine className="h-5 w-5" /></button>
    </div>
  );
}
