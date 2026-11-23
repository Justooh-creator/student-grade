/** Official GES dates used only as optional one-tap helpers; teachers can always pick any date. */
const GES_DATES: Record<string, Record<string, { vacate?: string; reopen?: string }>> = {
  "2026/2027": {
    "Term 1": { vacate: "17th December 2026", reopen: "5th January 2027" },
    "Term 2": { vacate: "25th March 2027", reopen: "20th April 2027" },
    "Term 3": { vacate: "22nd July 2027" },
  },
};

/** GES vacation date for this term and the next term's reopening date, when known. */
export function gesDateHints(academicYear: string, term: string): { vacate?: string; reopen?: string } {
  return GES_DATES[academicYear]?.[term] ?? {};
}
