import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_PRICE_IDS, type PlanId } from "./plans";

function assertPlan(plan: string): asserts plan is PlanId {
  if (plan !== "basic" && plan !== "pro" && plan !== "business") {
    throw new Error("Invalid plan");
  }
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: string; origin: string }) => {
    assertPlan(input.plan);
    if (!/^https?:\/\//.test(input.origin)) throw new Error("Invalid origin");
    return { plan: input.plan as PlanId, origin: input.origin };
  })
  .handler(async ({ data, context }) => {
    const { default: Stripe } = await import("stripe");
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error("Stripe not configured");
    const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" as never });

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PLAN_PRICE_IDS[data.plan], quantity: 1 }],
      success_url: `${data.origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/billing?canceled=true`,
      customer: (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? undefined,
      customer_email:
        (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
          ? undefined
          : (profile?.email ?? undefined),
      client_reference_id: context.userId,
      metadata: { user_id: context.userId, plan: data.plan },
      subscription_data: { metadata: { user_id: context.userId, plan: data.plan } },
      allow_promotion_codes: true,
    });

    return { url: session.url };
  });