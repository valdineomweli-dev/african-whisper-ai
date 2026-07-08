import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useCampaigns, requireUserId, type Campaign } from "@/lib/db-hooks";
import { supabase } from "@/integrations/supabase/client";
import { Search, LayoutGrid, List, Copy, Trash2, Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsLayout,
});

function CampaignsLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/campaigns") return <Outlet />;
  return <CampaignsList />;
}

function CampaignsList() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useCampaigns();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [toDelete, setToDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((c) => (status === "all" || c.status === status) && c.name.toLowerCase().includes(query.toLowerCase())),
    [items, status, query],
  );

  async function duplicate(id: string) {
    const c = items.find((x) => x.id === id);
    if (!c) return;
    try {
      const user_id = await requireUserId();
      const { error } = await supabase.from("campaigns").insert({
        user_id,
        name: c.name + " (copy)",
        message: c.message,
        media_url: c.media_url,
        contact_list_id: c.contact_list_id,
        status: "draft",
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign duplicated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to duplicate");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", toDelete);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Deleted");
    }
    setToDelete(null);
  }

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle={isLoading ? "Loading..." : `${items.length} campaign${items.length === 1 ? "" : "s"}`}
        actions={
          <Button asChild className="glow-primary">
            <Link to="/compose"><Plus className="h-4 w-4 mr-2" />New campaign</Link>
          </Button>
        }
      />

      <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaigns..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all", "sent", "sending", "scheduled", "draft", "failed"].map((s) => (
              <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border border-border p-0.5">
          <button onClick={() => setView("grid")} className={`px-3 py-1.5 rounded ${view === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded ${view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {items.length === 0 && !isLoading ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Compose your first WhatsApp campaign to reach your contacts."
            action={
              <Button asChild className="glow-primary">
                <Link to="/compose"><Plus className="h-4 w-4 mr-2" />New campaign</Link>
              </Button>
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c: Campaign) => {
            const pct = c.sent_count ? Math.round((c.delivered_count / c.sent_count) * 100) : 0;
            return (
              <Card key={c.id} className="p-5 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <Link to="/campaigns/$id" params={{ id: c.id }} className="font-semibold hover:text-primary">{c.name}</Link>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.message}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span>{c.sent_count.toLocaleString()}</span></div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex justify-between text-muted-foreground pt-1"><span>Delivery {pct}%</span><span>{c.created_at.slice(0, 10)}</span></div>
                </div>
                <div className="flex gap-1 mt-4 pt-3 border-t border-border">
                  <Button asChild size="sm" variant="ghost" className="flex-1"><Link to="/campaigns/$id" params={{ id: c.id }}>View</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicate(c.id)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="font-medium px-4 py-3">Name</th>
                  <th className="font-medium py-3">Sent</th>
                  <th className="font-medium py-3">Read %</th>
                  <th className="font-medium py-3">Status</th>
                  <th className="font-medium py-3">Date</th>
                  <th className="font-medium py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: Campaign) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium"><Link to="/campaigns/$id" params={{ id: c.id }} className="hover:text-primary">{c.name}</Link></td>
                    <td className="py-3">{c.sent_count.toLocaleString()}</td>
                    <td className="py-3">{c.sent_count ? Math.round((c.read_count / c.sent_count) * 100) : 0}%</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-muted-foreground">{c.created_at.slice(0, 10)}</td>
                    <td className="pr-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => setToDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}