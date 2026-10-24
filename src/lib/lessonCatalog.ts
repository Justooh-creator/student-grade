import { kgNumeracyRows } from "@/lib/kgNumeracyData";
import { blankLesson, scannedComputingExample, type LessonNote } from "@/lib/lessonNotes";

/** Preloaded weekly lesson entries. `verified` is true only for references confirmed against official NaCCA documents. */
export interface CatalogEntry {
  classIds: string[];
  subject: string;
  term: 1 | 2 | 3;
  week: number;
  verified: boolean;
  fill: Partial<LessonNote>;
}

const draftRef = "EduReport draft scheme — confirm codes against your current NaCCA curriculum";

function maths(term: 1 | 2 | 3, week: number, strand: string, subStrand: string, topic: string, words: string, activity: string, check: string): CatalogEntry {
  return { classIds: ["b4", "b5", "b6"], subject: "Mathematics", term, week, verified: false, fill: {
    title: topic, strand, subStrand, performanceIndicator: `Learners can ${topic.toLowerCase()}.`,
    competencies: "Critical Thinking and Problem Solving; Communication and Collaboration", newWords: words, reference: draftRef,
    starter: "Mental warm-up with quick oral questions on the previous lesson.\nShare the lesson objective with learners.",
    main: activity, assessment: check,
    reflection: "Learners explain one thing they learnt and one question they still have.\nSummarise the key points.",
    resources: "Counters, number cards, chalkboard illustrations", progression: topic,
    homework: "Solve five similar questions from the exercise given.", crossCurriculum: "English (reading word problems)", misconceptions: "None noted",
  } };
}

const kgRef = "NaCCA Kindergarten Curriculum (2019), Ministry of Education Ghana";

const kgEntries: CatalogEntry[] = kgNumeracyRows.map(([classId, term, week, strand, subStrand, standard, indicator, text, exemplar]) => ({
  classIds: [classId], subject: "Numeracy", term, week, verified: true, fill: {
    title: text, strand, subStrand, contentStandard: standard, indicator, performanceIndicator: `Learners can ${text.charAt(0).toLowerCase()}${text.slice(1)}.`,
    competencies: "Communication and Collaboration; Critical Thinking and Problem Solving; Creativity and Innovation", newWords: "count, number, more, less, same", reference: kgRef,
    duration: "30", starterMinutes: "5", mainMinutes: "20", reflectionMinutes: "5",
    starter: `Sing a number song or rhyme linked to the theme "${strand}".\nShare today's activity with learners.`,
    main: exemplar, assessment: "Observe each learner during the activity and record Gold / Silver / Bronze.\nAsk learners to show or count with real objects.",
    reflection: "Learners show and tell what they did.\nRecap the key idea with a song or game.",
    resources: "Real objects, counters, bottle tops, picture cards, number cards", progression: text,
    homework: "Count similar objects at home with a family member.", crossCurriculum: "Language & Literacy; Creative Arts; Our World Our People", misconceptions: "None noted",
  },
}));

export const lessonCatalog: CatalogEntry[] = [
  ...kgEntries,
  maths(1, 1, "Number", "Counting, Representation & Cardinality", "Read and write whole numbers", "Place value, digit, numeral", "Use place-value charts to read and write numbers.\nIn pairs, learners write numbers in words and figures.", "1. Write 4,327 in words.\n2. Write the value of 6 in 56,214."),
  maths(1, 2, "Number", "Counting, Representation & Cardinality", "Compare and order whole numbers", "Greater than, less than, ascending, descending", "Compare numbers using place value.\nGroups arrange number cards in ascending and descending order.", "1. Arrange 342, 432, 324 in ascending order.\n2. Use < or > between 5,601 and 5,610."),
  maths(1, 3, "Number", "Number Operations", "Add and subtract whole numbers", "Sum, difference, regroup", "Model regrouping with bundles of sticks.\nLearners solve addition and subtraction word problems.", "1. 4,568 + 2,795\n2. 9,000 − 3,456"),
  maths(1, 4, "Number", "Number Operations", "Multiply whole numbers", "Product, factor, multiple", "Use arrays and repeated addition.\nLearners multiply 2-digit numbers by 1-digit numbers.", "1. 34 × 6\n2. A crate holds 24 eggs. How many eggs are in 5 crates?"),
  maths(1, 5, "Number", "Fractions", "Identify and compare fractions", "Numerator, denominator, equivalent", "Fold paper strips to show halves, thirds and quarters.\nCompare fractions using strips.", "1. Shade 3/4 of a shape.\n2. Which is bigger: 1/2 or 1/3?"),
  { classIds: ["b9"], subject: "Computing", term: 1, week: 2, verified: false, fill: (({ id: _id, schoolName: _s, weekEnding: _w, classSize: _c, ...rest }) => rest)(scannedComputingExample("")) },
];

export function catalogFor(classId: string, subject: string, term: number): CatalogEntry[] {
  return lessonCatalog.filter((e) => e.classIds.includes(classId) && e.subject === subject && e.term === term).sort((a, b) => a.week - b.week);
}

export function catalogSubjects(classId: string): string[] {
  return [...new Set(lessonCatalog.filter((e) => e.classIds.includes(classId)).map((e) => e.subject))];
}

/** Fill a lesson note from a catalog entry while keeping the teacher's own small inputs. */
export function applyCatalogEntry(note: LessonNote, entry: CatalogEntry): LessonNote {
  const keep = { id: note.id, schoolName: note.schoolName, weekEnding: note.weekEnding, day: note.day, classId: note.classId, classSize: note.classSize, vettedBy: note.vettedBy, signature: note.signature, vettedDate: note.vettedDate };
  return { ...blankLesson(note.schoolName), ...entry.fill, ...keep, subject: entry.subject };
}
