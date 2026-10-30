import { JHS_CONTENT } from "./jhsContent";
import type { Objective, SubjectBank } from "./questionBank";
import { JHS_OBJECTIVE_COUNT, JHS_THEORY_COUNT, THEORY_MARKS } from "./qaRules";

export const JHS_SUBJECTS = ["Mathematics", "Integrated Science", "English Language", "Ghanaian Language (Eʋegbe)", "Social Studies", "Religious and Moral Education", "Computing", "Career Technology"] as const;
export function generateJhsPack(classId: "b7" | "b8" | "b9", subject: string, seed: number, previous?: SubjectBank): SubjectBank {
  const content = JHS_CONTENT[subject];
  if (!content) throw new Error(`No JHS content for ${subject}`);
  let state = (seed + Number(classId.slice(1)) * 997) >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffle = <T,>(items: readonly T[]): T[] => items.map((value) => ({ value, rank: random() })).sort((a, b) => a.rank - b.rank).map((v) => v.value);
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const pool: Objective[] = [];
  const add = (topic: string, q: string, correct: string, wrong: string[], explain: string) => {
    const options = shuffle([correct, ...shuffle([...new Set(wrong)].filter((w) => w !== correct)).slice(0, 3)]) as Objective["options"];
    if (options.length !== 4) throw new Error("Question needs four distinct options");
    pool.push({ id: "", topic, q, options, answer: options.indexOf(correct) as Objective["answer"], explain });
  };
  const ewe = subject.includes("Eʋegbe");
  for (const [term, meaning, topic] of content.facts) {
    add(topic, ewe ? `Nya kae fia "${meaning}" le Eʋegbe me?` : `Which term describes ${meaning}?`, term, content.facts.map((f) => f[0]), ewe ? `"${term}" fia "${meaning}".` : `${term}: ${meaning}.`);
    add(topic, ewe ? `Nya "${term}" gɔmee nye nuka le English me?` : `What is meant by "${term}"?`, meaning, content.facts.map((f) => f[1]), ewe ? `"${term}" fia "${meaning}".` : `${term} means ${meaning}.`);
  }
  const names = ["Ama", "Kofi", "Akosua", "Kwame", "Abena", "Yao", "Adzo", "Sena", "Esi"];
  for (let i = 0; i < 18; i++) {
    const name = names[i % names.length] ?? "Ama";
    const a = int(2, 20 + Number(classId.slice(1)) * 2), b = int(2, 12);
    if (subject === "English Language") {
      const plural = i % 2 === 0;
      const actions = [["read", "reads", "reading", "readed", "a book"], ["play", "plays", "playing", "playeds", "football"], ["walk", "walks", "walking", "walked", "to school"], ["wash", "washes", "washing", "washs", "the plates"], ["write", "writes", "writing", "writed", "a letter"]];
      const action = actions[i % actions.length];
      if (!action) continue;
      const [base = "read", singular = "reads", ing = "reading", other = "readed", object = "books"] = action;
      add("Grammar", `Choose the correct verb: ${name}${plural ? " and Kofi" : ""} ___ ${object} every day.`, plural ? base : singular, [plural ? singular : base, ing, other], `The subject is ${plural ? "plural, so use the base verb" : "singular, so use the third-person singular verb"}: ${plural ? base : singular}.`);
    } else if (subject === "Integrated Science") {
      const value = a * b;
      add("Energy", `A ${name === "Ama" ? "pupil" : "worker"} applies a force of ${a} N to move a box ${b} m in the force's direction. How much work is done?`, `${value} J`, [`${a + b} J`, `${value + a} J`, `${value - 1} J`], `Work = force × distance = ${a} × ${b} = ${value} J.`);
    } else if (subject === "Computing") {
      const fn = i % 3;
      const value = fn === 0 ? a + b : fn === 1 ? Math.max(a, b) : (a + b) / 2;
      const formula = ["SUM", "MAX", "AVERAGE"][fn];
      add("Spreadsheet", `In ${name}'s spreadsheet, A1 = ${a} and A2 = ${b}. What does =${formula}(A1:A2) return?`, String(value), [String(value + 1), String(value + 2), String(value + 3)], `${formula} ${fn === 0 ? "adds the values" : fn === 1 ? "returns the largest value" : "divides their sum by the count"}: ${value}.`);
    } else if (subject === "Career Technology") {
      const sales = a * b, costs = a;
      add("Entrepreneurship", `${name} sells ${b} items for GH₵ ${a} each. Total costs are GH₵ ${costs}. What is the profit?`, `GH₵ ${sales - costs}`, [`GH₵ ${sales}`, `GH₵ ${sales + costs}`, `GH₵ ${sales - costs + 1}`], `Revenue = ${b} × ${a} = ${sales}. Profit = revenue − total costs = GH₵ ${sales - costs}.`);
    } else if (ewe) {
      const verbs = [["yi", "go"], ["va", "come"], ["ŋlɔ", "write"], ["xlẽ", "read"], ["ɖu", "eat"]];
      const verb = verbs[i % verbs.length];
      if (!verb) continue;
      const [word = "yi", meaning = "go"] = verb;
      add("Gbeŋutise", `Dɔwɔnya kae le "${name} ${word}${word === "ɖu" ? " nu" : word === "ŋlɔ" || word === "xlẽ" ? " agbalẽ" : " suku"}." me?`, word, [name, "suku", "agbalẽ", "nu"], `"${word}" nye dɔwɔnya; eƒe gɔmee nye "${meaning}".`);
    }
  }
  const old = new Set(previous?.objectives.map((q) => q.q) ?? []);
  const unique = [...new Map(pool.map((q) => [q.q, q])).values()];
  const fresh = shuffle(unique.filter((q) => !old.has(q.q)));
  const objectives = shuffle([...fresh, ...shuffle(unique.filter((q) => old.has(q.q)))].slice(0, JHS_OBJECTIVE_COUNT)).map((q, i) => ({ ...q, id: `${classId}-${subject}-${seed}-o${i}` }));
  const written = shuffle(content.written).slice(0, JHS_THEORY_COUNT);
  const theory = written.map(([topic, q, a, b, c], i) => ({ id: `${classId}-${subject}-${seed}-t${i}`, topic, q, marks: THEORY_MARKS, scheme: [`(a) ${a} [6 marks]`, `(b) ${b} [6 marks]`, `(c) ${c} [8 marks]`] }));
  return { id: `${classId}-${subject}-${seed}`, classId, subject, objectives, theory };
}