import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROMPT = `This is a photo of a Ghanaian school class register (handwritten or printed).
Extract every learner listed, in order from top to bottom. For each, return the full name exactly as written
(fix only obvious letter casing, e.g. "KOFI mensah" -> "Kofi Mensah"), the admission number if shown (else ""),
and gender as "Male", "Female" or "" if not shown. Ignore headings, dates, ticks, totals and teacher names.
If a name is hard to read, give your best guess. Return an empty list if no register is visible.`;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["learners"],
  properties: {
    learners: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "admissionNo", "gender"],
        properties: {
          name: { type: "string" },
          admissionNo: { type: "string" },
          gender: { type: "string", enum: ["Male", "Female", ""] },
        },
      },
    },
  },
} as const;

type Learner = { name: string; admissionNo: string; gender: string };

export const scanRegisterPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { image: string }) => {
    if (typeof d?.image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(d.image)) throw new Error("Please choose a photo.");
    if (d.image.length > 8_000_000) throw new Error("Photo is too large.");
    return d;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Register reading is not set up yet.");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output, jsonSchema } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        messages: [{ role: "user", content: [
          { type: "text", text: PROMPT },
          { type: "image", image: data.image },
        ] }],
        output: Output.object({ schema: jsonSchema<{ learners: Learner[] }>(schema as never) }),
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      });
      const out = await result.output;
      return { learners: (out?.learners ?? []).map((l) => ({ name: l.name.trim().replace(/\s+/g, " "), admissionNo: l.admissionNo.trim(), gender: l.gender })).filter((l) => l.name) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (/402|credit/i.test(msg)) throw new Error("Register reading is paused right now. Please try again later.");
      if (/429/.test(msg)) throw new Error("Too many photos at once. Wait a minute and try again.");
      console.error("scanRegisterPhoto", e);
      throw new Error("Could not read this photo. Try a clearer, well-lit picture.");
    }
  });
