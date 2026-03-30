import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]",
        tone === "accent" &&
          "border-[color:color-mix(in_srgb,var(--accent-strong)_16%,white)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "neutral" && "border-[color:var(--line)] bg-white text-[color:var(--ink-soft)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
