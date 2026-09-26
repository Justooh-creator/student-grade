import { CLASS_LEVELS, type ClassId } from "./ges";

export function validateClassSearch(search: Record<string, unknown>): { class?: ClassId; student?: string } {
  const c = search["class"];
  const s = search["student"];
  const out: { class?: ClassId; student?: string } = {};
  if (typeof c === "string" && CLASS_LEVELS.some((l) => l.id === c)) out.class = c as ClassId;
  if (typeof s === "string" && s) out.student = s;
  return out;
}
