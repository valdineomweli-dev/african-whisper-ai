import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactList = Database["public"]["Tables"]["contact_lists"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      await requireUserId();
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaigns", id],
    queryFn: async (): Promise<Campaign | null> => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCampaignMessages(campaignId: string) {
  return useQuery({
    queryKey: ["messages", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, contacts(name, phone)")
        .eq("campaign_id", campaignId)
        .order("sent_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async (): Promise<Contact[]> => {
      await requireUserId();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactLists() {
  return useQuery({
    queryKey: ["contact_lists"],
    queryFn: async (): Promise<ContactList[]> => {
      await requireUserId();
      const { data, error } = await supabase.from("contact_lists").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const uid = await requireUserId();
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUserMessages() {
  return useQuery({
    queryKey: ["all_messages"],
    queryFn: async () => {
      await requireUserId();
      // RLS restricts to messages tied to campaigns the user owns.
      const { data, error } = await supabase
        .from("messages")
        .select("id, status, sent_at, delivered_at, read_at, campaign_id")
        .order("sent_at", { ascending: false, nullsFirst: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export { requireUserId };