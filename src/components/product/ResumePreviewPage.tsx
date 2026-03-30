"use client";

import Link from "next/link";
import { ArrowLeft, Download, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
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

export function ResumePreviewPage({
  initialDocument,
}: {
  initialDocument: ResumeDocument;
}) {
  const qualityReport = useMemo(() => buildResumeQualityReport(initialDocument), [initialDocument]);
  const hasBlockingIssues = qualityReport.blockingIssues.length > 0;
  const [status, setStatus] = useState(
    hasBlockingIssues ? "导出前还有必填项未完成，请先回到编辑页补齐。" : "已通过必填检查，可直接导出。",
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
  const exportReadinessLabel = hasBlockingIssues ? "需要补充内容" : "可直接导出";

  const exportPdf = async () => {
    setBusyAction("export");
    setStatus("导出中");

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
      setStatus("已导出");
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
          <h1 className="workspace-title">{initialDocument.meta.title}</h1>
          <p className="workspace-copy">{status}</p>
          <div className="preview-toolbar-badges">
            <Badge tone={hasBlockingIssues ? "warning" : "success"}>{exportReadinessLabel}</Badge>
            <Badge tone="neutral">
              检查项 {completedChecklistCount}/{checklist.length}
            </Badge>
            <Badge tone="neutral">
              {qualityReport.warnings.length > 0 ? `${qualityReport.warnings.length} 项建议优化` : "无额外风险"}
            </Badge>
          </div>
        </div>

        <div className="workspace-header-actions">
          <Link className="btn btn-ghost" href={`/studio/${initialDocument.meta.id}`}>
            <ArrowLeft className="size-4" />
            返回编辑
          </Link>
          <Button disabled={hasBlockingIssues} onClick={() => void exportPdf()}>
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
                  <span className={`workspace-check-tag ${item.done ? "workspace-check-tag-done" : ""}`}>
                    {item.done ? "已完成" : item.required ? "待补充" : "建议优化"}
                  </span>
                </div>
              ))}
            </div>
          </div>

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
                    <span className="workspace-check-tag">必须处理</span>
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
                    <span className="workspace-check-tag">建议优化</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!hasBlockingIssues && optionalPendingItems.length === 0 && qualityReport.warnings.length === 0 ? (
            <div className="preview-sidebar-section">
              <p className="workspace-sidebar-label">当前状态</p>
              <p className="preview-sidebar-note">必填项已完成，当前没有额外风险，可直接导出 PDF。</p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
