import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PrintButton } from "@/components/PaymentGate";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/lib/store";
import { BANKS, scoreQuiz, type SubjectBank } from "@/lib/questionBank";

export const Route = createFileRoute("/_authenticated/qa-hub")({
  head: () => ({ meta: [
    { title: "Q&A Hub — EduReport Ghana" },
    { name: "description", content: "Interactive BECE-style quizzes and printable exam papers with marking schemes." },
    { property: "og:title", content: "Q&A Hub — EduReport Ghana" },
    { property: "og:description", content: "Practice quizzes and A4 exam papers for Ghanaian basic schools." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: QaHub,
});

type Mode = "menu" | "quiz" | "paper" | "scheme";
const L = ["A", "B", "C", "D"];

function QaHub() {
  const { school } = useAppData();
  const [bank, setBank] = useState<SubjectBank>(BANKS[0]!);
  const [mode, setMode] = useState<Mode>("menu");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const result = scoreQuiz(bank.objectives, answers);

  const start = (m: Mode) => { setAnswers({}); setDone(false); setMode(m); };

  return <div className="min-h-screen bg-background pb-10">
    <AppHeader schoolName={school.name} term={school.term} year={school.academicYear} activeClass="b9" />
    <main className="mx-auto max-w-3xl px-4">
      <div className="no-print my-5 space-y-3">
        <h1 className="text-2xl font-black">📚 Questions & Answers Hub</h1>
        <p className="text-muted-foreground">Basic 9 (JHS 3) pilot · BECE-style practice. More classes coming.</p>
        <div className="flex flex-wrap gap-2">
          {BANKS.map((b) => <Button key={b.id} variant={b.id === bank.id ? "default" : "outline"} onClick={() => { setBank(b); setMode("menu"); }}>{b.subject}</Button>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => start("quiz")}>🎯 Interactive quiz (free)</Button>
          <Button variant="secondary" onClick={() => setMode("paper")}>📝 Exam paper</Button>
          <Button variant="secondary" onClick={() => setMode("scheme")}>✅ Marking scheme</Button>
          {(mode === "paper" || mode === "scheme") && <PrintButton label="Print / Save as PDF (A4)" />}
        </div>
      </div>

      {mode === "menu" && <p className="rounded-lg border p-4">{bank.objectives.length} objective and {bank.theory.length} theory questions ready. Choose an option above.</p>}

      {mode === "quiz" && <div className="space-y-4">
        {bank.objectives.map((q, i) => {
          const picked = answers[q.id];
          const show = picked !== undefined;
          return <div key={q.id} className="rounded-xl border bg-card p-4">
            <p className="mb-3 font-semibold">{i + 1}. {q.q} <span className="text-xs text-muted-foreground">({q.topic})</span></p>
            <div className="grid gap-2">
              {q.options.map((opt, j) => {
                const state = !show ? "" : j === q.answer ? "border-primary bg-primary/15" : j === picked ? "border-destructive bg-destructive/15" : "opacity-60";
                return <button key={j} disabled={show} onClick={() => setAnswers((a) => ({ ...a, [q.id]: j }))} className={`min-h-12 rounded-lg border-2 px-3 text-left text-base ${state}`}><b>{L[j]}.</b> {opt}</button>;
              })}
            </div>
            {show && <p className="mt-3 rounded-md bg-muted p-3 text-sm"><b>{picked === q.answer ? "✅ Correct." : `❌ Answer: ${L[q.answer]}.`}</b> {q.explain}</p>}
          </div>;
        })}
        <Button className="w-full" onClick={() => setDone(true)}>See my score</Button>
        {done && <div className="rounded-xl border-2 border-primary p-4 text-center">
          <p className="text-3xl font-black">{result.correct} / {result.total}</p>
          <p className="text-muted-foreground">{result.percent}% · {result.percent >= 80 ? "Excellent!" : result.percent >= 50 ? "Good effort — review the explanations." : "Keep practising."}</p>
          <Button variant="outline" className="mt-3" onClick={() => start("quiz")}>Try again</Button>
        </div>}
      </div>}

      {(mode === "paper" || mode === "scheme") && <article className="rounded-lg border bg-card p-6 text-card-foreground print:border-0">
        <header className="mb-4 border-b pb-3 text-center">
          <h2 className="text-lg font-black uppercase">{school.name || "School Name"}</h2>
          <p className="font-semibold">Basic 9 · {bank.subject} {mode === "scheme" ? "— Marking Scheme" : ""}</p>
          <p className="text-sm">{school.term} · {school.academicYear} · Time: 2 hours</p>
          {mode === "paper" && <p className="mt-2 text-sm italic">Answer all questions in Section A and all questions in Section B.</p>}
        </header>
        <h3 className="mb-2 font-bold">SECTION A — Objective ({bank.objectives.length} marks)</h3>
        <ol className="mb-5 list-decimal space-y-2 pl-6">
          {bank.objectives.map((q) => <li key={q.id}>{q.q}
            {mode === "paper"
              ? <div className="grid grid-cols-2 gap-x-4 text-sm">{q.options.map((opt, j) => <span key={j}>{L[j]}. {opt}</span>)}</div>
              : <p className="text-sm"><b>{L[q.answer]}</b> — {q.explain}</p>}
          </li>)}
        </ol>
        <h3 className="mb-2 font-bold">SECTION B — Theory</h3>
        <ol className="list-decimal space-y-3 pl-6">
          {bank.theory.map((t) => <li key={t.id}>{t.q} <b>[{t.marks} marks]</b>
            {mode === "scheme" && <ul className="mt-1 list-disc pl-5 text-sm">{t.scheme.map((s) => <li key={s}>{s}</li>)}</ul>}
          </li>)}
        </ol>
      </article>}
    </main>
  </div>;
}
