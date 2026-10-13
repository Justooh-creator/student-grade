import { isValidClassId, type ClassId } from "./ges";

export function validateClassSearch(search: Record<string, unknown>): { class?: ClassId; student?: string } {
  const c = search["class"];
  const s = search["student"];
  const out: { class?: ClassId; student?: string } = {};
  if (typeof c === "string" && isValidClassId(c)) out.class = c as ClassId;
  if (typeof s === "string" && s) out.student = s;
  return out;
}
