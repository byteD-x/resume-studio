"use client";

import type { Route } from "next";
import Link from "next/link";
import { Eye, FilePlus2, LoaderCircle, PencilLine, Target, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import {
  buildResumeWorkbenchReport,
  getResumeWorkbenchTaskFocusTarget,
} from "@/lib/resume-workbench";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function ResumeLibraryPage({
  resumes,
}: {
  resumes: ResumeDashboardSummary[];
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [status, setStatus] = useState(resumes.length > 0 ? `共 ${resumes.length} 份草稿` : "还没有简历草稿");
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    return resumes.map((resume) => {
      const report = buildResumeWorkbenchReport(resume);
      const nextTaskFocus = getResumeWorkbenchTaskFocusTarget(report.openTasks[0] ?? null);
      const studioHref = (
        nextTaskFocus
          ? `/studio/${resume.meta.id}?focus=${nextTaskFocus}`
          : `/studio/${resume.meta.id}`
      ) as Route;

      return {
        resume,
        report,
        studioHref,
        hasContent: hasResumeRenderableContent(resume),
      };
    });
  }, [resumes]);

  const deleteResume = async (id: string, title: string) => {
    const confirmed = window.confirm(`删除《${title}》？`);
    if (!confirmed) return;

    setPendingKey(`delete:${id}`);
    setStatus(`正在删除 ${title}`);

    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "删除失败");
      }

      setStatus(`已删除 ${title}`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
      setPendingKey(null);
    }
  };

  const readyCount = rows.filter(({ hasContent, report }) => hasContent && report.readiness === "ready").length;
  const targetingCount = rows.filter(
    ({ resume }) => resume.targeting.role.trim() || resume.targeting.company.trim(),
  ).length;
  const recentlyUpdatedCount = rows.filter(({ resume }) => {
    const updatedAt = new Date(resume.meta.updatedAt).getTime();
    return Date.now() - updatedAt < 1000 * 60 * 60 * 24 * 7;
  }).length;

  return (
    <main className="page-wrap">
      <section className="page-header-copy">
        <div className="section-heading-row items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--ink-strong)]">
              我的简历
            </h1>
            <p className="mt-2 text-[0.95rem] text-[color:var(--ink-soft)]">
              在这里管理主稿、特定岗位的定向版本及追踪推进状态。
            </p>
          </div>
          <ButtonLink href="/templates">
            <FilePlus2 className="size-4" />
            开始新简历
          </ButtonLink>
        </div>
      </section>

      <section className="library-summary-strip mt-6">
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">总草稿数</span>
          <strong className="library-summary-value">{rows.length}</strong>
          <span className="library-summary-label">全部版本</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">接近可导出</span>
          <strong className="library-summary-value">{readyCount}</strong>
          <span className="library-summary-label">可直接预览</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">已做岗位定向</span>
          <strong className="library-summary-value">{targetingCount}</strong>
          <span className="library-summary-label">已填岗位信息</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">最近 7 天更新</span>
          <strong className="library-summary-value">{recentlyUpdatedCount}</strong>
          <span className="library-summary-label">最近活跃</span>
        </article>
      </section>

      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      {rows.length > 0 ? (
        <section className="library-stack mt-6">
          {rows.map(({ resume, hasContent, report, studioHref }) => (
            <article className="library-row" key={resume.meta.id}>
              <div className="min-w-0">
                <div className="library-row-head">
                  <div className="min-w-0">
                    <h2 className="library-row-title">{resume.meta.title}</h2>
                    <p className="library-row-copy">
                      {resume.basics.headline.trim() || "先补基本信息。"}
                    </p>
                  </div>
                  <div className="library-row-pills">
                    <Badge tone={hasContent ? (report.readiness === "ready" ? "success" : "neutral") : "warning"}>
                      {hasContent ? report.readinessLabel : "待补内容"}
                    </Badge>
                    <Badge tone="accent">{report.workflow.currentLabel}</Badge>
                  </div>
                </div>

                <div className="library-meta-strip">
                  <div>
                    <p className="library-meta-label">目标岗位</p>
                    <p className="library-meta-value">
                      {[resume.targeting.role, resume.targeting.company].filter(Boolean).join(" / ") || "尚未设置"}
                    </p>
                  </div>
                  <div>
                    <p className="library-meta-label">最近更新</p>
                    <p className="library-meta-value">{formatDateTime(resume.meta.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="library-meta-label">下一步</p>
                    <p className="library-meta-value">{report.openTasks[0]?.title ?? "可以进入预览导出"}</p>
                  </div>
                </div>

                {resume.targeting.focusKeywords.length > 0 ? (
                  <div className="library-keywords-row">
                    <span className="library-keywords-label">关键词</span>
                    <p className="library-keywords-text">{resume.targeting.focusKeywords.join(" · ")}</p>
                  </div>
                ) : null}
              </div>

              <div className="library-row-actions">
                <Link className="btn btn-primary" href={studioHref}>
                  <PencilLine aria-hidden="true" className="size-4" />
                  继续编辑
                </Link>
                {hasContent ? (
                  <Link className="btn btn-secondary" href={`/studio/${resume.meta.id}/preview`}>
                    <Eye aria-hidden="true" className="size-4" />
                    预览导出
                  </Link>
                ) : null}
                <Link className="btn btn-ghost" href={studioHref}>
                  <Target className="size-4" />
                  岗位定向
                </Link>
                <button
                  aria-label={`删除 ${resume.meta.title}`}
                  className="icon-button"
                  disabled={isPending}
                  onClick={() => void deleteResume(resume.meta.id, resume.meta.title)}
                  type="button"
                >
                  {pendingKey === `delete:${resume.meta.id}` && isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-dashed border-[color:var(--line)] bg-[rgba(255,255,255,0.6)] px-6 py-12 text-center shadow-sm">
          <FilePlus2 className="mx-auto mb-4 size-8 text-[color:var(--ink-muted)]" />
          <h2 className="text-xl font-bold text-[color:var(--ink-strong)]">
            第一份简历
          </h2>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/templates">
              挑选版式开始
            </ButtonLink>
            <ButtonLink className="bg-white border-[color:var(--line)] shadow-sm text-[color:var(--ink-strong)] hover:bg-slate-50" href="/import">
              智能提取在线经历
            </ButtonLink>
            <ButtonLink className="bg-transparent text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] shadow-none px-3" href="/import?tab=pdf">
              导入旧版 PDF
            </ButtonLink>
          </div>
        </section>
      )}
    </main>
  );
}
