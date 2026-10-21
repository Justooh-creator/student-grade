import type { Objective, SubjectBank, Theory } from "./questionBank";

export const MATH_CLASSES = ["kg1", "kg2", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"] as const;
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
  // Kindergarten (KG 1–2): NaCCA Early Childhood numeracy — counting, comparing, shapes, patterns.
  const kg = classId === "kg1" || classId === "kg2" ? (classId === "kg1" ? 1 : 2) : 0;
  const makeKg = (selected: MathTopic): Item => {
    const max = kg === 1 ? 10 : 20;
    switch (selected) {
      case "Number": {
        const kind = int(0, 2);
        if (kind === 0) {
          const n = int(2, max);
          return { topic: selected, q: `Count the stars: ${"⭐".repeat(n)}. How many stars are there?`, value: n, explain: `Count one by one: there are ${n} stars.` };
        }
        if (kind === 1) {
          const n = int(1, max - 1);
          return { topic: selected, q: `What number comes after ${n}?`, value: n + 1, explain: `Count on one more: ${n}, ${n + 1}.` };
        }
        const n = int(2, max);
        return { topic: selected, q: `What number comes before ${n}?`, value: n - 1, explain: `Count back one: ${n - 1}, ${n}.` };
      }
      case "Fractions & Percentages": {
        if (kg === 1) {
          const a = int(1, 5), b = int(1, 5);
          return { topic: selected, q: `Ama has ${a} bananas. Kofi gives her ${b} more. How many bananas does she have now?`, value: a + b, explain: `Count them all together: ${a} + ${b} = ${a + b} bananas.` };
        }
        const whole = sample([4, 6, 8, 10, 12]);
        return { topic: selected, q: `Share ${whole} toffees equally between 2 children. How many does each child get?`, value: whole / 2, explain: `Half of ${whole} is ${whole / 2}. Each child gets ${whole / 2} toffees.` };
      }
      case "Algebra": {
        const a = int(1, kg === 1 ? 5 : 9), b = int(1, kg === 1 ? 5 : 9);
        if (int(0, 1) === 0) {
          return { topic: selected, q: `Find the missing number: ${a} + ▢ = ${a + b}.`, value: b, explain: `Count on from ${a} to ${a + b}: ▢ = ${b}.` };
        }
        const start = int(2, 5), step = int(1, 3);
        const seq = [start, start + step, start + 2 * step];
        return { topic: selected, q: `What number comes next in the pattern: ${seq.join(", ")}, …?`, value: start + 3 * step, explain: `The pattern adds ${step} each time: ${start + 2 * step} + ${step} = ${start + 3 * step}.` };
      }
      case "Geometry & Mensuration": {
        const shape = sample([["circle", 0], ["triangle", 3], ["square", 4], ["rectangle", 4]] as const);
        if (shape[1] === 0) {
          return { topic: selected, q: "Which shape is round like a ball or the moon?", value: 1, explain: "A circle is round — it has no corners or straight sides." };
        }
        if (int(0, 1) === 0) {
          return { topic: selected, q: `How many sides does a ${shape[0]} have?`, value: shape[1], explain: `A ${shape[0]} has ${shape[1]} straight sides.` };
        }
        const n = int(2, kg === 1 ? 3 : 5);
        return { topic: selected, q: `Yaw drew ${n} ${shape[0]}s. How many sides are there altogether?`, value: n * shape[1], explain: `Each ${shape[0]} has ${shape[1]} sides: ${n} × ${shape[1]} = ${n * shape[1]} sides.` };
      }
      case "Statistics & Probability": {
        if (kg === 1) {
          const a = int(2, 9), b = int(1, a - 1);
          return { topic: selected, q: `Which is more: ${a} apples or ${b} apples?`, value: a, explain: `${a} is greater than ${b}, so ${a} apples is more.` };
        }
        const cedis = int(1, 5), extra = int(1, 5);
        return { topic: selected, q: `Esi bought a pencil for GH₵ ${cedis} and an eraser for GH₵ ${extra}. How much did she spend altogether?`, value: cedis + extra, unit: "GH₵", explain: `Add the prices: GH₵ ${cedis} + GH₵ ${extra} = GH₵ ${cedis + extra}.` };
      }
    }
  };
  // Lower Primary (Basic 1–3): NaCCA foundational numeracy with whole-number answers only.
  const grade = Number(classId.slice(1));
  const lower = grade >= 1 && grade <= 3;
  const makeLower = (selected: MathTopic): Item => {
    const max = grade === 1 ? 20 : grade === 2 ? 100 : 1000;
    switch (selected) {
      case "Number": {
        const kind = int(0, 2);
        if (kind === 0) {
          const x = int(1, max / 2), y = int(1, max / 2);
          return { topic: selected, q: `Ama has ${x} oranges. Kofi gives her ${y} more. How many oranges does she have now?`, value: x + y, explain: `Add: ${x} + ${y} = ${x + y} oranges.` };
        }
        if (kind === 1) {
          const x = int(Math.ceil(max / 2), max), y = int(1, Math.floor(max / 2));
          return { topic: selected, q: `Work out ${x} − ${y}.`, value: x - y, explain: `Take away ${y} from ${x}: ${x} − ${y} = ${x - y}.` };
        }
        const n = int(1, max - 10);
        return { topic: selected, q: `What number is 10 more than ${n}?`, value: n + 10, explain: `Add 10: ${n} + 10 = ${n + 10}.` };
      }
      case "Fractions & Percentages": {
        const parts = sample(grade === 1 ? [2] : grade === 2 ? [2, 4] : [2, 3, 4]);
        const whole = parts * int(1, grade === 1 ? 5 : grade === 2 ? 10 : 20);
        const name = parts === 2 ? "half" : parts === 3 ? "one-third" : "one-quarter";
        return { topic: selected, q: `What is ${name} (1/${parts}) of ${whole} sweets?`, value: whole / parts, explain: `Share ${whole} into ${parts} equal groups: ${whole} ÷ ${parts} = ${whole / parts}.` };
      }
      case "Algebra": {
        if (grade === 1) {
          const x = int(1, 10), y = int(1, 10);
          return { topic: selected, q: `Find the missing number: ${x} + ▢ = ${x + y}.`, value: y, explain: `Count on from ${x} to ${x + y}: ▢ = ${y}.` };
        }
        const times = sample(grade === 2 ? [2, 5, 10] : [2, 3, 4, 5, 10]), groups = int(2, 10);
        return { topic: selected, q: `There are ${groups} bags with ${times} mangoes in each bag. How many mangoes altogether?`, value: groups * times, explain: `Repeated addition: ${groups} × ${times} = ${groups * times} mangoes.` };
      }
      case "Geometry & Mensuration": {
        if (grade === 1) {
          const shape = sample([["triangle", 3], ["square", 4], ["rectangle", 4]] as const);
          if (int(0, 1) === 0) {
            const n = int(2, shape[1] === 3 ? 6 : 5);
            return { topic: selected, q: `Yaw drew ${n} ${shape[0]}s. How many sides are there altogether?`, value: n * shape[1], explain: `Each ${shape[0]} has ${shape[1]} sides: ${n} × ${shape[1]} = ${n * shape[1]} sides.` };
          }
          return { topic: selected, q: `How many sides does a ${shape[0]} have?`, value: shape[1], explain: `A ${shape[0]} has ${shape[1]} straight sides.` };
        }
        const l = int(2, grade === 2 ? 10 : 25), w = int(2, grade === 2 ? 10 : 25);
        return { topic: selected, q: `A rectangular garden is ${l} m long and ${w} m wide. Find the distance around it (perimeter).`, value: 2 * (l + w), unit: "m", explain: `Add all four sides: ${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} m.` };
      }
      case "Statistics & Probability": {
        const cedis = grade === 1 ? int(1, 5) : grade === 2 ? int(5, 25) : int(20, 200);
        const extra = grade === 1 ? int(1, 5) : grade === 2 ? int(5, 25) : int(20, 200);
        return { topic: selected, q: `Esi bought bread for GH₵ ${cedis} and milk for GH₵ ${extra}. How much did she spend altogether?`, value: cedis + extra, unit: "GH₵", explain: `Add the prices: GH₵ ${cedis} + GH₵ ${extra} = GH₵ ${cedis + extra}.` };
      }
    }
  };
  const make = (selected: MathTopic): Item => {
    if (lower) return makeLower(selected);
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