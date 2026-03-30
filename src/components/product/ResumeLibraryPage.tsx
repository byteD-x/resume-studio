"use client";

import Link from "next/link";
import { Eye, FilePlus2, LoaderCircle, PencilLine, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(resumes.length > 0 ? `${resumes.length} 份简历` : "还没有简历");
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resumes
      .map((resume) => {
        const report = buildResumeWorkbenchReport(resume);
        const nextTaskFocus = getResumeWorkbenchTaskFocusTarget(report.openTasks[0] ?? null);
        const studioHref = nextTaskFocus
          ? `/studio/${resume.meta.id}?focus=${nextTaskFocus}`
          : `/studio/${resume.meta.id}`;

        return {
          resume,
          report,
          studioHref,
          hasContent: hasResumeRenderableContent(resume),
        };
      })
      .filter(({ resume }) => {
        if (!normalizedQuery) return true;

        const haystack = [
          resume.meta.title,
          resume.meta.id,
          resume.basics.name,
          resume.basics.headline,
          resume.basics.location,
          resume.targeting.role,
          resume.targeting.company,
          ...resume.targeting.focusKeywords,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });
  }, [query, resumes]);

  const deleteResume = async (id: string, title: string) => {
    const confirmed = window.confirm(`删除「${title}」？`);
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

  return (
    <main className="page-wrap">
      <section className="page-header-copy">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">我的简历</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-[color:var(--ink-strong)]">
              我的简历
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[color:var(--ink-soft)]">
              这里用于搜索、继续编辑、预览导出和删除。不再承担工作台统计，只保留你真正会用到的管理动作。
            </p>
          </div>
          <ButtonLink href="/templates">
            <FilePlus2 className="size-4" />
            新建简历
          </ButtonLink>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/92 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
        <div className="search-shell">
          <Search aria-hidden="true" className="size-4 text-[color:var(--ink-soft)]" />
          <input
            aria-label="搜索简历"
            className="search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、岗位、公司或关键词…"
            value={query}
          />
        </div>
        <p className="mt-3 text-sm text-[color:var(--ink-soft)]">
          {status} · 当前可见 {rows.length} 份
        </p>
      </section>

      {rows.length > 0 ? (
        <section className="mt-6 grid gap-4">
          {rows.map(({ resume, hasContent, report, studioHref }) => (
            <article
              className="rounded-[1.4rem] border border-[color:var(--line)] bg-white/92 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]"
              key={resume.meta.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[1.25rem] font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
                      {resume.meta.title}
                    </h2>
                    <span className={`filter-chip ${report.readiness === "ready" ? "filter-chip-active" : ""}`}>
                      {hasContent ? report.readinessLabel : "待补内容"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm leading-7 text-[color:var(--ink-soft)] md:grid-cols-3">
                    <p>
                      当前定位：
                      {[resume.targeting.role, resume.targeting.company].filter(Boolean).join(" / ") || "尚未设置"}
                    </p>
                    <p>最近更新：{formatDateTime(resume.meta.updatedAt)}</p>
                    <p>{hasContent ? "可继续编辑或预览导出" : "先进入编辑页补齐内容"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link className="btn btn-primary" href={studioHref}>
                    <PencilLine aria-hidden="true" className="size-4" />
                    编辑
                  </Link>
                  {hasContent ? (
                    <Link className="btn btn-secondary" href={`/studio/${resume.meta.id}/preview`}>
                      <Eye aria-hidden="true" className="size-4" />
                      预览
                    </Link>
                  ) : null}
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
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="mt-6 empty-surface">
          <p className="empty-surface-title">{resumes.length > 0 ? "没有匹配结果" : "还没有简历"}</p>
          <p className="empty-surface-text">
            {resumes.length > 0 ? "换一个关键词试试。" : "先去模板页开始一份新简历，或从首页导入旧内容。"}
          </p>
          <ButtonLink className="mx-auto mt-6" href="/templates">
            <FilePlus2 className="size-4" />
            去选模板
          </ButtonLink>
        </section>
      )}
    </main>
  );
}
