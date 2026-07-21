import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function renderMessage(template: string, contact: { name?: string | null; phone: string }) {
  return template
    .replace(/\{name\}/gi, contact.name ?? "")
    .replace(/\{phone\}/gi, contact.phone);
}

export const sendWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { campaignId: string; contactId: string; phone: string; name?: string | null; message: string }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      throw new Error(
        "Fonnte is not configured on the server. Missing secret: FONNTE_TOKEN. Add it in Lovable → Project settings → Secrets.",
      );
    }

    // Verify campaign ownership (RLS also enforces this)
    const { data: campaign, error: cErr } = await supabase
      .from("campaigns")
      .select("id, user_id, sent_count")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!campaign || campaign.user_id !== userId) throw new Error("Campaign not found");

    // Insert message row (pending)
    const { data: msgRow, error: mErr } = await supabase
      .from("messages")
      .insert({ campaign_id: data.campaignId, contact_id: data.contactId, status: "pending" })
      .select("id")
      .single();
    if (mErr) throw mErr;

    const body = renderMessage(data.message, { name: data.name, phone: data.phone });
    const to = normalizePhone(data.phone);

    let ok = false;
    let errorText: string | null = null;
    try {
      const form = new URLSearchParams({ target: to, message: body });
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: token,
        },
        body: form.toString(),
      });
      const raw = await res.text();
      let json: { status?: boolean; reason?: string; detail?: string; error?: unknown; message?: string } = {};
      try { json = JSON.parse(raw); } catch { /* keep raw */ }
      ok = res.ok && json.status === true;
      if (!ok) {
        const detail =
          json.reason ||
          json.detail ||
          (typeof json.error === "string" ? json.error : json.error ? JSON.stringify(json.error) : null) ||
          json.message ||
          raw ||
          `HTTP ${res.status}`;
        errorText = `Fonnte ${res.status}: ${String(detail).slice(0, 400)}`;
        console.error("[Fonnte] send failed", { status: res.status, to, body: raw.slice(0, 500) });
      }
    } catch (e) {
      errorText = e instanceof Error ? `Network error: ${e.message}` : "Network error";
      console.error("[Fonnte] network error", e);
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from("messages")
      .update({ status: ok ? "sent" : "failed", sent_at: ok ? nowIso : null })
      .eq("id", msgRow.id);

    if (ok) {
      await supabase
        .from("campaigns")
        .update({ sent_count: (campaign.sent_count ?? 0) + 1 })
        .eq("id", data.campaignId);
    }

    return { ok, error: errorText };
  });

export const finalizeCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("campaigns")
      .update({ status: "sent" })
      .eq("id", data.campaignId);
    if (error) throw error;
    return { ok: true };
  });