"use client";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { buildLineageCopy } from "@/components/product/preview/shared";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";

export function ResumePreviewLineageBanner({
  lineage,
}: {
  lineage: ResumeLineageMeta;
}) {
  return (
    <section className="resume-lineage-banner">
      <div>
        <p className="editor-workflow-kicker">版本关系</p>
        <div className="resume-lineage-banner-head">
          <strong>
            {lineage.kind === "variant"
              ? "当前预览的是一份岗位定制版。"
              : lineage.kind === "source"
                ? "当前预览的是一份主稿版本。"
                : "当前预览的是一份独立草稿。"}
          </strong>
          <div className="resume-lineage-banner-badges">
            <Badge tone={lineage.kind === "variant" ? "accent" : "neutral"}>
              {lineage.kind === "variant" ? "定制版" : lineage.kind === "source" ? "主稿" : "独立稿"}
            </Badge>
            {lineage.childCount > 0 ? <Badge tone="success">已派生 {lineage.childCount} 份</Badge> : null}
          </div>
        </div>
        <p className="editor-workflow-copy">{buildLineageCopy(lineage)}</p>
      </div>

      <div className="editor-workflow-actions">
        {lineage.parentId ? (
          <ButtonLink href={`/studio/${lineage.parentId}/preview`} variant="secondary">
            查看来源主稿
          </ButtonLink>
        ) : null}
        <ButtonLink href="/resumes" variant="ghost">
          返回简历库
        </ButtonLink>
      </div>
    </section>
  );
}
