export type ThemeChoice = "light" | "dark" | "system";
const KEY = "edureport-theme";

export function getTheme(): ThemeChoice {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem(KEY);
  return v === "dark" || v === "system" ? v : "light";
}

export function applyTheme(choice: ThemeChoice = getTheme()) {
  if (typeof window === "undefined") return;
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(choice: ThemeChoice) {
  localStorage.setItem(KEY, choice);
  applyTheme(choice);
}

/** Call once from the app shell after hydration. */
export function initTheme() {
  applyTheme();
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const fn = () => getTheme() === "system" && applyTheme("system");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}
