import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useCampaigns, useProfile, useUserMessages } from "@/lib/db-hooks";
import { useMemo } from "react";
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
  BarChart3,
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
  const campaignsQ = useCampaigns();
  const profileQ = useProfile();
  const messagesQ = useUserMessages();
  const campaigns = campaignsQ.data ?? [];
  const messages = messagesQ.data ?? [];

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count ?? 0), 0);
  const totalDelivered = campaigns.reduce((a, c) => a + (c.delivered_count ?? 0), 0);
  const deliveryRate = totalSent ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const active = campaigns.filter((c) => c.status === "sending" || c.status === "scheduled").length;
  const credits = profileQ.data?.credits_remaining ?? 500;
  const creditsPct = Math.min(100, Math.round((credits / 500) * 100));

  const dailySends = useMemo(() => {
    const buckets = new Map<string, number>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
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
  }, [messages]);

  const hasSendActivity = dailySends.some((d) => d.sent > 0);

  const deliveryData = campaigns
    .filter((c) => (c.sent_count ?? 0) > 0)
    .slice(0, 5)
    .map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name,
      delivered: Math.round(((c.delivered_count ?? 0) / c.sent_count) * 100),
      read: Math.round(((c.read_count ?? 0) / c.sent_count) * 100),
    }));

  const recent = campaigns.slice(0, 6);

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
        <StatCard label="Messages sent" value={totalSent.toLocaleString()} icon={Send} />
        <StatCard label="Delivery rate" value={`${deliveryRate}%`} icon={CheckCheck} progress={deliveryRate} />
        <StatCard label="Active campaigns" value={String(active)} icon={Megaphone} />
        <StatCard label="Credits remaining" value={credits.toLocaleString()} warning={credits < 100} icon={Zap} progress={creditsPct} />
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
            {hasSendActivity ? (
              <ResponsiveContainer>
                <LineChart data={dailySends}>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke={chartTheme.text} fontSize={11} />
                  <YAxis stroke={chartTheme.text} fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 20%)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="sent" stroke="oklch(0.78 0.18 149)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No data yet" description="Create your first campaign to see stats." />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold">Delivery vs Read</h3>
            <p className="text-xs text-muted-foreground">By campaign (%)</p>
          </div>
          <div className="h-[260px]">
            {deliveryData.length > 0 ? (
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
            ) : (
              <EmptyState icon={BarChart3} title="No campaigns yet" description="Send a campaign to compare delivery and read rates." />
            )}
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
        {recent.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Your recent campaigns will show up here. Create your first one to get started."
            action={
              <Button asChild className="glow-primary">
                <Link to="/compose"><Plus className="h-4 w-4 mr-2" />New campaign</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="font-medium px-6 py-2.5">Name</th>
                  <th className="font-medium py-2.5">Sent</th>
                  <th className="font-medium py-2.5">Delivered</th>
                  <th className="font-medium py-2.5">Read %</th>
                  <th className="font-medium py-2.5">Status</th>
                  <th className="font-medium px-6 py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => {
                  const readPct = c.sent_count ? Math.round((c.read_count / c.sent_count) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 font-medium">
                        <Link to="/campaigns/$id" params={{ id: c.id }} className="hover:text-primary">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3">{c.sent_count.toLocaleString()}</td>
                      <td className="py-3">{c.delivered_count.toLocaleString()}</td>
                      <td className="py-3">{readPct}%</td>
                      <td className="py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-6 py-3 text-right text-muted-foreground">{c.created_at.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}