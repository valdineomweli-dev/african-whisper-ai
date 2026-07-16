import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      try {
        const url = new URL(window.location.href);
        const errorDescription = url.searchParams.get("error_description");
        if (errorDescription) throw new Error(errorDescription);

        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (window.location.hash.includes("access_token")) {
          // Implicit flow: supabase-js auto-detects and stores the session.
          await new Promise((r) => setTimeout(r, 50));
        }

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          setMessage("Waiting for session…");
          const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
              sub.subscription.unsubscribe();
              navigate({ to: "/dashboard", replace: true });
            }
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign in failed");
        navigate({ to: "/auth", search: { mode: "login" }, replace: true });
      }
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}