import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { mockContacts } from "@/lib/mock-data";
import { Plus, Upload, Trash2, Search, Pencil, UsersRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contacts")({
  component: ContactsPage,
});

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  group_name: string;
  status: string;
  created_at: string;
}

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const groups = useMemo(() => Array.from(new Set(contacts.map((c) => c.group_name))), [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (group !== "all" && c.group_name !== group) return false;
      if (status !== "all" && c.status !== status) return false;
      if (query && !`${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [contacts, group, status, query]);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function saveContact(c: Contact) {
    setContacts((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      return exists ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev];
    });
    setAddOpen(false);
    setEditing(null);
    toast.success("Contact saved");
  }

  function deleteSelected() {
    setContacts((prev) => prev.filter((c) => !selected.has(c.id)));
    toast.success(`${selected.size} contact(s) removed`);
    setSelected(new Set());
  }

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length.toLocaleString()} total contacts`}
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
          <div className="p-16 text-center">
            <UsersRound className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
            <h3 className="mt-4 font-semibold">No contacts found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or add your first contact.</p>
            <Button className="mt-4" onClick={() => { setEditing(null); setAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add contact
            </Button>
          </div>
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
                    <td className="py-3 text-muted-foreground">{c.email}</td>
                    <td className="py-3">{c.group_name}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-muted-foreground">{c.created_at}</td>
                    <td className="pr-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setAddOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setContacts((p) => p.filter((x) => x.id !== c.id)); toast.success("Deleted"); }}>
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

      <ContactDialog open={addOpen} onOpenChange={setAddOpen} contact={editing} onSave={saveContact} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={(count) => toast.success(`${count} contacts queued for import`)} />
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
  onSave: (c: Contact) => void;
}) {
  const [form, setForm] = useState<Contact>(
    contact ?? { id: crypto.randomUUID(), name: "", phone: "", email: "", group_name: "Customers", status: "active", created_at: new Date().toISOString().slice(0, 10) }
  );

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

function ImportDialog({ open, onOpenChange, onImport }: { open: boolean; onOpenChange: (v: boolean) => void; onImport: (count: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
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
          <Button className="glow-primary" disabled={!file} onClick={() => { onImport(Math.floor(Math.random() * 200 + 50)); onOpenChange(false); setFile(null); }}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}