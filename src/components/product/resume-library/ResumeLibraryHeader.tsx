"use client";

import { FilePlus2, PencilLine } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import type { LibraryRow } from "@/components/product/resume-library/types";

export function ResumeLibraryHeader({
  latestResume,
}: {
  latestResume: LibraryRow | null;
}) {
  return (
    <section className="page-header-copy">
      <div className="section-heading-row items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[color:var(--ink-strong)]">简历库</h1>
          <p className="mt-2 text-[0.94rem] text-[color:var(--ink-soft)]">
            统一管理主稿、定制版与下一步动作，继续编辑、校对预览或从现有内容生成新的岗位版本。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {latestResume ? (
            <ButtonLink href={latestResume.studioHref} variant="secondary">
              <PencilLine className="size-4" />
              继续编辑
            </ButtonLink>
          ) : null}
          <ButtonLink href="/templates">
            <FilePlus2 className="size-4" />
            新建简历
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
