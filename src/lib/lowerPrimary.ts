import type { Objective, SubjectBank } from "./questionBank";
import { JHS_OBJECTIVE_COUNT } from "./qaRules";
import { LOWER_FACTS, type LowerClass } from "./lowerPrimaryContent";
import { lowerLanguageWritten, lowerSubjectWritten } from "./lowerPrimaryWritten";

export function generateLowerPrimaryPack(classId: LowerClass, subject: string, seed: number, previous?: SubjectBank): SubjectBank {
  const grade = Number(classId.slice(1));
  const facts = LOWER_FACTS[subject]?.filter((f) => (f[3] ?? 1) <= grade);
  if (!facts) throw new Error(`No Basic 1–3 content for ${subject}`);
  let state = (seed + grade * 997) >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffle = <T,>(values: readonly T[]) => values.map((value) => ({ value, rank: random() })).sort((a, b) => a.rank - b.rank).map((x) => x.value);
  const pool: (Objective & { grade: number })[] = [];
  const add = (q: string, correct: string, wrong: readonly string[], topic: string, fromGrade: number, explain: string) => {
    const choices = shuffle([...new Set(wrong)].filter((s) => s !== correct)).slice(0, 3);
    const options = shuffle([correct, ...choices]);
    const [a, b, c, d] = options;
    if (a === undefined || b === undefined || c === undefined || d === undefined) throw new Error("Four distinct choices required");
    pool.push({ id: "", q, options: [a, b, c, d], answer: options.indexOf(correct) as Objective["answer"], topic, explain, grade: fromGrade });
  };
  const names = shuffle(["Ama", "Kofi", "Sena", "Esi", "Abena", "Yao", "Adzo", "Kwame"]);
  const ewe = subject.includes("Eʋegbe");
  facts.forEach(([answer, clue, topic, fromGrade = 1], index) => {
    const peers = facts.filter((f) => f[2] === topic);
    const answers = peers.map((f) => f[0]);
    const clues = peers.map((f) => f[1]);
    const explanation = ewe ? `${answer}: ${clue}.` : `${clue} Answer: ${answer}.`;
    add(ewe ? `Nya kae fia "${clue}"?` : clue, answer, answers, topic, fromGrade, explanation);
    add(ewe ? `"${answer}" gɔmee nye nuka le English me?` : `Choose the clue for "${answer}".`, clue, clues, topic, fromGrade, explanation);
    // A separate practice-card form enlarges the pool; each paper takes at most one form per fact.
    const name = names[index % names.length] ?? "Ama";
    add(ewe ? `${name} xlẽ nya "${answer}". Eƒe gɔmee nye nuka?` : `${name}'s question card says: "${clue}" Choose the answer.`, answer, answers, topic, fromGrade, explanation);
  });
  if (subject === "English Language") {
    const objects = ["cat", "dog", "book", "pen", "bag", "cup", "hat", "bed", "egg", "leg"];
    objects.forEach((word) => {
      add(`One ${word}, two ___.`, `${word}s`, [word, `${word}es`, `${word}ing`], "Word forms", 1, `Add s: ${word} → ${word}s.`);
      add(`Choose the correct word: I have ${word === "egg" ? "an" : "a"} ___.`, word, [`${word}s`, `${word}ing`, `${word}es`], "Word forms", 1, `One item uses the singular word ${word}.`);
    });
    const actions = [["read", "reads", "a book"], ["play", "plays", "a game"], ["eat", "eats", "rice"], ["wash", "washes", "a cup"], ["carry", "carries", "a bag"], ["walk", "walks", "to school"]];
    for (const name of names) for (const [base = "read", singular = "reads", object = "a book"] of actions) {
      add(`${name} ___ ${object} every day.`, singular, [base, `${base}ing`, "are"], "Sentences", 1, `One person: ${name} ${singular} ${object}.`);
      if (grade >= 2) add(`${name} and Esi ___ ${object} every day.`, base, [singular, `${base}ing`, "is"], "Sentences", 2, `Two people use ${base}.`);
    }
  }
  const old = new Set(previous?.objectives.map((q) => q.q) ?? []);
  const ranked = [...shuffle(pool.filter((q) => !old.has(q.q))), ...shuffle(pool.filter((q) => old.has(q.q)))];
  // Avoid testing the same fact twice in a paper, except distinct English sentence/word-form exercises.
  const selected: typeof pool = [];
  const used = new Set<string>();
  const take = (q: (typeof pool)[number]) => {
    const key = `${q.topic}:${q.explain}`;
    if (used.has(key) || selected.length >= JHS_OBJECTIVE_COUNT) return;
    used.add(key); selected.push(q);
  };
  // Grade-specific ideas are guaranteed instead of being lost through random sampling.
  if (grade > 1) ranked.filter((q) => q.grade === grade).forEach(take);
  ranked.forEach(take);
  // Small classes have fewer concepts: allow a second direction, never an identical question.
  const questions = new Set(selected.map((q) => q.q));
  for (const q of ranked) {
    if (selected.length >= JHS_OBJECTIVE_COUNT) break;
    if (!questions.has(q.q)) { selected.push(q); questions.add(q.q); }
  }
  if (selected.length !== JHS_OBJECTIVE_COUNT) throw new Error("Incomplete Basic 1–3 paper");
  const objectives = shuffle(selected).map(({ grade: _grade, ...q }, i) => ({ ...q, id: `${classId}-${subject}-${seed}-o${i}` }));
  const theory = subject === "English Language" || ewe ? lowerLanguageWritten(classId, ewe, seed) : lowerSubjectWritten(classId, subject, seed, shuffle([0, 1, 2, 3, 4, 5]));
  return { id: `${classId}-${subject}-${seed}`, classId, subject, objectives, theory };
}