import type { Theory } from "./questionBank";

/** Original Eʋegbe practice material laid out like the English written paper. Not an official WAEC paper. */
export function eweWritten(seed: number): Theory[] {
  const name = ["Kofi", "Sena", "Elikem"][seed % 3] ?? "Kofi";
  const market = ["Aflao", "Ho", "Keta"][seed % 3] ?? "Ho";
  const id = (s: string) => `${seed}-ewe-${s}`;
  return [
    { id: id("letter"), topic: "Nuŋɔŋlɔ (Composition)", marks: 30,
      q: "Ŋlɔ lɛta na xɔ̃wò si le suku bubu me. Gblɔ nya vevi aɖe si dzɔ le wò suku me na eyama. (Nya 150–250.)",
      scheme: ["Nyawo ƒe dzidzenu (Content) — 10", "Ɖoɖo: adrɛs, ŋkeke, gbedoname, nuwuwu — 5", "Gbegbɔgblɔ nyui (Expression) — 10", "Nuŋɔŋlɔ ƒe dzidzenu (spelling, punctuation) — 5"] },
    { id: id("story"), topic: "Nuŋɔŋlɔ (Composition)", marks: 30,
      q: "Ŋlɔ ŋutinya aɖe si wu enu kple nya siawo: ‘Tso gbe ma gbe dzi la, mesrɔ̃ be nyateƒe nyo.’ (Nya 150–250.)",
      scheme: ["Ŋutinya la ƒe nyawo kple nuwuwu si sɔ — 10", "Ɖoɖo: gɔmedzedze, titina, nuwuwu — 5", "Gbegbɔgblɔ nyui — 10", "Nuŋɔŋlɔ ƒe dzidzenu — 5"] },
    { id: id("essay"), topic: "Nuŋɔŋlɔ (Composition)", marks: 30,
      q: "Ŋlɔ nya tso mɔ etɔ̃ siwo dzi suku viwo ate ŋu ato ana be woƒe suku nanɔ dzadzɛ ŋu. (Nya 150–250.)",
      scheme: ["Mɔ etɔ̃ siwo sɔ eye woɖe wo me — 10", "Ɖoɖo: tanya, gɔmedzedze, memamawo — 5", "Gbegbɔgblɔ nyui — 10", "Nuŋɔŋlɔ ƒe dzidzenu — 5"] },
    { id: id("comprehension"), topic: "Nyaxlẽ kple Gɔmesese (Comprehension)", marks: 30,
      q: `Xlẽ nya sia nyuie eye nàɖo biabiawo katã ŋu.\n\n${name} kple dadaa yi asime le ${market} le Memleɖagbe. Wowɔ fli, tomato kple akpa. Le mɔ dzi la, ${name} kpɔ ga aɖe le anyigba. Mexɔe ɖe eɖokui si o; etsɔe na asitsala si bu ga la. Asitsala la kafu ${name} eye wòna aŋeʋuti eve wo. Esi wogbugbɔ va aƒe me la, fofoa gblɔ be nyateƒenɔnɔ nye nunana nyui.\n\n(a) Afikae ${name} kple dadaa yi? (b) Nu etɔ̃ kawoe wowɔ? (c) Nukae ${name} kpɔ le mɔ dzi? (d) Nukae asitsala la na wo? (e) Nusɔsrɔ̃ kae le nya sia me?`,
      scheme: [`(a) Asime le ${market} — 6`, "(b) Fli, tomato, akpa — 6", "(c) Ga si bu — 6", "(d) Aŋeʋuti eve — 6", "(e) Nyateƒenɔnɔ nyo / mègaxɔ ame bubu ƒe nu o — 6"] },
    { id: id("literature"), topic: "Agbenɔnɔ kple Dekɔnuwo (Literature & Culture)", marks: 10,
      q: "(a) Ŋlɔ lododo eve le Eʋegbe me eye nàɖe wo gɔme. (b) Ŋkekenyui kae Aŋlɔawo ɖuna, eye nukatae?",
      scheme: ["(a) Lododo eve siwo sɔ kple wo gɔmeɖeɖe (3 each) — 6", "(b) Hogbetsotso (2); woɖoa ŋku Notsie dzodzo dzi (2) — 4"] },
  ];
}
