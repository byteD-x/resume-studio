"use client";

import Link from "next/link";
import { Eye, LoaderCircle, PencilLine, Sparkles, Target, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { LibraryRow, VersionGroup } from "@/components/product/resume-library/types";
import { formatDateTime, getGroupKindLabel } from "@/components/product/resume-library/utils";

function ResumeLibraryVariantList({
  activeDeleteId,
  deletingSourceInSelectedGroup,
  generatingInProgress,
  sourceRow,
  variantRows,
  onRequestDeleteResume,
}: {
  activeDeleteId: string | null;
  deletingSourceInSelectedGroup: boolean;
  generatingInProgress: boolean;
  sourceRow: LibraryRow;
  variantRows: LibraryRow[];
  onRequestDeleteResume: (row: LibraryRow, group?: VersionGroup) => void;
}) {
  return (
    <div className="library-version-list">
      {variantRows.map((variant) => {
        const deletingVariant = deletingSourceInSelectedGroup || activeDeleteId === variant.resume.meta.id;

        return (
          <article
            aria-busy={deletingVariant}
            className={`library-version-card ${deletingVariant ? "library-card-deleting" : ""}`}
            key={variant.resume.meta.id}
          >
            <div className="library-version-card-head">
              <div>
                <strong>{variant.resume.meta.title}</strong>
                <p>{variant.resume.basics.headline.trim() || "暂未填写职位标题"}</p>
              </div>
              <div className="library-row-pills">
                <Badge tone="accent">定制版</Badge>
                <Badge tone={variant.report.readiness === "ready" ? "success" : "neutral"}>
                  {variant.report.readinessLabel}
                </Badge>
                {deletingVariant ? <Badge tone="warning">删除中</Badge> : null}
              </div>
            </div>

            <div className="library-version-card-meta">
              <span>
                定向岗位：
                {[variant.resume.targeting.role, variant.resume.targeting.company].filter(Boolean).join(" / ") ||
                  "尚未补充岗位信息"}
              </span>
              <span>最近更新 {formatDateTime(variant.resume.meta.updatedAt)}</span>
              <span>来源主稿：{variant.lineage?.parentTitle ?? sourceRow.resume.meta.title}</span>
            </div>

            {variant.resume.targeting.focusKeywords.length > 0 ? (
              <div className="library-keywords-row">
                <span className="library-keywords-label">关键词</span>
                <p className="library-keywords-text">{variant.resume.targeting.focusKeywords.join(" / ")}</p>
              </div>
            ) : null}

            <div className="library-version-card-actions">
              <Link className="btn btn-primary" href={variant.studioHref}>
                <PencilLine className="size-4" />
                继续编辑
              </Link>
              <Link className="btn btn-secondary" href={variant.previewHref}>
                <Eye className="size-4" />
                打开预览
              </Link>
              <button
                aria-label={`删除 ${variant.resume.meta.title}`}
                className="icon-button"
                disabled={generatingInProgress || deletingVariant}
                onClick={() => onRequestDeleteResume(variant)}
                type="button"
              >
                {deletingVariant ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ResumeLibraryVariantsSection({
  pendingKey,
  selectedGroup,
  onGenerateTailoredVariant,
  onRequestDeleteResume,
  activeDeleteId,
  generatingInProgress,
  deletingSourceInSelectedGroup,
}: {
  pendingKey: string | null;
  selectedGroup: VersionGroup;
  onGenerateTailoredVariant: (row: LibraryRow) => Promise<void>;
  onRequestDeleteResume: (row: LibraryRow, group?: VersionGroup) => void;
  activeDeleteId: string | null;
  generatingInProgress: boolean;
  deletingSourceInSelectedGroup: boolean;
}) {
  return (
    <section className="library-detail-section">
      <div className="library-detail-section-head">
        <strong>定制版本</strong>
        <span>
          {selectedGroup.variantRows.length > 0
            ? `共 ${selectedGroup.variantRows.length} 个岗位版本`
            : "当前还没有基于这份主稿生成的定制版本"}
        </span>
      </div>

      {selectedGroup.variantRows.length > 0 ? (
        <ResumeLibraryVariantList
          activeDeleteId={activeDeleteId}
          deletingSourceInSelectedGroup={deletingSourceInSelectedGroup}
          generatingInProgress={generatingInProgress}
          sourceRow={selectedGroup.sourceRow}
          variantRows={selectedGroup.variantRows}
          onRequestDeleteResume={onRequestDeleteResume}
        />
      ) : (
        <section className="empty-surface empty-surface-left">
          <p className="empty-surface-title">还没有定制版本</p>
          <p className="empty-surface-text">
            {selectedGroup.sourceRow.tailoredPlan.canGenerate
              ? "补充岗位、公司或 JD 关键词后，可以直接从主稿生成新的定制版。"
              : "先完善岗位定向信息，再生成更贴近目标职位的定制版本。"}
          </p>
          <div className="empty-surface-actions">
            {selectedGroup.sourceRow.tailoredPlan.canGenerate ? (
              <Button
                disabled={pendingKey !== null}
                onClick={() => void onGenerateTailoredVariant(selectedGroup.sourceRow)}
              >
                {pendingKey === `generate:${selectedGroup.sourceRow.resume.meta.id}` ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                生成定制版
              </Button>
            ) : null}
            <ButtonLink href={selectedGroup.sourceRow.targetingHref} variant="secondary">
              {selectedGroup.sourceRow.tailoredPlan.canGenerate ? "完善定向" : "填写定向信息"}
            </ButtonLink>
          </div>
        </section>
      )}
    </section>
  );
}

export function ResumeLibraryDetailPanel({
  activeDeleteId,
  deletingSourceInSelectedGroup,
  generatingInProgress,
  pendingKey,
  selectedGroup,
  onGenerateTailoredVariant,
  onRequestDeleteResume,
}: {
  activeDeleteId: string | null;
  deletingSourceInSelectedGroup: boolean;
  generatingInProgress: boolean;
  pendingKey: string | null;
  selectedGroup: VersionGroup;
  onGenerateTailoredVariant: (row: LibraryRow) => Promise<void>;
  onRequestDeleteResume: (row: LibraryRow, group?: VersionGroup) => void;
}) {
  return (
    <div className="library-detail-panel">
      <article
        aria-busy={deletingSourceInSelectedGroup}
        className={`library-detail-hero ${deletingSourceInSelectedGroup ? "library-card-deleting" : ""}`}
      >
        <div className="library-detail-hero-head">
          <div>
            <p className="section-kicker">当前分组</p>
            <h2 className="library-card-title">{selectedGroup.sourceRow.resume.meta.title}</h2>
          </div>
          <div>
            <p className="library-meta-label">下一步建议</p>
            <p className="library-meta-value">
              {selectedGroup.sourceRow.report.openTasks[0]?.title ?? "进入预览检查交付质量"}
            </p>
          </div>
        </div>

        <div className="library-detail-actions">
          <ButtonLink href={selectedGroup.sourceRow.studioHref}>
            <PencilLine className="size-4" />
            编辑主稿
          </ButtonLink>
          {selectedGroup.sourceRow.tailoredPlan.canGenerate ? (
            <Button
              disabled={pendingKey !== null}
              onClick={() => void onGenerateTailoredVariant(selectedGroup.sourceRow)}
              variant="secondary"
            >
              {pendingKey === `generate:${selectedGroup.sourceRow.resume.meta.id}` ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              生成定制版
            </Button>
          ) : null}
          <ButtonLink href={selectedGroup.sourceRow.previewHref} variant="secondary">
            <Eye className="size-4" />
            打开预览
          </ButtonLink>
          <ButtonLink href={selectedGroup.sourceRow.targetingHref} variant="ghost">
            <Target className="size-4" />
            完善定向
          </ButtonLink>
          <Button
            aria-label={selectedGroup.variantRows.length > 0 ? "删除整组" : `删除 ${selectedGroup.sourceRow.resume.meta.title}`}
            disabled={generatingInProgress || activeDeleteId === selectedGroup.sourceRow.resume.meta.id}
            onClick={() => onRequestDeleteResume(selectedGroup.sourceRow, selectedGroup)}
            variant="ghost"
          >
            {pendingKey === `delete:${selectedGroup.sourceRow.resume.meta.id}` ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {selectedGroup.variantRows.length > 0 ? "删除整组" : "删除主稿"}
          </Button>
        </div>
      </article>

      <section className="library-detail-section">
        <div className="library-detail-section-head">
          <strong>{selectedGroup.sourceRow.lineage?.kind === "source" ? "主稿" : "当前版本"}</strong>
          <span>
            {selectedGroup.variantRows.length > 0
              ? `${selectedGroup.variantRows.length} 个版本基于这份主稿延展`
              : "这份简历暂时还没有衍生版本"}
          </span>
        </div>

        <article
          aria-busy={deletingSourceInSelectedGroup}
          className={`library-version-card library-version-card-source ${deletingSourceInSelectedGroup ? "library-card-deleting" : ""}`}
        >
          <div className="library-version-card-head">
            <div>
              <strong>{selectedGroup.sourceRow.resume.meta.title}</strong>
              <p>{selectedGroup.sourceRow.resume.basics.headline.trim() || "暂未填写职位标题"}</p>
            </div>
            <div className="library-row-pills">
              <Badge tone="neutral">{getGroupKindLabel(selectedGroup.sourceRow)}</Badge>
              <Badge tone={selectedGroup.sourceRow.report.readiness === "ready" ? "success" : "neutral"}>
                {selectedGroup.sourceRow.report.readinessLabel}
              </Badge>
              {deletingSourceInSelectedGroup ? <Badge tone="warning">删除中</Badge> : null}
            </div>
          </div>

          <div className="library-version-card-meta">
            <span>最近更新 {formatDateTime(selectedGroup.sourceRow.resume.meta.updatedAt)}</span>
            <span>完成度 {selectedGroup.sourceRow.report.score}%</span>
          </div>

          {selectedGroup.sourceRow.resume.targeting.focusKeywords.length > 0 ? (
            <div className="library-keywords-row">
              <span className="library-keywords-label">关键词</span>
              <p className="library-keywords-text">
                {selectedGroup.sourceRow.resume.targeting.focusKeywords.join(" / ")}
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <ResumeLibraryVariantsSection
        activeDeleteId={activeDeleteId}
        deletingSourceInSelectedGroup={deletingSourceInSelectedGroup}
        generatingInProgress={generatingInProgress}
        pendingKey={pendingKey}
        selectedGroup={selectedGroup}
        onGenerateTailoredVariant={onGenerateTailoredVariant}
        onRequestDeleteResume={onRequestDeleteResume}
      />
    </div>
  );
}
