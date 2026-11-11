/** School Details access comes from verified account privileges, never name matching. */
export function canEditSchoolDetails(role?: string, isAdmin = false): boolean {
  return isAdmin || role === "headteacher" || role === "admin";
}