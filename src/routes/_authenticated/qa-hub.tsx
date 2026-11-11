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
import { generateJhsPack, hasDynamicPack, isUpperPrimary, isEarlyClass } from "@/lib/dynamicJhs";
import { isJhsClass, quizPageRange, THEORY_REQUIRED } from "@/lib/qaRules";
import { freshMathSeed, generateMathPack, isMathClass, mathTopicLabel, MATH_TOPICS, type MathTopicChoice } from "@/lib/dynamicMath";
import { qaSubjects, qaBankSubject, GHANAIAN_LANGUAGES, theoryParts } from "@/lib/qaSubjects";

export const Route = createFileRoute("/_authenticated/qa-hub")({
  head: () => ({ meta: [
    { title: "Q&A Hub — EduReport Ghana" },
    { name: "description", content: "KG 1–Basic 9 numeracy and Mathematics quizzes, A4 practice papers and worked marking schemes." },
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
  const [language, setLanguage] = useState<string>("Eʋegbe");
  const [topic, setTopic] = useState<MathTopicChoice>("all");
  const [bank, setBank] = useState<SubjectBank | null>(() => generateMathPack("b9", freshMathSeed()));
  const [mode, setMode] = useState<Mode>("menu");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [revision, setRevision] = useState(1);
  const [page, setPage] = useState(0);
  const math = (subject === "Mathematics" || subject === "Numeracy") && isMathClass(classId);
  const kindergarten = classId.startsWith("kg");
  const jhs = isJhsClass(classId) || isUpperPrimary(classId) || isEarlyClass(classId);
  const dynamic = !!bank && (math || jhs);
  const english = (subject === "English Language" || subject === "Ghanaian Language") && jhs && bank?.theory.length === 5 && bank.theory[4]?.marks === 10;
  const subjects = qaSubjects(classId);
  const result = scoreQuiz(bank?.objectives ?? [], answers);
  const answered = Object.keys(answers).length;

  const reset = () => { setAnswers({}); setDone(false); setPage(0); };
  const makePack = (id: ClassId, name: string, prev?: SubjectBank): SubjectBank | null => {
    if ((isJhsClass(id) || isUpperPrimary(id) || isEarlyClass(id)) && name !== "Mathematics" && hasDynamicPack(id, name)) return generateJhsPack(id, name, freshMathSeed(), prev);
    if (name === "Mathematics" && isMathClass(id)) return generateMathPack(id, freshMathSeed(), "all", prev);
    return BANKS.find((b) => b.classId === id && b.subject === name) ?? null;
  };
  const newQuestions = () => {
    if (!dynamic) return;
    setBank(math && isMathClass(classId) ? generateMathPack(classId, freshMathSeed(), topic, bank ?? undefined) : makePack(classId, qaBankSubject(subject, language), bank ?? undefined));
    setRevision((n) => n + 1);
    reset();
  };
  const selectClass = (id: ClassId) => {
    setClassId(id); setSubject(id.startsWith("kg") ? "Numeracy" : "Mathematics"); setTopic("all"); setMode("menu"); reset();
    setBank(isMathClass(id) ? generateMathPack(id, freshMathSeed()) : null);
  };
  const selectSubject = (name: string) => {
    setSubject(name); setTopic("all"); setMode("menu"); reset();
    setBank(makePack(classId, qaBankSubject(name, language)));
  };
  const selectTopic = (value: string) => {
    const choice = value === "all" ? "all" : MATH_TOPICS.find((t) => t === value);
    if (!choice || !isMathClass(classId)) return;
    setTopic(choice); reset();
    setBank(generateMathPack(classId, freshMathSeed(), choice));
  };
  const startQuiz = () => { if (dynamic) newQuestions(); else reset(); setMode("quiz"); };

  return <div className="min-h-screen bg-background pb-10 text-foreground">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass={classId} />
    <main className="mx-auto max-w-3xl px-4">
      <div className="no-print my-5 space-y-4">
        <h1 className="flex items-center gap-2 text-2xl font-black"><BookOpen className="size-6 shrink-0 text-primary" /> Questions & Answers Hub</h1>
        <section aria-label="Class selection">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">Class</h2>
          <Select value={classId} onValueChange={(v) => { const c = CLASS_LEVELS.find((x) => x.id === v); if (c) selectClass(c.id); }}>
            <SelectTrigger aria-label="Class" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{CLASS_LEVELS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </section>
        {subjects.length > 0 && <section aria-label="Subject selection">
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">Subject</h2>
          <Select value={subject} onValueChange={selectSubject}>
            <SelectTrigger aria-label="Subject" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{subjects.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </section>}
        {subject === "Ghanaian Language" && <div>
          <label id="ghanaian-language-label" className="mb-1 block text-sm font-semibold">Ghanaian language</label>
          <Select value={language} onValueChange={(value) => { setLanguage(value); setMode("menu"); reset(); setBank(makePack(classId, qaBankSubject(subject, value))); }}>
            <SelectTrigger aria-labelledby="ghanaian-language-label"><SelectValue /></SelectTrigger>
            <SelectContent>{GHANAIAN_LANGUAGES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
          </Select>
        </div>}
        {dynamic && jhs && !math && <Button variant="outline" className="h-11" onClick={newQuestions}><RefreshCw /> New Questions</Button>}
        {math && <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <label id="math-topic-label" className="mb-1 block text-sm font-semibold">Topic</label>
            <Select value={topic} onValueChange={selectTopic}>
              <SelectTrigger aria-labelledby="math-topic-label" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All topics</SelectItem>{MATH_TOPICS.map((t) => <SelectItem key={t} value={t}>{mathTopicLabel(classId, t)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="h-11" onClick={newQuestions}><RefreshCw /> New Questions</Button>
        </div>}
        {bank && <>
          <p className="text-sm text-muted-foreground">{classDisplayName(classId)} · {bank.subject} · {bank.objectives.length} multiple-choice · {bank.theory.length} subjective</p>
          <p className="text-sm text-muted-foreground">Original revision practice · Not an official WAEC paper</p>
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
        <h2 className="text-xl font-bold">Updates Coming Soon</h2>
        <p className="mt-2 text-muted-foreground">{classDisplayName(classId)} · {subject === "Ghanaian Language" ? language : subject}</p>
        <p className="mt-1 text-muted-foreground">This question bank is being prepared.</p>
      </div>}
      {bank && mode === "menu" && <div className="border-y border-border py-6">
        <h2 className="text-lg font-bold">{bank.subject} · {classDisplayName(classId)}</h2>
        <p className="mt-1 text-muted-foreground">{topic === "all" ? [...new Set(bank.objectives.map((q) => mathTopicLabel(classId, q.topic)))].join(" · ") : mathTopicLabel(classId, topic)}</p>
      </div>}

      {bank && mode === "quiz" && <div className="no-print space-y-4">
        <p className="font-semibold" aria-live="polite">{answered} / {bank.objectives.length} answered</p>
        {(() => { const pr = quizPageRange(bank.objectives.length, page); return <>
        <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold">Questions {pr.start + 1}–{pr.end} of {bank.objectives.length}</span><span className="text-sm text-muted-foreground">Page {pr.current + 1} / {pr.pages}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${((pr.current + 1) / pr.pages) * 100}%` }} /></div>
        {bank.objectives.slice(pr.start, pr.end).map((q, k) => { const i = pr.start + k;
          const picked = answers[q.id];
          const show = picked !== undefined;
          return <div key={q.id} className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 break-words font-semibold">{i + 1}. {q.q} <span className="text-xs text-muted-foreground">({mathTopicLabel(classId, q.topic)})</span></p>
            <div className="grid gap-2">
              {q.options.map((opt, j) => {
                const state = !show ? "" : j === q.answer ? "border-primary bg-primary/15" : j === picked ? "border-destructive bg-destructive/15" : "opacity-60";
                return <Button variant="outline" key={j} disabled={show} onClick={() => setAnswers((a) => ({ ...a, [q.id]: j }))} className={`h-auto min-h-12 justify-start whitespace-normal rounded-md border-2 px-3 text-left text-base disabled:opacity-100 ${state}`}><b>{L[j]}.</b> {opt}</Button>;
              })}
            </div>
            {show && <p className="mt-3 rounded-md bg-muted p-3 text-sm" role="status"><b>{picked === q.answer ? "✅ Correct." : `❌ Answer: ${L[q.answer]}.`}</b> {q.explain}</p>}
          </div>;
        })}
        <div className="flex gap-2"><Button variant="outline" className="h-12 flex-1" disabled={pr.current === 0} onClick={() => { setPage(pr.current - 1); window.scrollTo({ top: 0 }); }}>← Previous</Button>
        {pr.current < pr.pages - 1 ? <Button className="h-12 flex-1" onClick={() => { setPage(pr.current + 1); window.scrollTo({ top: 0 }); }}>Next →</Button> : <Button className="h-12 flex-1" onClick={() => setDone(true)}>See my score</Button>}</div>
        </>; })()}
        {done && <div className="rounded-lg border-2 border-primary p-4 text-center" role="status">
          <p className="text-3xl font-black">{result.correct} / {result.total}</p>
          <p className="text-muted-foreground">{result.percent}% · {result.percent >= 80 ? "Excellent!" : result.percent >= 50 ? "Good effort — review the explanations." : "Keep practising."}</p>
          <p className="mt-1 text-sm text-muted-foreground">{result.total - answered} unanswered</p>
          <Button variant="outline" className="mt-3 h-11" onClick={startQuiz}>{dynamic ? "Try fresh questions" : "Try again"}</Button>
        </div>}
      </div>}

      {bank && (mode === "paper" || mode === "scheme") && <article className="qa-paper border border-border bg-card p-5 text-card-foreground sm:p-6 print:border-0 print:p-0">
        <header className="mb-4 border-b border-border pb-3 text-center">
          <h2 className="text-lg font-black uppercase">{school.name || "School Name"}</h2>
          <p className="font-semibold">{classDisplayName(classId)} · {bank.subject} {mode === "scheme" ? "— Marking Scheme" : "— Practice Paper"}</p>
          <p className="text-sm">{school.term} · {school.academicYear} · {kindergarten ? "Teacher-guided practice" : "Time: 2 hours"}</p>
          {topic !== "all" && <p className="text-sm">{topic}</p>}
          <p className="mt-1 text-xs">Original revision practice · Not an official WAEC paper</p>
          {mode === "paper" && <><p className="mt-2 text-left text-sm">Name: ______________________________ Class: __________ Date: __________</p><p className="mt-2 text-sm italic">{kindergarten ? "Teacher reads each question aloud. Learner may point, count or respond orally." : english ? "Answer ALL questions in Section A. In Section B, answer ONE composition question in Part A and ALL questions in Parts B and C." : jhs ? `Answer ALL questions in Section A. In Section B, answer Question 1 and any other ${THEORY_REQUIRED - 1} questions.` : "Answer all questions in Sections A and B. Show your working in Section B."}</p></>}
        </header>
        <h3 className="mb-2 font-bold">SECTION A — Objective ({bank.objectives.length} marks)</h3>
        <ol className="mb-5 list-decimal space-y-3 pl-6">
          {bank.objectives.map((q) => <li key={q.id} className="break-inside-avoid">{q.q}
            {mode === "paper"
              ? <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">{q.options.map((opt, j) => <span key={j} className={opt.length > 24 ? "basis-full" : "whitespace-nowrap"}><b>{L[j]}.</b> {opt}</span>)}</div>
              : <p className="mt-1 text-sm"><b>{L[q.answer]}: {q.options[q.answer]}</b> — {q.explain}</p>}
          </li>)}
        </ol>
        <h3 className="mb-2 font-bold">{kindergarten ? "SECTION B — Oral & Practical Observation" : english ? "SECTION B — Written Paper (70 marks)" : jhs ? `SECTION B — Subjective (${THEORY_REQUIRED * (bank.theory[0]?.marks ?? 20)} marks) · Question 1 is compulsory` : `SECTION B — Subjective (${bank.theory.reduce((sum, t) => sum + t.marks, 0)} marks)`}</h3>
        <ol className="space-y-4">
          {bank.theory.map((t, i) => <li key={t.id} className="break-inside-avoid">
            {english && (i === 0 || i === 3 || i === 4) && <h4 className="mb-3 border-b border-border pb-2 font-bold">{i === 0 ? "PART A — Composition (30 marks) · Answer ONE question" : i === 3 ? "PART B — Comprehension (30 marks) · Compulsory" : "PART C — Literature (10 marks) · Compulsory"}</h4>}
            <div className="flex items-start gap-3"><b className="shrink-0">{i + 1}.</b><div className="min-w-0 flex-1 space-y-2">{theoryParts(t.q).map((part, n) => <p key={n} className={`whitespace-pre-line ${/^\([a-z]\)/.test(part) ? "pl-4" : ""}`}>{part}</p>)}<b>{kindergarten ? "[Gold / Silver / Bronze]" : `[${t.marks} marks]`}</b></div></div>
            {mode === "scheme" ? <ul className="mt-1 list-disc pl-5 text-sm">{t.scheme.map((s) => <li key={s}>{s}</li>)}</ul> : <div className="mt-3 space-y-5" aria-label="Answer space"><div className="border-b border-border" /><div className="border-b border-border" /><div className="border-b border-border" /></div>}
          </li>)}
        </ol>
      </article>}
    </main>
  </div>;
}
