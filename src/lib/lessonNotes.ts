import { getClassLevel, isJhs, isKg, type ClassId } from "./ges";

export const WEEKS_PER_TERM = 12;

export const CORE_COMPETENCIES = [
  "Critical Thinking & Problem Solving (CP)",
  "Communication & Collaboration (CC)",
  "Creativity & Innovation (CI)",
  "Digital Literacy (DL)",
  "Cultural Identity & Global Citizenship (CG)",
  "Personal Development & Leadership (PL)",
];

export type SchemeRow = { week: number; strand: string; subStrand: string; contentStandard: string; indicator: string; resources: string };

export interface LessonNote {
  classId: ClassId;
  subject: string;
  term: number;
  week: number;
  date: string;
  duration: string;
  classSize: string;
  strand: string;
  subStrand: string;
  contentStandard: string;
  indicator: string;
  performanceIndicator: string;
  competencies: string[];
  keywords: string;
  resources: string;
  starter: string;
  main: string;
  plenary: string;
  reflection: string;
  teacher: string;
}

/** Starter strand outlines per subject (aligned to NaCCA strand names; teachers should confirm against their official scheme). */
const STRANDS: Record<string, [string, string[]][]> = {
  "English Language": [
    ["Oral Language", ["Listening & Speaking", "Songs, Rhymes & Conversation"]],
    ["Reading", ["Phonics & Word Families", "Comprehension", "Vocabulary"]],
    ["Grammar Usage", ["Nouns & Pronouns", "Verbs & Tenses", "Sentence Structure"]],
    ["Writing", ["Composition", "Letter Writing", "Penmanship & Spelling"]],
    ["Literature", ["Stories & Poems", "Drama"]],
  ],
  Mathematics: [
    ["Number", ["Counting & Place Value", "Operations", "Fractions & Decimals"]],
    ["Algebra", ["Patterns & Relationships", "Expressions & Equations"]],
    ["Geometry & Measurement", ["Shapes & Space", "Measurement", "Position & Transformation"]],
    ["Data", ["Data Collection & Organisation", "Chance / Probability"]],
  ],
  Science: [
    ["Diversity of Matter", ["Living & Non-Living Things", "Materials"]],
    ["Cycles", ["Earth Science", "Life Cycles"]],
    ["Systems", ["The Human Body", "Ecosystems"]],
    ["Forces & Energy", ["Sources & Forms of Energy", "Electricity & Magnetism", "Forces & Movement"]],
    ["Humans & the Environment", ["Personal Hygiene & Sanitation", "Climate Change"]],
  ],
  "Our World Our People": [
    ["All Around Us", ["The Environment", "Weather & Seasons"]],
    ["Me & My Family", ["Family & Clan", "Home & Community"]],
    ["Our Beliefs & Values", ["Celebrations", "Values"]],
    ["Our Nation Ghana", ["Being a Citizen", "National Symbols"]],
  ],
  History: [
    ["History as a Subject", ["Sources of History", "Time & Chronology"]],
    ["My Country Ghana", ["Peoples of Ghana", "Inter-group Relations"]],
    ["Europeans in Ghana", ["Arrival of Europeans", "Colonisation"]],
    ["Journey to Independence", ["Nationalism", "Independence"]],
  ],
  "Social Studies": [
    ["Environment", ["The Physical Environment", "Population & Settlement"]],
    ["Governance, Politics & Stability", ["Democracy", "Citizenship & Human Rights"]],
    ["Social & Economic Development", ["Production & Resources", "Tourism & Entrepreneurship"]],
    ["Sustainable Development", ["Science, Technology & Development"]],
  ],
  "Religious and Moral Education": [
    ["God, His Creation & Attributes", ["God the Creator", "Humankind"]],
    ["Religious Practices & Moral Implications", ["Worship", "Festivals"]],
    ["Religious Leaders", ["Lives of Leaders"]],
    ["The Family, Authority & Obedience", ["Roles & Responsibilities", "Good Conduct"]],
  ],
  "Creative Arts": [
    ["Visual Arts", ["Thinking & Exploring Ideas", "Planning, Making & Composing", "Displaying & Sharing"]],
    ["Performing Arts", ["Music & Dance", "Drama"]],
  ],
  "Creative Arts and Design": [
    ["Creative Arts", ["Visual Arts", "Performing Arts"]],
    ["Design", ["Design Process", "Displaying & Appraising"]],
  ],
  "Ghanaian Language": [
    ["Oral Language", ["Conversation", "Folktales & Proverbs"]],
    ["Reading", ["Phonics", "Comprehension"]],
    ["Writing", ["Composition", "Letter Writing"]],
    ["Culture", ["Customs & Traditions"]],
  ],
  "Physical Education": [
    ["Motor Skills & Movement Patterns", ["Locomotor Skills", "Manipulative Skills"]],
    ["Movement Concepts", ["Space & Effort Awareness"]],
    ["Physical Fitness", ["Health-Related Fitness"]],
  ],
  Computing: [
    ["Introduction to Computing", ["Parts of a Computer", "Health & Safety"]],
    ["Productivity Software", ["Word Processing", "Spreadsheets"]],
    ["Communication Networks", ["The Internet", "Email & Online Safety"]],
    ["Computational Thinking", ["Algorithms", "Programming Basics"]],
  ],
  "Integrated Science": [
    ["Diversity of Matter", ["Materials", "Living Cells & Organisms"]],
    ["Cycles", ["Earth Science", "Life Cycles of Organisms"]],
    ["Systems", ["Human Body Systems", "Solar System"]],
    ["Forces & Energy", ["Energy", "Electricity & Electronics", "Forces & Motion"]],
    ["Humans & the Environment", ["Health & Disease", "Science & Industry"]],
  ],
  "Career Technology": [
    ["Pre-Technical Skills", ["Health & Safety", "Tools & Materials", "Technical Drawing"]],
    ["Home Economics", ["Food & Nutrition", "Clothing & Textiles"]],
    ["Career Pathways", ["Entrepreneurship"]],
  ],
  French: [
    ["Listening & Speaking", ["Greetings & Introductions", "Daily Activities"]],
    ["Reading", ["Short Texts"]],
    ["Writing", ["Simple Sentences", "Short Letters"]],
  ],
  "Language and Literacy": [
    ["Oral Language", ["Songs, Rhymes & Poems", "Conversation"]],
    ["Reading", ["Letter Sounds", "Picture Reading"]],
    ["Writing", ["Pre-writing Patterns", "Letter Formation"]],
  ],
  Numeracy: [
    ["Number", ["Counting 1–20", "Number Recognition", "Addition & Subtraction"]],
    ["Geometry & Measurement", ["Shapes", "Comparing Sizes"]],
    ["Data", ["Sorting & Grouping"]],
  ],
  "Physical Development": [
    ["Gross Motor Skills", ["Running, Jumping & Balancing"]],
    ["Fine Motor Skills", ["Hand-Eye Coordination"]],
    ["Health", ["Personal Hygiene"]],
  ],
  "Music and Movement": [
    ["Music", ["Songs & Rhythm", "Local Instruments"]],
    ["Movement", ["Dance & Action Songs"]],
  ],
};

const RES: Record<string, string> = {
  Mathematics: "Counters, bottle tops, number charts, rulers, manila card",
  Science: "Realia, pictures, charts, simple apparatus",
  "Integrated Science": "Realia, charts, simple apparatus, video clips",
  Computing: "Computer/laptop, projector, pictures of devices",
};

function prefix(classId: ClassId) {
  if (classId === "kg1") return "K1";
  if (classId === "kg2") return "K2";
  return "B" + classId.slice(1);
}

/** Preloaded termly scheme of learning: walks the subject's strands across the 3 terms. */
export function termlyScheme(classId: ClassId, subject: string, term: number): SchemeRow[] {
  const strands = STRANDS[subject] ?? [["General", ["Topic"]]];
  const flat: { s: number; strand: string; ss: number; sub: string }[] = [];
  strands.forEach(([strand, subs], si) => subs.forEach((sub, ssi) => flat.push({ s: si + 1, strand, ss: ssi + 1, sub })));
  const p = prefix(classId);
  const rows: SchemeRow[] = [];
  const total = WEEKS_PER_TERM * 3;
  for (let w = 1; w <= WEEKS_PER_TERM; w++) {
    const g = (term - 1) * WEEKS_PER_TERM + (w - 1);
    if (w === WEEKS_PER_TERM) {
      rows.push({ week: w, strand: "Revision & End-of-Term Examination", subStrand: "—", contentStandard: "—", indicator: "—", resources: "Past questions, worksheets" });
      continue;
    }
    const f = flat[Math.floor((g / total) * flat.length)]!;
    const ind = (g % 3) + 1;
    rows.push({
      week: w,
      strand: `Strand ${f.s}: ${f.strand}`,
      subStrand: `Sub-strand ${f.ss}: ${f.sub}`,
      contentStandard: `${p}.${f.s}.${f.ss}.1`,
      indicator: `${p}.${f.s}.${f.ss}.1.${ind}`,
      resources: RES[subject] ?? (isKg(classId) ? "Pictures, toys, realia, flash cards" : "Charts, textbooks, pictures, realia"),
    });
  }
  return rows;
}

export function defaultDuration(classId: ClassId) {
  return isKg(classId) ? "40 mins" : isJhs(classId) ? "60 mins" : "60 mins";
}

export function newNote(classId: ClassId, subject: string, term: number, week: number): LessonNote {
  const row = termlyScheme(classId, subject, term)[week - 1]!;
  return {
    classId, subject, term, week,
    date: "", duration: defaultDuration(classId), classSize: "",
    strand: row.strand, subStrand: row.subStrand, contentStandard: row.contentStandard, indicator: row.indicator,
    performanceIndicator: `Learners can demonstrate understanding of ${row.subStrand.replace(/^Sub-strand \d+: /, "").toLowerCase()}.`,
    competencies: [CORE_COMPETENCIES[0]!, CORE_COMPETENCIES[1]!],
    keywords: "",
    resources: row.resources,
    starter: "Review relevant previous knowledge (RPK) with questions.\nUse a song, game or brainstorm to introduce the lesson.",
    main: "1. Teacher introduces the new concept with TLMs.\n2. Learners work in groups on a guided activity.\n3. Groups present; teacher clarifies misconceptions.\n4. Individual practice with differentiated tasks.",
    plenary: "Learners summarise key points.\nExit ticket / class exercise to assess mastery.\nHomework where appropriate.",
    reflection: "",
    teacher: "",
  };
}

export const noteKey = (n: Pick<LessonNote, "classId" | "subject" | "term" | "week">) => `${n.classId}|${n.subject}|${n.term}|${n.week}`;

const LS = "edureport.lessonNotes.v1";
export function loadNotes(): Record<string, LessonNote> {
  try { return JSON.parse(localStorage.getItem(LS) ?? "{}"); } catch { return {}; }
}
export function saveNotes(all: Record<string, LessonNote>) {
  localStorage.setItem(LS, JSON.stringify(all));
}

export const subjectsFor = (classId: ClassId) => getClassLevel(classId).subjects;
