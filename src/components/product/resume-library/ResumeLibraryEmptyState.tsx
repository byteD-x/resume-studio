"use client";

import { FilePlus2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function ResumeLibraryEmptyState() {
  return (
    <section className="mt-8 rounded-[20px] border border-dashed border-[color:var(--line)] bg-[rgba(255,255,255,0.76)] px-6 py-12 text-center shadow-sm">
      <FilePlus2 className="mx-auto mb-4 size-8 text-[color:var(--ink-muted)]" />
      <h2 className="text-xl font-semibold text-[color:var(--ink-strong)]">还没有简历</h2>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/templates">从模板开始</ButtonLink>
        <ButtonLink
          className="border-[color:var(--line)] bg-white text-[color:var(--ink-strong)] shadow-sm hover:bg-slate-50"
          href="/import"
        >
          导入内容
        </ButtonLink>
        <ButtonLink
          className="bg-transparent px-3 text-[color:var(--ink-muted)] shadow-none hover:text-[color:var(--ink-strong)]"
          href="/import?tab=pdf"
        >
          导入 PDF
        </ButtonLink>
      </div>
    </section>
  );
}
