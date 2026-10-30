export const JHS_OBJECTIVE_COUNT = 45;
export const JHS_THEORY_COUNT = 5;
export const QUIZ_PAGE_SIZE = 5;
export const THEORY_REQUIRED = 4;
export const THEORY_MARKS = 20;
export const isJhsClass = (id: string): id is "b7" | "b8" | "b9" => ["b7", "b8", "b9"].includes(id);
export function quizPageRange(total: number, page: number) {
  const pages = Math.max(1, Math.ceil(total / QUIZ_PAGE_SIZE));
  const current = Math.max(0, Math.min(page, pages - 1));
  const start = current * QUIZ_PAGE_SIZE;
  return { start, end: Math.min(total, start + QUIZ_PAGE_SIZE), pages, current };
}
export function validTheorySelection(indices: number[]) {
  return indices.length === THEORY_REQUIRED && new Set(indices).size === THEORY_REQUIRED && indices.includes(0) && indices.every((i) => i >= 0 && i < JHS_THEORY_COUNT);
}