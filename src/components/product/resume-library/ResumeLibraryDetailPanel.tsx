"use client";

import Link from "next/link";
import { Copy, Eye, LoaderCircle, PencilLine, Sparkles, Target, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { LibraryRow, VersionGroup } from "@/components/product/resume-library/types";
import { formatDateTime, getGroupKindLabel } from "@/components/product/resume-library/utils";
import { getResumeDerivativeLabel } from "@/lib/resume-lineage";

function ResumeLibraryVariantList({
  activeDeleteId,
  deletingSourceInSelectedGroup,
  generatingInProgress,
  optimizingInProgress,
  sourceRow,
  variantRows,
  onRequestDeleteResume,
}: {
  activeDeleteId: string | null;
  deletingSourceInSelectedGroup: boolean;
  generatingInProgress: boolean;
  optimizingInProgress: boolean;
  sourceRow: LibraryRow;
  variantRows: LibraryRow[];
  onRequestDeleteResume: (row: LibraryRow, group?: VersionGroup) => void;
}) {
  return (
    <div className="library-version-list">
      {variantRows.map((variant) => {
        const deletingVariant = deletingSourceInSelectedGroup || activeDeleteId === variant.resume.meta.id;
        const derivativeLabel = getResumeDerivativeLabel(variant.lineage?.derivativeKind ?? "tailored");

        return (
          <article
            aria-busy={deletingVariant}
            className={`library-version-card ${deletingVariant ? "library-card-deleting" : ""}`}
            key={variant.resume.meta.id}
          >
            <div className="library-version-card-head">
              <div>
                <strong>{variant.resume.meta.title}</strong>
                <p>{variant.resume.basics.headline.trim() || "未填写职位标题"}</p>
              </div>
              <div className="library-row-pills">
                <Badge tone="accent">{derivativeLabel}</Badge>
                <Badge tone={variant.report.readiness === "ready" ? "success" : "neutral"}>
                  {variant.report.readinessLabel}
                </Badge>
                {deletingVariant ? <Badge tone="warning">删除中</Badge> : null}
              </div>
            </div>

            <div className="library-version-card-meta">
              <span>更新于 {formatDateTime(variant.resume.meta.updatedAt)}</span>
              <span>{variant.lineage?.parentTitle ?? sourceRow.resume.meta.title}</span>
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
                编辑
              </Link>
              <Link className="btn btn-secondary" href={variant.previewHref}>
                <Eye className="size-4" />
                预览
              </Link>
              <button
                aria-label={`删除 ${variant.resume.meta.title}`}
                className="icon-button"
                disabled={generatingInProgress || optimizingInProgress || deletingVariant}
                onClick={() => onRequestDeleteResume(variant)}
                type="button"
              >
                {deletingVariant ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
  onGenerateOptimizedVersion,
  onGenerateTailoredVariant,
  onRequestDeleteResume,
  activeDeleteId,
  generatingInProgress,
  optimizingInProgress,
  deletingSourceInSelectedGroup,
}: {
  pendingKey: string | null;
  selectedGroup: VersionGroup;
  onGenerateOptimizedVersion: (row: LibraryRow) => Promise<void>;
  onGenerateTailoredVariant: (row: LibraryRow) => Promise<void>;
  onRequestDeleteResume: (row: LibraryRow, group?: VersionGroup) => void;
  activeDeleteId: string | null;
  generatingInProgress: boolean;
  optimizingInProgress: boolean;
  deletingSourceInSelectedGroup: boolean;
}) {
  return (
    <section className="library-detail-section">
      <div className="library-detail-section-head">
        <strong>派生版本</strong>
        <span>{selectedGroup.variantRows.length}</span>
      </div>

      {selectedGroup.variantRows.length > 0 ? (
        <ResumeLibraryVariantList
          activeDeleteId={activeDeleteId}
          deletingSourceInSelectedGroup={deletingSourceInSelectedGroup}
          generatingInProgress={generatingInProgress}
          optimizingInProgress={optimizingInProgress}
          sourceRow={selectedGroup.sourceRow}
          variantRows={selectedGroup.variantRows}
          onRequestDeleteResume={onRequestDeleteResume}
        />
      ) : (
        <div className="empty-surface empty-surface-left">
          <div className="empty-surface-actions">
            {selectedGroup.sourceRow.hasContent ? (
              <Button
                disabled={pendingKey !== null}
                onClick={() => void onGenerateOptimizedVersion(selectedGroup.sourceRow)}
                variant="secondary"
              >
                {pendingKey === `optimize:${selectedGroup.sourceRow.resume.meta.id}` ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Copy className="size-4" />
                )}
                新增两页优化版
              </Button>
            ) : null}
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
              定向
            </ButtonLink>
          </div>
        </div>
      )}
    </section>
  );
}

export function ResumeLibraryDetailPanel({
  activeDeleteId,
  deletingSourceInSelectedGroup,
  generatingInProgress,
  optimizingInProgress,
  pendingKey,
  selectedGroup,
  onGenerateOptimizedVersion,
  onGenerateTailoredVariant,
  onRequestDeleteResume,
}: {
  activeDeleteId: string | null;
  deletingSourceInSelectedGroup: boolean;
  generatingInProgress: boolean;
  optimizingInProgress: boolean;
  pendingKey: string | null;
  selectedGroup: VersionGroup;
  onGenerateOptimizedVersion: (row: LibraryRow) => Promise<void>;
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
            <h2 className="library-card-title">{selectedGroup.sourceRow.resume.meta.title}</h2>
          </div>
          <div className="library-row-pills">
            <Badge tone="neutral">{getGroupKindLabel(selectedGroup.sourceRow)}</Badge>
            <Badge tone={selectedGroup.sourceRow.report.readiness === "ready" ? "success" : "neutral"}>
              {selectedGroup.sourceRow.report.readinessLabel}
            </Badge>
            <Badge tone="neutral">完成度 {selectedGroup.sourceRow.report.score}%</Badge>
          </div>
        </div>

        <div className="library-detail-actions">
          <ButtonLink href={selectedGroup.sourceRow.studioHref}>
            <PencilLine className="size-4" />
            编辑
          </ButtonLink>
          {selectedGroup.sourceRow.hasContent ? (
            <Button
              disabled={pendingKey !== null}
              onClick={() => void onGenerateOptimizedVersion(selectedGroup.sourceRow)}
              variant="secondary"
            >
              {pendingKey === `optimize:${selectedGroup.sourceRow.resume.meta.id}` ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
              新增两页优化版
            </Button>
          ) : null}
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
            预览
          </ButtonLink>
          <ButtonLink href={selectedGroup.sourceRow.targetingHref} variant="ghost">
            <Target className="size-4" />
            定向
          </ButtonLink>
          <Button
            aria-label={selectedGroup.variantRows.length > 0 ? "删除整组" : `删除 ${selectedGroup.sourceRow.resume.meta.title}`}
            disabled={
              generatingInProgress ||
              optimizingInProgress ||
              activeDeleteId === selectedGroup.sourceRow.resume.meta.id
            }
            onClick={() => onRequestDeleteResume(selectedGroup.sourceRow, selectedGroup)}
            variant="ghost"
          >
            {pendingKey === `delete:${selectedGroup.sourceRow.resume.meta.id}` ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {selectedGroup.variantRows.length > 0 ? "删除整组" : "删除"}
          </Button>
        </div>
      </article>

      <section className="library-detail-section">
        <div className="library-detail-section-head">
          <strong>当前版本</strong>
          <span>更新于 {formatDateTime(selectedGroup.sourceRow.resume.meta.updatedAt)}</span>
        </div>

        <article
          aria-busy={deletingSourceInSelectedGroup}
          className={`library-version-card library-version-card-source ${deletingSourceInSelectedGroup ? "library-card-deleting" : ""}`}
        >
          <div className="library-version-card-head">
            <div>
              <strong>{selectedGroup.sourceRow.resume.meta.title}</strong>
              <p>{selectedGroup.sourceRow.resume.basics.headline.trim() || "未填写职位标题"}</p>
            </div>
            <div className="library-row-pills">
              <Badge tone="neutral">{getGroupKindLabel(selectedGroup.sourceRow)}</Badge>
              <Badge tone={selectedGroup.sourceRow.report.readiness === "ready" ? "success" : "neutral"}>
                {selectedGroup.sourceRow.report.readinessLabel}
              </Badge>
              {deletingSourceInSelectedGroup ? <Badge tone="warning">删除中</Badge> : null}
            </div>
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
        optimizingInProgress={optimizingInProgress}
        pendingKey={pendingKey}
        selectedGroup={selectedGroup}
        onGenerateOptimizedVersion={onGenerateOptimizedVersion}
        onGenerateTailoredVariant={onGenerateTailoredVariant}
        onRequestDeleteResume={onRequestDeleteResume}
      />
    </div>
  );
}
