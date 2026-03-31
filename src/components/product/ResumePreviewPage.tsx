"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft, Download, LoaderCircle, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import { buildResumeWorkbenchReport } from "@/lib/resume-workbench";
import type { ResumeDocument } from "@/types/resume";

const exportTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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

function buildLineageCopy(lineage: ResumeLineageMeta) {
  if (lineage.parentTitle) {
    return `这份版本来自「${lineage.parentTitle}」，导出前请确认它就是这次要使用的岗位版本。`;
  }

  if (lineage.childCount > 0) {
    return "这份主稿已经派生出多个版本，导出前请确认当前是否仍应作为统一主稿保存。";
  }

  return "这是一份独立草稿，如果后续还要面向不同岗位生成版本，可以回到编辑器继续定向。";
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
  const stats = qualityReport.stats;
  const completedChecklistCount = checklist.filter((item) => item.done).length;
  const optionalPendingItems = checklist.filter((item) => !item.done && !item.required);
  const requiredPendingItems = checklist.filter((item) => !item.done && item.required);
  const nextWorkbenchTask = workbenchReport.openTasks[0] ?? null;
  const exportReadinessLabel = hasBlockingIssues ? "需要补充内容" : "可以直接导出";
  const [status, setStatus] = useState(hasBlockingIssues ? "先补齐必填项。" : "检查通过，可导出。");
  const [busyAction, setBusyAction] = useState<"export" | null>(null);
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);
  const exportState = lastExportedAt ? "success" : busyAction === "export" ? "busy" : "idle";

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
      const exportedAt = new Date().toISOString();
      setLastExportedAt(exportedAt);
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

      {lineage ? (
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
      ) : null}

      <section className="preview-decision-strip">
        <article className="preview-decision-main">
          <p className="editor-workflow-kicker">最终决策</p>
          <div className="editor-workflow-head">
            <strong>
              {exportState === "success"
                ? "PDF 已导出，接下来可以回到库里继续管理版本。"
                : hasBlockingIssues
                  ? "先处理阻塞项，再进入导出动作。"
                  : "当前已经具备导出条件。"}
            </strong>
            <span>
              {exportState === "success"
                ? `导出于 ${lastExportedAt ? exportTimeFormatter.format(new Date(lastExportedAt)) : ""}`
                : `完成度 ${workbenchReport.score}%`}
            </span>
          </div>
          <p className="editor-workflow-copy">
            {exportState === "success"
              ? "这份简历已经完成一次 PDF 导出。你可以回到编辑器继续润色，或回到简历库推进下一份版本。"
              : hasBlockingIssues
                ? "预览页的职责是帮你判断这份简历是否到了可以导出的阶段，而不是把问题直接带进 PDF。"
                : "如果还想进一步提高匹配度，可以回到岗位定向继续补关键词；否则现在就可以导出。"}
          </p>

          <div className="preview-decision-grid">
            <article className="preview-decision-card">
              <span className="preview-stat-label">阻塞项</span>
              <strong>{qualityReport.blockingIssues.length}</strong>
              <p>{hasBlockingIssues ? "必须先处理这些问题。" : "当前没有阻塞导出的内容问题。"}</p>
            </article>
            <article className="preview-decision-card">
              <span className="preview-stat-label">建议优化</span>
              <strong>{optionalPendingItems.length + qualityReport.warnings.length}</strong>
              <p>这些项不会阻止导出，但会影响最终观感与完整度。</p>
            </article>
            <article className="preview-decision-card">
              <span className="preview-stat-label">岗位匹配</span>
              <strong>{targetingAnalysis.coveragePercent ?? "—"}</strong>
              <p>
                {targetingAnalysis.coveragePercent == null
                  ? "还没有足够的岗位信息可供分析。"
                  : `已命中 ${targetingAnalysis.matchedKeywords.length} 个关键词。`}
              </p>
            </article>
            <article className="preview-decision-card">
              <span className="preview-stat-label">定向关键词</span>
              <strong>{initialDocument.targeting.focusKeywords.length}</strong>
              <p>
                {initialDocument.targeting.focusKeywords.length > 0
                  ? `当前版本已经围绕 ${initialDocument.targeting.focusKeywords.length} 个关键词做定向。`
                  : "还没有配置关键词，适合回到岗位信息补定向线索。"}
              </p>
            </article>
          </div>
        </article>

        <aside className="preview-decision-side">
          {exportState === "success" ? (
            <div className="preview-completion-card">
              <div className="preview-completion-head">
                <div className="preview-completion-mark">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <strong>导出完成</strong>
                  <p>建议回到简历库管理这份版本，或继续做岗位定向版本。</p>
                </div>
              </div>

              <div className="preview-completion-actions">
                <ButtonLink href="/resumes" variant="secondary">
                  回到简历库
                </ButtonLink>
                <ButtonLink href={`/studio/${initialDocument.meta.id}?focus=targeting`}>
                  继续岗位定向
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="preview-next-actions">
              <div className="preview-next-actions-head">
                <strong>接下来做什么</strong>
                <Badge tone={hasBlockingIssues ? "warning" : "success"}>
                  {hasBlockingIssues ? "先修问题" : "可以导出"}
                </Badge>
              </div>

              <div className="preview-next-action-list">
                {nextWorkbenchTask ? (
                  <article className="preview-next-action-card">
                    <div className="preview-next-action-head">
                      <strong>{nextWorkbenchTask.title}</strong>
                      <Badge tone={nextWorkbenchTask.status === "warning" ? "warning" : "neutral"}>
                        {nextWorkbenchTask.status === "warning" ? "建议" : "优先"}
                      </Badge>
                    </div>
                    <p>{nextWorkbenchTask.detail}</p>
                    <ButtonLink
                      href={buildEditorFocusHref(
                        initialDocument.meta.id,
                        nextWorkbenchTask.area === "export" ? "export" : nextWorkbenchTask.area,
                      )}
                      variant="secondary"
                    >
                      {nextWorkbenchTask.action.label}
                    </ButtonLink>
                  </article>
                ) : null}

                {targetingAnalysis.active ? (
                  <article className="preview-next-action-card">
                    <div className="preview-next-action-head">
                      <strong>继续贴近岗位描述</strong>
                      <Badge tone="accent">定向中</Badge>
                    </div>
                    <p>
                      {targetingAnalysis.missingKeywords.length > 0
                        ? `还有 ${targetingAnalysis.missingKeywords.length} 个关键词没有命中，适合回到岗位信息继续补强。`
                        : "当前关键词已经比较完整，可以把精力放在导出前检查上。"}
                    </p>
                    <ButtonLink href={`/studio/${initialDocument.meta.id}?focus=targeting`} variant="secondary">
                      返回岗位信息
                    </ButtonLink>
                  </article>
                ) : null}

                {!hasBlockingIssues ? (
                  <article className="preview-next-action-card">
                    <div className="preview-next-action-head">
                      <strong>现在可以导出 PDF</strong>
                      <Badge tone="success">就绪</Badge>
                    </div>
                    <p>如果这份已经是当前要使用的岗位版本，可以直接导出；如果还要继续贴近 JD，可以先回去做岗位定向。</p>
                    <div className="preview-next-action-buttons">
                      <Button disabled={busyAction !== null} onClick={() => void exportPdf()}>
                        {busyAction === "export" ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                        立即导出
                      </Button>
                      <ButtonLink href={`/studio/${initialDocument.meta.id}?focus=targeting`} variant="secondary">
                        <Target className="size-4" />
                        补岗位定向
                      </ButtonLink>
                    </div>
                  </article>
                ) : null}
              </div>
            </div>
          )}
        </aside>
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
                      {item.done ? "已完成" : item.required ? "待补齐" : "建议优化"}
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
                  <span className="workspace-check-tag workspace-check-tag-done">
                    {targetingAnalysis.matchedKeywords.length}
                  </span>
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
