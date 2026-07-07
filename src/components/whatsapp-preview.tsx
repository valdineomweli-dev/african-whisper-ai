import { CheckCheck } from "lucide-react";

export function WhatsAppPreview({ message, mediaUrl }: { message: string; mediaUrl?: string }) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const rendered = message.replace(/\{name\}/g, "Anna").replace(/\{phone\}/g, "+264 81 234 5678");
  return (
    <div className="mx-auto max-w-[300px] rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
      <div className="rounded-[2rem] overflow-hidden bg-[#0b141a]">
        <div className="h-8 bg-neutral-900" />
        <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">B</div>
          <div>
            <p className="text-white text-sm font-medium leading-tight">Your Business</p>
            <p className="text-[10px] text-white/50">online</p>
          </div>
        </div>
        <div className="min-h-[440px] p-3 space-y-2 bg-[#0b141a]">
          <div className="ml-auto max-w-[85%] rounded-lg bg-[#005c4b] p-2 shadow">
            {mediaUrl && <img src={mediaUrl} alt="" className="rounded mb-1 max-h-40 w-full object-cover" />}
            <p className="text-white text-sm whitespace-pre-wrap break-words">{rendered || "Your message will appear here..."}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-white/60">{time}</span>
              <CheckCheck className="h-3 w-3 text-sky-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}