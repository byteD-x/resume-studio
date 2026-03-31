"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft, Download, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import { buildResumeWorkbenchReport } from "@/lib/resume-workbench";
import type { ResumeDocument } from "@/types/resume";

async function downloadBlob(response: Response, fallbackName: string) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fallbackName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function buildEditorFocusHref(
  documentId: string,
  target: "basics" | "summary" | "content" | "targeting" | "export",
): Route {
  switch (target) {
    case "targeting":
      return `/studio/${documentId}?focus=targeting` as Route;
    case "content":
      return `/studio/${documentId}?focus=content` as Route;
    case "export":
      return `/studio/${documentId}?focus=design` as Route;
    case "summary":
    case "basics":
    default:
      return `/studio/${documentId}?focus=summary` as Route;
  }
}

export function ResumePreviewPage({
  initialDocument,
}: {
  initialDocument: ResumeDocument;
}) {
  const qualityReport = useMemo(() => buildResumeQualityReport(initialDocument), [initialDocument]);
  const targetingAnalysis = useMemo(() => analyzeResumeTargeting(initialDocument), [initialDocument]);
  const workbenchReport = useMemo(
    () =>
      buildResumeWorkbenchReport(initialDocument, {
        qualityReport,
        targetingAnalysis,
      }),
    [initialDocument, qualityReport, targetingAnalysis],
  );
  const hasBlockingIssues = qualityReport.blockingIssues.length > 0;
  const [status, setStatus] = useState(
    hasBlockingIssues ? "先补齐必填项。" : "检查通过，可导出。",
  );
  const [busyAction, setBusyAction] = useState<"export" | null>(null);
  const html = useMemo(() => buildResumePreviewHtml(initialDocument), [initialDocument]);
  const checklist = useMemo(
    () => buildResumeExportChecklist(initialDocument, qualityReport),
    [initialDocument, qualityReport],
  );
  const stats = qualityReport.stats;
  const completedChecklistCount = checklist.filter((item) => item.done).length;
  const optionalPendingItems = checklist.filter((item) => !item.done && !item.required);
  const requiredPendingItems = checklist.filter((item) => !item.done && item.required);
  const exportReadinessLabel = hasBlockingIssues ? "需要补充内容" : "可以直接导出";

  const exportPdf = async () => {
    setBusyAction("export");
    setStatus("正在导出…");

    try {
      const response = await fetch(`/api/resumes/${initialDocument.meta.id}/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialDocument),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "导出失败");
      }

      await downloadBlob(response, `${initialDocument.meta.id}.pdf`);
      setStatus("导出完成。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导出失败");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <main className="preview-page">
      <section className="preview-toolbar">
        <div>
          <p className="section-kicker">预览与导出</p>
          <h1 className="workspace-title">{initialDocument.meta.title}</h1>
          <p aria-live="polite" className="sr-only">
            {status}
          </p>
          <div className="preview-toolbar-badges">
            <Badge tone={hasBlockingIssues ? "warning" : "success"}>{exportReadinessLabel}</Badge>
            <Badge tone="neutral">
              检查项 {completedChecklistCount}/{checklist.length}
            </Badge>
            <Badge tone="accent">{workbenchReport.workflow.currentLabel}</Badge>
          </div>
        </div>

        <div className="workspace-header-actions">
          <Link className="btn btn-ghost" href={`/studio/${initialDocument.meta.id}`}>
            <ArrowLeft className="size-4" />
            返回编辑
          </Link>
          <Button disabled={hasBlockingIssues || busyAction !== null} onClick={() => void exportPdf()}>
            {busyAction === "export" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            导出 PDF
          </Button>
        </div>
      </section>

      <section className="preview-layout">
        <div className="preview-stage">
          <div className="preview-stage-topbar">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-paper-shell">
            <PreviewFrame html={html} />
          </div>
        </div>

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
                      {item.done ? "已完成" : item.required ? "待补充" : "建议优化"}
                    </span>
                    {!item.done ? (
                      <Link className="btn btn-ghost" href={buildEditorFocusHref(initialDocument.meta.id, item.target)}>
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
                    {targetingAnalysis.coveragePercent == null
                      ? "等待分析"
                      : `${targetingAnalysis.coveragePercent}%`}
                  </span>
                </div>
                <div className="workspace-check-row">
                  <div>
                    <p>已命中关键词</p>
                    <span>
                      {targetingAnalysis.matchedKeywords.length > 0
                        ? targetingAnalysis.matchedKeywords.join(" · ")
                        : "当前还没有命中的关键词"}
                    </span>
                  </div>
                  <span className="workspace-check-tag workspace-check-tag-done">
                    {targetingAnalysis.matchedKeywords.length}
                  </span>
                </div>
                <div className="workspace-check-row">
                  <div>
                    <p>待补齐关键词</p>
                    <span>
                      {targetingAnalysis.missingKeywords.length > 0
                        ? targetingAnalysis.missingKeywords.join(" · ")
                        : "当前没有缺口关键词"}
                    </span>
                  </div>
                  <span className="workspace-check-tag">
                    {targetingAnalysis.missingKeywords.length}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {requiredPendingItems.length > 0 ? (
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
                      <Link className="btn btn-ghost" href={buildEditorFocusHref(initialDocument.meta.id, issue.target)}>
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
                      <Link className="btn btn-ghost" href={buildEditorFocusHref(initialDocument.meta.id, issue.target)}>
                        去处理
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!hasBlockingIssues && optionalPendingItems.length === 0 && qualityReport.warnings.length === 0 ? (
            <div className="preview-sidebar-section">
              <p className="workspace-sidebar-label">当前状态</p>
              <p className="preview-sidebar-note">可以直接生成 PDF。</p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
