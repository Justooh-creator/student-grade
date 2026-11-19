/** Pupil date of birth helpers. DOB is stored as ISO "YYYY-MM-DD"; age is always calculated, never stored. */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(dob: string | undefined | null): [number, number, number] | null {
  const m = ISO.exec((dob ?? "").trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return [y, mo, d];
}

/** Completed years on `ref` (default today). Null when DOB is missing, invalid or in the future. */
export function ageInYears(dob: string | undefined | null, ref: Date = new Date()): number | null {
  const p = parts(dob);
  if (!p) return null;
  const [y, mo, d] = p;
  const ry = ref.getFullYear(), rm = ref.getMonth() + 1, rd = ref.getDate();
  let age = ry - y;
  if (rm < mo || (rm === mo && rd < d)) age--;
  return age < 0 ? null : age;
}

/** "2018-05-14" → "14 May 2018". */
export function formatDob(dob: string | undefined | null): string {
  const p = parts(dob);
  return p ? `${p[2]} ${MONTHS[p[1] - 1]} ${p[0]}` : "";
}

/** Report text: "14 May 2018 (8 yrs)" or "—". */
export function dobWithAge(dob: string | undefined | null, ref: Date = new Date()): string {
  const f = formatDob(dob);
  if (!f) return "—";
  const a = ageInYears(dob, ref);
  return a === null ? f : `${f} (${a} ${a === 1 ? "yr" : "yrs"})`;
}

export function ageLabel(dob: string | undefined | null, ref: Date = new Date()): string {
  const a = ageInYears(dob, ref);
  return a === null ? "—" : `${a} ${a === 1 ? "year" : "years"}`;
}
