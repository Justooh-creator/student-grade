/**
 * KG 1–2 term progress checklists (Kindergarten Learners Progress Report used by partner schools).
 * Ratings are stored per learner in `scores["kgm:t<term>:<nn>"].level` so they sync field by field
 * and reset with the other term work at year rollover. KG 1 and KG 2 each follow their school-issued assessment tool.
 */
import { baseClassId, type ClassId } from "./ges";
import type { Student } from "./store";

export const KG_RATINGS = [
  { code: "VG", label: "Very Good" },
  { code: "G", label: "Good" },
  { code: "NI", label: "Needs Improvement" },
  { code: "NSA", label: "Needs Special Attention" },
] as const;
export type KgRatingCode = (typeof KG_RATINGS)[number]["code"];
const CODES = new Set<string>(KG_RATINGS.map((r) => r.code));
export const isKgRating = (v: unknown): v is KgRatingCode => typeof v === "string" && CODES.has(v);

const KG2_TERMS: Record<1 | 2 | 3, string[]> = {
  1: [
    "Describe in simple sentences how unique he or she is, different from other God's creation.",
    "Recognise the beginning letter-sound of their names.",
    "Create sets of human parts that have the same number and represent them with numerals.",
    "Sing an action song that helps to name the parts of the body.",
    "Draw and label body parts.",
    "Compare objects and numerals between 1–10 to show more and less than.",
    "Talk about the visual information on the cover page of a book.",
    "Randomly identify five letters of the English alphabet.",
    "Answer oral questions during and after listening to an interactive read-aloud text.",
    "Draw and colour four food items that keep our body healthy.",
    "Identify the initial and ending sounds of names of objects.",
    "Draw and label three objects that are dangerous in the environment.",
    "Classify objects according to their shape and colour.",
    "Copy a sentence correctly into his or her book.",
    "Compare the length of objects.",
    "Blend letter-sounds learnt to form simple words.",
    "Identify who an author is and the title of a book.",
    "Read six appropriate sight words.",
    "Recite a poem about the family.",
    "Describe how to protect oneself from strangers.",
  ],
  2: [
    "Mention the origin of his/her family.",
    "Clap to show the number of syllables in a word.",
    "Identify two activities we do during birthdays.",
    "Create own simple pattern.",
    "Draw an object used to communicate rules in school.",
    "Mention three things he/she likes and dislikes.",
    "Compose and decompose numbers up to 10.",
    "Randomly identify letters in words and names.",
    "Use gestures to convey meaning.",
    "Copy daily greetings neatly.",
    "Mention some polite cultural language.",
    "Talk about the National Flag.",
    "Dramatise a vocabulary learnt.",
    "Identify Ghanaian coins and money by name.",
    "Draw and colour the Flag of Ghana.",
    "Talk about the activities done during 6th March.",
    "Compare objects in length and weight.",
    "Read four appropriate sight words.",
    "Mention three leaders in the community.",
    "Draw the family tree.",
    "Mention three special places in the community.",
  ],
  3: [
    "Assign a numeral to a group of objects.",
    "Say number names from 1–20 in order.",
    "Identify the numerals 11–20.",
    "Identify and name shapes.",
    "Draw plane shapes from real objects.",
    "Compare two heights and determine which is shorter.",
    "Find missing numerals in a series of numbers.",
    "Identify letters of the alphabet with their associated sounds.",
    "Copy sentences correctly.",
    "Associate objects with words.",
    "Identify and fill in missing letters.",
    "Use the prepositions in, on and under correctly.",
    "Identify four sources of light.",
    "Talk about some dangers associated with handling some types of light.",
    "Mention the name of the school, its location, class and class teacher.",
    "Name four things created by God.",
    "Identify changes in weather conditions.",
    "Select appropriate clothing to suit various weather conditions.",
    "Identify roles of leaders in the community.",
    "Make patterns within his/her experience using tools.",
  ],
};

/** KG 1 Assessment Tool supplied by the school (Mad. Stella): 14, 16 and 20 items for Terms 1–3. */
const KG1_TERMS: Record<1 | 2 | 3, string[]> = {
  1: [
    "Provide information about oneself.",
    "Listen attentively to others and respond appropriately.",
    "Follow one- or two-part oral directions.",
    "Sort and match common colours, shapes and sizes.",
    "Match upper-case and lower-case letters correctly.",
    "Recognise left to right sequence.",
    "Arrange five letters of the English alphabet in order.",
    "Draw a beautiful picture of himself or herself.",
    "Mention some functions of body parts.",
    "Compare objects to show more or less than.",
    "Demonstrate the proper way to handle a book.",
    "Draw a family tree.",
    "Count numerals one to ten correctly.",
    "Read the English alphabet A–J correctly.",
  ],
  2: [
    "Identify three good manners our family values.",
    "Demonstrate how to use daily greetings.",
    "Copy a letter correctly.",
    "Tell the time of the day.",
    "Recognise the basic components of a book.",
    "Mention some special places in the community.",
    "Draw yourself in your future job.",
    "Count the number of letters that form the word CHIEF.",
    "Clap to find the number of syllables in words.",
    "Write numerals 1–10 in order.",
    "Identify and name shapes.",
    "Copy lower-case and upper-case letters in order.",
    "Read two-letter words correctly.",
    "Make curves in different directions.",
    "Identify activities done during 6th March.",
    "Do simple addition.",
  ],
  3: [
    "Identify three sources of light.",
    "Talk about dangers associated with handling some types of light, e.g. a candle.",
    "Assign numerals to groups of objects.",
    "Read a picture book.",
    "Copy own name.",
    "Associate objects with words.",
    "Use letter-sounds to match the names of animals.",
    "Tell which source he or she fetches water from.",
    "Mention some uses of water.",
    "Make simple sentences with sources of water.",
    "Mention three things that can show the presence of air.",
    "Identify the parts of a plant.",
    "Tell the position of objects in a space.",
    "Select appropriate clothing to suit various weather conditions.",
    "Identify roles of some leaders in the community.",
    "Copy a word correctly.",
    "Write letters A–Z in order.",
    "Copy numerals 1–15 correctly.",
    "Form two-letter words and read them.",
    "Retell a story heard.",
  ],
};

const BANK: Record<"kg1" | "kg2", Record<1 | 2 | 3, string[]>> = { kg1: KG1_TERMS, kg2: KG2_TERMS };

/** "Term 2" → 2. Anything unrecognised counts as Term 1. */
export function kgTermNo(term: string | undefined | null): 1 | 2 | 3 {
  const m = /([123])/.exec(term ?? "");
  return m ? (Number(m[1]) as 1 | 2 | 3) : 1;
}

export const kgMilestoneKey = (term: 1 | 2 | 3, index: number) => `kgm:t${term}:${String(index + 1).padStart(2, "0")}`;
export const isKgMilestoneKey = (key: string) => /^kgm:t[123]:\d{2}$/.test(key);

export interface KgMilestone { key: string; n: number; text: string }

export function kgMilestones(classId: ClassId, term: string | undefined | null): KgMilestone[] {
  const base = baseClassId(classId);
  const list = base === "kg1" || base === "kg2" ? BANK[base][kgTermNo(term)] : [];
  const t = kgTermNo(term);
  return list.map((text, i) => ({ key: kgMilestoneKey(t, i), n: i + 1, text }));
}

export function kgRatingOf(student: Pick<Student, "scores">, key: string): KgRatingCode | null {
  const v = student.scores?.[key]?.level;
  return isKgRating(v) ? v : null;
}

export interface KgProgress { rows: (KgMilestone & { rating: KgRatingCode | null })[]; rated: number; counts: Record<KgRatingCode, number> }

export function kgProgress(student: Pick<Student, "scores" | "classId">, term: string | undefined | null): KgProgress {
  const counts: Record<KgRatingCode, number> = { VG: 0, G: 0, NI: 0, NSA: 0 };
  const rows = kgMilestones(student.classId, term).map((m) => {
    const rating = kgRatingOf(student, m.key);
    if (rating) counts[rating]++;
    return { ...m, rating };
  });
  return { rows, rated: rows.filter((r) => r.rating).length, counts };
}

/** Keys still unrated this term — used by "Mark remaining as Good". Never overwrites an existing rating. */
export function unratedKeys(student: Pick<Student, "scores" | "classId">, term: string | undefined | null): string[] {
  return kgProgress(student, term).rows.filter((r) => !r.rating).map((r) => r.key);
}
