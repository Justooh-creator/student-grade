import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, GraduationCap, BookOpen } from "lucide-react";
import { classDisplayName } from "@/lib/ges";
import { lessonCatalog, type CatalogEntry } from "@/lib/lessonCatalog";

const LEVELS = [
  { id: "kg", label: "Kindergarten", hint: "KG 1 – KG 2", match: (c: string) => c.startsWith("kg") },
  { id: "primary", label: "Basic School", hint: "Basic 1 – Basic 6", match: (c: string) => /^b[1-6]/.test(c) },
  { id: "jhs", label: "Junior High", hint: "Basic 7 – Basic 9", match: (c: string) => /^b[7-9]/.test(c) },
];
const STEPS = ["Level", "Class", "Subject", "Term", "Strand", "Sub-strand", "Lesson"];

const baseClass = (c: string) => c.replace(/[ab]$/i, "").replace(/^(b\d|kg\d).*/i, "$1").toLowerCase();

export function LessonWizard({ classIds, onPick }: { classIds: string[]; onPick: (entry: CatalogEntry, classId: string) => void }) {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<{ level?: string; classId?: string; subject?: string; term?: number; strand?: string; subStrand?: string }>({});
  const level = LEVELS.find((l) => l.id === sel.level);
  const classes = level ? [...new Set(classIds)].filter((c) => level.match(baseClass(c))) : [];
  const forClass = lessonCatalog.filter((e) => sel.classId && e.classIds.includes(baseClass(sel.classId)));
  const subjects = [...new Set(forClass.map((e) => e.subject))];
  const bySubject = forClass.filter((e) => e.subject === sel.subject);
  const terms = [...new Set(bySubject.map((e) => e.term))].sort();
  const byTerm = bySubject.filter((e) => e.term === sel.term);
  const strands = [...new Set(byTerm.map((e) => e.fill.strand ?? "General"))];
  const byStrand = byTerm.filter((e) => (e.fill.strand ?? "General") === sel.strand);
  const subs = [...new Set(byStrand.map((e) => e.fill.subStrand ?? "General"))];
  const lessons = byStrand.filter((e) => (e.fill.subStrand ?? "General") === sel.subStrand).sort((a, b) => a.week - b.week);

  const pick = (patch: typeof sel) => { setSel((s) => ({ ...s, ...patch })); setStep((n) => n + 1); };
  const card = (key: string, title: string, sub: string | undefined, onClick: () => void, active?: boolean) => (
    <button key={key} type="button" onClick={onClick} className={`flex min-h-20 w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/60"}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">{active ? <Check /> : step === 0 ? <GraduationCap /> : <BookOpen />}</span>
      <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span>{sub && <span className="block text-sm text-muted-foreground">{sub}</span>}</span>
      <ChevronRight className="shrink-0 text-muted-foreground" />
    </button>
  );
  const empty = (msg: string) => <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{msg}</p>;

  let body: React.ReactNode;
  if (step === 0) body = LEVELS.map((l) => card(l.id, l.label, l.hint, () => pick({ level: l.id }), sel.level === l.id));
  else if (step === 1) body = classes.length ? classes.map((c) => card(c, classDisplayName(c), undefined, () => pick({ classId: c }), sel.classId === c)) : empty("Your school has no classes at this level.");
  else if (step === 2) body = subjects.length ? subjects.map((s) => card(s, s, undefined, () => pick({ subject: s }), sel.subject === s)) : empty("No preloaded lessons for this class yet. More subjects are being added.");
  else if (step === 3) body = [1, 2, 3].map((t) => terms.includes(t as 1) ? card(`t${t}`, `Term ${t}`, undefined, () => pick({ term: t }), sel.term === t) : <div key={t} className="rounded-xl border border-border p-3 text-sm text-muted-foreground">Term {t} — coming soon</div>);
  else if (step === 4) body = strands.map((s) => card(s, s, undefined, () => pick({ strand: s }), sel.strand === s));
  else if (step === 5) body = subs.map((s) => card(s, s, undefined, () => pick({ subStrand: s }), sel.subStrand === s));
  else body = lessons.map((e, i) => card(`l${i}`, `Week ${e.week} — ${e.fill.title}`, e.fill.performanceIndicator, () => { onPick(e, sel.classId!); setStep(0); setSel({}); }));

  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  return (
    <div>
      <div className="flex items-center gap-2">
        {step > 0 && <button type="button" onClick={() => setStep((n) => n - 1)} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-border"><ArrowLeft className="h-4 w-4" /></button>}
        <div className="flex-1"><p className="font-bold">Select {STEPS[step]}</p><p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p></div>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{body}</div>
    </div>
  );
}
