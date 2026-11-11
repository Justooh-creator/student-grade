/** Who may print report cards: independent teachers, or school headteacher / assistant headteacher / admin. Class teachers in a school may only preview. */
export const REPORT_PRINT_ROLES = ["headteacher", "assistant_headteacher", "admin"];
export function canPrintReports(inSchool: boolean, role?: string) {
  return !inSchool || REPORT_PRINT_ROLES.includes(role ?? "");
}
