import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Download, FilePlus2, Printer, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { LessonNoteSheet } from "@/components/LessonNoteSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUser } from "@/lib/auth";
import { useAppData } from "@/lib/store";
import { schoolClassIds, classDisplayName, getClassLevel, type ClassId } from "@/lib/ges";
import { downloadBlob } from "@/lib/download";
import { applyCatalogEntry, catalogFor, catalogSubjects } from "@/lib/lessonCatalog";
import { blankLesson, lessonMinutes, lessonStorageKey, parseLessonNotes, saveLessonNote, scannedComputingExample, type LessonNote } from "@/lib/lessonNotes";

export const Route = createFileRoute("/_authenticated/lesson-notes")({
  head: () => ({ meta: [
    { title: "Weekly Lesson Notes — EduReport Ghana" },
    { name: "description", content: "Private offline weekly lesson preparation with curriculum indicators, learning activities and editable A4 documents." },
    { property: "og:title", content: "Weekly Lesson Notes — EduReport Ghana" },
    { property: "og:description", content: "Prepare and save weekly lesson notes for Ghanaian basic-school teaching." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }), component: LessonNotes,
});

function LessonNotes() {
  const { school } = useAppData();
  const { user } = useUser();
  const [note, setNote] = useState<LessonNote>(() => blankLesson());
  const [drafts, setDrafts] = useState<LessonNote[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("preview")
  const [term, setTerm] = useState(1);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!user) return;
    let saved: LessonNote[] = [];
    try { saved = parseLessonNotes(localStorage.getItem(lessonStorageKey(user.id))); } catch { toast.error("Device storage is unavailable."); }
    setDrafts(saved); setNote(saved[0] ?? blankLesson(school.name)); setReady(true);
  }, [user?.id]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  const update = (key: keyof LessonNote, value: string) => { setNote((n) => ({ ...n, [key]: value })); setDirty(true); };
  const switchNote = (next: LessonNote) => { if (dirty && !window.confirm("Discard unsaved changes?")) return; setNote(next); setDirty(false); };
  function save() {
    if (!user) return;
    const id = note.id || crypto.randomUUID();
    const saved = saveLessonNote(drafts, note, id);
    try { localStorage.setItem(lessonStorageKey(user.id), JSON.stringify(saved)); setDrafts(saved); setNote({ ...note, id }); setDirty(false); toast.success("Lesson note saved on this device."); } catch { toast.error("Could not save. Device storage may be full."); }
  }
  function remove() {
    if (!user || !note.id || !window.confirm("Delete this saved lesson note?")) return;
    const saved = drafts.filter((d) => d.id !== note.id);
    try { localStorage.setItem(lessonStorageKey(user.id), JSON.stringify(saved)); setDrafts(saved); setNote(saved[0] ?? blankLesson(school.name)); setDirty(false); } catch { toast.error("Could not delete the saved note."); }
  }
  async function word() {
    setBusy(true);
    try { const { createLessonWordBlob } = await import("@/lib/lessonWord"); downloadBlob(await createLessonWordBlob(note), `${(note.title || "Weekly lesson note").replace(/[^a-z0-9 -]/gi, "_")}.docx`); } catch { toast.error("Word download failed. Please try again."); } finally { setBusy(false); }
  }
  const field = (key: keyof LessonNote, label: string, multiline = false, type = "text") => <label key={key} className="grid gap-1.5 text-sm font-semibold">{label}{multiline ? <Textarea rows={key === "main" ? 9 : 4} value={note[key]} onChange={(e) => update(key, e.target.value)} /> : <Input type={type} min={type === "number" ? 0 : undefined} value={note[key]} onChange={(e) => update(key, e.target.value)} />}</label>;
  if (!ready) return <p className="p-6" role="status">Opening lesson notes…</p>;
  return <div className="min-h-screen bg-background pb-12">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={note.classId as ClassId} />
    <main className="mx-auto max-w-5xl px-4">
      <div className="no-print border-b border-border py-5">
        <h1 className="flex items-center gap-2 text-2xl"><BookOpen className="text-primary" />Weekly Lesson Notes</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => switchNote(blankLesson(school.name))}><FilePlus2 />New</Button>
          <Button onClick={save}><Save />Save note</Button>
          <Button variant="outline" onClick={() => setView(view === "edit" ? "preview" : "edit")}>{view === "edit" ? "A4 preview" : "Edit note"}</Button>
          <Button variant="outline" onClick={word} disabled={busy}><Download />{busy ? "Preparing Word…" : "Word (.docx)"}</Button>
          <Button variant="outline" onClick={() => { setView("preview"); requestAnimationFrame(() => requestAnimationFrame(() => window.print())); }}><Printer />Print / Save PDF</Button>
          {note.id && <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete note" title="Delete note"><Trash2 /></Button>}
        </div>
        <p className="mt-3 text-sm text-muted-foreground" role="status">{dirty ? "Unsaved changes" : "Saved notes stay on this device"}</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-sm font-semibold">Saved notes<select aria-label="Saved notes" className="mt-1 w-full rounded-md border border-input bg-card p-2" value={note.id} onChange={(e) => { const saved = drafts.find((d) => d.id === e.target.value); if (saved) switchNote(saved); }}><option value="">New note</option>{drafts.map((d) => <option key={d.id} value={d.id}>{d.title || d.subject} · {classDisplayName(d.classId)} · {d.weekEnding || "No date"}</option>)}</select></label>
          <Button variant="secondary" onClick={() => switchNote(scannedComputingExample(school.name))}>Your scanned example</Button>
        </div>
      </div>
      <section className="no-print mt-4 rounded-lg border border-border bg-card p-4" aria-label="Select lesson">
        <h2 className="text-lg font-bold">Select your lesson — no typing needed</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold">Class<select className="rounded-md border border-input bg-card p-2" value={note.classId} onChange={(e) => { update("classId", e.target.value); update("subject", catalogSubjects(e.target.value)[0] ?? note.subject); }}>{[...new Set([note.classId, ...schoolClassIds(school)])].map((id) => <option key={id} value={id}>{classDisplayName(id)}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Subject<select className="rounded-md border border-input bg-card p-2" value={note.subject} onChange={(e) => update("subject", e.target.value)}>{[...new Set([note.subject, ...catalogSubjects(note.classId)])].map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Term<select className="rounded-md border border-input bg-card p-2" value={term} onChange={(e) => setTerm(Number(e.target.value))}>{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Week / topic<select className="rounded-md border border-input bg-card p-2" value="" onChange={(e) => { const entry = catalogFor(note.classId, note.subject, term)[Number(e.target.value)]; if (entry) { setNote(applyCatalogEntry(note, entry)); setDirty(true); setView("preview"); } }}><option value="">Choose week…</option>{catalogFor(note.classId, note.subject, term).map((e, i) => <option key={i} value={i}>Week {e.week} — {e.fill.title}</option>)}</select></label>
          {field("classSize", "Class size", false, "number")}{field("weekEnding", "Week ending", false, "date")}{field("vettedBy", "Vetted by")}{field("schoolName", "School")}
        </div>
        {catalogFor(note.classId, note.subject, term).length === 0 && <p className="mt-2 text-sm text-muted-foreground">No preloaded weeks yet for this class, subject and term. Use “Edit note” to fill it in.</p>}
        <p className="mt-2 text-xs text-muted-foreground">Preloaded weeks are EduReport drafts. Confirm curriculum codes with your current NaCCA curriculum.</p>
      </section>
      {view === "edit" && <div className="no-print py-4">
        <Accordion type="multiple" defaultValue={["details", "curriculum"]}>
          <AccordionItem value="details"><AccordionTrigger className="text-base font-bold">Lesson details</AccordionTrigger><AccordionContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {field("title", "Lesson title")}{field("schoolName", "School")}{field("weekEnding", "Week ending", false, "date")}
            <label className="grid gap-1.5 text-sm font-semibold">Day<select value={note.day} onChange={(e) => update("day", e.target.value)} className="rounded-md border border-input bg-card p-2">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => <option key={day}>{day}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Class<select value={note.classId} onChange={(e) => { update("classId", e.target.value); update("subject", getClassLevel(e.target.value as ClassId).subjects[0] ?? "Mathematics"); }} className="rounded-md border border-input bg-card p-2">{[...new Set([note.classId, ...schoolClassIds(school)])].map((id) => <option key={id} value={id}>{classDisplayName(id)}</option>)}</select></label>
            <label className="grid gap-1.5 text-sm font-semibold">Subject<select value={note.subject} onChange={(e) => update("subject", e.target.value)} className="rounded-md border border-input bg-card p-2">{[...new Set([note.subject, ...getClassLevel(note.classId as ClassId).subjects])].map((subject) => <option key={subject}>{subject}</option>)}</select></label>
            {field("classSize", "Class size", false, "number")}{field("duration", "Duration (minutes)", false, "number")}{field("lesson", "Lesson number")}
          </div></AccordionContent></AccordionItem>
          <AccordionItem value="curriculum"><AccordionTrigger className="text-base font-bold">Curriculum & learning outcomes</AccordionTrigger><AccordionContent><div className="grid gap-4 sm:grid-cols-2">
            {field("strand", "Strand")}{field("subStrand", "Sub-strand")}{field("contentStandard", "Content standard (code & text)", true)}{field("indicator", "Indicator (code & text)", true)}{field("performanceIndicator", "Performance indicator", true)}{field("competencies", "Core competencies", true)}{field("newWords", "New words")}{field("reference", "Curriculum reference")}
          </div></AccordionContent></AccordionItem>
          <AccordionItem value="activities"><AccordionTrigger className="text-base font-bold">Activities, assessment & reflection</AccordionTrigger><AccordionContent><div className="grid gap-4 sm:grid-cols-3">{field("starterMinutes", "Starter minutes", false, "number")}{field("mainMinutes", "Main minutes", false, "number")}{field("reflectionMinutes", "Reflection minutes", false, "number")}</div>
            {lessonMinutes(note) !== Number(note.duration) && <p role="alert" className="my-3 text-sm text-destructive">Activities total {lessonMinutes(note)} minutes; lesson duration is {note.duration} minutes.</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{field("starter", "Starter", true)}{field("main", "Main activities", true)}{field("assessment", "Assessment", true)}{field("reflection", "Reflection", true)}{field("resources", "Resources", true)}{field("progression", "Progression", true)}</div>
          </AccordionContent></AccordionItem>
          <AccordionItem value="followup"><AccordionTrigger className="text-base font-bold">Follow-up & vetting</AccordionTrigger><AccordionContent><div className="grid gap-4 sm:grid-cols-2">{field("homework", "Homework / Project Work / Community Engagement", true)}{field("crossCurriculum", "Cross-Curriculum Links / Cross-Cutting Issues", true)}{field("misconceptions", "Potential Misconceptions / Learning Difficulties", true)}{field("vettedBy", "Vetted by")}{field("signature", "Signature / name")}{field("vettedDate", "Vetting date", false, "date")}</div></AccordionContent></AccordionItem>
        </Accordion>
      </div>}
      <div className={view === "edit" ? "hidden print:block" : "lesson-preview-wrap py-6 print:p-0"}><LessonNoteSheet note={note} /></div>
    </main>
  </div>;
}