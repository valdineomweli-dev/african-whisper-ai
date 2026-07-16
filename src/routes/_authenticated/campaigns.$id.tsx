import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { EmptyState } from "@/components/empty-state";
import { useCampaign, useCampaignMessages } from "@/lib/db-hooks";
import { ArrowLeft, MessageSquare, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campaigns/$id")({
  component: CampaignDetail,
});

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CampaignDetail() {
  const { id } = useParams({ from: "/_authenticated/campaigns/$id" });
  const { data: c, isLoading } = useCampaign(id);
  const { data: messages = [] } = useCampaignMessages(id);

  const back = (
    <Button asChild variant="ghost" size="sm" className="mb-4">
      <Link to="/campaigns"><ArrowLeft className="h-4 w-4 mr-1.5" />Back to campaigns</Link>
    </Button>
  );

  if (isLoading) {
    return (
      <>
        {back}
        <Card><EmptyState icon={BarChart3} title="Loading campaign..." /></Card>
      </>
    );
  }

  if (!c) {
    return (
      <>
        {back}
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="Campaign not found"
            description="This campaign no longer exists or you don't have access."
            action={<Button asChild><Link to="/campaigns">Back to campaigns</Link></Button>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={c.name}
        subtitle={`Created ${c.created_at.slice(0, 10)}`}
        actions={<StatusBadge status={c.status} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Recipients", value: messages.length.toLocaleString() },
          { label: "Sent", value: c.sent_count.toLocaleString() },
          { label: "Delivered", value: c.delivered_count.toLocaleString(), sub: `${c.sent_count ? Math.round((c.delivered_count / c.sent_count) * 100) : 0}%` },
          { label: "Read", value: c.read_count.toLocaleString(), sub: `${c.sent_count ? Math.round((c.read_count / c.sent_count) * 100) : 0}%` },
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
          <h3 className="font-semibold mb-4">Campaign summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={c.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(c.created_at).toLocaleString()}</span></div>
            {c.scheduled_at && (
              <div className="flex justify-between"><span className="text-muted-foreground">Scheduled for</span><span>{new Date(c.scheduled_at).toLocaleString()}</span></div>
            )}
            {c.media_url && (
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">Media</span><span className="truncate max-w-[240px]">{c.media_url}</span></div>
            )}
          </div>
        </Card>
        <div>
          <p className="text-sm font-medium mb-3">Message preview</p>
          <WhatsAppPreview message={c.message} />
        </div>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Individual messages</h3>
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Individual message deliveries will appear here once the campaign starts sending."
          />
        ) : (
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
                {messages.map((m) => {
                  const contact = (m as unknown as { contacts?: { name: string; phone: string } | null }).contacts;
                  return (
                    <tr key={m.id} className="border-b border-border/40">
                      <td className="py-2.5 font-medium">{contact?.name ?? "—"}</td>
                      <td className="py-2.5 text-muted-foreground font-mono text-xs">{contact?.phone ?? "—"}</td>
                      <td className="py-2.5"><StatusBadge status={m.status} /></td>
                      <td className="py-2.5 text-muted-foreground text-xs">{fmtTime(m.sent_at)}</td>
                      <td className="py-2.5 text-muted-foreground text-xs">{fmtTime(m.delivered_at)}</td>
                      <td className="py-2.5 text-muted-foreground text-xs">{fmtTime(m.read_at)}</td>
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