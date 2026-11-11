import type { Theory } from "./questionBank";
import { pickFresh } from "./writtenPick";

/** Original practice material, not an official WAEC paper or prescribed literary text. */
export function englishWritten(seed: number, previous: Theory[] = []): Theory[] {
  const prev = new Set(previous.map((t) => t.q));
  const pack = englishBase(seed);
  const comps = pickFresh([...pack.slice(0, 3), ...EXTRA_COMPOSITIONS.map((c, i) => ({ ...c, id: `${seed}-composition-x${i}` }))], seed, 3, (c) => c.q, prev);
  const comp = pickFresh([pack[3]!, ...EXTRA_COMPREHENSION.map((f, i) => ({ ...f(seed), id: `${seed}-comprehension-x${i}` }))], seed + 1, 1, (c) => c.q, prev);
  const lit = pickFresh([pack[4]!, ...EXTRA_POEMS.map((c, i) => ({ ...c, id: `${seed}-literature-x${i}` }))], seed + 2, 1, (c) => c.q, prev);
  return [...comps, ...comp, ...lit];
}

function englishBase(seed: number): Theory[] {
  const name = ["Ama", "Sena", "Abena"][seed % 3] ?? "Ama";
  const place = ["school library", "reading club", "community library"][seed % 3] ?? "school library";
  return [
    { id: `${seed}-composition-letter`, topic: "Composition", marks: 30,
      q: "Write a letter to a friend in another school describing a memorable event in your school. Explain why the event was important to you. (About 250 words.)",
      scheme: ["Content: relevant, developed account and reasons — 10 marks", "Organisation: appropriate letter format and coherent paragraphs — 5 marks", "Expression: clear sentences and suitable vocabulary — 10 marks", "Mechanical accuracy: spelling, punctuation and grammar — 5 marks"] },
    { id: `${seed}-composition-story`, topic: "Composition", marks: 30,
      q: "Write a story ending with the words: ‘That day, I learnt the value of honesty.’ (About 250 words.)",
      scheme: ["Content: developed story leading naturally to the given ending — 10 marks", "Organisation: logical sequence, beginning and conclusion — 5 marks", "Expression: effective narration and vocabulary — 10 marks", "Mechanical accuracy — 5 marks"] },
    { id: `${seed}-composition-article`, topic: "Composition", marks: 30,
      q: "Write an article for your school magazine on three ways learners can keep their school environment clean. (About 250 words.)",
      scheme: ["Content: three relevant, developed ways — 10 marks", "Organisation: title, introduction, paragraphs and conclusion — 5 marks", "Expression: clear explanations and appropriate vocabulary — 10 marks", "Mechanical accuracy — 5 marks"] },
    { id: `${seed}-comprehension`, topic: "Comprehension", marks: 30,
      q: `Read the passage carefully and answer all the questions.\n\nEvery Wednesday, ${name} visited the ${place} after lessons. At first, only four learners attended. Some classmates believed that reading was useful only before examinations. ${name} disagreed. She asked the librarian to help organise a weekly reading circle. Each learner chose a short book and explained one new idea to the group.\n\nAfter a month, the circle had twelve members. The learners began borrowing books regularly and speaking more confidently in class. When rain damaged the roof, they moved their meeting to an empty classroom rather than cancel it. Their teacher praised their determination. ${name} realised that a small beginning could lead to lasting change when people worked together.\n\n(a) When did ${name} visit the ${place}? [4 marks]\n(b) Why did some classmates not value regular reading? [4 marks]\n(c) Describe two activities of the reading circle. [6 marks]\n(d) What did the learners do when the roof was damaged, and what quality did this show? [6 marks]\n(e) Give a word or phrase similar in meaning to each: ‘regularly’, ‘determination’, ‘lasting’. [6 marks]\n(f) State the main lesson of the passage in one sentence. [4 marks]`,
      scheme: [`(a) Every Wednesday after lessons — 4 marks`, "(b) They thought reading was useful only before examinations — 4 marks", "(c) Each chose a short book; each explained one new idea (3 each) — 6 marks", "(d) Moved to an empty classroom (3); perseverance/determination/resourcefulness (3) — 6 marks", "(e) Often/consistently; resolve/persistence; enduring/continuing (2 each) — 6 marks", "(f) Small beginnings and cooperation can bring lasting positive change — 4 marks"] },
    { id: `${seed}-literature`, topic: "Literature", marks: 10,
      q: "Read this original practice poem and answer all the questions.\n\nThe morning sun smiles on our way,\nWe plant a seed of hope today.\nThough storms may bend the growing tree,\nIts roots hold firm for you and me.\n\n(a) Identify the figure of speech in ‘The morning sun smiles’ and explain it. [3 marks]\n(b) Write the two pairs of rhyming words. [2 marks]\n(c) What do the storms suggest about life? [2 marks]\n(d) State one theme and support it with evidence from the poem. [3 marks]",
      scheme: ["(a) Personification (1); the sun is given the human action of smiling (2) — 3 marks", "(b) Way/today; tree/me (1 each) — 2 marks", "(c) Difficulties or challenges — 2 marks", "(d) Hope/resilience/cooperation (1), supported by a relevant line and explanation (2) — 3 marks"] },
  ];
}

const C = (content: string) => [`Content: ${content} — 10 marks`, "Organisation: suitable format and coherent paragraphs — 5 marks", "Expression: clear sentences and suitable vocabulary — 10 marks", "Mechanical accuracy — 5 marks"];
const EXTRA_COMPOSITIONS = [
  { topic: "Composition", marks: 30, q: "Write a letter to your uncle thanking him for a gift and telling him how you have used it. (About 250 words.)", scheme: C("thanks, description of the gift and how it was used") },
  { topic: "Composition", marks: 30, q: "Write a letter to the headteacher of your school suggesting two ways to improve the school library. (About 250 words.)", scheme: C("formal tone and two developed suggestions") },
  { topic: "Composition", marks: 30, q: "Write a story beginning with the words: ‘As soon as the bell rang, everyone ran outside.’ (About 250 words.)", scheme: C("story developing naturally from the given opening") },
  { topic: "Composition", marks: 30, q: "Write a story that illustrates the saying: ‘Unity is strength.’ (About 250 words.)", scheme: C("story clearly illustrating the saying") },
  { topic: "Composition", marks: 30, q: "Write an article for your school magazine on the dangers of illegal mining (galamsey) in Ghana. (About 250 words.)", scheme: C("three developed dangers and a conclusion") },
  { topic: "Composition", marks: 30, q: "Describe your favourite Ghanaian festival and explain why you enjoy it. (About 250 words.)", scheme: C("vivid description of the festival and reasons") },
  { topic: "Composition", marks: 30, q: "Write a speech you would give to your classmates on the importance of punctuality. (About 250 words.)", scheme: C("speech format and developed reasons") },
];
const EXTRA_COMPREHENSION = [
  (seed: number) => { const n = ["Kojo", "Yaw", "Kwesi"][seed % 3] ?? "Kojo"; return { topic: "Comprehension", marks: 30,
    q: `Read the passage carefully and answer all the questions.\n\n${n} lived in a fishing village near Keta. Every morning, he helped his father mend the nets before going to school. One day, the sea became rough and the fishermen could not go out. Instead of resting, ${n}'s father taught him how to repair the canoe.\n\nWeeks later, a storm damaged several canoes in the village. ${n} remembered what he had learnt and helped the elders repair them. The chief praised him at a gathering and encouraged all the young people to learn skills from their parents.\n\n(a) Where did ${n} live? [4 marks]\n(b) What did ${n} do every morning before school? [4 marks]\n(c) Why could the fishermen not go out to sea? [6 marks]\n(d) How did ${n} help after the storm? [6 marks]\n(e) Give a word or phrase similar in meaning to each: ‘mend’, ‘rough’, ‘praised’. [6 marks]\n(f) What is the main lesson of the passage? [4 marks]`,
    scheme: [`(a) In a fishing village near Keta — 4 marks`, "(b) Helped his father mend the nets — 4 marks", "(c) The sea was rough — 6 marks", "(d) He helped the elders repair the damaged canoes — 6 marks", "(e) Repair/fix; stormy/violent; commended/applauded (2 each) — 6 marks", "(f) Learning useful skills from elders helps the community — 4 marks"] }; },
  (seed: number) => { const n = ["Efua", "Akua", "Adwoa"][seed % 3] ?? "Efua"; return { topic: "Comprehension", marks: 30,
    q: `Read the passage carefully and answer all the questions.\n\nWhen the school announced a tree-planting day, ${n} was excited. She brought three seedlings from her grandmother's farm. Some pupils complained that the work was too hard under the hot sun, but ${n} kept digging. She explained that trees provide shade, fruit and fresh air.\n\nBy the end of the day, the pupils had planted forty trees around the compound. Each class agreed to water its trees every Friday. Two years later, the school compound was green and cool, and pupils gathered under the trees to read during break.\n\n(a) What did the school announce? [4 marks]\n(b) Where did ${n} get her seedlings? [4 marks]\n(c) Why did some pupils complain? [6 marks]\n(d) State three benefits of trees mentioned in the passage. [6 marks]\n(e) Give a word or phrase similar in meaning to each: ‘excited’, ‘complained’, ‘gathered’. [6 marks]\n(f) Suggest a suitable title for the passage. [4 marks]`,
    scheme: ["(a) A tree-planting day — 4 marks", "(b) From her grandmother's farm — 4 marks", "(c) The work was hard under the hot sun — 6 marks", "(d) Shade, fruit, fresh air (2 each) — 6 marks", "(e) Thrilled/eager; grumbled/protested; assembled/met (2 each) — 6 marks", "(f) Any suitable title, e.g. ‘Our Green School’ — 4 marks"] }; },
];
const EXTRA_POEMS = [
  { topic: "Literature", marks: 10, q: "Read this original practice poem and answer all the questions.\n\nThe drum calls out across the land,\nIt gathers young and old;\nWe dance together, hand in hand,\nOur stories proudly told.\n\n(a) Identify the figure of speech in ‘The drum calls out’ and explain it. [3 marks]\n(b) Write the two pairs of rhyming words. [2 marks]\n(c) What does ‘hand in hand’ suggest? [2 marks]\n(d) State one theme of the poem and support it. [3 marks]",
    scheme: ["(a) Personification (1); the drum is given the human action of calling (2) — 3 marks", "(b) Land/hand; old/told (1 each) — 2 marks", "(c) Unity/togetherness — 2 marks", "(d) Unity/culture/celebration (1) with supporting line (2) — 3 marks"] },
  { topic: "Literature", marks: 10, q: "Read this original practice poem and answer all the questions.\n\nMy mother is a shining star,\nShe guides me near and far;\nHer words are honey, sweet and kind,\nThey bring a calmness to my mind.\n\n(a) Identify the figure of speech in ‘My mother is a shining star’ and explain it. [3 marks]\n(b) Identify the figure of speech in ‘Her words are honey’. [2 marks]\n(c) Write one pair of rhyming words. [2 marks]\n(d) What is the poet's attitude towards the mother? Support your answer. [3 marks]",
    scheme: ["(a) Metaphor (1); the mother is directly compared to a star that guides (2) — 3 marks", "(b) Metaphor — 2 marks", "(c) Star/far or kind/mind — 2 marks", "(d) Love/admiration/gratitude (1) with evidence (2) — 3 marks"] },
];
