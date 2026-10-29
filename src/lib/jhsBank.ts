// JHS (Basic 7–9) BECE-style practice items. Original questions, not official WAEC papers.
import type { Objective, SubjectBank, Theory } from "./questionBank";

const o = (id: string, topic: string, q: string, options: [string, string, string, string], answer: 0 | 1 | 2 | 3, explain: string): Objective => ({ id, topic, q, options, answer, explain });
type Pack = { key: string; subject: string; objectives: Objective[]; theory: Theory[] };

const PACKS: Pack[] = [
  {
    key: "ewe", subject: "Ghanaian Language (Eʋegbe)",
    objectives: [
      o("ew1", "Gbeŋutise", "Nya kae nye ŋkɔnya le nyagbe sia me: \"Kofi ɖu nu.\"", ["ɖu", "Kofi", "nu le", "ɖu nu"], 1, "\"Kofi\" nye amegbetɔ ƒe ŋkɔ, eya ta enye ŋkɔnya."),
      o("ew2", "Gbeŋutise", "Dɔwɔnya kae le nyagbe sia me: \"Ama yi suku.\"", ["Ama", "suku", "yi", "le"], 2, "\"yi\" ɖe nu si Ama wɔ fia, eya ta enye dɔwɔnya."),
      o("ew3", "Gbeŋutise", "Ŋkɔnya \"ati\" ƒe fofuƒomenya (plural) enye", ["atiwo", "atiawo", "ati eve", "atiwó"], 0, "Míetsɔa \"-wo\" kpena ɖe ŋkɔnya ŋu be wòanye fofuƒomenya: atiwo."),
      o("ew4", "Dekɔnuwo", "Le Eʋeawo ƒe kɔnu nu la, ɖevi si wodzi le Memleɖagbe (Saturday) ŋutsuvi ŋkɔe nye", ["Kofi", "Kwami / Kɔmi", "Yao", "Kɔdzo"], 1, "Ŋutsuvi si wodzi le Memleɖagbe ŋkɔe nye Kwami (Kɔmi)."),
      o("ew5", "Dekɔnuwo", "Hogbetsotso ƒe ŋkekenyui la, Aŋlɔawo ɖua eŋkeke le", ["Notsie dzodzo ŋkuɖodzi", "nuŋeŋe ƒe ŋkekenyui", "Kristmas", "Yesu ƒe tsitretsitsi"], 0, "Hogbetsotso ɖoa ŋku Eʋeawo ƒe Notsie dzodzo dzi."),
      o("ew6", "Lododowo", "Lododo \"Kpɔtɔ ɖeka mesea vi o\" fia be", ["ame ɖeka mate ŋu awɔ nu katã o", "kpɔtɔ nyo", "nu ɖuɖu nyo", "ɖeviwo nyo"], 0, "Lododo sia fia ɖekawɔwɔ ƒe vevienyenye — ame ɖeka mate ŋu awɔ nu blibo o."),
      o("ew7", "Nuŋɔŋlɔ", "Lɛta si ŋlɔm nèle na xɔ̃wò la, nukae nàŋlɔ gbã?", ["Wò adrɛs kple ŋkeke", "Nuwuwu", "Wò ŋkɔ ko", "Nyatakaka"], 0, "Le lɛta ŋlɔŋlɔ me la, adrɛs kple ŋkeke dona gbã."),
      o("ew8", "Gbeŋutise", "Le \"ɖevi nyui\" me la, \"nyui\" nye", ["ŋkɔnya", "dɔwɔnya", "nyatsigbe (adjective)", "nyaɖoɖo"], 2, "\"nyui\" ɖe alesi ɖevi la le fia; enye nyatsigbe."),
    ],
    theory: [
      { id: "ewt1", topic: "Nuŋɔŋlɔ", marks: 15, q: "Ŋlɔ lɛta na xɔ̃wò le suku bubu me nàgblɔ alesi miaƒe suku ɖu Ghana ƒe Dzodzome ŋkekenyui (Independence Day). (Nya 200 lɔƒo)", scheme: ["Lɛta ƒe ɖoɖo (adrɛs, ŋkeke, dodoɖo, nuwuwu) — 5", "Nyatakaka ƒe nyonyo — 5", "Gbegbɔgblɔ kple nyagbewo ƒe ɖoɖo — 3", "Nuŋɔŋlɔ ƒe dzɔdzɔenyenye (ɖ, ƒ, ʋ, ŋ, ɛ, ɔ) — 2"] },
      { id: "ewt2", topic: "Dekɔnuwo", marks: 10, q: "(a) Ɖe ɖevi ŋkɔɖeɖe ƒe kɔnu le Eʋeawo dome me. (b) Ŋlɔ ŋkɔ siwo wotsɔna na ŋutsuvi kple nyɔnuvi siwo wodzi le Fiɖagbe.", scheme: ["(a) Ŋkeke enyilia gbe, ŋdi kanya, tsi kple aha wotsɔna kpɔa ɖevi la, wogblɔa nyonyo ƒe nyawo — 6", "(b) Ŋutsuvi: Kofi; Nyɔnuvi: Afua / Afi — 4"] },
    ],
  },
  {
    key: "soc", subject: "Social Studies",
    objectives: [
      o("so1", "Government", "Ghana attained independence on", ["1st July 1960", "6th March 1957", "24th February 1966", "7th January 1993"], 1, "Ghana became independent on 6th March 1957."),
      o("so2", "Government", "The arm of government that makes laws is the", ["Executive", "Judiciary", "Legislature", "Police"], 2, "Parliament (Legislature) makes laws."),
      o("so3", "Environment", "Cutting down trees without replacing them is called", ["afforestation", "deforestation", "irrigation", "erosion"], 1, "Deforestation is the removal of forests without replanting."),
      o("so4", "Geography", "The largest man-made lake in Ghana is the", ["Bosomtwe", "Volta", "Keta", "Weija"], 1, "Lake Volta, created by the Akosombo Dam."),
      o("so5", "Citizenship", "Paying tax is an example of a citizen's", ["right", "privilege", "responsibility", "hobby"], 2, "Paying tax is a civic responsibility."),
      o("so6", "Population", "A census is the", ["counting of people", "election of leaders", "sale of land", "building of roads"], 0, "A census is an official count of the population."),
      o("so7", "Economy", "Ghana's leading cash crop is", ["maize", "cocoa", "cassava", "rice"], 1, "Cocoa is Ghana's main export cash crop."),
      o("so8", "Culture", "The process of passing culture from one generation to another is", ["socialisation", "migration", "urbanisation", "taxation"], 0, "Socialisation transmits values and customs."),
    ],
    theory: [
      { id: "sot1", topic: "Environment", marks: 10, q: "(a) State three causes of land degradation in Ghana. (b) Suggest two ways to reduce it.", scheme: ["(a) Any three: galamsey/illegal mining, bush burning, deforestation, overgrazing — 2 each (6)", "(b) Any two: afforestation, enforcing laws, public education, controlled grazing — 2 each (4)"] },
      { id: "sot2", topic: "Government", marks: 10, q: "Explain four functions of the Electoral Commission of Ghana.", scheme: ["Any four: registers voters, conducts elections, demarcates constituencies, educates public on voting, declares results — 2½ each"] },
    ],
  },
  {
    key: "rme", subject: "Religious and Moral Education",
    objectives: [
      o("rm1", "Religions", "The holy book of Islam is the", ["Bible", "Qur'an", "Torah", "Vedas"], 1, "Muslims read the Holy Qur'an."),
      o("rm2", "Religions", "Christians celebrate the birth of Jesus at", ["Easter", "Christmas", "Pentecost", "Lent"], 1, "Christmas marks Jesus' birth."),
      o("rm3", "Traditional religion", "The Supreme Being in Ewe traditional belief is known as", ["Mawu", "Nyame", "Ataa Naa Nyonmo", "Wuni"], 0, "Ewes call the Supreme Being Mawu."),
      o("rm4", "Moral values", "Telling the truth at all times shows", ["honesty", "pride", "greed", "laziness"], 0, "Honesty is being truthful."),
      o("rm5", "Religions", "The fasting month in Islam is", ["Hajj", "Ramadan", "Zakat", "Shahada"], 1, "Muslims fast during Ramadan."),
      o("rm6", "Moral values", "Respect for elders is important because it", ["promotes peace and harmony", "makes one rich", "ends school", "causes quarrels"], 0, "Respect builds harmony in society."),
      o("rm7", "Religions", "The first book of the Bible is", ["Exodus", "Genesis", "Matthew", "Psalms"], 1, "Genesis is the first book."),
      o("rm8", "Moral values", "Taking something without permission is", ["borrowing", "stealing", "sharing", "giving"], 1, "That is stealing."),
    ],
    theory: [
      { id: "rmt1", topic: "Moral values", marks: 10, q: "(a) What is discipline? (b) State four benefits of discipline to a JHS pupil.", scheme: ["(a) Self-control and obeying rules — 2", "(b) Any four: good academic results, respect, trust, avoiding trouble, good future — 2 each (8)"] },
      { id: "rmt2", topic: "Religions", marks: 10, q: "Name the Five Pillars of Islam.", scheme: ["Shahada, Salat, Zakat, Sawm, Hajj — 2 each"] },
    ],
  },
  {
    key: "ict", subject: "Computing",
    objectives: [
      o("ic1", "Hardware", "Which is an input device?", ["Monitor", "Printer", "Keyboard", "Speaker"], 2, "A keyboard sends data into the computer."),
      o("ic2", "Hardware", "The brain of the computer is the", ["RAM", "CPU", "Hard disk", "Mouse"], 1, "The CPU processes instructions."),
      o("ic3", "Software", "Microsoft Word is an example of", ["an operating system", "application software", "hardware", "a virus"], 1, "Word is word-processing application software."),
      o("ic4", "Internet", "WWW stands for", ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], 0, "World Wide Web."),
      o("ic5", "Storage", "1 kilobyte equals", ["100 bytes", "1000 bits", "1024 bytes", "8 bytes"], 2, "1 KB = 1024 bytes."),
      o("ic6", "Safety", "A strong password should", ["be your name", "mix letters, numbers and symbols", "be 1234", "be shared with friends"], 1, "Mixing character types makes it hard to guess."),
      o("ic7", "Spreadsheet", "In a spreadsheet, =SUM(A1:A5) will", ["add A1 to A5", "average A1 to A5", "count A1 to A5", "delete A1 to A5"], 0, "SUM adds the range."),
      o("ic8", "Software", "Windows and Android are", ["operating systems", "browsers", "games", "viruses"], 0, "They manage the device's hardware."),
    ],
    theory: [
      { id: "ict1", topic: "Hardware", marks: 10, q: "(a) Give two examples each of input and output devices. (b) State two differences between RAM and ROM.", scheme: ["(a) Input e.g. keyboard, mouse; output e.g. monitor, printer — 1 each (4)", "(b) RAM is volatile, ROM is not; RAM is read/write, ROM read-only — 3 each (6)"] },
      { id: "ict2", topic: "Safety", marks: 10, q: "State five ways to stay safe on the internet.", scheme: ["Any five: strong passwords, don't share personal details, avoid unknown links, use antivirus, log out on shared devices, report bullying — 2 each"] },
    ],
  },
  {
    key: "ct", subject: "Career Technology",
    objectives: [
      o("ct1", "Tools", "A tool used for driving nails is the", ["saw", "claw hammer", "plane", "chisel"], 1, "A claw hammer drives and removes nails."),
      o("ct2", "Food & nutrition", "Food that provides energy is mainly", ["proteins", "carbohydrates", "vitamins", "minerals"], 1, "Carbohydrates give energy."),
      o("ct3", "Safety", "The first thing to do when someone gets an electric shock is to", ["pour water on them", "switch off the power", "pull them by hand", "run away"], 1, "Switching off prevents further current."),
      o("ct4", "Drawing", "An instrument used to draw circles is a", ["set square", "compass", "protractor", "T-square"], 1, "Compasses draw circles and arcs."),
      o("ct5", "Sewing", "A stitch used to join fabric temporarily is", ["tacking", "hemming", "back stitch", "embroidery"], 0, "Tacking is a temporary stitch."),
      o("ct6", "Materials", "Wood obtained from coniferous trees is", ["hardwood", "softwood", "plywood", "metal"], 1, "Conifers give softwood."),
      o("ct7", "Food & nutrition", "Lack of vitamin C causes", ["rickets", "scurvy", "kwashiorkor", "goitre"], 1, "Scurvy results from vitamin C deficiency."),
      o("ct8", "Entrepreneurship", "A person who starts and runs a business is", ["an employee", "an entrepreneur", "a customer", "a debtor"], 1, "An entrepreneur takes business risks."),
    ],
    theory: [
      { id: "ctt1", topic: "Food & nutrition", marks: 10, q: "(a) What is a balanced diet? (b) List the six classes of food.", scheme: ["(a) Meal containing all food nutrients in right proportions — 4", "(b) Carbohydrates, proteins, fats & oils, vitamins, minerals, water — 1 each (6)"] },
      { id: "ctt2", topic: "Safety", marks: 10, q: "State five safety rules in a workshop.", scheme: ["Any five: wear protective clothing, no running, use tools correctly, report accidents, keep floor clean, follow teacher's instructions — 2 each"] },
    ],
  },
];

export const JHS_BANKS: SubjectBank[] = (["b7", "b8", "b9"] as const).flatMap((classId) =>
  PACKS.map((p) => ({ id: `${classId}-${p.key}`, classId, subject: p.subject, objectives: p.objectives, theory: p.theory })),
);
