import { createFileRoute } from "@tanstack/react-router";
import { PLAN_CREDITS, priceIdToPlan } from "@/lib/plans";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !webhookSecret) {
          return new Response("Stripe not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const rawBody = await request.text();
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(secret);

        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
        } catch (err) {
          console.error("Webhook signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        async function applySubscription(sub: import("stripe").Stripe.Subscription, userIdHint?: string) {
          const userId =
            userIdHint ??
            (sub.metadata?.user_id as string | undefined) ??
            null;
          if (!userId) return;
          const priceId = sub.items.data[0]?.price.id;
          const plan = priceId ? priceIdToPlan(priceId) : null;
          if (!plan) return;
          const isActive = sub.status === "active" || sub.status === "trialing";
          await supabaseAdmin
            .from("profiles")
            .update({
              plan: isActive ? plan : "basic",
              credits_remaining: isActive ? PLAN_CREDITS[plan] : PLAN_CREDITS.basic,
              stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
              stripe_subscription_id: sub.id,
              subscription_status: sub.status,
            })
            .eq("user_id", userId);
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as import("stripe").Stripe.Checkout.Session;
              const userId =
                (session.metadata?.user_id as string | undefined) ??
                (session.client_reference_id as string | undefined) ??
                undefined;
              if (session.subscription) {
                const sub = await stripe.subscriptions.retrieve(
                  typeof session.subscription === "string" ? session.subscription : session.subscription.id,
                );
                await applySubscription(sub, userId);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as import("stripe").Stripe.Subscription;
              await applySubscription(sub);
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("Webhook handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});