import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { mockCampaigns, mockContacts } from "@/lib/mock-data";
import { ArrowLeft, Copy } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/campaigns/$id")({
  component: CampaignDetail,
});

const timelineData = Array.from({ length: 12 }, (_, i) => ({
  t: `${i * 5}m`,
  sent: Math.round(200 + i * 180 + Math.random() * 40),
  delivered: Math.round(190 + i * 170 + Math.random() * 40),
  read: Math.round(120 + i * 140 + Math.random() * 40),
}));

function CampaignDetail() {
  const { id } = useParams({ from: "/_authenticated/campaigns/$id" });
  const c = mockCampaigns.find((x) => x.id === id) ?? mockCampaigns[0];

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/campaigns"><ArrowLeft className="h-4 w-4 mr-1.5" />Back to campaigns</Link>
        </Button>
      </div>
      <PageHeader
        title={c.name}
        subtitle={`Created ${c.date}`}
        actions={
          <>
            <StatusBadge status={c.status} />
            <Button variant="outline"><Copy className="h-4 w-4 mr-2" />Duplicate</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Contacts", value: c.contacts.toLocaleString() },
          { label: "Sent", value: c.sent.toLocaleString() },
          { label: "Delivered", value: c.delivered.toLocaleString(), sub: `${c.sent ? Math.round((c.delivered / c.sent) * 100) : 0}%` },
          { label: "Read", value: c.read.toLocaleString(), sub: `${c.sent ? Math.round((c.read / c.sent) * 100) : 0}%` },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-xs text-primary mt-1">{s.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Delivery timeline</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 149)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 149)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(0 0% 20%)" strokeDasharray="3 3" />
                <XAxis dataKey="t" stroke="hsl(0 0% 62%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 62%)" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="sent" stroke="oklch(0.78 0.18 149)" fill="url(#g1)" />
                <Area type="monotone" dataKey="delivered" stroke="oklch(0.62 0.12 174)" fill="transparent" />
                <Area type="monotone" dataKey="read" stroke="oklch(0.72 0.16 60)" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div>
          <p className="text-sm font-medium mb-3">Message preview</p>
          <WhatsAppPreview message={c.message} />
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Individual messages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="font-medium py-2">Contact</th>
                <th className="font-medium py-2">Phone</th>
                <th className="font-medium py-2">Status</th>
                <th className="font-medium py-2">Sent</th>
                <th className="font-medium py-2">Delivered</th>
                <th className="font-medium py-2">Read</th>
              </tr>
            </thead>
            <tbody>
              {mockContacts.slice(0, 8).map((contact, i) => {
                const states = ["read", "delivered", "sent", "read", "read", "failed", "delivered", "read"] as const;
                const st = states[i % states.length];
                return (
                  <tr key={contact.id} className="border-b border-border/40">
                    <td className="py-2.5 font-medium">{contact.name}</td>
                    <td className="py-2.5 text-muted-foreground font-mono text-xs">{contact.phone}</td>
                    <td className="py-2.5"><StatusBadge status={st === "failed" ? "failed" : "sent"} /></td>
                    <td className="py-2.5 text-muted-foreground text-xs">10:00</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{st !== "sent" && st !== "failed" ? "10:00" : "—"}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{st === "read" ? "10:02" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}