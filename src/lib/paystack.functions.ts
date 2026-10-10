import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAYSTACK_PLANS } from "@/lib/paystack";

const TERM_DAYS = 100;

/**
 * Verify a Paystack payment server-side and grant the license it bought.
 * Never trusts the browser: the reference is checked against Paystack directly.
 */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string; planId: string }) => d)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { reference, planId } = data;
    const plan = PAYSTACK_PLANS.find((p) => p.id === planId);
    if (!plan) throw new Error("Unknown plan");
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payments are not fully set up yet. Please contact support with your reference: " + reference);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    // Already processed? Return the current license state.
    const { data: existing } = await supabaseAdmin
      .from("payment_transactions")
      .select("status")
      .eq("reference", reference)
      .maybeSingle();
    if (existing?.status === "success") return { ok: true, already: true };

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = (await res.json()) as { status: boolean; data?: { status: string; amount: number; currency: string } };
    const tx = body.data;
    const ok =
      res.ok && body.status && tx?.status === "success" &&
      tx.amount === Math.round(plan.amount * 100) && tx.currency === "GHS";
    if (!ok) {
      await supabaseAdmin.from("payment_transactions").upsert({
        reference, user_id: userId, plan: plan.id, scope: plan.scope, terms: plan.terms,
        amount_pesewas: Math.round(plan.amount * 100), status: "failed",
      });
      throw new Error("Payment could not be verified. If money was taken, contact support with reference: " + reference);
    }

    // Grant the license.
    const days = plan.terms * TERM_DAYS;
    let schoolId: string | null = null;
    if (plan.scope === "school") {
      const { data: membership } = await context.supabase
        .from("school_members").select("school_id, role").eq("user_id", userId).maybeSingle();
      if (!membership || membership.role !== "headteacher") {
        throw new Error("Only the headteacher can activate a school license. Payment received — reference: " + reference);
      }
      schoolId = membership.school_id;
      const { data: school } = await supabaseAdmin
        .from("schools").select("license_expires_at").eq("id", schoolId).single();
      const base = school?.license_expires_at && new Date(school.license_expires_at) > new Date()
        ? new Date(school.license_expires_at) : new Date();
      const expires = new Date(base.getTime() + days * 86400000).toISOString();
      await supabaseAdmin.from("schools").update({ license_expires_at: expires }).eq("id", schoolId);
    } else {
      const { data: lic } = await supabaseAdmin
        .from("user_licenses").select("expires_at").eq("user_id", userId).maybeSingle();
      const base = lic?.expires_at && new Date(lic.expires_at) > new Date()
        ? new Date(lic.expires_at) : new Date();
      const expires = new Date(base.getTime() + days * 86400000).toISOString();
      await supabaseAdmin.from("user_licenses").upsert({ user_id: userId, expires_at: expires, updated_at: new Date().toISOString() });
    }

    await supabaseAdmin.from("payment_transactions").upsert({
      reference, user_id: userId, school_id: schoolId, plan: plan.id, scope: plan.scope,
      terms: plan.terms, amount_pesewas: Math.round(plan.amount * 100),
      status: "success", verified_at: new Date().toISOString(),
    });
    return { ok: true };
  });
