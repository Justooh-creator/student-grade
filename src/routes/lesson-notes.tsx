import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { useAppData } from "@/lib/store";
import { CLASS_LEVELS, getClassLevel, type ClassId } from "@/lib/ges";
import {
  CORE_COMPETENCIES, WEEKS_PER_TERM, loadNotes, newNote, noteKey, saveNotes, subjectsFor, termlyScheme, type LessonNote,
} from "@/lib/lessonNotes";

export const Route = createFileRoute("/lesson-notes")({
  head: () => ({
    meta: [
      { title: "NaCCA Lesson Notes — EduReport" },
      { name: "description", content: "Prepare NaCCA standard-based lesson notes for KG 1 to Basic 9 with a preloaded termly scheme." },
      { property: "og:title", content: "NaCCA Lesson Notes — EduReport" },
      { property: "og:description", content: "Weekly lesson notes synced to each class's subjects, with printable A4 output for vetting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonNotesPage,
});

const inp = "w-full rounded-md border border-border bg-card px-3 py-2";
const sel = "h-11 rounded-md border border-border bg-card px-3 font-bold";

function LessonNotesPage() {
  const { school } = useAppData();
  const [classId, setClassId] = useState<ClassId>("b4");
  const subjects = subjectsFor(classId);
  const [subject, setSubject] = useState(subjects[0]!);
  const [term, setTerm] = useState(1);
  const [week, setWeek] = useState(1);
  const [tab, setTab] = useState<"note" | "scheme">("note");
  const [previewing, setPreviewing] = useState(false);
  const [all, setAll] = useState<Record<string, LessonNote>>({});
  const [note, setNote] = useState<LessonNote>(() => newNote("b4", subjects[0]!, 1, 1));

  useEffect(() => {
    setAll(loadNotes());
    const t = Number(String(school.term ?? "").match(/\d/)?.[0]);
    if (t >= 1 && t <= 3) setTerm(t);
  }, [school.term]);

  useEffect(() => { if (!subjects.includes(subject)) setSubject(subjects[0]!); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const key = noteKey({ classId, subject, term, week });
  useEffect(() => {
    if (!subjects.includes(subject)) return;
    setNote(all[key] ?? newNote(classId, subject, term, week));
  }, [key, all]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheme = useMemo(() => termlyScheme(classId, subject, term), [classId, subject, term]);
  const set = <K extends keyof LessonNote>(k: K, v: LessonNote[K]) => setNote((n) => ({ ...n, [k]: v }));
  const save = () => { const next = { ...all, [key]: note }; setAll(next); saveNotes(next); toast.success("Lesson note saved"); };
  const reload = () => { setNote(newNote(classId, subject, term, week)); toast("Scheme content reloaded — tap Save to keep it"); };
  const copyLast = () => {
    const prev = all[noteKey({ classId, subject, term, week: week - 1 })];
    if (!prev) { toast("No saved note for last week"); return; }
    const row = scheme[week - 1]!;
    setNote({ ...prev, week, date: "", reflection: "", strand: row.strand, subStrand: row.subStrand, contentStandard: row.contentStandard, indicator: row.indicator });
    toast("Copied last week's note");
  };
  const className = getClassLevel(classId).name;

  const noteArticle = (
    <article className="space-y-2 bg-background p-4 text-sm">
      <h2 className="text-center text-lg font-bold">{school.name || "School"} — Lesson Note</h2>
      <table className="w-full border-collapse [&_td]:border [&_td]:border-border [&_td]:p-1">
        <tbody>
          <tr><td><b>Class:</b> {className}</td><td><b>Subject:</b> {subject}</td><td><b>Term/Week:</b> {term} / {week}</td></tr>
          <tr><td><b>Date:</b> {note.date}</td><td><b>Duration:</b> {note.duration}</td><td><b>Class size:</b> {note.classSize}</td></tr>
          <tr><td colSpan={3}><b>Strand:</b> {note.strand} &nbsp; <b>Sub-strand:</b> {note.subStrand}</td></tr>
          <tr><td colSpan={3}><b>Content standard:</b> {note.contentStandard} &nbsp; <b>Indicator:</b> {note.indicator}</td></tr>
          <tr><td colSpan={3}><b>Performance indicator:</b> {note.performanceIndicator}</td></tr>
          <tr><td colSpan={3}><b>Core competencies:</b> {note.competencies.join("; ")}</td></tr>
          <tr><td colSpan={3}><b>Keywords:</b> {note.keywords}</td></tr>
          <tr><td colSpan={3}><b>Resources:</b> {note.resources}</td></tr>
          <tr><td><b>Phase 1: Starter</b></td><td colSpan={2} className="whitespace-pre-wrap">{note.starter}</td></tr>
          <tr><td><b>Phase 2: Main</b></td><td colSpan={2} className="whitespace-pre-wrap">{note.main}</td></tr>
          <tr><td><b>Phase 3: Plenary</b></td><td colSpan={2} className="whitespace-pre-wrap">{note.plenary}</td></tr>
          <tr><td><b>Reflection</b></td><td colSpan={2} className="whitespace-pre-wrap">{note.reflection}</td></tr>
        </tbody>
      </table>
      <div className="flex justify-between pt-8">
        <span>Teacher: {note.teacher} ____________</span>
        <span>Vetted by Headteacher: ____________ Date: ______</span>
      </div>
    </article>
  );

  const Field = ({ label, k, rows }: { label: string; k: keyof LessonNote; rows?: number }) => (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      {rows ? (
        <textarea className={inp} rows={rows} value={String(note[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <input className={inp} value={String(note[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
      )}
    </label>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print"><AppHeader schoolName={school.name} term={school.term} year={school.academicYear} /></div>
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-5">
        <div className="no-print space-y-3">
          <h1 className="text-2xl font-bold">📝 NaCCA Lesson Notes</h1>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Class" className={sel} value={classId} onChange={(e) => setClassId(e.target.value as ClassId)}>
              {CLASS_LEVELS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select aria-label="Subject" className={sel} value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select aria-label="Term" className={sel} value={term} onChange={(e) => setTerm(Number(e.target.value))}>
              {[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}
            </select>
            <select aria-label="Week" className={sel} value={week} onChange={(e) => setWeek(Number(e.target.value))}>
              {Array.from({ length: WEEKS_PER_TERM }, (_, i) => <option key={i} value={i + 1}>Week {i + 1}{all[noteKey({ classId, subject, term, week: i + 1 })] ? " ✓" : ""}</option>)}
            </select>
          </div>
          <div className="flex overflow-hidden rounded-md border border-border w-fit">
            {(["note", "scheme"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 font-bold ${tab === t ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                {t === "note" ? "Lesson Note" : "Termly Scheme"}
              </button>
            ))}
          </div>
        </div>

        {tab === "scheme" ? (
          <section className="space-y-2">
            <h2 className="text-lg font-bold">{className} · {subject} · Term {term} Scheme of Learning</h2>
            <p className="no-print text-sm text-muted-foreground">Starter scheme following NaCCA strands. Confirm codes against your official scheme; tap a week to prepare its note.</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr>{["Wk", "Strand", "Sub-strand", "Content Std", "Indicator", "Resources"].map((h) => <th key={h} className="p-2 text-left font-bold">{h}</th>)}</tr></thead>
                <tbody>
                  {scheme.map((r) => (
                    <tr key={r.week} className="cursor-pointer border-t border-border hover:bg-accent" onClick={() => { setWeek(r.week); setTab("note"); }}>
                      <td className="p-2 font-bold">{r.week}</td><td className="p-2">{r.strand}</td><td className="p-2">{r.subStrand}</td>
                      <td className="p-2">{r.contentStandard}</td><td className="p-2">{r.indicator}</td><td className="p-2">{r.resources}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => window.print()} className="no-print rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground">🖨️ Print Scheme</button>
          </section>
        ) : (
          <>
            {!previewing ? (
            <section className="no-print space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block"><span className="mb-1 block text-sm font-bold">Date</span><input type="date" className={inp} value={note.date} onChange={(e) => set("date", e.target.value)} /></label>
                {Field({ label: "Duration", k: "duration" })}
                {Field({ label: "Class size", k: "classSize" })}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Field({ label: "Strand", k: "strand" })}{Field({ label: "Sub-strand", k: "subStrand" })}
                {Field({ label: "Content standard", k: "contentStandard" })}{Field({ label: "Indicator", k: "indicator" })}
              </div>
              {Field({ label: "Performance indicator", k: "performanceIndicator", rows: 2 })}
              <div>
                <span className="mb-1 block text-sm font-bold">Core competencies</span>
                <div className="grid gap-1 sm:grid-cols-2">
                  {CORE_COMPETENCIES.map((c) => (
                    <label key={c} className="flex items-center gap-2">
                      <input type="checkbox" className="h-5 w-5" checked={note.competencies.includes(c)}
                        onChange={(e) => set("competencies", e.target.checked ? [...note.competencies, c] : note.competencies.filter((x) => x !== c))} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Keywords / vocabulary" k="keywords" />
              {Field({ label: "Teaching & learning resources", k: "resources" })}
              {Field({ label: "Phase 1: Starter (10 mins)", k: "starter", rows: 3 })}
              <Field label="Phase 2: Main / New learning (40 mins)" k="main" rows={5} />
              <Field label="Phase 3: Plenary / Reflection (10 mins)" k="plenary" rows={3} />
              {Field({ label: "Teacher's reflection (after lesson)", k: "reflection", rows: 2 })}
              {Field({ label: "Teacher's name", k: "teacher" })}
              <div className="flex flex-wrap gap-2">
                <button onClick={save} className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground">💾 Save</button>
                <button onClick={() => setPreviewing(true)} className="rounded-md border border-border px-4 py-2 font-bold">👁️ Preview</button>
                <button onClick={() => window.print()} className="rounded-md border border-border px-4 py-2 font-bold">🖨️ Print A4</button>
                <button onClick={copyLast} disabled={week === 1} className="rounded-md border border-border px-4 py-2 font-bold disabled:opacity-50">Copy last week</button>
                <button onClick={reload} className="rounded-md border border-border px-4 py-2 font-bold">Reload from scheme</button>
              </div>
            </section>
            ) : (
              <section className="no-print space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setPreviewing(false)} className="rounded-md border border-border px-4 py-2 font-bold">✏️ Back to editing</button>
                  <button onClick={() => window.print()} className="rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground">🖨️ Print / Save PDF</button>
                </div>
                <p className="text-sm text-muted-foreground">This is exactly how the printed A4 lesson note will look.</p>
                <div className="rounded-lg border border-border bg-card p-2 sm:p-4">
                  <div className="mx-auto w-full max-w-[210mm] rounded-md bg-background shadow-md">
                    {noteArticle}
                  </div>
                </div>
              </section>
            )}

            <div className="print-only hidden print:block">{noteArticle}</div>
          </>
        )}
      </main>
    </div>
  );
}
