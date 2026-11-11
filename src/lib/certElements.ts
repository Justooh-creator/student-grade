/** Preloaded certificate design elements (transparent PNGs on the asset CDN) and placed-layer helpers. */
export const ELEMENT_CATEGORIES = [
  { id: "frames", label: "Frames" }, { id: "laurels", label: "Laurels" }, { id: "trophies", label: "Trophies" },
  { id: "academic", label: "Academic" }, { id: "crowns", label: "Crowns" }, { id: "medals", label: "Medals & rosettes" },
  { id: "seals", label: "Seals" }, { id: "ribbons", label: "Ribbons & banners" }, { id: "dividers", label: "Dividers" },
  { id: "corners", label: "Corners" }, { id: "kente", label: "Kente" }, { id: "adinkra", label: "Adinkra" },
] as const;
export type ElementCategory = (typeof ELEMENT_CATEGORIES)[number]["id"];
export type CertElement = { id: string; name: string; category: ElementCategory; url: string; ratio: number };

export const CERT_ELEMENTS: CertElement[] = [
  { id: "el00", name: "Frame 1", category: "frames", url: "/__l5e/assets-v1/c6dbd9ae-8213-48d5-9875-4c8876d0c15b/frame-1.png", ratio: 1.373 },
  { id: "el01", name: "Frame 2", category: "frames", url: "/__l5e/assets-v1/35a1151a-73ea-4c82-beec-74a997f669b2/frame-2.png", ratio: 1.409 },
  { id: "el02", name: "Frame 3", category: "frames", url: "/__l5e/assets-v1/33a106ed-aa34-4583-a443-b12018512030/frame-3.png", ratio: 1.241 },
  { id: "el03", name: "Frame 4", category: "frames", url: "/__l5e/assets-v1/d78090fd-32bb-4673-97e0-477a6e01da97/frame-4.png", ratio: 1.418 },
  { id: "el04", name: "Frame 5", category: "frames", url: "/__l5e/assets-v1/0b049c2c-b23d-464b-a0f9-26ca837aa173/frame-5.png", ratio: 1.271 },
  { id: "el05", name: "Laurel wreath", category: "laurels", url: "/__l5e/assets-v1/2c579ad8-b39e-45b0-98ee-424b1a5371ca/laurel-wreath.png", ratio: 1.111 },
  { id: "el06", name: "Slim laurel wreath", category: "laurels", url: "/__l5e/assets-v1/b617efc3-e6d4-4c43-9a3a-af2b818a47a5/slim-laurel-wreath.png", ratio: 1.058 },
  { id: "el07", name: "Graduation cap", category: "academic", url: "/__l5e/assets-v1/23218c4d-0280-42a3-9227-01427234b79c/graduation-cap.png", ratio: 1.586 },
  { id: "el08", name: "Open book", category: "academic", url: "/__l5e/assets-v1/07c00afe-eca8-4a68-b2ac-f3701b81166b/open-book.png", ratio: 1.767 },
  { id: "el09", name: "Gold trophy", category: "trophies", url: "/__l5e/assets-v1/e470b453-0362-4daa-95c3-1385aa6d85ed/gold-trophy.png", ratio: 0.8 },
  { id: "el10", name: "Royal crown", category: "crowns", url: "/__l5e/assets-v1/cbd1c18a-b306-488b-8f34-3c74f48154fc/royal-crown.png", ratio: 1.234 },
  { id: "el11", name: "Blue ribbon medal", category: "medals", url: "/__l5e/assets-v1/2f539821-e6e7-44bd-b49d-c4966b608866/blue-ribbon-medal.png", ratio: 0.579 },
  { id: "el12", name: "Red ribbon medal", category: "medals", url: "/__l5e/assets-v1/b8e0f897-e1e3-4f4b-930f-bacfd07e5dd2/red-ribbon-medal.png", ratio: 0.619 },
  { id: "el13", name: "Gold laurel seal", category: "seals", url: "/__l5e/assets-v1/cbf42c71-c771-4551-bcfa-ddea36580981/gold-laurel-seal.png", ratio: 1.0 },
  { id: "el14", name: "Blue star rosette", category: "medals", url: "/__l5e/assets-v1/8e78553e-ccdc-4508-a223-238f30b63804/blue-star-rosette.png", ratio: 0.733 },
  { id: "el15", name: "Red crown rosette", category: "medals", url: "/__l5e/assets-v1/910f5765-b66c-4bda-abcd-fde93373719f/red-crown-rosette.png", ratio: 0.744 },
  { id: "el16", name: "Navy laurel seal", category: "seals", url: "/__l5e/assets-v1/9db8d57f-9a72-4bfd-a422-20122304754d/navy-laurel-seal.png", ratio: 1.028 },
  { id: "el17", name: "Gold seal with banner", category: "seals", url: "/__l5e/assets-v1/d2341c69-289b-40b3-a4e6-55b715d5d025/gold-seal-with-banner.png", ratio: 1.147 },
  { id: "el18", name: "Three-star seal", category: "seals", url: "/__l5e/assets-v1/dc12d9fa-1fa9-4dac-a65a-1f28da5cd1c2/three-star-seal.png", ratio: 0.796 },
  { id: "el19", name: "Banner 1", category: "ribbons", url: "/__l5e/assets-v1/202f05e4-32a2-4314-b69a-7053d7b30cf3/banner-1.png", ratio: 3.415 },
  { id: "el20", name: "Banner 2", category: "ribbons", url: "/__l5e/assets-v1/627c9f64-ac9f-4af7-bfec-c443dab6a2ae/banner-2.png", ratio: 3.8 },
  { id: "el21", name: "Banner 3", category: "ribbons", url: "/__l5e/assets-v1/0828e05b-4077-4f20-b7dc-669e082beb9b/banner-3.png", ratio: 3.701 },
  { id: "el22", name: "Banner 4", category: "ribbons", url: "/__l5e/assets-v1/bbd1c776-12a4-4e6f-bedc-78f6ad1d8f07/banner-4.png", ratio: 3.654 },
  { id: "el23", name: "Banner 5", category: "ribbons", url: "/__l5e/assets-v1/1e630f2e-49e3-4b1c-a301-50a6040aaf80/banner-5.png", ratio: 2.889 },
  { id: "el24", name: "Gold divider 1", category: "dividers", url: "/__l5e/assets-v1/44948912-effb-4a19-9458-0ee37ce39537/gold-divider-1.png", ratio: 8.111 },
  { id: "el25", name: "Gold divider 2", category: "dividers", url: "/__l5e/assets-v1/e5eaccd3-550a-4d3a-a895-64d5e0b5d99d/gold-divider-2.png", ratio: 5.214 },
  { id: "el26", name: "Gold divider 3", category: "dividers", url: "/__l5e/assets-v1/c4e10c9d-31dc-4f5f-a504-f829f21ead5e/gold-divider-3.png", ratio: 10.4 },
  { id: "el27", name: "Gold divider 4", category: "dividers", url: "/__l5e/assets-v1/1dd2102c-55ca-48aa-8507-8e35dcb27fe9/gold-divider-4.png", ratio: 5.083 },
  { id: "el28", name: "Gold divider 5", category: "dividers", url: "/__l5e/assets-v1/701820b1-19d7-4112-a9a4-d63b67f72c0d/gold-divider-5.png", ratio: 3.896 },
  { id: "el29", name: "Gold divider 6", category: "dividers", url: "/__l5e/assets-v1/f4c343c5-ace1-4791-8737-ccc5df5d5972/gold-divider-6.png", ratio: 5.22 },
  { id: "el30", name: "Gold divider 7", category: "dividers", url: "/__l5e/assets-v1/c0ebb9a9-944c-439f-a55e-6fd34b3c1151/gold-divider-7.png", ratio: 3.056 },
  { id: "el31", name: "Blue-gold swoosh", category: "ribbons", url: "/__l5e/assets-v1/f780703d-1afd-4189-9f42-91e35d6bfd9d/blue-gold-swoosh.png", ratio: 1.386 },
  { id: "el32", name: "Blue-gold wave", category: "ribbons", url: "/__l5e/assets-v1/5fb36c29-0689-43f9-a4f0-673d15d64010/blue-gold-wave.png", ratio: 2.015 },
  { id: "el33", name: "Kente strip 1", category: "kente", url: "/__l5e/assets-v1/8de826d6-bd98-4c33-a641-da8885064c0d/kente-strip-1.png", ratio: 5.157 },
  { id: "el34", name: "Kente strip 2", category: "kente", url: "/__l5e/assets-v1/74b9ab1c-d597-46cb-ab6a-c5e093ca9110/kente-strip-2.png", ratio: 6.033 },
  { id: "el35", name: "Adinkra symbol 1", category: "adinkra", url: "/__l5e/assets-v1/f4cefd96-5596-4bd0-a537-8494bcad50cd/adinkra-symbol-1.png", ratio: 1.016 },
  { id: "el36", name: "Adinkra symbol 2", category: "adinkra", url: "/__l5e/assets-v1/a7d2e502-79d5-4c41-b34d-ff53aecb2795/adinkra-symbol-2.png", ratio: 1.016 },
  { id: "el37", name: "Adinkra symbol 3", category: "adinkra", url: "/__l5e/assets-v1/329fe73e-5395-4464-85a0-ec1d08f24826/adinkra-symbol-3.png", ratio: 0.938 },
  { id: "el38", name: "Adinkra symbol 4", category: "adinkra", url: "/__l5e/assets-v1/9b81e80c-f851-4d61-b853-ac0501fac703/adinkra-symbol-4.png", ratio: 1.094 },
  { id: "el39", name: "Adinkra symbol 5", category: "adinkra", url: "/__l5e/assets-v1/cb555d5e-45b3-4749-a50c-8a0302202b26/adinkra-symbol-5.png", ratio: 1.148 },
  { id: "el40", name: "Adinkra symbol 6", category: "adinkra", url: "/__l5e/assets-v1/0914b56a-cac5-4736-8af4-2ac85d2fcd83/adinkra-symbol-6.png", ratio: 1.047 },
  { id: "el41", name: "Adinkra symbol 7", category: "adinkra", url: "/__l5e/assets-v1/160192ab-61f5-40f7-8eda-479e64ab56ea/adinkra-symbol-7.png", ratio: 1.0 },
  { id: "el42", name: "Adinkra symbol 8", category: "adinkra", url: "/__l5e/assets-v1/3acd6e00-1100-4435-bab7-e1fc4b79fb6c/adinkra-symbol-8.png", ratio: 1.0 },
  { id: "el43", name: "Adinkra symbol 9", category: "adinkra", url: "/__l5e/assets-v1/9840307f-450c-4e3a-b243-a2fdf4197c38/adinkra-symbol-9.png", ratio: 0.923 },
  { id: "el44", name: "Adinkra symbol 10", category: "adinkra", url: "/__l5e/assets-v1/8af33ae4-7ca7-46c1-b09d-5c0562aa77ff/adinkra-symbol-10.png", ratio: 1.095 },
  { id: "el45", name: "Adinkra symbol 11", category: "adinkra", url: "/__l5e/assets-v1/299da372-fe14-4b7a-a3ff-9cf124db6346/adinkra-symbol-11.png", ratio: 1.077 },
  { id: "el46", name: "Adinkra symbol 12", category: "adinkra", url: "/__l5e/assets-v1/aa19c1b6-e45c-4ba3-8175-75c94fa7428e/adinkra-symbol-12.png", ratio: 1.031 },
  { id: "el47", name: "Gold corner ornament", category: "corners", url: "/__l5e/assets-v1/548fa88b-fee7-4e84-bdac-0bf6ffe14e22/gold-corner-ornament.png", ratio: 1.138 },
  { id: "el48", name: "Gold quill", category: "academic", url: "/__l5e/assets-v1/e424d478-085b-4a0e-84b9-1b3c775adc16/gold-quill.png", ratio: 0.959 },
  { id: "el49", name: "Fountain pen", category: "academic", url: "/__l5e/assets-v1/4e729419-53bc-486c-8a12-550642a96689/fountain-pen.png", ratio: 1.461 },
];

/** A placed element. x/y = centre and w = width, all as % of the sheet width/height. */
export type PlacedElement = { key: string; elementId: string; url: string; ratio: number; x: number; y: number; w: number; rotation: number; opacity: number; behind: boolean; locked: boolean };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
let seq = 0;
export function placeElement(el: CertElement): PlacedElement {
  const frame = el.category === "frames";
  return { key: `${el.id}-${Date.now()}-${seq++}`, elementId: el.id, url: el.url, ratio: el.ratio, x: 50, y: 50, w: frame ? 100 : el.category === "dividers" || el.category === "kente" ? 40 : 15, rotation: 0, opacity: 1, behind: frame, locked: false };
}
export function updateElement(p: PlacedElement, patch: Partial<PlacedElement>): PlacedElement {
  if (p.locked && !("locked" in patch)) return p;
  const n = { ...p, ...patch };
  return { ...n, x: clamp(n.x, 0, 100), y: clamp(n.y, 0, 100), w: clamp(n.w, 3, 110), opacity: clamp(n.opacity, 0.05, 1), rotation: ((n.rotation % 360) + 360) % 360 };
}
export function moveLayer(list: PlacedElement[], key: string, dir: -1 | 1): PlacedElement[] {
  const i = list.findIndex((p) => p.key === key); const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const out = [...list]; [out[i], out[j]] = [out[j]!, out[i]!]; return out;
}
export function duplicateElement(p: PlacedElement): PlacedElement {
  return { ...p, key: `${p.elementId}-${Date.now()}-${seq++}`, x: clamp(p.x + 4, 0, 100), y: clamp(p.y + 4, 0, 100), locked: false };
}
