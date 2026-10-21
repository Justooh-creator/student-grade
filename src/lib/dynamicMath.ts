import type { Objective, SubjectBank, Theory } from "./questionBank";

export const MATH_CLASSES = ["b4", "b5", "b6", "b7", "b8", "b9"] as const;
export type MathClass = (typeof MATH_CLASSES)[number];
export const MATH_TOPICS = ["Number", "Fractions & Percentages", "Algebra", "Geometry & Mensuration", "Statistics & Probability"] as const;
export type MathTopic = (typeof MATH_TOPICS)[number];
export type MathTopicChoice = MathTopic | "all";
export const isMathClass = (id: string): id is MathClass => MATH_CLASSES.some((c) => c === id);

// Seeded, browser-safe generation makes every pack reproducible for validation.
function randomSource(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function freshMathSeed() {
  return Math.floor(Math.random() * 4294967296);
}

export interface MathPack extends SubjectBank {
  seed: number;
  topic: MathTopicChoice;
}

export function generateMathPack(classId: MathClass, seed: number, topic: MathTopicChoice = "all", previous?: SubjectBank): MathPack {
  const random = randomSource(seed);
  const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const level = Number(classId.slice(1)) - 7;
  // Upper Primary (level < 0) uses smaller, NaCCA-appropriate numbers.
  const primary = level < 0;
  const limit = primary ? 9 + (level + 3) * 3 : 12 + level * 8;
  const fmt = (n: number) => String(Number(n.toFixed(2)));
  const sample = <T,>(values: readonly T[]): T => {
    const value = values[int(0, values.length - 1)];
    if (value === undefined) throw new Error("Cannot sample an empty set");
    return value;
  };
  const shuffle = <T,>(values: T[]) => {
    for (let i = values.length - 1; i > 0; i--) {
      const j = int(0, i);
      const a = values[i];
      const b = values[j];
      if (a !== undefined && b !== undefined) { values[i] = b; values[j] = a; }
    }
    return values;
  };

  type Item = { topic: MathTopic; q: string; value: number; unit?: string; explain: string };
  const make = (selected: MathTopic): Item => {
    const a = int(2, limit), b = int(2, limit);
    switch (selected) {
      case "Number": {
        if (primary || int(0, 1) === 0) {
          const x = primary ? int(2, limit * 5) : int(-limit, limit), y = int(2, limit);
          return { topic: selected, q: `Calculate ${x} + (${y}) × ${b}.`, value: x + y * b, explain: `Multiply first: ${y} × ${b} = ${y * b}. Then ${x} + ${y * b} = ${x + y * b}.` };
        }
        const base = int(2, 4), p = int(1, 3), r = int(1, 2);
        return { topic: selected, q: `Evaluate ${base}^${p} × ${base}^${r}.`, value: base ** (p + r), explain: `Same base: add indices. ${base}^(${p} + ${r}) = ${base}^${p + r} = ${base ** (p + r)}.` };
      }
      case "Fractions & Percentages": {
        if (int(0, 1) === 0) {
          const percent = sample(primary ? (level === -1 ? [10, 20, 25, 50, 75] : [10, 25, 50]) : [5, 10, 15, 20, 25, 30, 40, 50, 75]);
          const amount = int(2, limit) * 20;
          const value = percent * amount / 100;
          return { topic: selected, q: `Find ${percent}% of GH₵ ${amount}.`, value, unit: "GH₵", explain: `${percent}/100 × ${amount} = GH₵ ${fmt(value)}.` };
        }
        const denominator = primary ? int(2, 4 + (level + 3) * 2) : int(3, 12), numerator = int(1, denominator - 1), whole = denominator * int(2, limit);
        return { topic: selected, q: `Find ${numerator}/${denominator} of ${whole}.`, value: numerator * whole / denominator, explain: `${whole} ÷ ${denominator} = ${whole / denominator}; multiply by ${numerator} to get ${numerator * whole / denominator}.` };
      }
      case "Algebra": {
        const x = int(1, limit), constant = int(1, limit);
        if (primary) return { topic: selected, q: `Find the missing number: ${a} × ▢ + ${constant} = ${a * x + constant}.`, value: x, explain: `Take away ${constant}: ${a} × ▢ = ${a * x}. Then ${a * x} ÷ ${a} = ${x}.` };
        if (level === 2 && int(0, 1) === 0) {
          const smaller = int(1, a - 1), right = (a - smaller) * x + constant;
          return { topic: selected, q: `Solve ${a}x + ${constant} = ${smaller}x + ${right}.`, value: x, unit: "x =", explain: `Collect x terms: (${a} − ${smaller})x = ${right} − ${constant}. ${a - smaller}x = ${(a - smaller) * x}, so x = ${x}.` };
        }
        if (int(0, 1) === 0) return { topic: selected, q: `Solve ${a}x + ${constant} = ${a * x + constant}.`, value: x, unit: "x =", explain: `Subtract ${constant}: ${a}x = ${a * x}. Divide by ${a}: x = ${x}.` };
        return { topic: selected, q: `If y = ${a}x + ${constant}, find y when x = ${x}.`, value: a * x + constant, explain: `Substitute x = ${x}: y = ${a} × ${x} + ${constant} = ${a * x + constant}.` };
      }
      case "Geometry & Mensuration": {
        const kind = int(0, primary ? (level === -1 ? 2 : 1) : level === 0 ? 2 : 3);
        if (kind === 0) return { topic: selected, q: `Find the area of a rectangle ${a} cm long and ${b} cm wide.`, value: a * b, unit: "cm²", explain: `Area = length × width = ${a} × ${b} = ${a * b} cm².` };
        if (kind === 1) return { topic: selected, q: `Find the perimeter of a rectangle ${a} cm long and ${b} cm wide.`, value: 2 * (a + b), unit: "cm", explain: `Perimeter = 2(length + width) = 2(${a} + ${b}) = ${2 * (a + b)} cm.` };
        if (kind === 2) {
          const first = int(3, 8) * 10, second = int(3, 8) * 10;
          return { topic: selected, q: `Two angles of a triangle are ${first}° and ${second}°. Find the third angle.`, value: 180 - first - second, unit: "°", explain: `Triangle angles total 180°. Third angle = 180 − ${first} − ${second} = ${180 - first - second}°.` };
        }
        const radius = int(1, 4 + level) * 7;
        return { topic: selected, q: `Find the area of a circle of radius ${radius} cm. Use π = 22/7.`, value: 22 / 7 * radius * radius, unit: "cm²", explain: `Area = πr² = 22/7 × ${radius} × ${radius} = ${22 / 7 * radius * radius} cm².` };
      }
      case "Statistics & Probability": {
        const mean = int(5, limit + 5), gap = int(1, 4);
        if (level > 0 && int(0, 2) === 0) {
          const red = int(1, 8), blue = int(1, 8);
          return { topic: selected, q: `A bag has ${red} red and ${blue} blue counters. What is the probability of choosing red? Give a decimal to 2 decimal places.`, value: Number((red / (red + blue)).toFixed(2)), explain: `Probability = red ÷ total = ${red}/${red + blue} = ${(red / (red + blue)).toFixed(2)} (to 2 decimal places).` };
        }
        const values = [mean - 2 * gap, mean - gap, mean, mean + gap, mean + 2 * gap];
        // Positive datasets avoid an unnecessary difficulty increase in Basic 7.
        const adjusted = values.map((v) => v + 10);
        return { topic: selected, q: `Find the mean of ${adjusted.join(", ")}.`, value: mean + 10, explain: `Sum = ${(mean + 10) * 5}. Mean = sum ÷ 5 = ${mean + 10}.` };
      }
    }
  };

  const objective = (item: Item, id: string): Objective => {
    const format = (value: number) => item.unit === "GH₵" || item.unit === "x =" ? `${item.unit} ${fmt(value)}` : `${fmt(value)}${item.unit ? ` ${item.unit}` : ""}`;
    const candidates = new Set<string>([format(item.value)]);
    const step = item.value > 0 && item.value < 1 ? 0.05 : Math.max(1, Math.round(Math.abs(item.value) / 10));
    for (const offset of shuffle([-2, -1, 1, 2, 3, 4])) {
      const value = Number((item.value + offset * step).toFixed(2));
      if ((item.unit === "°" && (value <= 0 || value >= 180)) || (item.value > 0 && value < 0)) continue;
      candidates.add(format(value));
      if (candidates.size === 4) break;
    }
    for (let n = 1; candidates.size < 4; n++) candidates.add(format(item.value + n * step));
    const options = shuffle([...candidates]) as [string, string, string, string];
    const answer = options.indexOf(format(item.value)) as 0 | 1 | 2 | 3;
    return { id, topic: item.topic, q: item.q, options, answer, explain: item.explain };
  };

  const topics = topic === "all" ? [...MATH_TOPICS] : [topic];
  const objectives: Objective[] = [];
  const seen = new Set<string>();
  const oldQuestions = new Set(previous?.objectives.map((q) => q.q) ?? []);
  for (let i = 0; i < 20; i++) {
    const selected = topics[i % topics.length];
    if (!selected) continue;
    let item = make(selected);
    let tries = 0;
    while ((seen.has(item.q) || oldQuestions.has(item.q)) && tries++ < 200) item = make(selected);
    seen.add(item.q);
    objectives.push(objective(item, `${classId}-${seed}-o${i}`));
  }

  const theory: Theory[] = [];
  const oldTheory = new Set(previous?.theory.map((q) => q.q.replace(/ Show your working\.$/, "")) ?? []);
  for (let i = 0; i < 4; i++) {
    const selected = topics[i % topics.length];
    if (!selected) continue;
    let item = make(selected);
    let tries = 0;
    while ((seen.has(item.q) || oldTheory.has(item.q)) && tries++ < 200) item = make(selected);
    seen.add(item.q);
    const finalAnswer = item.unit === "GH₵" || item.unit === "x =" ? `${item.unit} ${fmt(item.value)}` : `${fmt(item.value)}${item.unit ? ` ${item.unit}` : ""}`;
    theory.push({ id: `${classId}-${seed}-t${i}`, topic: selected, q: `${item.q} Show your working.`, marks: 5, scheme: ["Correct formula or method — 1 mark", "Correct substitution or setup — 1 mark", `Correct working — 2 marks: ${item.explain}`, `Correct final answer: ${finalAnswer} — 1 mark`] });
  }
  return { id: `${classId}-math`, classId, subject: "Mathematics", seed, topic, objectives: shuffle(objectives), theory };
}