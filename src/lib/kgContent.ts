// Original KG 1–2 revision material for teachers to read aloud; not an official curriculum catalogue.
import type { Content } from "./jhsContent";

const W = (topic: string, q: string, a: string, b: string, c: string) => [topic, q, a, b, c] as const;
type F = [string, string, string];
const f = (topic: string, rows: [string, string][]): F[] => rows.map(([t, m]) => [t, m, topic]);

export const KG_CONTENT: Record<string, Content> = {
  "Language and Literacy": {
    facts: [
      ...f("Letters", [["A", "the first letter of the alphabet"], ["Z", "the last letter of the alphabet"], ["vowel", "a letter such as a, e, i, o or u"], ["capital letter", "a big letter like A, B or C"], ["small letter", "a little letter like a, b or c"], ["alphabet", "all the letters from A to Z"]]),
      ...f("Sounds", [["b", "the first sound in 'ball'"], ["c", "the first sound in 'cat'"], ["d", "the first sound in 'dog'"], ["m", "the first sound in 'mango'"], ["s", "the first sound in 'sun'"], ["p", "the first sound in 'pen'"]]),
      ...f("Words", [["cat", "an animal that says 'meow'"], ["dog", "an animal that barks"], ["book", "something we read"], ["bag", "something we carry our books in"], ["cup", "something we drink from"], ["bed", "something we sleep on"], ["chair", "something we sit on"], ["hat", "something we wear on the head"]]),
      ...f("Opposites", [["big", "the opposite of small"], ["hot", "the opposite of cold"], ["up", "the opposite of down"], ["happy", "the opposite of sad"]]),
    ],
    written: [
      W("Letters", "(a) Write the letters A to E. (b) Circle the vowels in: a, b, e, d, o. (c) Write the small letter for B, M and T.", "A B C D E", "a, e, o", "b, m, t"),
      W("Sounds", "(a) Say the first sound of 'ball'. (b) Name two things that begin with 's'. (c) Match 'c' to a picture of a cat.", "b", "sun, sand, sugar", "cat begins with c"),
      W("Words", "(a) Name three things in the classroom. (b) Draw a cup. (c) Write the word 'cat'.", "book, chair, table", "a clear drawing of a cup", "c-a-t"),
      W("Opposites", "(a) Give the opposite of 'big'. (b) Give the opposite of 'hot'. (c) Act 'happy' and 'sad'.", "small", "cold", "smiling and frowning faces"),
      W("Speaking", "(a) Say your name. (b) Greet your teacher in English. (c) Say one thing you like to eat.", "My name is ...", "Good morning, teacher", "any food named in a sentence"),
    ],
  },
  "Our World Our People": {
    facts: [
      ...f("My Body", [["eyes", "the body parts we use to see"], ["ears", "the body parts we use to hear"], ["nose", "the body part we use to smell"], ["tongue", "the body part we use to taste"], ["hands", "the body parts we use to hold things"], ["legs", "the body parts we use to walk"], ["teeth", "the body parts we use to chew food"]]),
      ...f("My Family", [["mother", "the woman who gave birth to you"], ["father", "the man who is your mother's husband and your parent"], ["brother", "a boy with the same parents as you"], ["sister", "a girl with the same parents as you"], ["grandmother", "your father's or mother's mother"], ["baby", "a very young child"]]),
      ...f("Hygiene", [["soap", "what we use with water to wash our hands"], ["toothbrush", "what we use to clean our teeth"], ["bath", "washing the whole body with water"], ["dustbin", "where we put rubbish"]]),
      ...f("Our Community", [["teacher", "the person who teaches us in school"], ["nurse", "the person who cares for sick people"], ["farmer", "the person who grows crops"], ["police officer", "the person who keeps us safe"], ["school", "the place where we learn"], ["market", "the place where we buy and sell things"], ["church or mosque", "a place where people pray"]]),
    ],
    written: [
      W("My Body", "(a) Name two parts of the face. (b) What do we use our ears for? (c) Point to your legs and say what they do.", "eyes, nose, mouth, ears", "to hear", "we walk with our legs"),
      W("My Family", "(a) Name two members of your family. (b) Who is a baby? (c) Say one way to help at home.", "mother, father, sister", "a very young child", "sweeping, washing plates"),
      W("Hygiene", "(a) When should we wash our hands? (b) What do we use to brush our teeth? (c) Where do we put rubbish?", "before eating and after the toilet", "toothbrush and toothpaste", "in the dustbin"),
      W("Our Community", "(a) Who teaches us in school? (b) Who cares for sick people? (c) Name a place where we buy food.", "teacher", "nurse or doctor", "market or shop"),
      W("Safety", "(a) Who should you tell when you are hurt? (b) Name one thing that is dangerous to play with. (c) Where should children cross the road?", "a teacher or parent", "fire, knife, broken bottle", "at the zebra crossing with an adult"),
    ],
  },
  "Creative Arts": {
    facts: [
      ...f("Colours", [["red", "the colour of a ripe tomato"], ["yellow", "the colour of a ripe banana"], ["green", "the colour of fresh leaves"], ["blue", "the colour of the clear sky"], ["white", "the colour of milk"], ["black", "the colour of charcoal"], ["orange", "the colour made by mixing red and yellow"]]),
      ...f("Shapes", [["circle", "a round shape like a ball"], ["square", "a shape with four equal sides"], ["triangle", "a shape with three sides"], ["rectangle", "a shape like a door"], ["star", "a shape with five points"]]),
      ...f("Materials", [["crayon", "a coloured stick for drawing and colouring"], ["clay", "soft earth we can mould into shapes"], ["paper", "what we draw and write on"], ["scissors", "a tool for cutting paper"], ["glue", "what we use to stick things together"], ["paint brush", "a tool for painting"], ["pencil", "a tool for drawing lines"]]),
      ...f("Activities", [["drawing", "making pictures with lines"], ["colouring", "filling a picture with colours"], ["moulding", "making shapes with clay"], ["weaving", "crossing strips over and under"], ["collage", "a picture made by sticking pieces of paper"]]),
    ],
    written: [
      W("Colours", "(a) Name three colours. (b) What colour is a ripe banana? (c) Colour a leaf green.", "red, blue, yellow", "yellow", "a leaf coloured green"),
      W("Shapes", "(a) Draw a circle. (b) How many sides has a triangle? (c) Name something shaped like a square.", "a round shape", "three", "a box, a tile"),
      W("Materials", "(a) Name two things we use for drawing. (b) What do we use to cut paper? (c) What can we mould with clay?", "pencil, crayon", "scissors", "a pot, a ball, a fruit"),
      W("Activities", "(a) Draw your house. (b) Colour your drawing. (c) Say one thing you drew.", "a simple house drawing", "neat colouring", "door, window, roof"),
      W("Craft", "(a) Make a ball with clay. (b) Stick paper pieces to make a collage. (c) Show your work to a friend.", "a round clay ball", "a neat collage", "the child presents the work"),
    ],
  },
  "Physical Development": {
    facts: [
      ...f("Movement", [["walking", "moving slowly on our feet"], ["running", "moving fast on our feet"], ["jumping", "pushing off the ground with both feet"], ["hopping", "jumping on one foot"], ["skipping", "stepping and hopping in turns"], ["crawling", "moving on hands and knees"], ["climbing", "going up using hands and feet"]]),
      ...f("Ball Skills", [["throwing", "sending a ball through the air with the hand"], ["catching", "taking hold of a ball in the air"], ["kicking", "hitting a ball with the foot"], ["rolling", "making a ball move along the ground"], ["bouncing", "making a ball hit the ground and come back up"]]),
      ...f("Health", [["water", "what we drink when we are thirsty"], ["fruit", "healthy food such as oranges and pawpaw"], ["rest", "resting after playing"], ["sleep", "what our body needs every night"], ["exercise", "moving our body to keep strong"], ["warm-up", "gentle moving before playing"]]),
      ...f("Body Parts", [["arms", "the parts we swing when we run"], ["knees", "the parts that bend in our legs"], ["feet", "the parts we stand on"], ["head", "the top part of our body"], ["fingers", "the parts we use to pick small things"]]),
    ],
    written: [
      W("Movement", "(a) Show how to hop on one foot. (b) Jump with both feet. (c) Run to the line and back.", "balanced hopping", "two-foot jump", "running safely"),
      W("Ball Skills", "(a) Throw a ball to a friend. (b) Catch the ball with two hands. (c) Kick the ball gently.", "an accurate throw", "a two-hand catch", "a controlled kick"),
      W("Health", "(a) What should we drink after playing? (b) Name one healthy food. (c) Why do we sleep?", "water", "fruit, vegetables, beans", "to rest and grow"),
      W("Body Parts", "(a) Touch your knees. (b) Wiggle your fingers. (c) Stand on your feet and stretch your arms.", "touches knees", "moves fingers", "stands and stretches"),
      W("Safety", "(a) Why do we warm up? (b) Where should we play? (c) What should you do when a friend falls?", "to prepare the body", "in a safe open place", "help and tell the teacher"),
    ],
  },
  "Music and Movement": {
    facts: [
      ...f("Instruments", [["drum", "an instrument we beat with hands or sticks"], ["rattle", "an instrument we shake to make a sound"], ["gong-gong", "a metal bell beaten with a stick"], ["xylophone", "an instrument with wooden bars we strike"], ["flute", "an instrument we blow"], ["guitar", "an instrument with strings"], ["castanets", "small instruments we click together"]]),
      ...f("Sounds", [["loud", "a sound that is very strong"], ["soft", "a sound that is quiet"], ["fast", "music that moves quickly"], ["slow", "music that moves gently"], ["high", "a sound like a bird's whistle"], ["low", "a deep sound like a big drum"]]),
      ...f("Music", [["song", "words we sing with a tune"], ["clap", "hitting our hands together to keep the beat"], ["beat", "the steady pulse in music"], ["dance", "moving our body to music"], ["rhyme", "a short poem we say or sing"], ["singer", "a person who sings"]]),
      ...f("Movement", [["march", "walking in step to music"], ["sway", "moving gently from side to side"], ["stamp", "hitting the ground hard with the feet"], ["spin", "turning round and round"], ["stretch", "making the body long and tall"]]),
    ],
    written: [
      W("Instruments", "(a) Name two instruments we beat. (b) Which instrument do we shake? (c) Play a steady beat on a drum.", "drum, gong-gong", "rattle", "a steady beat"),
      W("Sounds", "(a) Clap loudly, then softly. (b) Sing a song slowly, then fast. (c) Make a high sound and a low sound.", "loud and soft claps", "slow and fast singing", "high and low voices"),
      W("Music", "(a) Sing your favourite song. (b) Clap to the beat. (c) Say a nursery rhyme.", "a complete song", "claps on the beat", "a complete rhyme"),
      W("Movement", "(a) March to the music. (b) Sway from side to side. (c) Spin and stop when the music stops.", "marching in time", "gentle swaying", "stopping on cue"),
      W("Culture", "(a) Name one Ghanaian dance. (b) Name a song we sing at school. (c) Dance to a drum beat.", "Adowa, Kpanlogo, Borborbor", "the National Anthem", "moving to the beat"),
    ],
  },
};
