import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { mockCampaigns } from "@/lib/mock-data";
import { Search, LayoutGrid, List, Copy, Trash2, Plus } from "lucide-react";
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
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [items, setItems] = useState(mockCampaigns);

  const filtered = useMemo(
    () => items.filter((c) => (status === "all" || c.status === status) && c.name.toLowerCase().includes(query.toLowerCase())),
    [items, status, query],
  );

  function duplicate(id: string) {
    const c = items.find((x) => x.id === id);
    if (!c) return;
    setItems([{ ...c, id: crypto.randomUUID(), name: c.name + " (copy)", status: "draft" }, ...items]);
    toast.success("Campaign duplicated");
  }

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle={`${items.length} campaigns`}
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

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const pct = c.sent ? Math.round((c.delivered / c.sent) * 100) : 0;
            return (
              <Card key={c.id} className="p-5 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <Link to="/campaigns/$id" params={{ id: c.id }} className="font-semibold hover:text-primary">{c.name}</Link>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.message}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sent</span><span>{c.sent.toLocaleString()} / {c.contacts.toLocaleString()}</span></div>
                  <Progress value={c.contacts ? (c.sent / c.contacts) * 100 : 0} className="h-1.5" />
                  <div className="flex justify-between text-muted-foreground pt-1"><span>Delivery {pct}%</span><span>{c.date}</span></div>
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
                  <th className="font-medium py-3">Contacts</th>
                  <th className="font-medium py-3">Sent</th>
                  <th className="font-medium py-3">Read %</th>
                  <th className="font-medium py-3">Status</th>
                  <th className="font-medium py-3">Date</th>
                  <th className="font-medium py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium"><Link to="/campaigns/$id" params={{ id: c.id }} className="hover:text-primary">{c.name}</Link></td>
                    <td className="py-3 text-muted-foreground">{c.contacts.toLocaleString()}</td>
                    <td className="py-3">{c.sent.toLocaleString()}</td>
                    <td className="py-3">{c.sent ? Math.round((c.read / c.sent) * 100) : 0}%</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-muted-foreground">{c.date}</td>
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
            <AlertDialogAction onClick={() => { setItems((p) => p.filter((c) => c.id !== toDelete)); toast.success("Deleted"); setToDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}