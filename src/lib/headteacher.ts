/** True only when the signed-in teacher's profile name matches the headteacher
 *  name saved in School Details. Used to gate custom headteacher remarks. */
export function canCustomHeadRemark(profileName: string, headTeacherName: string, role?: string): boolean {
  if (role === "headteacher") return true;
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const head = norm(headTeacherName);
  return head !== "" && norm(profileName) === head;
}
