"use client";

import Link from "next/link";
import { ArrowLeft, Download, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { ResumePreviewDecisionStrip } from "@/components/product/preview/ResumePreviewDecisionStrip";
import { ResumePreviewLineageBanner } from "@/components/product/preview/ResumePreviewLineageBanner";
import { ResumePreviewSidebar } from "@/components/product/preview/ResumePreviewSidebar";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
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

export function ResumePreviewPage({
  initialDocument,
  lineage,
}: {
  initialDocument: ResumeDocument;
  lineage: ResumeLineageMeta | null;
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
  const checklist = useMemo(
    () => buildResumeExportChecklist(initialDocument, qualityReport),
    [initialDocument, qualityReport],
  );
  const html = useMemo(() => buildResumePreviewHtml(initialDocument), [initialDocument]);
  const hasBlockingIssues = qualityReport.blockingIssues.length > 0;
  const completedChecklistCount = checklist.filter((item) => item.done).length;
  const optionalPendingItems = checklist.filter((item) => !item.done && !item.required);
  const exportReadinessLabel = hasBlockingIssues ? "需要补充内容" : "可以直接导出";
  const [status, setStatus] = useState(hasBlockingIssues ? "先补齐必填项。" : "检查通过，可导出。");
  const [busyAction, setBusyAction] = useState<"export" | null>(null);
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);

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
      setLastExportedAt(new Date().toISOString());
      setStatus("导出完成。");
    } catch (error) {
      setLastExportedAt(null);
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
            {busyAction === "export" ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
            导出 PDF
          </Button>
        </div>
      </section>

      {lineage ? <ResumePreviewLineageBanner lineage={lineage} /> : null}

      <ResumePreviewDecisionStrip
        busyAction={busyAction}
        documentId={initialDocument.meta.id}
        exportPdf={exportPdf}
        hasBlockingIssues={hasBlockingIssues}
        initialKeywordCount={initialDocument.targeting.focusKeywords.length}
        lastExportedAt={lastExportedAt}
        optionalPendingCount={optionalPendingItems.length}
        qualityReport={qualityReport}
        targetingAnalysis={targetingAnalysis}
        workbenchReport={workbenchReport}
      />

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

        <ResumePreviewSidebar
          checklist={checklist}
          documentId={initialDocument.meta.id}
          hasBlockingIssues={hasBlockingIssues}
          optionalPendingCount={optionalPendingItems.length}
          qualityReport={qualityReport}
          stats={qualityReport.stats}
          targetingAnalysis={targetingAnalysis}
        />
      </section>
    </main>
  );
}
