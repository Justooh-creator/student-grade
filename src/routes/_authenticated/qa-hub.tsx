import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PrintButton } from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/lib/store";
import { CLASS_LEVELS, classDisplayName, type ClassId } from "@/lib/ges";
import { BANKS, scoreQuiz, type SubjectBank } from "@/lib/questionBank";
import { freshMathSeed, generateMathPack, isMathClass, MATH_TOPICS, type MathTopicChoice } from "@/lib/dynamicMath";

export const Route = createFileRoute("/_authenticated/qa-hub")({
  head: () => ({ meta: [
    { title: "Q&A Hub — EduReport Ghana" },
    { name: "description", content: "Fresh Basic 4–9 Mathematics quizzes by topic and printable practice papers with worked marking schemes." },
    { property: "og:title", content: "Q&A Hub — EduReport Ghana" },
    { property: "og:description", content: "Interactive Mathematics practice and school exam papers for Ghanaian basic schools." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: QaHub,
});

type Mode = "menu" | "quiz" | "paper" | "scheme";
const L = ["A", "B", "C", "D"];

function QaHub() {
  const { school } = useAppData();
  const [classId, setClassId] = useState<ClassId>("b9");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState<MathTopicChoice>("all");
  const [bank, setBank] = useState<SubjectBank | null>(() => generateMathPack("b9", freshMathSeed()));
  const [mode, setMode] = useState<Mode>("menu");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [revision, setRevision] = useState(1);
  const math = subject === "Mathematics" && isMathClass(classId);
  const subjects = isMathClass(classId)
    ? ["Mathematics", ...BANKS.filter((b) => b.classId === classId && b.subject !== "Mathematics").map((b) => b.subject)]
    : [];
  const result = scoreQuiz(bank?.objectives ?? [], answers);
  const answered = Object.keys(answers).length;

  const reset = () => { setAnswers({}); setDone(false); };
  const newQuestions = () => {
    if (!isMathClass(classId) || !math) return;
    setBank(generateMathPack(classId, freshMathSeed(), topic, bank ?? undefined));
    setRevision((n) => n + 1);
    reset();
  };
  const selectClass = (id: ClassId) => {
    setClassId(id); setSubject("Mathematics"); setTopic("all"); setMode("menu"); reset();
    setBank(isMathClass(id) ? generateMathPack(id, freshMathSeed()) : null);
  };
  const selectSubject = (name: string) => {
    setSubject(name); setTopic("all"); setMode("menu"); reset();
    setBank(name === "Mathematics" && isMathClass(classId)
      ? generateMathPack(classId, freshMathSeed())
      : BANKS.find((b) => b.classId === classId && b.subject === name) ?? null);
  };
  const selectTopic = (value: string) => {
    const choice = value === "all" ? "all" : MATH_TOPICS.find((t) => t === value);
    if (!choice || !isMathClass(classId)) return;
    setTopic(choice); reset();
    setBank(generateMathPack(classId, freshMathSeed(), choice));
  };
  const startQuiz = () => { if (math) newQuestions(); else reset(); setMode("quiz"); };

  return <div className="min-h-screen bg-background pb-10 text-foreground">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
    <main className="mx-auto max-w-3xl px-4">
      <div className="no-print my-5 space-y-4">
        <h1 className="flex items-center gap-2 text-2xl font-black"><BookOpen className="size-6 shrink-0 text-primary" /> Questions & Answers Hub</h1>
        <section aria-label="Class selection">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">Class</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CLASS_LEVELS.map((c) => <Button key={c.id} aria-pressed={classId === c.id} variant={classId === c.id ? "default" : "outline"} className="h-11 px-2" onClick={() => selectClass(c.id)}>{c.name}</Button>)}
          </div>
        </section>
        {subjects.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Subjects">
          {subjects.map((name) => <Button key={name} aria-pressed={name === subject} variant={name === subject ? "default" : "outline"} className="h-auto min-h-11 whitespace-normal" onClick={() => selectSubject(name)}>{name}</Button>)}
        </div>}
        {math && <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <label id="math-topic-label" className="mb-1 block text-sm font-semibold">Topic</label>
            <Select value={topic} onValueChange={selectTopic}>
              <SelectTrigger aria-labelledby="math-topic-label" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All topics</SelectItem>{MATH_TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="h-11" onClick={newQuestions}><RefreshCw /> New Questions</Button>
        </div>}
        {bank && <>
          <p className="text-sm text-muted-foreground">{classDisplayName(classId)} · {bank.subject} · {bank.objectives.length} multiple-choice · {bank.theory.length} subjective</p>
          <p className="text-sm text-muted-foreground">🇬🇭 100% GES & NaCCA Curriculum Standard — Practice questions and worked marking schemes.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={mode === "quiz" ? "default" : "secondary"} className="h-11" onClick={startQuiz}>🎯 Interactive quiz (free)</Button>
            <Button variant={mode === "paper" ? "default" : "secondary"} className="h-11" onClick={() => setMode("paper")}>📝 Exam paper</Button>
            <Button variant={mode === "scheme" ? "default" : "secondary"} className="h-11" onClick={() => setMode("scheme")}>✅ Marking scheme</Button>
            {(mode === "paper" || mode === "scheme") && <PrintButton label="Print / Save as PDF (A4)" />}
          </div>
        </>}
        <span className="sr-only" role="status">Question set {revision}</span>
      </div>

      {!bank && <div className="py-8 text-center">
        <h2 className="text-xl font-bold">{classDisplayName(classId)}</h2>
        <p className="mt-2 text-muted-foreground">Questions for this class are not available yet.</p>
        <Button variant="outline" className="mt-4" onClick={() => selectClass("b7")}>Basic 7 Mathematics</Button>
      </div>}
      {bank && mode === "menu" && <div className="border-y border-border py-6">
        <h2 className="text-lg font-bold">{bank.subject} · {classDisplayName(classId)}</h2>
        <p className="mt-1 text-muted-foreground">{topic === "all" ? [...new Set(bank.objectives.map((q) => q.topic))].join(" · ") : topic}</p>
      </div>}

      {bank && mode === "quiz" && <div className="no-print space-y-4">
        <p className="font-semibold" aria-live="polite">{answered} / {bank.objectives.length} answered</p>
        {bank.objectives.map((q, i) => {
          const picked = answers[q.id];
          const show = picked !== undefined;
          return <div key={q.id} className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 font-semibold">{i + 1}. {q.q} <span className="text-xs text-muted-foreground">({q.topic})</span></p>
            <div className="grid gap-2">
              {q.options.map((opt, j) => {
                const state = !show ? "" : j === q.answer ? "border-primary bg-primary/15" : j === picked ? "border-destructive bg-destructive/15" : "opacity-60";
                return <Button variant="outline" key={j} disabled={show} onClick={() => setAnswers((a) => ({ ...a, [q.id]: j }))} className={`h-auto min-h-12 justify-start whitespace-normal rounded-md border-2 px-3 text-left text-base disabled:opacity-100 ${state}`}><b>{L[j]}.</b> {opt}</Button>;
              })}
            </div>
            {show && <p className="mt-3 rounded-md bg-muted p-3 text-sm" role="status"><b>{picked === q.answer ? "✅ Correct." : `❌ Answer: ${L[q.answer]}.`}</b> {q.explain}</p>}
          </div>;
        })}
        <Button className="h-12 w-full" onClick={() => setDone(true)}>See my score</Button>
        {done && <div className="rounded-lg border-2 border-primary p-4 text-center" role="status">
          <p className="text-3xl font-black">{result.correct} / {result.total}</p>
          <p className="text-muted-foreground">{result.percent}% · {result.percent >= 80 ? "Excellent!" : result.percent >= 50 ? "Good effort — review the explanations." : "Keep practising."}</p>
          <p className="mt-1 text-sm text-muted-foreground">{result.total - answered} unanswered</p>
          <Button variant="outline" className="mt-3 h-11" onClick={startQuiz}>{math ? "Try fresh questions" : "Try again"}</Button>
        </div>}
      </div>}

      {bank && (mode === "paper" || mode === "scheme") && <article className="qa-paper border border-border bg-card p-5 text-card-foreground sm:p-6 print:border-0 print:p-0">
        <header className="mb-4 border-b border-border pb-3 text-center">
          <h2 className="text-lg font-black uppercase">{school.name || "School Name"}</h2>
          <p className="font-semibold">{classDisplayName(classId)} · {bank.subject} {mode === "scheme" ? "— Marking Scheme" : "— Practice Paper"}</p>
          <p className="text-sm">{school.term} · {school.academicYear} · Time: 2 hours</p>
          {topic !== "all" && <p className="text-sm">{topic}</p>}
          <p className="mt-1 text-xs">🇬🇭 100% GES & NaCCA Curriculum Standard — Practice questions and worked marking schemes.</p>
          {mode === "paper" && <><p className="mt-2 text-left text-sm">Name: ______________________________ Class: __________ Date: __________</p><p className="mt-2 text-sm italic">Answer all questions in Sections A and B. Show your working in Section B.</p></>}
        </header>
        <h3 className="mb-2 font-bold">SECTION A — Objective ({bank.objectives.length} marks)</h3>
        <ol className="mb-5 list-decimal space-y-3 pl-6">
          {bank.objectives.map((q) => <li key={q.id} className="break-inside-avoid">{q.q}
            {mode === "paper"
              ? <div className="mt-1 grid grid-cols-1 gap-x-4 text-sm sm:grid-cols-2 print:grid-cols-2">{q.options.map((opt, j) => <span key={j}>{L[j]}. {opt}</span>)}</div>
              : <p className="mt-1 text-sm"><b>{L[q.answer]}: {q.options[q.answer]}</b> — {q.explain}</p>}
          </li>)}
        </ol>
        <h3 className="mb-2 font-bold">SECTION B — Subjective ({bank.theory.reduce((sum, t) => sum + t.marks, 0)} marks)</h3>
        <ol className="list-decimal space-y-4 pl-6">
          {bank.theory.map((t) => <li key={t.id} className="break-inside-avoid">{t.q} <b>[{t.marks} marks]</b>
            {mode === "scheme" ? <ul className="mt-1 list-disc pl-5 text-sm">{t.scheme.map((s) => <li key={s}>{s}</li>)}</ul> : <div className="mt-3 space-y-5" aria-label="Answer space"><div className="border-b border-border" /><div className="border-b border-border" /><div className="border-b border-border" /></div>}
          </li>)}
        </ol>
      </article>}
    </main>
  </div>;
}
