import type { Theory } from "./questionBank";

/** Original practice material, not an official WAEC paper or prescribed literary text. */
export function englishWritten(seed: number): Theory[] {
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