import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

const ORDER = ["setup", "students", "sba", "report"] as const;
type Tab = (typeof ORDER)[number];

// Ignore swipes starting on inputs, drawing areas, sliders or sideways-scrolling tables.
function blocked(el: EventTarget | null): boolean {
  let n = el as HTMLElement | null;
  while (n && n !== document.body) {
    if (n.matches?.("input, textarea, select, canvas, [contenteditable], [role=slider], [role=dialog], [data-no-swipe]")) return true;
    if (n.scrollWidth > n.clientWidth + 2) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    n = n.parentElement;
  }
  return false;
}

export function useTabSwipe(current: Tab | null, classId: string) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!current) return;
    let sx = 0, sy = 0, ok = false;
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1) { ok = false; return; }
      ok = !blocked(e.target);
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    };
    const end = (e: TouchEvent) => {
      if (!ok) return;
      ok = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const i = ORDER.indexOf(current) + (dx < 0 ? 1 : -1);
      const next = ORDER[i];
      if (!next) return;
      const search = { class: classId } as never;
      if (next === "setup") navigate({ to: "/setup", search });
      else if (next === "students") navigate({ to: "/students", search });
      else if (next === "sba") navigate({ to: "/sba-details", search });
      else navigate({ to: "/class-report/$classId", params: { classId } });
    };
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchend", end, { passive: true });
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchend", end);
    };
  }, [current, classId, navigate]);
}
