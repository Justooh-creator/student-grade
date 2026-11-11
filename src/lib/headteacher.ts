/** True only when the signed-in teacher's profile name matches the headteacher
 *  name saved in School Details. Used to gate custom headteacher remarks. */
export function canCustomHeadRemark(profileName: string, headTeacherName: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const head = norm(headTeacherName);
  return head !== "" && norm(profileName) === head;
}
