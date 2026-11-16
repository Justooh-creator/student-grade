export const APP_URL = "https://edureportghana.com";

export const SHARE_MESSAGE = [
  "🇬🇭 *EduReport Ghana* — GES report cards for KG 1 to Basic 9",
  "",
  "📴 Works offline, syncs instantly when online",
  "📊 SBA totals, grades & positions done for you",
  "📝 Attendance, fees, certificates & Q&A",
  "📲 Send results to parents on WhatsApp",
  "",
  `Free to start: ${APP_URL}`,
].join("\n");

export function whatsappShareUrl(message = SHARE_MESSAGE) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Native share sheet on phones; falls back to WhatsApp. */
export async function shareApp(): Promise<void> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "EduReport Ghana", text: SHARE_MESSAGE });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  window.open(whatsappShareUrl(), "_blank", "noopener,noreferrer");
}
