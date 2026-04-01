"use client";

import { Download, LoaderCircle, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import type {
  PreviewQualityReport,
  PreviewTargetingAnalysis,
  PreviewWorkbenchReport,
} from "@/components/product/preview/shared";
import { buildEditorFocusHref } from "@/components/product/preview/shared";

const exportTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ResumePreviewDecisionStrip({
  busyAction,
  documentId,
  exportPdf,
  hasBlockingIssues,
  initialKeywordCount,
  lastExportedAt,
  optionalPendingCount,
  qualityReport,
  targetingAnalysis,
  workbenchReport,
}: {
  busyAction: "export" | null;
  documentId: string;
  exportPdf: () => Promise<void>;
  hasBlockingIssues: boolean;
  initialKeywordCount: number;
  lastExportedAt: string | null;
  optionalPendingCount: number;
  qualityReport: PreviewQualityReport;
  targetingAnalysis: PreviewTargetingAnalysis;
  workbenchReport: PreviewWorkbenchReport;
}) {
  const exportState = lastExportedAt ? "success" : busyAction === "export" ? "busy" : "idle";
  const nextWorkbenchTask = workbenchReport.openTasks[0] ?? null;

  return (
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
            <strong>{optionalPendingCount + qualityReport.warnings.length}</strong>
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
            <strong>{initialKeywordCount}</strong>
            <p>
              {initialKeywordCount > 0
                ? `当前版本已经围绕 ${initialKeywordCount} 个关键词做定向。`
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
              <ButtonLink href={`/studio/${documentId}?focus=targeting`}>继续岗位定向</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="preview-next-actions">
            <div className="preview-next-actions-head">
              <strong>接下来做什么</strong>
              <Badge tone={hasBlockingIssues ? "warning" : "success"}>{hasBlockingIssues ? "先修问题" : "可以导出"}</Badge>
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
                      documentId,
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
                  <ButtonLink href={`/studio/${documentId}?focus=targeting`} variant="secondary">
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
                      {busyAction === "export" ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
                      立即导出
                    </Button>
                    <ButtonLink href={`/studio/${documentId}?focus=targeting`} variant="secondary">
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
  );
}
