import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function cfg() {
  const subKey = process.env["MOMO_SUBSCRIPTION_KEY"];
  const apiUser = process.env["MOMO_API_USER"];
  const apiKey = process.env["MOMO_API_KEY"];
  const env = process.env["MOMO_TARGET_ENV"] ?? "sandbox";
  const base = process.env["MOMO_BASE_URL"] ?? "https://sandbox.momodeveloper.mtn.com";
  if (!subKey || !apiUser || !apiKey) return null;
  return { subKey, apiUser, apiKey, env, base };
}

async function token(c: NonNullable<ReturnType<typeof cfg>>) {
  const res = await fetch(`${c.base}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${c.apiUser}:${c.apiKey}`)}`,
      "Ocp-Apim-Subscription-Key": c.subKey,
    },
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export const requestMomoPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ phone: z.string().regex(/^0?\d{9}$|^233\d{9}$/) }).parse(d))
  .handler(async ({ data }) => {
    const c = cfg();
    if (!c) return { ok: false as const, error: "Mobile Money payments are not set up yet." };
    try {
      const t = await token(c);
      const ref = crypto.randomUUID();
      const msisdn = data.phone.startsWith("233") ? data.phone : `233${data.phone.replace(/^0/, "")}`;
      const res = await fetch(`${c.base}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "X-Reference-Id": ref,
          "X-Target-Environment": c.env,
          "Ocp-Apim-Subscription-Key": c.subKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: "10",
          currency: c.env === "sandbox" ? "EUR" : "GHS",
          externalId: ref,
          payer: { partyIdType: "MSISDN", partyId: msisdn },
          payerMessage: "SBA report card printing (3 hours)",
          payeeNote: "SBA Report Cards",
        }),
      });
      if (res.status !== 202) {
        console.error("momo requesttopay", res.status, await res.text());
        return { ok: false as const, error: "Could not start the payment. Try again." };
      }
      return { ok: true as const, ref };
    } catch (e) {
      console.error(e);
      return { ok: false as const, error: "Payment service unavailable." };
    }
  });

export const checkMomoPayment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ref: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const c = cfg();
    if (!c) return { status: "FAILED" as const };
    try {
      const t = await token(c);
      const res = await fetch(`${c.base}/collection/v1_0/requesttopay/${data.ref}`, {
        headers: {
          Authorization: `Bearer ${t}`,
          "X-Target-Environment": c.env,
          "Ocp-Apim-Subscription-Key": c.subKey,
        },
      });
      const j = (await res.json()) as { status?: string };
      const s = j.status === "SUCCESSFUL" ? "SUCCESSFUL" : j.status === "FAILED" || j.status === "REJECTED" ? "FAILED" : "PENDING";
      return { status: s as "SUCCESSFUL" | "FAILED" | "PENDING" };
    } catch {
      return { status: "PENDING" as const };
    }
  });
