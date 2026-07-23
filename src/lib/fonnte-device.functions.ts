import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

async function fonntePost(url: string, token: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: token,
    },
    body: new URLSearchParams(body).toString(),
  });
  const raw = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(raw); } catch { /* keep raw */ }
  return { ok: res.ok, status: res.status, raw, json };
}

export const connectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { phone: string }) => data)
  .handler(async ({ data, context }) => {
    const master = process.env.FONNTE_TOKEN;
    if (!master) throw new Error("Missing FONNTE_TOKEN secret");
    const { supabase, userId } = context;

    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email ?? `user-${userId}`;
    const device = normalizePhone(data.phone);
    if (!device) throw new Error("Invalid phone number");

    // 1. Add device
    const add = await fonntePost("https://api.fonnte.com/add-device", master, {
      name: email,
      device,
      autoread: "false",
      personal: "false",
      group: "false",
      countryCode: "0",
    });
    const deviceToken =
      (add.json.token as string) ||
      (typeof add.json.data === "object" && add.json.data !== null
        ? ((add.json.data as Record<string, unknown>).token as string)
        : "");
    if (!deviceToken) {
      const reason = (add.json.reason as string) || add.raw || `HTTP ${add.status}`;
      return { ok: false, error: `Fonnte add-device failed: ${String(reason).slice(0, 400)}` };
    }

    // Save token
    await supabase
      .from("profiles")
      .update({ whatsapp_token: deviceToken, whatsapp_device: device, whatsapp_connected: false })
      .eq("user_id", userId);

    // 2. Request QR
    const qr = await fonntePost("https://api.fonnte.com/qr", deviceToken, {});
    const qrUrl =
      (qr.json.url as string) ||
      (qr.json.qr as string) ||
      (typeof qr.json.data === "object" && qr.json.data !== null
        ? ((qr.json.data as Record<string, unknown>).url as string)
        : "");
    if (!qrUrl) {
      const reason = (qr.json.reason as string) || qr.raw || `HTTP ${qr.status}`;
      return { ok: false, error: `Fonnte qr failed: ${String(reason).slice(0, 400)}`, deviceToken };
    }

    return { ok: true, qrUrl, deviceToken };
  });

export const checkWhatsAppStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("whatsapp_token")
      .eq("user_id", userId)
      .maybeSingle();
    const token = profile?.whatsapp_token;
    if (!token) return { connected: false, error: "No device token" };

    const res = await fonntePost("https://api.fonnte.com/device", token, {});
    // Fonnte returns status like "connect" / "disconnect"
    const raw = res.json as Record<string, unknown>;
    const statusRaw =
      (raw.device_status as string) ||
      (raw.status as unknown as string) ||
      (typeof raw.data === "object" && raw.data !== null
        ? ((raw.data as Record<string, unknown>).device_status as string)
        : "");
    const connected =
      typeof statusRaw === "string" &&
      (statusRaw.toLowerCase() === "connect" || statusRaw.toLowerCase() === "connected");

    if (connected) {
      await supabase.from("profiles").update({ whatsapp_connected: true }).eq("user_id", userId);
    }
    return { connected, statusRaw };
  });

export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("profiles")
      .update({ whatsapp_token: null, whatsapp_device: null, whatsapp_connected: false })
      .eq("user_id", userId);
    return { ok: true };
  });