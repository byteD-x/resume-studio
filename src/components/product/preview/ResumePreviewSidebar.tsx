"use client";

import Link from "next/link";
import type {
  PreviewChecklistItem,
  PreviewQualityReport,
  PreviewTargetingAnalysis,
} from "@/components/product/preview/shared";
import { buildEditorFocusHref } from "@/components/product/preview/shared";

export function ResumePreviewSidebar({
  checklist,
  documentId,
  hasBlockingIssues,
  optionalPendingCount,
  qualityReport,
  stats,
  targetingAnalysis,
}: {
  checklist: PreviewChecklistItem[];
  documentId: string;
  hasBlockingIssues: boolean;
  optionalPendingCount: number;
  qualityReport: PreviewQualityReport;
  stats: PreviewQualityReport["stats"];
  targetingAnalysis: PreviewTargetingAnalysis;
}) {
  return (
    <section className="workspace-sidebar-card preview-sidebar-card">
      <div className="preview-sidebar-section">
        <p className="workspace-sidebar-label">导出概览</p>
        <div className="preview-stat-grid">
          <article className="preview-stat-card">
            <span className="preview-stat-label">联系方式</span>
            <strong>{stats.contactCount}</strong>
          </article>
          <article className="preview-stat-card">
            <span className="preview-stat-label">摘要字数</span>
            <strong>{stats.summaryLength}</strong>
          </article>
          <article className="preview-stat-card">
            <span className="preview-stat-label">模块数</span>
            <strong>{stats.visibleSections}</strong>
          </article>
          <article className="preview-stat-card">
            <span className="preview-stat-label">要点数</span>
            <strong>{stats.totalBullets}</strong>
          </article>
        </div>
      </div>

      <div className="preview-sidebar-section">
        <p className="workspace-sidebar-label">导出前检查</p>
        <div className="mt-4 space-y-3">
          {checklist.map((item) => (
            <div className="workspace-check-row" key={item.id}>
              <div>
                <p>{item.title}</p>
                <span>{item.detail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`workspace-check-tag ${item.done ? "workspace-check-tag-done" : ""}`}>
                  {item.done ? "已完成" : item.required ? "待补齐" : "建议优化"}
                </span>
                {!item.done ? (
                  <Link className="btn btn-ghost" href={buildEditorFocusHref(documentId, item.target)}>
                    去处理
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {targetingAnalysis.active ? (
        <div className="preview-sidebar-section">
          <p className="workspace-sidebar-label">岗位匹配</p>
          <div className="mt-4 space-y-3">
            <div className="workspace-check-row">
              <div>
                <p>关键词来源</p>
                <span>
                  {targetingAnalysis.keywordSource === "manual"
                    ? "手动关键词"
                    : targetingAnalysis.keywordSource === "job-description"
                      ? "从 JD 提取"
                      : "暂无"}
                </span>
              </div>
              <span className="workspace-check-tag">
                {targetingAnalysis.coveragePercent == null ? "等待分析" : `${targetingAnalysis.coveragePercent}%`}
              </span>
            </div>
            <div className="workspace-check-row">
              <div>
                <p>已命中关键词</p>
                <span>
                  {targetingAnalysis.matchedKeywords.length > 0
                    ? targetingAnalysis.matchedKeywords.join(" / ")
                    : "当前还没有命中的关键词。"}
                </span>
              </div>
              <span className="workspace-check-tag workspace-check-tag-done">{targetingAnalysis.matchedKeywords.length}</span>
            </div>
            <div className="workspace-check-row">
              <div>
                <p>待补齐关键词</p>
                <span>
                  {targetingAnalysis.missingKeywords.length > 0
                    ? targetingAnalysis.missingKeywords.join(" / ")
                    : "当前没有缺口关键词。"}
                </span>
              </div>
              <span className="workspace-check-tag">{targetingAnalysis.missingKeywords.length}</span>
            </div>
          </div>
        </div>
      ) : null}

      {qualityReport.blockingIssues.length > 0 ? (
        <div className="preview-sidebar-section">
          <p className="workspace-sidebar-label">阻塞导出</p>
          <div className="mt-4 space-y-3">
            {qualityReport.blockingIssues.map((issue) => (
              <div className="workspace-check-row" key={issue.id}>
                <div>
                  <p>{issue.message}</p>
                  <span>{issue.suggestion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="workspace-check-tag">必须处理</span>
                  <Link className="btn btn-ghost" href={buildEditorFocusHref(documentId, issue.target)}>
                    去处理
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {qualityReport.warnings.length > 0 ? (
        <div className="preview-sidebar-section">
          <p className="workspace-sidebar-label">建议优化</p>
          <div className="mt-4 space-y-3">
            {qualityReport.warnings.map((issue) => (
              <div className="workspace-check-row" key={issue.id}>
                <div>
                  <p>{issue.message}</p>
                  <span>{issue.suggestion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="workspace-check-tag">建议优化</span>
                  <Link className="btn btn-ghost" href={buildEditorFocusHref(documentId, issue.target)}>
                    去处理
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!hasBlockingIssues && optionalPendingCount === 0 && qualityReport.warnings.length === 0 ? (
        <div className="preview-sidebar-section">
          <p className="workspace-sidebar-label">当前状态</p>
          <p className="preview-sidebar-note">可以直接生成 PDF。</p>
        </div>
      ) : null}
    </section>
  );
}
