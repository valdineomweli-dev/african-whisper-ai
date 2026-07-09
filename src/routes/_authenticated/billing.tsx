import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useProfile } from "@/lib/db-hooks";
import { createCheckoutSession } from "@/lib/stripe.functions";
import { Check, Zap, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  validateSearch: z.object({
    success: z.boolean().optional(),
    canceled: z.boolean().optional(),
    session_id: z.string().optional(),
  }),
  component: BillingPage,
});

const PLANS = [
  {
    id: "basic", name: "Basic", price: "N$500", popular: false,
    features: ["500 messages/day", "1,000 contacts", "Basic analytics", "Email support", "1 WhatsApp number"],
  },
  {
    id: "pro", name: "Pro", price: "N$1,500", popular: true,
    features: ["2,000 messages/day", "10,000 contacts", "Advanced analytics", "Priority support", "AI message generator", "3 WhatsApp numbers"],
  },
  {
    id: "business", name: "Business", price: "N$3,000", popular: false,
    features: ["Unlimited messages", "Unlimited contacts", "Full analytics suite", "Dedicated support", "Full AI suite", "10 WhatsApp numbers", "Custom branding"],
  },
];

function BillingPage() {
  const { data: profile } = useProfile();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const checkout = useServerFn(createCheckoutSession);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (search.success) {
      toast.success("Payment successful — your plan is being activated.");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      window.history.replaceState({}, "", "/billing");
    } else if (search.canceled) {
      toast.info("Checkout canceled.");
      window.history.replaceState({}, "", "/billing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpgrade(planId: string) {
    if (planId === "business") {
      toast.info("Sales will reach out shortly");
      return;
    }
    setPendingPlan(planId);
    try {
      const { url } = await checkout({ data: { plan: planId, origin: window.location.origin } });
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
      setPendingPlan(null);
    }
  }

  const currentPlan = profile?.plan ?? "basic";
  const credits = profile?.credits_remaining ?? 500;
  const limit = 500;
  const used = Math.max(0, limit - credits);
  const currentName = PLANS.find((p) => p.id === currentPlan)?.name ?? "Basic";
  const currentPrice = PLANS.find((p) => p.id === currentPlan)?.price ?? "N$500";

  return (
    <>
      <PageHeader title="Billing & plans" subtitle="Manage your subscription and payment history." />

      <Card className="p-5 mb-6 border-primary/40 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold">You're on the {currentName} plan</p>
            <p className="text-xs text-muted-foreground">{credits.toLocaleString()} credits remaining · {currentPrice}/month</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => toast.info("Redirect to portal")}>Manage subscription</Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLANS.map((p) => (
          <Card key={p.id} className={`p-6 relative ${p.popular ? "border-primary glow-primary" : ""}`}>
            {p.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold rounded-full">
                Most popular
              </span>
            )}
            <h3 className="font-bold text-lg">{p.name}</h3>
            <p className="mt-2 text-3xl font-bold">{p.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className={`w-full mt-6 ${p.popular ? "glow-primary" : ""}`}
              variant={p.id === currentPlan ? "outline" : p.popular ? "default" : "secondary"}
              disabled={p.id === currentPlan || pendingPlan !== null}
              onClick={() => handleUpgrade(p.id)}
            >
              {pendingPlan === p.id ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting…</>
              ) : p.id === currentPlan ? (
                "Current plan"
              ) : p.id === "business" ? (
                "Contact sales"
              ) : (
                "Upgrade"
              )}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-1">Credits this cycle</h3>
        <p className="text-xs text-muted-foreground mb-4">Messages used · {currentName} plan</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{used.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">of {limit.toLocaleString()}</span>
        </div>
        <Progress value={limit ? (used / limit) * 100 : 0} />
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Payment history</div>
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Your invoices and payment history will appear here after your first billing cycle."
        />
      </Card>
    </>
  );
}