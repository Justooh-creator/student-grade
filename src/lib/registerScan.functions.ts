import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseDob } from "@/lib/studentImport";

const PROMPT = `This is a photo of a Ghanaian school class register (handwritten or printed).
Extract every learner listed, in order from top to bottom. For each, return the full name exactly as written
(fix only obvious letter casing, e.g. "KOFI mensah" -> "Kofi Mensah"), the admission number if shown (else ""),
gender as "Male", "Female" or "" if not shown, and the date of birth exactly as written if a birth-date column is shown (else "").
If there is no sex column but boys are listed first and girls follow after a gap of blank rows, give those above the gap
"Male" and those below it "Female". Ignore headings, dates, ticks, totals and teacher names.
If a name is hard to read, give your best guess. Return an empty list if no register is visible.`;

// Gemini structured-output schema (OpenAPI subset).
const schema = {
  type: "OBJECT",
  required: ["learners"],
  properties: {
    learners: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["name", "admissionNo", "gender", "dob"],
        properties: {
          name: { type: "STRING" },
          admissionNo: { type: "STRING" },
          gender: { type: "STRING", description: '"Male", "Female" or "" when not shown' },
          dob: { type: "STRING" },
        },
      },
    },
  },
};

type Learner = { name: string; admissionNo: string; gender: string; dob: string };

export const scanRegisterPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { image: string }) => {
    if (typeof d?.image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(d.image)) throw new Error("Please choose a photo.");
    if (d.image.length > 8_000_000) throw new Error("Photo is too large.");
    return d;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API"] || process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("Photo scanner is not set up yet. Use the Excel/CSV upload for now.");
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.*)$/s.exec(data.image);
    if (!m) throw new Error("Please choose a photo.");
    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: PROMPT }, { inline_data: { mime_type: m[1], data: m[2] } }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: schema },
    });
    // Newest first; fall through to the next model when one is busy or retired.
    const models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    let res: Response | null = null;
    for (const model of models) {
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body,
        });
      } catch (e) {
        console.error("scanRegisterPhoto network", model, e);
        res = null;
        continue;
      }
      if (res.ok || ![404, 500, 503].includes(res.status)) break;
      console.warn("scanRegisterPhoto model unavailable", model, res.status);
    }
    if (!res) throw new Error("Could not reach the photo scanner. Check your internet connection and try again.");
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("scanRegisterPhoto gemini", res.status, errBody.slice(0, 500));
      if (res.status === 429) throw new Error("Photo scanner has reached today's free limit. Try again later or use the Excel/CSV upload.");
      if (res.status === 400 && /api key/i.test(errBody)) throw new Error("Photo scanner key was not accepted. Use the Excel/CSV upload for now.");
      if (res.status === 401 || res.status === 403) throw new Error("Photo scanner key was not accepted. Use the Excel/CSV upload for now.");
      if (res.status >= 500) throw new Error("Photo scanner is busy right now. Wait a minute and try again.");
      throw new Error("Photo scanner could not process this picture. Try again or use the Excel/CSV upload.");
    }
    const json = (await res.json().catch(() => null)) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] } | null;
    const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    let out: { learners?: Learner[] } | null = null;
    try { out = text ? JSON.parse(text) : null; } catch { out = null; }
    if (!out) {
      console.error("scanRegisterPhoto parse", json?.candidates?.[0]?.finishReason, text.slice(0, 300));
      throw new Error("Could not read this photo. Try a clearer, well-lit picture.");
    }
    return { learners: (out.learners ?? []).map((l) => {
      const dob = parseDob(String(l.dob ?? ""));
      const g = String(l.gender ?? "").trim().toLowerCase();
      const gender = g.startsWith("m") || g === "boy" ? "Male" : g.startsWith("f") || g === "girl" ? "Female" : "";
      return { name: String(l.name ?? "").trim().replace(/\s+/g, " "), admissionNo: String(l.admissionNo ?? "").trim(), gender, ...(dob ? { dob } : {}) };
    }).filter((l) => l.name) };
  });
