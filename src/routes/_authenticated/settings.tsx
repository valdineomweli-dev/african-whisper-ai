import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-header";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Upload, CheckCircle2, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { connectWhatsApp, checkWhatsAppStatus, disconnectWhatsApp } from "@/lib/fonnte-device.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [waKey, setWaKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [showGem, setShowGem] = useState(false);
  const [notif, setNotif] = useState({ sent: true, credits: true, weekly: false });
  const [pw, setPw] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waConnected, setWaConnected] = useState(false);
  const [waDevice, setWaDevice] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connectFn = useServerFn(connectWhatsApp);
  const statusFn = useServerFn(checkWhatsAppStatus);
  const disconnectFn = useServerFn(disconnectWhatsApp);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", u.id).maybeSingle();
      if (profile) {
        setFullName(profile.full_name ?? "");
        setAvatar(profile.avatar_url ?? "");
        setWaKey(profile.whatsapp_api_key ?? "");
        setGeminiKey(profile.gemini_api_key ?? "");
        setWaConnected(Boolean(profile.whatsapp_connected));
        setWaDevice(profile.whatsapp_device ?? null);
        setWaPhone(profile.whatsapp_device ?? "");
      }
    })();
  }, []);

  // Poll status while QR modal is open
  useEffect(() => {
    if (!qrOpen) return;
    const interval = setInterval(async () => {
      try {
        const res = await statusFn({});
        if (res.connected) {
          setWaConnected(true);
          setQrOpen(false);
          setQrUrl(null);
          toast.success("WhatsApp Connected ✅");
        }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [qrOpen, statusFn]);

  async function handleConnectWhatsApp() {
    if (!waPhone.trim()) return toast.error("Enter your WhatsApp number");
    setConnecting(true);
    try {
      const res = await connectFn({ data: { phone: waPhone.trim() } });
      if (!res.ok || !res.qrUrl) {
        toast.error(res.error ?? "Failed to start connection");
        return;
      }
      setQrUrl(res.qrUrl);
      setWaDevice(waPhone.trim());
      setQrOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    await disconnectFn({});
    setWaConnected(false);
    setWaDevice(null);
    setWaPhone("");
    toast.success("WhatsApp disconnected");
  }

  async function saveProfile() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatar }).eq("user_id", u.user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  }

  async function saveKeys() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ whatsapp_api_key: waKey, gemini_api_key: geminiKey }).eq("user_id", u.user.id);
    if (error) return toast.error(error.message);
    toast.success("API keys saved");
  }

  async function changePassword() {
    if (pw.length < 6) return toast.error("Password too short");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw("");
  }

  const initials = (fullName || email || "U").slice(0, 2).toUpperCase();

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account, API keys, notifications, and security." />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api">API keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatar && <AvatarImage src={avatar} />}
                <AvatarFallback className="bg-primary/20 text-primary text-lg">{initials}</AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={() => toast.info("Upload triggered")}><Upload className="h-4 w-4 mr-2" />Change photo</Button>
            </div>
            <div className="space-y-1.5"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={email} readOnly disabled /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input placeholder="+264 81 000 0000" /></div>
            <Button className="glow-primary" onClick={saveProfile}>Save changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="p-6 max-w-2xl space-y-5">
            <div className="space-y-3 pb-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Connect WhatsApp</h3>
                {waConnected && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your WhatsApp number and scan the QR code with WhatsApp to link your device.
              </p>
              <div className="space-y-1.5">
                <Label>WhatsApp number</Label>
                <Input
                  placeholder="+264 81 000 0000"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  disabled={waConnected}
                />
              </div>
              <div className="flex gap-2">
                {waConnected ? (
                  <>
                    <span className="text-sm text-muted-foreground self-center">Device: {waDevice}</span>
                    <Button variant="outline" className="ml-auto" onClick={handleDisconnect}>Disconnect</Button>
                  </>
                ) : (
                  <Button className="glow-primary" onClick={handleConnectWhatsApp} disabled={connecting}>
                    {connecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Connect WhatsApp
                  </Button>
                )}
              </div>
            </div>
            <MaskedField label="Gemini API key (optional — built-in AI is used by default)" value={geminiKey} onChange={setGeminiKey} show={showGem} onToggle={() => setShowGem((s) => !s)} />
            <div className="flex gap-2">
              <Button className="glow-primary" onClick={saveKeys}>Save keys</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6 max-w-2xl space-y-4">
            {[
              { key: "sent" as const, label: "Campaign sent", desc: "When a campaign finishes sending" },
              { key: "credits" as const, label: "Low credits", desc: "When you're running out of credits" },
              { key: "weekly" as const, label: "Weekly performance report", desc: "Every Monday morning" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div><p className="font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                <Switch checked={notif[n.key]} onCheckedChange={(v) => setNotif({ ...notif, [n.key]: v })} />
              </div>
            ))}
            <Button className="glow-primary" onClick={() => toast.success("Preferences saved")}>Save preferences</Button>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="max-w-2xl space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">Change password</h3>
              <div className="space-y-1.5"><Label>New password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
              <Button className="glow-primary" onClick={changePassword}>Update password</Button>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Active sessions</h3>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">This device · Chrome on macOS</p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>
                <span className="text-xs text-primary">Current</span>
              </div>
            </Card>
            <Card className="p-6 border-destructive/40">
              <h3 className="font-semibold text-destructive">Danger zone</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Permanently delete your account and all associated data.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive">Delete account</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>This action is permanent. All campaigns, contacts, and data will be erased.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toast.error("Contact support to complete deletion")}>Delete permanently</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan to connect WhatsApp</DialogTitle>
            <DialogDescription>
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan this QR code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrUrl ? (
              <img src={qrUrl} alt="WhatsApp QR code" className="w-64 h-64 rounded-lg border border-border bg-white p-2" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for scan...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MaskedField({
  label, value, onChange, show, onToggle,
}: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="sk_..." />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}