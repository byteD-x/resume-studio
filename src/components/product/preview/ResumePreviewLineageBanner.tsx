"use client";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getResumeDerivativeLabel, type ResumeLineageMeta } from "@/lib/resume-lineage";

function resolveLineageTitle(lineage: ResumeLineageMeta) {
  if (lineage.kind === "variant") {
    return getResumeDerivativeLabel(lineage.derivativeKind);
  }

  if (lineage.kind === "source") {
    return "主稿";
  }

  return "独立稿";
}

export function ResumePreviewLineageBanner({
  lineage,
}: {
  lineage: ResumeLineageMeta;
}) {
  return (
    <section className="resume-lineage-banner">
      <div className="resume-lineage-banner-head">
        <strong>{resolveLineageTitle(lineage)}</strong>
        <div className="resume-lineage-banner-badges">
          <Badge tone={lineage.kind === "variant" ? "accent" : "neutral"}>
            {resolveLineageTitle(lineage)}
          </Badge>
          {lineage.childCount > 0 ? <Badge tone="success">{lineage.childCount} 个派生</Badge> : null}
        </div>
      </div>

      <div className="workspace-header-actions">
        {lineage.parentId ? (
          <ButtonLink href={`/studio/${lineage.parentId}/preview`} variant="secondary">
            查看来源
          </ButtonLink>
        ) : null}
        <ButtonLink href="/resumes" variant="ghost">
          返回简历库
        </ButtonLink>
      </div>
    </section>
  );
}
