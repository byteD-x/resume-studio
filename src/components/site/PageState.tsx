import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

export function PageState({
  badge,
  title,
  description,
  actions,
}: {
  badge?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <main className="state-page">
      <section className="state-card">
        {badge ? <Badge tone="accent">{badge}</Badge> : null}
        <h1 className="state-title">{title}</h1>
        <p className="state-description">{description}</p>
        {actions ? <div className="state-actions">{actions}</div> : null}
      </section>
    </main>
  );
}
