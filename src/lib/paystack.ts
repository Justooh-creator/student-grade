/** Paystack inline popup checkout (public key only — safe for the browser). */

export const PAYSTACK_PUBLIC_KEY = "pk_live_ca5e6ac93f8d08348c74316b70892910ec44b28f";

export interface PaystackPlan {
  id: string;
  label: string;
  /** GH₵ amount */
  amount: number;
  /** License scope + length this plan buys */
  scope: "individual" | "school";
  terms: number;
}

export const PAYSTACK_PLANS: PaystackPlan[] = [
  { id: "ind-1", label: "Independent teacher — 1 term", amount: 30, scope: "individual", terms: 1 },
  { id: "ind-3", label: "Independent teacher — 3 terms", amount: 75, scope: "individual", terms: 3 },
  { id: "sch-1", label: "School (all teachers) — 1 term", amount: 150, scope: "school", terms: 1 },
  { id: "sch-3", label: "School (all teachers) — 3 terms", amount: 350, scope: "school", terms: 3 },
];

interface PaystackPop {
  setup(options: {
    key: string;
    email: string;
    amount: number; // pesewas
    currency: string;
    ref: string;
    metadata?: Record<string, unknown>;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }): { openIframe: () => void };
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack. Check your internet."));
    document.head.appendChild(s);
  });
  return loading;
}

/** Open the Paystack popup. Resolves with the payment reference on success, null if closed. */
export async function payWithPaystack(opts: {
  email: string;
  plan: PaystackPlan;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}): Promise<void> {
  await loadScript();
  const ref = `edureport-${opts.plan.id}-${Date.now()}`;
  window.PaystackPop!.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: opts.email,
    amount: Math.round(opts.plan.amount * 100),
    currency: "GHS",
    ref,
    metadata: { plan: opts.plan.id, scope: opts.plan.scope, terms: opts.plan.terms },
    callback: (r) => opts.onSuccess(r.reference),
    onClose: () => opts.onClose?.(),
  }).openIframe();
}
