import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
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

const PAYMENTS = [
  { id: "p1", date: "2026-07-01", plan: "Pro", amount: "N$1,500", status: "Paid" },
  { id: "p2", date: "2026-06-01", plan: "Pro", amount: "N$1,500", status: "Paid" },
  { id: "p3", date: "2026-05-01", plan: "Pro", amount: "N$1,500", status: "Paid" },
  { id: "p4", date: "2026-04-01", plan: "Basic", amount: "N$500", status: "Paid" },
];

function BillingPage() {
  const currentPlan = "pro";
  const used = 12480;
  const limit = 60000;

  return (
    <>
      <PageHeader title="Billing & plans" subtitle="Manage your subscription and payment history." />

      <Card className="p-5 mb-6 border-primary/40 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold">You're on the Pro plan</p>
            <p className="text-xs text-muted-foreground">Renews on August 1, 2026 · N$1,500/month</p>
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
              disabled={p.id === currentPlan}
              onClick={() => {
                if (p.id === "business") toast.info("Sales will reach out shortly");
                else toast.success(`Upgrading to ${p.name}...`);
              }}
            >
              {p.id === currentPlan ? "Current plan" : p.id === "business" ? "Contact sales" : "Upgrade"}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-1">Usage this month</h3>
        <p className="text-xs text-muted-foreground mb-4">Messages sent · Pro plan cap</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{used.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">of {limit.toLocaleString()}</span>
        </div>
        <Progress value={(used / limit) * 100} />
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Payment history</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b border-border">
              <th className="font-medium px-4 py-2.5">Date</th>
              <th className="font-medium py-2.5">Plan</th>
              <th className="font-medium py-2.5">Amount</th>
              <th className="font-medium py-2.5">Status</th>
              <th className="font-medium px-4 py-2.5 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {PAYMENTS.map((p) => (
              <tr key={p.id} className="border-b border-border/40">
                <td className="px-4 py-3">{p.date}</td>
                <td className="py-3">{p.plan}</td>
                <td className="py-3">{p.amount}</td>
                <td className="py-3"><span className="text-primary text-xs">{p.status}</span></td>
                <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => toast.success("Invoice downloaded")}>Download</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}