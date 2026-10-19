// Pilot Q&A bank: Basic 9 core subjects. Original BECE-style practice items (not official WAEC papers).
export type Objective = { id: string; topic: string; q: string; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3; explain: string };
export type Theory = { id: string; topic: string; q: string; marks: number; scheme: string[] };
export type SubjectBank = { id: string; classId: string; subject: string; objectives: Objective[]; theory: Theory[] };

const o = (id: string, topic: string, q: string, options: [string, string, string, string], answer: 0 | 1 | 2 | 3, explain: string): Objective => ({ id, topic, q, options, answer, explain });

export const BANKS: SubjectBank[] = [
  {
    id: "b9-math", classId: "b9", subject: "Mathematics",
    objectives: [
      o("m1", "Number", "Simplify 2³ × 2².", ["2⁵", "2⁶", "4⁵", "4⁶"], 0, "Same base: add indices. 3 + 2 = 5, so 2⁵ = 32."),
      o("m2", "Algebra", "Solve 3x − 5 = 10.", ["x = 3", "x = 5", "x = 15", "x = 1⅔"], 1, "3x = 15 (add 5 to both sides), x = 15 ÷ 3 = 5."),
      o("m3", "Percentages", "What is 15% of GH₵ 240?", ["GH₵ 24", "GH₵ 32", "GH₵ 36", "GH₵ 40"], 2, "15/100 × 240 = 36."),
      o("m4", "Geometry", "The sum of interior angles of a triangle is", ["90°", "180°", "270°", "360°"], 1, "Angles of any triangle add up to 180°."),
      o("m5", "Mensuration", "Find the area of a rectangle 8 cm by 5 cm.", ["13 cm²", "26 cm²", "40 cm²", "45 cm²"], 2, "Area = length × breadth = 8 × 5 = 40 cm²."),
      o("m6", "Statistics", "Find the mean of 4, 6, 8, 10, 12.", ["6", "8", "9", "10"], 1, "Sum = 40, count = 5, mean = 40 ÷ 5 = 8."),
      o("m7", "Algebra", "Expand 2(x + 3).", ["2x + 3", "2x + 6", "x + 6", "2x + 5"], 1, "Multiply each term by 2: 2x + 6."),
      o("m8", "Number", "Express 0.75 as a fraction in its lowest terms.", ["3/4", "7/5", "75/10", "1/4"], 0, "0.75 = 75/100 = 3/4."),
    ],
    theory: [
      { id: "mt1", topic: "Algebra", marks: 10, q: "(a) Solve 2(x − 1) = x + 4. (b) If y = 3x + 2, find y when x = 4.", scheme: ["(a) 2x − 2 = x + 4 — M1", "x = 6 — A1 (5 marks)", "(b) y = 3(4) + 2 — M1", "y = 14 — A1 (5 marks)"] },
      { id: "mt2", topic: "Mensuration", marks: 10, q: "A circular garden has radius 7 m. Taking π = 22/7, find (a) its circumference (b) its area.", scheme: ["(a) C = 2πr = 2 × 22/7 × 7 — M1", "C = 44 m — A1 (5 marks)", "(b) A = πr² = 22/7 × 49 — M1", "A = 154 m² — A1 (5 marks)"] },
    ],
  },
  {
    id: "b9-sci", classId: "b9", subject: "Integrated Science",
    objectives: [
      o("s1", "Cells", "The control centre of a cell is the", ["cytoplasm", "nucleus", "cell membrane", "vacuole"], 1, "The nucleus holds genetic material and controls cell activities."),
      o("s2", "Matter", "Which is a chemical change?", ["Melting ice", "Rusting iron", "Boiling water", "Dissolving salt"], 1, "Rusting forms a new substance (iron oxide)."),
      o("s3", "Energy", "The SI unit of energy is the", ["watt", "newton", "joule", "volt"], 2, "Energy and work are measured in joules (J)."),
      o("s4", "Human body", "Blood is pumped round the body by the", ["lungs", "kidneys", "heart", "liver"], 2, "The heart pumps blood through the circulatory system."),
      o("s5", "Plants", "Photosynthesis takes place mainly in the", ["roots", "stem", "leaves", "flowers"], 2, "Leaves contain chlorophyll in chloroplasts."),
      o("s6", "Electricity", "A material that allows current to flow easily is a", ["conductor", "insulator", "resistor", "magnet"], 0, "Conductors (e.g. copper) let electrons move freely."),
      o("s7", "Matter", "pH 7 is described as", ["acidic", "alkaline", "neutral", "corrosive"], 2, "pH 7 is neutral, like pure water."),
      o("s8", "Ecosystem", "Organisms that make their own food are", ["consumers", "producers", "decomposers", "predators"], 1, "Green plants are producers."),
    ],
    theory: [
      { id: "st1", topic: "Plants", marks: 10, q: "(a) Write the word equation for photosynthesis. (b) State two conditions necessary for photosynthesis.", scheme: ["(a) Carbon dioxide + water → glucose + oxygen (in light, with chlorophyll) — 4 marks", "(b) Any two: sunlight, chlorophyll, carbon dioxide, water — 3 marks each"] },
      { id: "st2", topic: "Matter", marks: 10, q: "(a) Distinguish between a physical and a chemical change. (b) Give one example of each.", scheme: ["(a) Physical: no new substance, usually reversible — 3 marks", "Chemical: new substance formed, usually irreversible — 3 marks", "(b) e.g. melting ice — 2 marks; burning paper — 2 marks"] },
    ],
  },
  {
    id: "b9-eng", classId: "b9", subject: "English Language",
    objectives: [
      o("e1", "Grammar", "Choose the correct option: She ___ to school every day.", ["go", "goes", "going", "gone"], 1, "Third person singular, simple present: 'goes'."),
      o("e2", "Vocabulary", "Choose the word nearest in meaning to 'enormous'.", ["tiny", "huge", "quick", "weak"], 1, "Enormous means very large — huge."),
      o("e3", "Vocabulary", "The opposite of 'generous' is", ["kind", "mean", "rich", "humble"], 1, "A mean person is unwilling to give."),
      o("e4", "Grammar", "The boys ___ playing football when it rained.", ["was", "were", "is", "are"], 1, "Plural subject in the past continuous: 'were'."),
      o("e5", "Punctuation", "Which sentence is correctly punctuated?", ["Where are you going.", "where are you going?", "Where are you going?", "Where are you going!"], 2, "A question starts with a capital letter and ends with '?'."),
      o("e6", "Grammar", "Neither Kofi nor Ama ___ present.", ["were", "are", "was", "have"], 2, "With neither/nor, the verb agrees with the nearer singular subject: 'was'."),
      o("e7", "Idioms", "'To let the cat out of the bag' means to", ["free an animal", "reveal a secret", "start a fight", "go shopping"], 1, "The idiom means to disclose a secret."),
      o("e8", "Grammar", "He is good ___ Mathematics.", ["in", "on", "at", "with"], 2, "The fixed expression is 'good at'."),
    ],
    theory: [
      { id: "et1", topic: "Composition", marks: 15, q: "Write a letter to your friend in another school describing how you celebrated your school's Speech and Prize-Giving Day. (About 250 words)", scheme: ["Format (address, date, salutation, closing) — 5 marks", "Content (relevant, well-developed points) — 5 marks", "Organisation and expression — 3 marks", "Mechanical accuracy (spelling, grammar) — 2 marks"] },
      { id: "et2", topic: "Grammar", marks: 5, q: "Rewrite in the passive voice: (a) Ama cooked the food. (b) The teacher marks the books.", scheme: ["(a) The food was cooked by Ama — 2½ marks", "(b) The books are marked by the teacher — 2½ marks"] },
    ],
  },
];

export const banksForClass = (classId: string) => BANKS.filter((b) => b.classId === classId);

export function scoreQuiz(items: Objective[], answers: Record<string, number>) {
  const correct = items.filter((q) => answers[q.id] === q.answer).length;
  const percent = items.length ? Math.round((correct / items.length) * 100) : 0;
  return { correct, total: items.length, percent };
}
