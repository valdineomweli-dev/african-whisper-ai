import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function WaLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary glow-primary">
        <MessageCircle className="h-5 w-5 text-primary-foreground" fill="currentColor" strokeWidth={0} />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          WA <span className="text-primary">Blaster</span>
        </span>
      )}
    </div>
  );
}