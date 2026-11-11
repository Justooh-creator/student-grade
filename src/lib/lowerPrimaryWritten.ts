import type { Theory } from "./questionBank";
import type { LowerClass } from "./lowerPrimaryContent";

type Task = readonly [topic: string, a: string, answerA: string, b: string, answerB: string, c: string, answerC: string];
const TASKS: Record<string, readonly Task[]> = {
  Science: [
    ["My body", "Name two body parts you use to see and hear.", "Eyes and ears (3 each).", "Name the body part you use to smell.", "Nose.", "Draw a face and label the eyes and nose.", "Recognisable face (4); eyes and nose labels (2 each)."],
    ["Animals", "Name two animals you may see near a home.", "Any two suitable animals, e.g. dog, cat, goat (3 each).", "Name an animal that lives in water.", "Fish or another correct water animal.", "Draw a hen and name one thing a hen gives us.", "Recognisable hen (4); eggs or meat (4)."],
    ["Clean hands", "Name two things needed to wash hands.", "Soap and clean water (3 each).", "When should you wash your hands before eating?", "Before handling or eating food.", "Write two other times to wash hands.", "After the toilet, after play or after handling rubbish (4 each)."],
    ["Plants", "Name two plants you know.", "Any two real plants, e.g. mango tree and maize (3 each).", "Name one thing a plant needs to grow.", "Water, air, suitable light or nutrients.", "Draw a small plant and label two parts.", "Drawing (4); any two correct labels (2 each)."],
    ["Healthy habits", "Name two fruits you can eat.", "Any two fruits (3 each).", "Why do we need sleep?", "To rest and stay healthy.", "Write two ways to keep your body clean.", "Any two: bathe, brush teeth, wash hands, wear clean clothes (4 each)."],
    ["Our surroundings", "Name two things you see in the daytime sky.", "Any two: sun, clouds, birds, aeroplane (3 each).", "What falls from clouds when it rains?", "Water/rain drops.", "Draw a tree and write one way to care for it.", "Drawing (4); water it or avoid damaging it (4)."],
  ],
  "Our World Our People": [
    ["My family", "Name two people who care for children at home.", "Any two appropriate family members or carers (3 each).", "Write one safe way you help at home.", "Any suitable age-appropriate chore.", "Draw your home and name one room or space.", "Drawing (4); correct room or space (4)."],
    ["My school", "Name two things you use in class.", "Any two: book, pencil, ruler, crayon (3 each).", "Who helps you learn at school?", "Teacher.", "Write two ways to keep your classroom clean.", "Any two: sweep, use a bin, put things away (4 each)."],
    ["People who help us", "Name two community helpers.", "Any two helpers (3 each).", "Who grows food crops?", "Farmer.", "Draw one helper and write what the person does.", "Drawing (4); matching work (4)."],
    ["Road safety", "Name two things that travel on roads.", "Any two: car, bus, bicycle, motorbike (3 each).", "Who should help a young child cross a busy road?", "A trusted adult.", "Write two things to do before crossing a road.", "Stop at a safe place; look and listen for traffic; cross with an adult when safe (4 each)."],
    ["Weather", "Name two kinds of weather you know.", "Any two: sunny, rainy, windy, cloudy (3 each).", "What can protect you from rain?", "Umbrella or raincoat.", "Draw a rainy day and write one thing to wear or carry.", "Drawing (4); suitable item (4)."],
    ["Our community", "Name two places in your community.", "Any two real places (3 each).", "Where can sick people get medical care?", "Clinic or hospital.", "Write two ways to care for a public place.", "Do not litter; avoid damage; follow rules; help clean safely (4 each)."],
  ],
  "Religious and Moral Education": [
    ["Good manners", "Write two polite words or greetings.", "Any two appropriate phrases (3 each).", "What do you say when someone gives you a gift?", "Thank you.", "Write what to say when you hurt someone, and what to do next.", "Sorry (4); help, make amends or avoid repeating the harm (4)."],
    ["Honesty", "Name two things that belong to you.", "Any two personal possessions (3 each).", "What should you do if you find a classmate's pencil?", "Return it or give it to the teacher.", "Write two ways to tell the truth at school.", "Own up to mistakes; give a true account; do not copy or lie (4 each)."],
    ["Kindness", "Name two people you can help.", "Any two appropriate people (3 each).", "How can you help a friend who has no crayon?", "Share or ask the teacher for help.", "Draw children helping one another and describe the help.", "Drawing (4); suitable description (4)."],
    ["Worship", "Name two places where people worship.", "Church, mosque or shrine (3 each).", "Name a holy book you know.", "Bible or Qur'an; accept another correctly matched sacred text.", "Write two ways to show respect for people with different beliefs.", "Listen politely; do not mock; allow worship; be kind (4 each)."],
    ["Taking turns", "Name two games you play with others.", "Any two appropriate games (3 each).", "What should you do while waiting for your turn?", "Wait calmly/patiently.", "Write two ways to settle a disagreement without fighting.", "Talk calmly; listen; apologise; ask a trusted adult for help (4 each)."],
    ["Caring for nature", "Name two living things around you.", "Any two plants or animals (3 each).", "How can you care for a young plant?", "Water it appropriately or protect it.", "Write two ways to care for animals safely.", "Provide suitable food/water; do not hurt them; ask an adult for help (4 each)."],
  ],
  "Creative Arts": [
    ["Drawing", "Name two drawing tools.", "Pencil and crayon or other suitable tools (3 each).", "What can remove a pencil mark?", "Eraser.", "Draw a cup and decorate it with two colours.", "Recognisable cup (4); two colours (2 each)."],
    ["Shapes", "Draw a circle and a triangle.", "Recognisable shapes (3 each).", "How many sides has a triangle?", "Three.", "Make a picture using a circle and a square.", "Both shapes (2 each); combined into a picture (4)."],
    ["Music", "Name two ways of making a sound with your body.", "Any two: sing, hum, clap, tap feet (3 each).", "Name an instrument that is beaten.", "Drum or another correct percussion instrument.", "Draw a drum and say how you play it.", "Drawing (4); beat or strike it safely (4)."],
    ["Patterns", "Draw a circle and a square.", "Each recognisable shape (3 each).", "Copy and continue: circle, square, circle, square, ___.", "Circle.", "Draw a repeating pattern with two shapes.", "Two shapes (4); correct repeating order (4)."],
    ["Making things", "Name two materials you can use to make a simple toy.", "Paper, cardboard, clay or other safe materials (3 each).", "What can join two pieces of paper?", "Glue or tape.", "Draw a toy you would make and name a material for it.", "Drawing (4); suitable material (4)."],
    ["Acting", "Name two characters from a story you know.", "Any two valid characters (3 each).", "What do actors do in a play?", "Pretend to be characters/act out a story.", "Draw a character and write one thing the character does.", "Drawing (4); suitable action (4)."],
  ],
  Computing: [
    ["Computer parts", "Name two computer parts.", "Any two: monitor, keyboard, mouse, system unit (3 each).", "Which part do you use to type?", "Keyboard.", "Draw a monitor and a keyboard; label them.", "Two drawings (2 each); two labels (2 each)."],
    ["Keys", "Write the letters shown on the A and B keys.", "A/a and B/b (3 each).", "Which key makes a space between words?", "Space bar.", "Copy these words with spaces: I like school.", "Three correctly copied words (6); two spaces (2)."],
    ["Device care", "Name two things to keep away from a computer.", "Water and food or other harmful materials (3 each).", "Should your hands be wet or dry when using a computer?", "Dry.", "Write two ways to care for a computer.", "Keep clean, use gently, keep liquids away, ask an adult before connecting cables (4 each)."],
    ["Sound and pictures", "Name a device for taking photos and a device for playing sound.", "Camera and speaker/headphones (3 each).", "What computer part shows pictures?", "Monitor/screen.", "Draw a camera and name one thing you could photograph with permission.", "Drawing (4); suitable subject (4)."],
    ["Safe use", "Name two trusted adults you can ask for help.", "Any two suitable adults (3 each).", "What should you do if a screen message scares you?", "Tell a trusted adult.", "Write two rules for using a shared classroom computer.", "Take turns, ask permission, use gently, do not change others' work (4 each)."],
    ["Learning with devices", "Name two things you can learn using a computer.", "Letters, numbers, stories, drawing or other suitable examples (3 each).", "Why should you take short breaks from a screen?", "To rest eyes/body.", "Draw a learner sitting safely at a computer and describe one safe habit.", "Drawing (4); suitable posture/breaks habit (4)."],
  ],
  "Physical Education": [
    ["Moving", "Name two ways to move your body.", "Any two: walk, run, hop, jump, crawl (3 each).", "What is hopping?", "Jumping and landing on the same foot.", "Draw a child jumping and write one safe place to practise.", "Drawing (4); clear safe play space (4)."],
    ["Ball skills", "Name two things you can do with a ball.", "Throw, catch, kick, roll, bounce (3 each).", "Which body part do you use to kick a ball?", "Foot.", "Write two rules for safe ball play.", "Use a clear space; do not throw at faces; follow teacher instructions (4 each)."],
    ["Play equipment", "Name two things used in games.", "Any two appropriate items (3 each).", "What can you jump over in a skipping game?", "Skipping rope.", "Draw one play item and write how it is used.", "Drawing (4); correct use (4)."],
    ["Fair play", "Name two games you enjoy.", "Any two safe games (3 each).", "What should you do when it is another child's turn?", "Wait and let the child play.", "Write two ways to be a good teammate.", "Share, encourage others, follow rules, help safely (4 each)."],
    ["Healthy play", "Name two gentle movements before a game.", "Walking, gentle jogging, arm circles, stretching (3 each).", "What should you drink after active play?", "Clean water.", "Write two things to do if someone gets hurt during play.", "Stop play; tell a teacher; get adult help; do not move a seriously hurt child (4 each)."],
    ["Balance", "Name two body parts used when standing.", "Feet/legs and any other reasonable supporting body part (3 each).", "What should you do if you feel dizzy during a game?", "Stop and tell a teacher/rest safely.", "Draw a child balancing and write one safety rule.", "Drawing (4); safe space/adult guidance/no pushing (4)."],
  ],
};

export function lowerSubjectWritten(classId: LowerClass, subject: string, seed: number, order: number[]): Theory[] {
  const tasks = TASKS[subject];
  if (!tasks) throw new Error(`No lower-primary written tasks for ${subject}`);
  const grade = Number(classId.slice(1));
  return order.slice(0, 5).map((index, i) => {
    const task = tasks[index % tasks.length];
    if (!task) throw new Error("Missing written task");
    const [topic, a, answerA, b, answerB, c, answerC] = task;
    return { id: `${classId}-${subject}-${seed}-t${i}`, topic, marks: 20,
      q: `${grade === 1 ? "Use short words. Your teacher may read the question aloud.\n" : grade === 2 ? "Use short sentences where needed.\n" : "Use complete sentences where needed.\n"}(a) ${a}\n(b) ${b}\n(c) ${c}`,
      scheme: [`(a) ${answerA} [6 marks]`, `(b) ${answerB} [6 marks]`, `(c) ${answerC} [8 marks]`],
    };
  });
}

export function lowerLanguageWritten(classId: LowerClass, ewe: boolean, seed: number): Theory[] {
  const grade = Number(classId.slice(1));
  const names = ["Ama", "Sena", "Esi", "Abena", "Kofi", "Yao"];
  const name = names[(seed >>> 0) % names.length] ?? "Ama";
  const quantity = 2 + ((seed >>> 0) % 4);
  const englishPlaces = ["school", "the park", "the library"];
  const englishObjects = ["a book", "a ball", "a pencil"];
  const place = englishPlaces[(seed >>> 0) % 3] ?? "school";
  const object = englishObjects[Math.floor((seed >>> 0) / 3) % 3] ?? "a book";
  const sentenceCount = grade === 1 ? 3 : grade === 2 ? 5 : 7;
  const id = (s: string) => `${classId}-${seed}-${ewe ? "ewe" : "english"}-${s}`;
  const compositionScheme = ["Relevant ideas — 10 marks", "Ideas in a sensible order — 5 marks", "Clear age-appropriate sentences — 10 marks", "Spelling, capitals and full stops — 5 marks"];
  const topics = ewe ? ["Nye aƒe", "Nye suku", "Nye xɔ̃"] : ["My home", "My school", "My friend"];
  const prompts = ewe ? [
    `Ŋlɔ nyagbe ${sentenceCount} tso wò aƒe ŋu.`,
    `Ŋlɔ nyagbe ${sentenceCount} tso wò suku ŋu.`,
    `Ŋlɔ nyagbe ${sentenceCount} tso wò xɔ̃ ŋu.`,
  ] : [
    `Write ${sentenceCount} short sentences about your home. Say who cares for you and one thing you do at home.`,
    `Write ${sentenceCount} short sentences about your school. Say what you learn and what you like doing.`,
    `Write ${sentenceCount} short sentences about a friend. Say what you do together and how you help each other.`,
  ];
  const passage = ewe
    ? `${name} yi suku. Agbalẽ le esi. Eƒe xɔ̃ nye Kofi.${grade >= 2 ? " Woxlẽ agbalẽ le suku. Wofe kple xɔ̃wo." : ""}${grade === 3 ? " Esi wogbugbɔ va aƒe me la, wotsɔ agbalẽwo ɖo teƒe." : ""}`
    : `${name} goes to ${place}. ${name} has ${object}. ${name} plays with ${quantity} friends.${grade >= 2 ? ` They share their things. They are happy together.` : ""}${grade === 3 ? ` Before going home, they put their things away. ${name} thanks the friends for helping.` : ""}`;
  const comprehension = ewe
    ? `Xlẽ nya sia.\n\n${passage}\n\n(a) Ame kae yi suku? [6 marks]\n(b) Afikae ${name} yi? [6 marks]\n(c) Nukae le ${name} si? [6 marks]\n(d) Ame kae nye ${name} ƒe xɔ̃? [6 marks]\n(e) Ŋlɔ nya si fia "book" le nya la me. [6 marks]`
    : `Read the passage.\n\n${passage}\n\n(a) Who goes to ${place}? [6 marks]\n(b) Where does ${name} go? [6 marks]\n(c) What does ${name} have? [6 marks]\n(d) How many friends play with ${name}? [6 marks]\n(e) ${grade === 1 ? "Copy the word that means people you like to play with." : grade === 2 ? "How do the children show kindness?" : "What do the children do before going home?"} [6 marks]`;
  return [
    ...prompts.map((q, i) => ({ id: id(`composition-${i}`), topic: ewe ? "Nuŋɔŋlɔ (Composition)" : "Composition", marks: 30,
      q: `${topics[i]}\n${q}${!ewe && grade === 1 ? " You may begin: I live … / My school … / My friend …" : ""}`, scheme: [...compositionScheme] })),
    { id: id("comprehension"), topic: ewe ? "Nyaxlẽ (Comprehension)" : "Comprehension", marks: 30, q: comprehension,
      scheme: ewe ? [`(a) ${name} — 6 marks`, "(b) Suku — 6 marks", "(c) Agbalẽ — 6 marks", "(d) Kofi — 6 marks", "(e) Agbalẽ — 6 marks"]
        : [`(a) ${name} — 6 marks`, `(b) ${place} — 6 marks`, `(c) ${object} — 6 marks`, `(d) ${quantity} — 6 marks`, `(e) ${grade === 1 ? "Friends" : grade === 2 ? "They share their things" : "They put their things away"} — 6 marks`] },
    { id: id("literature"), topic: ewe ? "Agbenɔnɔ kple Dekɔnuwo (Literature & Culture)" : "Literature", marks: 10,
      q: ewe ? `(a) Ŋlɔ wò ŋkɔ. [2 marks]\n(b) Ŋlɔ wò xɔ̃ ƒe ŋkɔ. [2 marks]\n(c) Nukae nàwɔ atsɔ akpe ɖe wò xɔ̃ ŋu? [3 marks]\n(d) Ŋlɔ ame si ƒe ŋkɔ le nya si nèxlẽ me. [3 marks]`
        : `Read this short original rhyme.\n\nWe put our books away,\nWhen we finish play.\nWe help a friend at school,\nBeing kind is our rule.\n\n(a) Copy the word that rhymes with "away". [2 marks]\n(b) Copy the word that rhymes with "school". [2 marks]\n(c) What do the children put away? [3 marks]\n(d) Write one kind thing you can do for a friend. [3 marks]`,
      scheme: ewe ? ["(a) Learner's name — 2 marks", "(b) Friend's name — 2 marks", "(c) Any appropriate act of help — 3 marks", `(d) ${name} or Kofi — 3 marks`]
        : ["(a) Play — 2 marks", "(b) Rule — 2 marks", "(c) Books — 3 marks", "(d) Any appropriate act of kindness — 3 marks"] },
  ];
}