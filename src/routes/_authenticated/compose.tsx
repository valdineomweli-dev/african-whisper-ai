import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import { mockContactLists } from "@/lib/mock-data";
import { Sparkles, Send, Save, Paperclip, Loader2, Copy } from "lucide-react";
import { generateMessages } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compose")({
  component: ComposePage,
});

function ComposePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [listId, setListId] = useState<string>(mockContactLists[0].id);
  const [message, setMessage] = useState("Hi {name}! ");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [scheduled, setScheduled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const list = mockContactLists.find((l) => l.id === listId);

  function insertToken(t: string) {
    setMessage((m) => m + `{${t}}`);
  }

  function send(draft = false) {
    if (!name.trim()) return toast.error("Campaign name required");
    if (!message.trim()) return toast.error("Message cannot be empty");
    toast.success(
      draft
        ? "Saved as draft"
        : scheduled
        ? `Scheduled for ${scheduleAt || "later"}`
        : `Sending to ${list?.contact_count.toLocaleString()} contacts...`,
    );
    setTimeout(() => navigate({ to: "/campaigns" }), 700);
  }

  function pickMessage(text: string) {
    setMessage(text);
    setAiOpen(false);
    toast.success("Message inserted");
  }

  return (
    <>
      <PageHeader title="Compose campaign" subtitle="Craft your message and preview it live." />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <Card className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label>Campaign name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. July promo blast" />
          </div>
          <div className="space-y-1.5">
            <Label>Contact list</Label>
            <Select value={listId} onValueChange={setListId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {mockContactLists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} · {l.contact_count.toLocaleString()} contacts
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
              <Button size="sm" variant="ghost" onClick={() => setAiOpen(true)} className="text-primary hover:text-primary">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />AI generate
              </Button>
            </div>
            <Textarea rows={7} maxLength={4096} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-1.5">
                <Button type="button" size="sm" variant="outline" onClick={() => insertToken("name")}>+ {"{name}"}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => insertToken("phone")}>+ {"{phone}"}</Button>
              </div>
              <span className="text-muted-foreground">{message.length} / 4096</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" />Media URL (optional)</Label>
            <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Schedule for later</p>
              <p className="text-xs text-muted-foreground">Send at a specific time</p>
            </div>
            <Switch checked={scheduled} onCheckedChange={setScheduled} />
          </div>
          {scheduled && (
            <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => send(true)}><Save className="h-4 w-4 mr-2" />Save draft</Button>
            <Button className="flex-1 glow-primary h-11" onClick={() => send(false)}>
              <Send className="h-4 w-4 mr-2" />
              {scheduled ? "Schedule campaign" : "Send now"}
            </Button>
          </div>
        </Card>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <WhatsAppPreview message={message} mediaUrl={mediaUrl} />
          <p className="text-xs text-center text-muted-foreground mt-3">Live preview · tokens replaced with sample values</p>
        </div>
      </div>

      <AiDialog open={aiOpen} onOpenChange={setAiOpen} onPick={pickMessage} />
    </>
  );
}

function AiDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (text: string) => void;
}) {
  const [biz, setBiz] = useState("Restaurant");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"Professional" | "Casual" | "Urgent" | "Friendly">("Friendly");
  const [lang, setLang] = useState<"English" | "Afrikaans" | "Oshiwambo">("English");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; message: string; tone: string; characterCount: number }>>([]);

  async function generate() {
    if (!topic.trim()) return toast.error("Describe your promotion");
    setLoading(true);
    setResults([]);
    try {
      const res = await generateMessages({
        data: { businessName: biz, businessType: biz, goal: "Promotion", tone, details: topic, language: lang },
      });
      setResults(res.messages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />AI message generator
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Business type</Label>
            <Input value={biz} onChange={(e) => setBiz(e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Promotion / topic</Label>
            <Textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. 20% off winter menu" />
          </div>
          <div className="space-y-1.5"><Label>Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Professional", "Casual", "Urgent", "Friendly"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Language</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["English", "Afrikaans", "Oshiwambo"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={generate} disabled={loading} className="w-full glow-primary">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate 3 variations</>}
        </Button>
        {loading && (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />)}</div>
        )}
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <Card key={r.id} className="p-3">
              <p className="text-sm whitespace-pre-wrap">{r.message}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{r.characterCount} chars · {r.tone}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(r.message); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" className="glow-primary" onClick={() => onPick(r.message)}>Use this</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <DialogFooter>
          {results.length > 0 && <Button variant="outline" onClick={generate} disabled={loading}>Regenerate</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}