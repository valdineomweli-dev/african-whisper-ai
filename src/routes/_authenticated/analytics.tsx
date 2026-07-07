import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { mockCampaigns, mockDailySends } from "@/lib/mock-data";
import { Download } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [range, setRange] = useState("30");
  const totalSent = mockCampaigns.reduce((a, c) => a + c.sent, 0);
  const totalDelivered = mockCampaigns.reduce((a, c) => a + c.delivered, 0);
  const totalRead = mockCampaigns.reduce((a, c) => a + c.read, 0);
  const delivRate = totalSent ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalSent ? Math.round((totalRead / totalSent) * 100) : 0;
  const best = [...mockCampaigns].filter((c) => c.sent).sort((a, b) => b.delivered / b.sent - a.delivered / a.sent)[0];

  const topFive = [...mockCampaigns].filter((c) => c.sent).sort((a, b) => b.delivered - a.delivered).slice(0, 5)
    .map((c) => ({ name: c.name.length > 14 ? c.name.slice(0, 12) + "…" : c.name, rate: Math.round((c.delivered / c.sent) * 100) }));

  const pieData = [
    { name: "Read", value: totalRead, color: "oklch(0.78 0.18 149)" },
    { name: "Delivered (not read)", value: totalDelivered - totalRead, color: "oklch(0.62 0.12 174)" },
    { name: "Sent (not delivered)", value: totalSent - totalDelivered, color: "oklch(0.72 0.16 60)" },
    { name: "Failed", value: 47, color: "oklch(0.62 0.24 27)" },
  ];

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
            <ResponsiveContainer>
              <LineChart data={mockDailySends}>
                <CartesianGrid stroke="hsl(0 0% 20%)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="hsl(0 0% 62%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 62%)" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="sent" stroke="oklch(0.78 0.18 149)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top 5 campaigns · delivery rate</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={topFive} layout="vertical">
                <CartesianGrid stroke="hsl(0 0% 20%)" strokeDasharray="3 3" />
                <XAxis type="number" stroke="hsl(0 0% 62%)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="hsl(0 0% 62%)" fontSize={11} width={100} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                <Bar dataKey="rate" fill="oklch(0.78 0.18 149)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">Message status breakdown</h3>
        <div className="h-[280px]">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
                {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
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
              {mockCampaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="py-2.5">{c.sent.toLocaleString()}</td>
                  <td className="py-2.5">{c.delivered.toLocaleString()}</td>
                  <td className="py-2.5">{c.read.toLocaleString()}</td>
                  <td className="py-2.5">{c.sent ? Math.round((c.delivered / c.sent) * 100) : 0}%</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}