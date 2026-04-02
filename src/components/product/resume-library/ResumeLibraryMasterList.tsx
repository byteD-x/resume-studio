"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VersionGroup } from "@/components/product/resume-library/types";
import { formatDateTime, getGroupKindLabel } from "@/components/product/resume-library/utils";

export function ResumeLibraryMasterList({
  activeDeleteId,
  selectedGroupId,
  versionGroups,
  onSelectGroup,
}: {
  activeDeleteId: string | null;
  selectedGroupId: string | null;
  versionGroups: VersionGroup[];
  onSelectGroup: (groupId: string) => void;
}) {
  return (
    <div aria-label="简历分组列表" className="library-master-list">
      {versionGroups.map((group) => {
        const source = group.sourceRow;
        const active = selectedGroupId === group.id;
        const deletingMaster = activeDeleteId === source.resume.meta.id;

        return (
          <button
            aria-busy={deletingMaster}
            aria-current={active ? "page" : undefined}
            className={`library-master-card ${active ? "library-master-card-active" : ""} ${deletingMaster ? "library-card-deleting" : ""}`}
            disabled={deletingMaster}
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            type="button"
          >
            <div className="library-master-card-head">
              <div className="min-w-0">
                <div className="library-master-card-titleline">
                  <strong>{source.resume.meta.title}</strong>
                  <ChevronRight className="size-4" />
                </div>
                <p>{source.resume.basics.headline.trim() || "暂未填写职位标题"}</p>
              </div>

              <div className="library-row-pills">
                <Badge tone="neutral">{getGroupKindLabel(source)}</Badge>
                {source.tailoredPlan.canGenerate ? <Badge tone="success">可生成定制版</Badge> : null}
                {group.variantRows.length > 0 ? <Badge tone="accent">{group.variantRows.length} 个版本</Badge> : null}
                {deletingMaster ? <Badge tone="warning">删除中</Badge> : null}
              </div>
            </div>

            <div className="library-master-meta">
              <span>最近更新：{formatDateTime(source.resume.meta.updatedAt)}</span>
              <span>下一步：{source.report.openTasks[0]?.title ?? "进入预览检查交付质量"}</span>
            </div>

            <div aria-hidden="true" className="library-progress-track">
              <div className="library-progress-fill" style={{ width: `${source.report.score}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
