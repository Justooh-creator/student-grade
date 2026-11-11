import type { Theory } from "./questionBank";
import { pickFresh } from "./writtenPick";

/**
 * Original Eʋegbe practice material laid out like the WAEC Ghanaian Language written paper:
 * Part A Composition (choose one), Part B Comprehension, Part C Translation (English → Eʋegbe),
 * Part D Customs & Language. Not an official WAEC paper; content should be reviewed by a fluent teacher.
 */
type Comp = { q: string; scheme: string[] };
const RUBRIC = (content: string) => [`Nyawo ƒe dzidzenu (Content): ${content} — 10`, "Ɖoɖo (Organisation): gɔmedzedze, memamawo, nuwuwu — 5", "Gbegbɔgblɔ nyui (Expression) — 10", "Nuŋɔŋlɔ ƒe dzidzenu (Mechanical accuracy) — 5"];
const LETTER = (c: string) => [`Nyawo ƒe dzidzenu: ${c} — 10`, "Lɛta ƒe ɖoɖo: adrɛs, ŋkeke, gbedoname, nuwuwu — 5", "Gbegbɔgblɔ nyui — 10", "Nuŋɔŋlɔ ƒe dzidzenu — 5"];
const COMPOSITIONS: Comp[] = [
  { q: "Ŋlɔ lɛta na xɔ̃wò si le suku bubu me. Gblɔ nya vevi aɖe si dzɔ le wò suku me na eyama. (Nya 150–250.)", scheme: LETTER("nya vevi si dzɔ kple esi wòle vevie") },
  { q: "Ŋlɔ lɛta na nɔviwò si le du bubu me. Gblɔ alesi nèzã wò dzudzɔɣeyiɣi la nɛ. (Nya 150–250.)", scheme: LETTER("nu siwo nèwɔ le dzudzɔɣeyiɣi me") },
  { q: "Ŋlɔ lɛta na wò sukuƒometɔ aɖe si dze dɔ. Do dzi nɛ eye nàgblɔ nu siwo dzɔ le klass me nɛ. (Nya 150–250.)", scheme: LETTER("dzideƒoname kple klass me nyawo") },
  { q: "Ŋlɔ ŋutinya aɖe si wu enu kple nya siawo: ‘Tso gbe ma gbe dzi la, mesrɔ̃ be nyateƒe nyo.’ (Nya 150–250.)", scheme: RUBRIC("ŋutinya si kplɔ ame yi nuwuwu si wona") },
  { q: "Ŋlɔ ŋutinya tso ɖevi aɖe si ŋu wòɖo to dzilawo o ŋu kple nusi dzɔ ɖe edzi. (Nya 150–250.)", scheme: RUBRIC("ŋutinya kple nusɔsrɔ̃ si dze") },
  { q: "Ŋlɔ ŋutinya tso gbe aɖe si nèkpe ɖe ame aɖe si hiã kpekpeɖeŋu ŋu. (Nya 150–250.)", scheme: RUBRIC("kpekpeɖeŋu la kple alesi wòwɔ ɖe ame dzii") },
  { q: "Ŋlɔ nya tso mɔ etɔ̃ siwo dzi suku viwo ate ŋu ato ana be woƒe suku nanɔ dzadzɛ ŋu. (Nya 150–250.)", scheme: RUBRIC("mɔ etɔ̃ siwo sɔ eye woɖe wo me") },
  { q: "Ŋlɔ nya tso agbledede ƒe vevienyenye na wò kɔmenyigba ŋu. (Nya 150–250.)", scheme: RUBRIC("agbledede ƒe viɖe vovovowo") },
  { q: "Ŋlɔ nya tso nusita wòle be ɖeviwo nayi suku ŋu. (Nya 150–250.)", scheme: RUBRIC("sukuyiyi ƒe viɖe etɔ̃ alo wu") },
  { q: "Ŋlɔ nya tso ŋkekenyui aɖe si woɖuna le wò kɔmenyigba me ŋu. (Nya 150–250.)", scheme: RUBRIC("ŋkekenyui la ƒe ŋkɔ, ɣeyiɣi kple nu siwo wowɔna") },
];

type Passage = { key: string; text: (n: string) => string; qs: string[]; scheme: (n: string) => string[] };
const PASSAGES: Passage[] = [
  { key: "market", text: (n) => `${n} kple dadaa yi asime le Memleɖagbe. Woƒle fli, tomato kple akpa. Le mɔ dzi la, ${n} kpɔ ga aɖe le anyigba. Mexɔe ɖe eɖokui si o; etsɔe na asitsala si bu ga la. Asitsala la kafu ${n} eye wòna aŋeʋuti eve wo. Esi wogbugbɔ va aƒe me la, fofoa gblɔ be nyateƒenɔnɔ nye nunana nyui.`,
    qs: ["Ŋkeke kae ${n} kple dadaa yi asime?", "Nu etɔ̃ kawoe woƒle?", "Nukae ${n} kpɔ le mɔ dzi?", "Nukae asitsala la na wo?", "Nusɔsrɔ̃ kae le nya sia me?"],
    scheme: () => ["Memleɖagbe — 4", "Fli, tomato, akpa — 4", "Ga si bu — 4", "Aŋeʋuti eve — 4", "Nyateƒenɔnɔ nyo — 4"] },
  { key: "farm", text: (n) => `Le Kɔsiɖagbe ŋdi la, ${n} kple fofoa yi agble. Wode agbeli kple bli. Ɣe va dze ƒu ŋutɔ, eya ta wotsi ati gã aɖe te ɖu nu. Fofoa gblɔ be ne womede agble o la, nuɖuɖu mava su aƒe me o. ${n} ɖoe be yeakpe ɖe fofoa ŋu Kɔsiɖagbe ɖe sia ɖe.`,
    qs: ["Ŋkeke kae wo yi agble?", "Nu eve kawoe wode?", "Nukatae wotsi ati te?", "Nukae fofoa gblɔ tso agbledede ŋu?", "Nukae ${n} ɖoe be yeawɔ?"],
    scheme: () => ["Kɔsiɖagbe — 4", "Agbeli kple bli — 4", "Ɣe dze ƒu ŋutɔ — 4", "Ne womede agble o la, nuɖuɖu masu aƒe me o — 4", "Akpe ɖe fofoa ŋu Kɔsiɖagbe ɖe sia ɖe — 4"] },
  { key: "festival", text: (n) => `Ƒe sia ƒe la, Aŋlɔawo ɖua Hogbetsotso ŋkekenyui. ${n} kple nɔviaŋutsu yi ɖakpɔ ŋkekenyui la. Wokpɔ fiawo le wo ƒe awu nyuiwo me, eye wosɔ ɣe le ŋkume. Ame geɖewo ɖu ɣe, eye ɖeviwo kpɔ dzidzɔ. Tsitsiawo gblɔ be ŋkekenyui la ɖoa ŋku alesi tɔgbuiwo si tso Notsie dzi.`,
    qs: ["Ŋkekenyui kae Aŋlɔawo ɖuna?", "Ameka kple ${n} yi?", "Nukae wokpɔ?", "Alekee ɖeviwo se le eme?", "Nukae ŋkekenyui la ɖoa ŋku edzi?"],
    scheme: () => ["Hogbetsotso — 4", "Nɔviaŋutsu — 4", "Fiawo le awu nyuiwo me — 4", "Wokpɔ dzidzɔ — 4", "Alesi tɔgbuiwo si tso Notsie — 4"] },
  { key: "rain", text: (n) => `Gbe ɖeka esi ${n} nɔ suku la, tsi dza vevie. Klass me xɔ la ƒe xɔta gbã, eye tsi ge ɖe agbalẽwo dzi. Nufiala la kplɔ ɖeviwo yi xɔ bubu me. ${n} kple xɔ̃awo kpe ɖe nufiala ŋu wokɔ agbalẽwo. Le ŋkeke eve megbe la, dukɔa ɖɔ xɔta la ɖo.`,
    qs: ["Nukae dzɔ esi ${n} nɔ suku?", "Nukae dzɔ ɖe agbalẽwo dzi?", "Afikae nufiala kplɔ ɖeviwo yi?", "Alekee ${n} kpe ɖe nufiala ŋu?", "Ameka ɖɔ xɔta la ɖo?"],
    scheme: () => ["Tsi dza vevie — 4", "Tsi ge ɖe wo dzi — 4", "Xɔ bubu me — 4", "Wokɔ agbalẽwo — 4", "Dukɔa — 4"] },
];

type Trans = { en: string; ewe: string[] };
const TRANSLATIONS: Trans[] = [
  { en: "(a) The children are going to school. (b) My mother is cooking rice. (c) Kofi reads his book every evening. (d) We drink clean water. (e) The teacher is in the classroom.", ewe: ["Ɖeviwo le suku yim.", "Danye le mɔli ɖam.", "Kofi xlẽa eƒe agbalẽ fiẽ sia fiẽ.", "Míenoa tsi dzadzɛ.", "Nufiala la le klass me."] },
  { en: "(a) I am going to the market. (b) The dog is under the tree. (c) Ama sweeps the compound every morning. (d) My father is a farmer. (e) We love our country Ghana.", ewe: ["Mele asime yim.", "Avu la le ati la te.", "Ama kplɔa aƒemenu ŋdi sia ŋdi.", "Fofonye nye agbledela.", "Míelɔ̃ míaƒe dukɔ Ghana."] },
  { en: "(a) The sun is shining. (b) Kwame has two goats. (c) Wash your hands before you eat. (d) The rain fell yesterday. (e) My friend came to visit me.", ewe: ["Ɣe le klẽm.", "Gbɔ̃ eve le Kwame si.", "Kɔ wò asiwo hafi nàɖu nu.", "Tsi dza etsɔ si va yi.", "Xɔ̃nye va srãm kpɔ."] },
  { en: "(a) The fish is in the river. (b) We are singing in the church. (c) Please give me water. (d) The boy is tall. (e) Our school is big and clean.", ewe: ["Akpa la le tɔsisi la me.", "Míele ha dzim le sɔleme.", "Meɖe kuku, na tsim.", "Ŋutsuvi la kɔ.", "Míaƒe suku lolo eye wòle dzadzɛ."] },
];

type Customs = { q: string; scheme: string[] };
const CUSTOMS: Customs[] = [
  { q: "(a) Ŋlɔ lododo eve le Eʋegbe me eye nàɖe wo gɔme. (b) Ŋkekenyui kae Aŋlɔawo ɖuna, eye nukatae?", scheme: ["(a) Lododo eve siwo sɔ kple wo gɔmeɖeɖe (3 each) — 6", "(b) Hogbetsotso (2); woɖoa ŋku Notsie dzodzo dzi (2) — 4"] },
  { q: "(a) Gblɔ nu eve siwo wowɔna le vidzidzi ŋkɔnana (vihehe do goe) me. (b) Ŋlɔ ŋkeke ŋkɔ eve le Eʋegbe me kple wo ƒe ŋutsu ŋkɔ.", scheme: ["(a) Ɖeviŋkɔnana, tsi kple aha tsɔtsɔ na ɖevi la, gbedodoɖa (3 each) — 6", "(b) Kɔsiɖa – Kɔsi/Kwasi; Dzoɖa – Kɔdzo; etc. (2 each) — 4"] },
  { q: "(a) Ɖe ŋkɔnya kple dɔwɔnya me eye nàna kpɔɖeŋu ɖeka ɖe sia ɖe. (b) Tsɔ dɔwɔnya eve wɔ nyagbe eve.", scheme: ["(a) Ŋkɔnya: ame/nu ƒe ŋkɔ, kpɔɖ. suku (3); dɔwɔnya: nuwɔwɔ, kpɔɖ. yi (3) — 6", "(b) Nyagbe eve siwo sɔ (2 each) — 4"] },
  { q: "(a) Gblɔ nuɖuɖu eve siwo Eʋeawo ɖuna wu. (b) Gblɔ alesi woaɖo gbe na ame tsitsi le Eʋe kɔnu nu.", scheme: ["(a) Akple, dzenkple, abolo, fufu, etc. (3 each) — 6", "(b) Ʋu ŋku, ɖe kuku le asi dzi, gblɔ ‘Ŋdi na mi’ alo nuxɔxɔ nyuiwo (4) — 4"] },
  { q: "(a) Ŋlɔ Eʋe ƒe vovo etɔ̃ siwo wolɔ̃na. (b) Gblɔ nusita wòle be míadze míaƒe gbe ŋu.", scheme: ["(a) Ʋukɔnuwo: Agbadza, Atsiagbekɔ, Borborbor, Gahu (2 each) — 6", "(b) Kɔnu dzi kpɔkpɔ, dekɔnu fiafia ɖeviwo (4) — 4"] },
];

export function eweWritten(seed: number, previous: Theory[] = []): Theory[] {
  const names = ["Kofi", "Sena", "Elikem", "Dzifa", "Kekeli", "Mawuli"];
  const n = names[seed % names.length] ?? "Kofi";
  const prev = new Set(previous.map((t) => t.q));
  const prevPassage = new Set(previous.map((t) => t.id.split("|")[1] ?? ""));
  const id = (s: string) => `${seed}-ewe-${s}`;
  const comps = pickFresh(COMPOSITIONS, seed, 3, (c) => c.q, prev);
  const [passage] = pickFresh(PASSAGES, seed + 1, 1, (p) => p.key, prevPassage);
  const [trans] = pickFresh(TRANSLATIONS, seed + 2, 1, (t) => `Translate the following sentences into Eʋegbe.\n\n${t.en}`, prev);
  const [custom] = pickFresh(CUSTOMS, seed + 3, 1, (c) => c.q, prev);
  const p = passage ?? PASSAGES[0]!;
  const t = trans ?? TRANSLATIONS[0]!;
  const c = custom ?? CUSTOMS[0]!;
  const L = ["a", "b", "c", "d", "e"];
  return [
    ...comps.map((x, i) => ({ id: id(`comp${i}`), topic: "Nuŋɔŋlɔ (Composition)", marks: 30, q: x.q, scheme: x.scheme })),
    { id: `${id("comprehension")}|${p.key}`, topic: "Nyaxlẽ kple Gɔmesese (Comprehension)", marks: 20,
      q: `Xlẽ nya sia nyuie eye nàɖo biabiawo katã ŋu.\n\n${p.text(n)}\n\n${p.qs.map((q, i) => `(${L[i]}) ${q.replace("${n}", n)} [4 marks]`).join("\n")}`,
      scheme: p.scheme(n).map((s, i) => `(${L[i]}) ${s}`) },
    { id: id("translation"), topic: "Gɔmeɖeɖe (Translation: English → Eʋegbe)", marks: 10,
      q: `Translate the following sentences into Eʋegbe.\n\n${t.en}`,
      scheme: t.ewe.map((s, i) => `(${L[i]}) ${s} — 2 (accept correct equivalent wording)`) },
    { id: id("customs"), topic: "Dekɔnuwo kple Gbeŋutise (Customs & Language)", marks: 10, q: c.q, scheme: c.scheme },
  ];
}
