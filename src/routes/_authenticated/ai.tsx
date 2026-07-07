import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageHeader } from "@/components/page-header";
import { Sparkles, Loader2, Copy, ChevronDown } from "lucide-react";
import { generateMessages } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AiPage,
});

interface Result { id: string; message: string; tone: string; characterCount: number }

function AiPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("Restaurant");
  const [goal, setGoal] = useState("Promotion");
  const [tone, setTone] = useState<"Professional" | "Casual" | "Urgent" | "Friendly">("Friendly");
  const [details, setDetails] = useState("");
  const [lang, setLang] = useState<"English" | "Afrikaans" | "Oshiwambo">("English");
  const [results, setResults] = useState<Result[]>([]);
  const [history, setHistory] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!name.trim() || !details.trim()) return toast.error("Fill business name and details");
    setLoading(true);
    setResults([]);
    try {
      const res = await generateMessages({
        data: { businessName: name, businessType: type, goal, tone, details, language: lang },
      });
      setResults(res.messages);
      setHistory((h) => [...res.messages, ...h].slice(0, 10));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="AI Message Generator" subtitle="Powered by Gemini · fine-tuned for WhatsApp marketing" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="space-y-1.5"><Label>Business name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Coastal Kitchen" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Business type</Label>
              <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {["Restaurant", "Salon", "Retail", "Healthcare", "Church", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Campaign goal</Label>
              <Select value={goal} onValueChange={setGoal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {["Promotion", "Announcement", "Reminder", "Follow-up", "Event"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {["Professional", "Casual", "Urgent", "Friendly"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Language</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                {["English", "Afrikaans", "Oshiwambo"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent></Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Key details</Label>
            <Textarea rows={5} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="What's the offer? Any dates, prices, or call to action?" />
          </div>
          <Button onClick={generate} disabled={loading} className="w-full h-11 glow-primary">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />Generate 3 variations</>}
          </Button>
        </Card>

        <div className="space-y-3">
          {loading && [0, 1, 2].map((i) => <Card key={i} className="p-4 h-28 animate-pulse bg-muted/40" />)}
          {!loading && results.length === 0 && (
            <Card className="p-12 text-center border-dashed">
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
              <p className="mt-3 text-sm text-muted-foreground">Your AI-generated messages will appear here</p>
            </Card>
          )}
          {results.map((r) => (
            <Card key={r.id} className="p-4 hover:border-primary/40 transition-colors">
              <p className="text-sm whitespace-pre-wrap">{r.message}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{r.characterCount} chars · {r.tone}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(r.message); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />Copy
                  </Button>
                  <Button size="sm" className="glow-primary" onClick={() => toast.success("Opened in composer")}>Use in campaign</Button>
                </div>
              </div>
            </Card>
          ))}
          {results.length > 0 && (
            <Button variant="outline" onClick={generate} disabled={loading} className="w-full">Regenerate</Button>
          )}

          {history.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <Card className="p-4 flex items-center justify-between text-sm hover:border-primary/40">
                  <span className="font-medium">History · last {history.length}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {history.map((h, i) => (
                  <Card key={`${h.id}-${i}`} className="p-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{h.message}</p>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </>
  );
}