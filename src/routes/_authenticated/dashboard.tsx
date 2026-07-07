import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { mockCampaigns, mockDailySends } from "@/lib/mock-data";
import {
  Send,
  CheckCheck,
  Megaphone,
  Zap,
  ArrowUpRight,
  Plus,
  Upload,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const chartTheme = {
  grid: "hsl(0 0% 20%)",
  text: "hsl(0 0% 62%)",
};

const deliveryData = mockCampaigns
  .filter((c) => c.sent > 0)
  .slice(0, 5)
  .map((c) => ({
    name: c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name,
    delivered: Math.round((c.delivered / c.sent) * 100),
    read: Math.round((c.read / c.sent) * 100),
  }));

function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  accent = "text-primary",
  progress,
  warning,
}: {
  label: string;
  value: string;
  trend?: string;
  icon: React.ElementType;
  accent?: string;
  progress?: number;
  warning?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${warning ? "text-yellow-400" : ""}`}>{value}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
          <TrendingUp className="h-3 w-3" /> {trend}
        </div>
      )}
      {progress !== undefined && <Progress value={progress} className="mt-3 h-1.5" />}
    </Card>
  );
}

function DashboardPage() {
  const totalSent = mockCampaigns.reduce((a, c) => a + c.sent, 0);
  const totalDelivered = mockCampaigns.reduce((a, c) => a + c.delivered, 0);
  const deliveryRate = totalSent ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const active = mockCampaigns.filter((c) => c.status === "sending" || c.status === "scheduled").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your WhatsApp campaigns and performance."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/contacts"><Upload className="h-4 w-4 mr-2" />Import contacts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ai"><Sparkles className="h-4 w-4 mr-2" />AI generate</Link>
            </Button>
            <Button asChild className="glow-primary">
              <Link to="/compose"><Plus className="h-4 w-4 mr-2" />New campaign</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Messages sent" value={totalSent.toLocaleString()} trend="+18.2% vs last month" icon={Send} />
        <StatCard label="Delivery rate" value={`${deliveryRate}%`} icon={CheckCheck} progress={deliveryRate} />
        <StatCard label="Active campaigns" value={String(active)} trend="2 scheduled today" icon={Megaphone} />
        <StatCard label="Credits remaining" value="2,340" warning icon={Zap} progress={35} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Messages sent</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <LineChart data={mockDailySends}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 149)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 149)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={chartTheme.text} fontSize={11} />
                <YAxis stroke={chartTheme.text} fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="sent" stroke="oklch(0.78 0.18 149)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold">Delivery vs Read</h3>
            <p className="text-xs text-muted-foreground">By campaign (%)</p>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={deliveryData}>
                <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={chartTheme.text} fontSize={10} />
                <YAxis stroke={chartTheme.text} fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="delivered" fill="oklch(0.78 0.18 149)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="read" fill="oklch(0.62 0.12 174)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Recent campaigns</h3>
          <Button asChild variant="ghost" size="sm">
            <Link to="/campaigns">View all <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="font-medium px-6 py-2.5">Name</th>
                <th className="font-medium py-2.5">Contacts</th>
                <th className="font-medium py-2.5">Sent</th>
                <th className="font-medium py-2.5">Delivered</th>
                <th className="font-medium py-2.5">Read %</th>
                <th className="font-medium py-2.5">Status</th>
                <th className="font-medium px-6 py-2.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockCampaigns.slice(0, 6).map((c) => {
                const readPct = c.sent ? Math.round((c.read / c.sent) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 font-medium">
                      <Link to="/campaigns/$id" params={{ id: c.id }} className="hover:text-primary">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{c.contacts.toLocaleString()}</td>
                    <td className="py-3">{c.sent.toLocaleString()}</td>
                    <td className="py-3">{c.delivered.toLocaleString()}</td>
                    <td className="py-3">{readPct}%</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-6 py-3 text-right text-muted-foreground">{c.date}</td>
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