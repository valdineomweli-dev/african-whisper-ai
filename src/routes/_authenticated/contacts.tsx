import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useContacts, requireUserId, type Contact } from "@/lib/db-hooks";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, Trash2, Search, Pencil, UsersRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contacts")({
  component: ContactsPage,
});

type ContactFormState = {
  id: string | null;
  name: string;
  phone: string;
  email: string;
  group_name: string;
};

function ContactsPage() {
  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useContacts();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const groups = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.group_name).filter((g): g is string => !!g))),
    [contacts],
  );

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (group !== "all" && c.group_name !== group) return false;
      if (status !== "all" && c.status !== status) return false;
      if (query && !`${c.name} ${c.phone} ${c.email ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [contacts, group, status, query]);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  async function saveContact(c: ContactFormState) {
    try {
      const user_id = await requireUserId();
      if (c.id) {
        const { error } = await supabase.from("contacts").update({
          name: c.name, phone: c.phone, email: c.email || null, group_name: c.group_name || null,
        }).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contacts").insert({
          user_id, name: c.name, phone: c.phone, email: c.email || null, group_name: c.group_name || null,
        });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setAddOpen(false);
      setEditing(null);
      toast.success("Contact saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    const { error } = await supabase.from("contacts").delete().in("id", ids);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["contacts"] });
    toast.success(`${ids.length} contact(s) removed`);
    setSelected(new Set());
  }

  async function deleteOne(id: string) {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["contacts"] });
    toast.success("Deleted");
  }

  async function importCsv(rows: Array<{ name: string; phone: string; email?: string; group?: string }>) {
    if (rows.length === 0) return toast.error("No rows to import");
    try {
      const user_id = await requireUserId();
      const payload = rows.map((r) => ({
        user_id, name: r.name, phone: r.phone, email: r.email || null, group_name: r.group || null,
      }));
      const { error } = await supabase.from("contacts").insert(payload);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success(`${rows.length} contact(s) imported`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={isLoading ? "Loading..." : `${contacts.length.toLocaleString()} total contact${contacts.length === 1 ? "" : "s"}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />Import CSV
            </Button>
            <Button className="glow-primary" onClick={() => { setEditing(null); setAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add contact
            </Button>
          </>
        }
      />

      {contacts.length === 0 && !isLoading ? (
        <Card>
          <EmptyState
            icon={UsersRound}
            title="No contacts yet"
            description="Add your first contact or import a CSV to start reaching people on WhatsApp."
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
                <Button className="glow-primary" onClick={() => { setEditing(null); setAddOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />Add contact
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
      <>
      <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email..." className="pl-9" />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
          <span className="text-sm">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => toast.info("Exported CSV")}>Export</Button>
            <Button size="sm" variant="destructive" onClick={deleteSelected}><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete</Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No contacts match those filters"
            description="Try adjusting your search or filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 w-10"><Checkbox
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onCheckedChange={(v) => setSelected(v ? new Set(filtered.map((c) => c.id)) : new Set())}
                  /></th>
                  <th className="font-medium py-3">Name</th>
                  <th className="font-medium py-3">Phone</th>
                  <th className="font-medium py-3">Email</th>
                  <th className="font-medium py-3">Group</th>
                  <th className="font-medium py-3">Status</th>
                  <th className="font-medium py-3">Added</th>
                  <th className="font-medium py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                    <td className="px-4 py-3"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} /></td>
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-muted-foreground font-mono text-xs">{c.phone}</td>
                    <td className="py-3 text-muted-foreground">{c.email ?? "—"}</td>
                    <td className="py-3">{c.group_name ?? "—"}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-muted-foreground">{c.created_at.slice(0, 10)}</td>
                    <td className="pr-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setAddOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteOne(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </>
      )}

      <ContactDialog open={addOpen} onOpenChange={setAddOpen} contact={editing} onSave={saveContact} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={importCsv} />
    </>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact: Contact | null;
  onSave: (c: ContactFormState) => void;
}) {
  const [form, setForm] = useState<ContactFormState>({
    id: contact?.id ?? null,
    name: contact?.name ?? "",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    group_name: contact?.group_name ?? "Customers",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader><DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div className="space-y-1.5"><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+264 81 000 0000" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Group</Label><Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="glow-primary">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (rows: Array<{ name: string; phone: string; email?: string; group?: string }>) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  async function handleImport() {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = {
      name: header.indexOf("name"),
      phone: header.indexOf("phone"),
      email: header.indexOf("email"),
      group: header.indexOf("group"),
    };
    if (idx.name < 0 || idx.phone < 0) {
      toast.error("CSV must include name and phone columns");
      return;
    }
    const rows: Array<{ name: string; phone: string; email?: string; group?: string }> = [];
    for (const line of lines.slice(1)) {
      const cells = line.split(",").map((c) => c.trim());
      const name = cells[idx.name];
      const phone = cells[idx.phone];
      if (!name || !phone) continue;
      rows.push({
        name,
        phone,
        email: idx.email >= 0 ? cells[idx.email] : undefined,
        group: idx.group >= 0 ? cells[idx.group] : undefined,
      });
    }
    onImport(rows);
    onOpenChange(false);
    setFile(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass">
        <DialogHeader><DialogTitle>Import contacts</DialogTitle></DialogHeader>
        <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary transition-colors">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground opacity-60" />
          <p className="mt-3 text-sm">{file ? file.name : "Drop your CSV here, or click to browse"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Columns: name, phone, email, group</p>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="glow-primary" disabled={!file} onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}