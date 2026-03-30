"use client";

import Link from "next/link";
import { FileArchive, FilePlus2, FolderOpen, PencilLine, Search, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import {
  buildResumeWorkbenchReport,
  getResumeWorkbenchTaskFocusTarget,
} from "@/lib/resume-workbench";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

type DashboardOnboarding = "portfolio" | "pdf";

const surfaceClassName =
  "rounded-[1.8rem] border border-[color:var(--line)] bg-white/90 shadow-[0_18px_42px_rgba(15,23,42,0.05)]";
const labelClassName =
  "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]";
const metaClassName = "text-sm leading-7 text-[color:var(--ink-soft)]";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function getResumeSummary(resume: ResumeDashboardSummary) {
  const headline = resume.basics.headline.trim();
  const targeting = [resume.targeting.role, resume.targeting.company].filter(Boolean).join(" / ");

  return headline || targeting || "继续完善内容";
}

export function DashboardPage({ resumes }: { resumes: ResumeDashboardSummary[] }) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<DashboardOnboarding | null>(null);
  const [status, setStatus] = useState("导入后会直接进入编辑页。");

  const rows = useMemo(
    () =>
      resumes.map((resume) => {
        const report = buildResumeWorkbenchReport(resume);
        const nextTaskFocus = getResumeWorkbenchTaskFocusTarget(report.openTasks[0] ?? null);

        return {
          resume,
          report,
          hasRenderableContent: hasResumeRenderableContent(resume),
          studioHref: nextTaskFocus
            ? `/studio/${resume.meta.id}?focus=${nextTaskFocus}`
            : `/studio/${resume.meta.id}`,
          previewHref: `/studio/${resume.meta.id}/preview`,
        };
      }),
    [resumes],
  );

  const recentResumes = rows.slice(0, 4);
  const latestResume = rows[0] ?? null;
  const exportableResume = rows.find(({ hasRenderableContent }) => hasRenderableContent) ?? null;

  const createImportedResume = async (onboarding: DashboardOnboarding) => {
    setBusyAction(onboarding);
    setStatus("正在创建草稿…");

    try {
      const created = await getJson<ResumeDocument>(
        await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "未命名简历",
            starter: "blank",
          }),
        }),
      );

      startTransition(() => {
        router.push(`/studio/${created.meta.id}?onboarding=${onboarding}`);
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建失败。");
      setBusyAction(null);
    }
  };

  return (
    <main className="page-wrap">
      <section className={cn(surfaceClassName, "p-7 sm:p-8")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className={labelClassName}>Resume Studio</p>
            <h1 className="mt-3 text-[clamp(2.1rem,4vw,3.2rem)] font-semibold tracking-[-0.05em] text-[color:var(--ink-strong)]">
              简历工作台
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[color:var(--ink-soft)]">
              从模板开始，进入编辑器完善内容，最后在预览页导出 PDF。首页只保留最常用的三个入口：模板、编辑、导入导出。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="btn btn-primary px-5" href="/templates">
              <FilePlus2 aria-hidden="true" className="size-4" />
              从模板开始
            </Link>
            <Link className="btn btn-secondary px-5" href="/resumes">
              <FolderOpen aria-hidden="true" className="size-4" />
              我的简历
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        <article className={cn(surfaceClassName, "p-6")}>
          <p className={labelClassName}>模板</p>
          <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
            选一个模板开始
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            模板页是默认起点。先选适合的版式，再进入编辑器补齐内容。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="filter-chip filter-chip-active">模板选择</span>
            <span className="filter-chip">求职类型筛选</span>
          </div>
          <div className="mt-6">
            <Link className="btn btn-primary w-full" href="/templates">
              去选模板
            </Link>
          </div>
        </article>

        <article className={cn(surfaceClassName, "p-6")}>
          <p className={labelClassName}>编辑</p>
          <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
            继续当前草稿
          </h2>

          {latestResume ? (
            <>
              <div className="mt-4 rounded-[1.3rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-4">
                <p className="text-base font-semibold text-[color:var(--ink-strong)]">
                  {latestResume.resume.meta.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                  {getResumeSummary(latestResume.resume)}
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                  最近更新于 {formatDateTime(latestResume.resume.meta.updatedAt)}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="btn btn-primary flex-1" href={latestResume.studioHref}>
                  <PencilLine aria-hidden="true" className="size-4" />
                  继续编辑
                </Link>
                <Link className="btn btn-secondary flex-1" href="/resumes">
                  查看全部
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                还没有草稿内容。先从模板开始创建第一份简历。
              </p>
              <div className="mt-6">
                <Link className="btn btn-secondary w-full" href="/templates">
                  去创建第一份
                </Link>
              </div>
            </>
          )}
        </article>

        <article className={cn(surfaceClassName, "p-6")}>
          <p className={labelClassName}>导入导出</p>
          <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
            导入旧内容，完成后导出
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            支持从旧 PDF 或作品集起稿。导出入口统一放在预览页，避免首页出现多套出口。
          </p>
          <div className="mt-6 grid gap-3">
            <button
              className="btn btn-secondary w-full"
              disabled={busyAction !== null}
              onClick={() => void createImportedResume("pdf")}
              type="button"
            >
              <FileArchive aria-hidden="true" className="size-4" />
              {busyAction === "pdf" ? "正在创建…" : "导入旧 PDF"}
            </button>
            <button
              className="btn btn-secondary w-full"
              disabled={busyAction !== null}
              onClick={() => void createImportedResume("portfolio")}
              type="button"
            >
              <Upload aria-hidden="true" className="size-4" />
              {busyAction === "portfolio" ? "正在创建…" : "导入作品集"}
            </button>
            {exportableResume ? (
              <Link className="btn btn-primary w-full" href={exportableResume.previewHref}>
                导出最近一份
              </Link>
            ) : null}
          </div>
          <p aria-live="polite" className="mt-4 text-sm text-[color:var(--ink-soft)]">
            {status}
          </p>
        </article>
      </section>

      <section className={cn(surfaceClassName, "mt-6 p-6 sm:p-7")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={labelClassName}>最近编辑</p>
            <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
              你现在有什么内容
            </h2>
          </div>
          <Link className="section-link" href="/resumes">
            <Search aria-hidden="true" className="size-4" />
            前往“我的简历”搜索和管理
          </Link>
        </div>

        {recentResumes.length > 0 ? (
          <div className="mt-6 grid gap-3">
            {recentResumes.map(({ resume, report, studioHref, previewHref, hasRenderableContent }) => (
              <article
                className="flex flex-col gap-4 rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-4 md:flex-row md:items-center md:justify-between"
                key={resume.meta.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-[color:var(--ink-strong)]">
                    {resume.meta.title}
                  </p>
                  <p className={cn(metaClassName, "mt-1")}>
                    {getResumeSummary(resume)} · {report.readinessLabel} · 更新于{" "}
                    {formatDateTime(resume.meta.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link className="btn btn-primary" href={studioHref}>
                    继续编辑
                  </Link>
                  {hasRenderableContent ? (
                    <Link className="btn btn-secondary" href={previewHref}>
                      预览导出
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.3rem] border border-dashed border-[color:var(--line)] bg-[color:var(--paper-soft)] px-5 py-7">
            <p className="text-base font-semibold text-[color:var(--ink-strong)]">还没有简历内容</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
              从模板开始，或者直接导入旧内容。创建后会自动进入编辑页。
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
