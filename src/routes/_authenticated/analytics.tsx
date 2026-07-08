import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useCampaigns, useUserMessages } from "@/lib/db-hooks";
import { Download, BarChart3, Plus } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [range, setRange] = useState("30");
  const { data: campaigns = [] } = useCampaigns();
  const { data: messages = [] } = useUserMessages();

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count ?? 0), 0);
  const totalDelivered = campaigns.reduce((a, c) => a + (c.delivered_count ?? 0), 0);
  const totalRead = campaigns.reduce((a, c) => a + (c.read_count ?? 0), 0);
  const delivRate = totalSent ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalSent ? Math.round((totalRead / totalSent) * 100) : 0;
  const best = [...campaigns].filter((c) => c.sent_count).sort((a, b) => b.delivered_count / b.sent_count - a.delivered_count / a.sent_count)[0];

  const days = Number(range);
  const dailyData = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const m of messages) {
      if (!m.sent_at) continue;
      const key = m.sent_at.slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([date, sent]) => ({ date: date.slice(5), sent }));
  }, [messages, days]);
  const hasDaily = dailyData.some((d) => d.sent > 0);

  const topFive = [...campaigns]
    .filter((c) => c.sent_count)
    .sort((a, b) => b.delivered_count - a.delivered_count)
    .slice(0, 5)
    .map((c) => ({
      name: c.name.length > 14 ? c.name.slice(0, 12) + "…" : c.name,
      rate: Math.round((c.delivered_count / c.sent_count) * 100),
    }));

  const failed = messages.filter((m) => m.status === "failed").length;
  const pieData = [
    { name: "Read", value: totalRead, color: "oklch(0.78 0.18 149)" },
    { name: "Delivered (not read)", value: Math.max(0, totalDelivered - totalRead), color: "oklch(0.62 0.12 174)" },
    { name: "Sent (not delivered)", value: Math.max(0, totalSent - totalDelivered), color: "oklch(0.72 0.16 60)" },
    { name: "Failed", value: failed, color: "oklch(0.62 0.24 27)" },
  ];
  const hasPie = pieData.some((d) => d.value > 0);

  const emptyOverall = campaigns.length === 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Deep-dive into your campaign performance."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.success("CSV exported")}><Download className="h-4 w-4 mr-2" />Export</Button>
          </>
        }
      />

      {emptyOverall ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="No data yet. Create your first campaign to see stats."
            action={
              <Button asChild className="glow-primary">
                <Link to="/compose"><Plus className="h-4 w-4 mr-2" />New campaign</Link>
              </Button>
            }
          />
        </Card>
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Total sent", v: totalSent.toLocaleString() },
          { l: "Delivery rate", v: `${delivRate}%` },
          { l: "Read rate", v: `${readRate}%` },
          { l: "Best performer", v: best?.name ?? "—", small: true },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className={`mt-2 font-bold ${s.small ? "text-lg" : "text-3xl"}`}>{s.v}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Daily message volume</h3>
          <div className="h-[260px]">
            {hasDaily ? (
              <ResponsiveContainer>
                <LineChart data={dailyData}>
                  <CartesianGrid stroke="hsl(0 0% 20%)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="hsl(0 0% 62%)" fontSize={11} />
                  <YAxis stroke="hsl(0 0% 62%)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="sent" stroke="oklch(0.78 0.18 149)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No messages sent" description="Send a campaign to populate this chart." />
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top 5 campaigns · delivery rate</h3>
          <div className="h-[260px]">
            {topFive.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={topFive} layout="vertical">
                  <CartesianGrid stroke="hsl(0 0% 20%)" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="hsl(0 0% 62%)" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0 0% 62%)" fontSize={11} width={100} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                  <Bar dataKey="rate" fill="oklch(0.78 0.18 149)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No sent campaigns" description="Rankings will appear here after you send campaigns." />
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Message status breakdown</h3>
        <div className="h-[280px]">
          {hasPie ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BarChart3} title="No message activity" description="Status breakdown will show up once messages start sending." />
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">All campaigns</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="font-medium px-4 py-2.5">Name</th>
                <th className="font-medium py-2.5">Sent</th>
                <th className="font-medium py-2.5">Delivered</th>
                <th className="font-medium py-2.5">Read</th>
                <th className="font-medium py-2.5">Delivery %</th>
                <th className="font-medium px-4 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="py-2.5">{c.sent_count.toLocaleString()}</td>
                  <td className="py-2.5">{c.delivered_count.toLocaleString()}</td>
                  <td className="py-2.5">{c.read_count.toLocaleString()}</td>
                  <td className="py-2.5">{c.sent_count ? Math.round((c.delivered_count / c.sent_count) * 100) : 0}%</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}
    </>
  );
}