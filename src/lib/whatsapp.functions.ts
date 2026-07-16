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
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    if (!instanceId || !token) throw new Error("UltraMsg is not configured");

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
      const form = new URLSearchParams({ token, to, body });
      const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const json = (await res.json().catch(() => ({}))) as { sent?: string | boolean; error?: unknown; message?: string };
      ok = res.ok && (json.sent === "true" || json.sent === true);
      if (!ok) errorText = json.message || JSON.stringify(json).slice(0, 300);
    } catch (e) {
      errorText = e instanceof Error ? e.message : "network error";
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