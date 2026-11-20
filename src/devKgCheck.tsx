// TEMPORARY verification helper — deleted after the browser check.
import { createRoot } from "react-dom/client";
import { KgReportSheet } from "@/components/KgReportSheet";
export function mount(el: HTMLElement, props: unknown) {
  createRoot(el).render(<KgReportSheet {...(props as Parameters<typeof KgReportSheet>[0])} />);
}
