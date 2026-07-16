import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: "bg-primary/15 text-primary border-primary/30",
    sending: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    scheduled: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    draft: "bg-muted text-muted-foreground border-border",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    active: "bg-primary/15 text-primary border-primary/30",
    unsubscribed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${map[status] ?? map.draft}`}>
      {status}
    </span>
  );
}