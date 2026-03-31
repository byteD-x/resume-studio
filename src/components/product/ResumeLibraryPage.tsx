"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  FilePlus2,
  LoaderCircle,
  PencilLine,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { readClientAiConfig } from "@/lib/client-ai-config";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import { buildResumeLineageMap, type ResumeLineageMeta } from "@/lib/resume-lineage";
import { buildTailoredVariantPlan } from "@/lib/resume-tailoring";
import {
  buildResumeWorkbenchReport,
  getResumeWorkbenchTaskFocusTarget,
} from "@/lib/resume-workbench";
import type { ResumeDocument } from "@/types/resume";
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

async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

interface PendingLibraryConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}

interface LibraryRow {
  resume: ResumeDashboardSummary;
  report: ReturnType<typeof buildResumeWorkbenchReport>;
  tailoredPlan: ReturnType<typeof buildTailoredVariantPlan>;
  lineage: ResumeLineageMeta | null;
  studioHref: Route;
  targetingHref: Route;
  previewHref: Route;
  hasContent: boolean;
}

interface VersionGroup {
  id: string;
  sourceRow: LibraryRow;
  variantRows: LibraryRow[];
  allRows: LibraryRow[];
  latestUpdatedAt: number;
}

function buildRowData(resumes: ResumeDashboardSummary[]) {
  const sortedResumes = [...resumes].sort(
    (left, right) => new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  );
  const lineageMap = buildResumeLineageMap(sortedResumes);

  return sortedResumes.map((resume) => {
    const report = buildResumeWorkbenchReport(resume);
    const tailoredPlan = buildTailoredVariantPlan(resume as ResumeDocument);
    const nextTaskFocus = getResumeWorkbenchTaskFocusTarget(report.openTasks[0] ?? null);
    const studioHref = (
      nextTaskFocus
        ? `/studio/${resume.meta.id}?focus=${nextTaskFocus}`
        : `/studio/${resume.meta.id}`
    ) as Route;

    return {
      resume,
      report,
      tailoredPlan,
      lineage: lineageMap.get(resume.meta.id) ?? null,
      studioHref,
      targetingHref: `/studio/${resume.meta.id}?focus=targeting` as Route,
      previewHref: `/studio/${resume.meta.id}/preview` as Route,
      hasContent: hasResumeRenderableContent(resume),
    } satisfies LibraryRow;
  });
}

function buildVersionGroups(rows: LibraryRow[]) {
  const grouped = new Map<string, LibraryRow[]>();

  for (const row of rows) {
    const groupId = row.lineage?.groupId ?? row.resume.meta.id;
    const bucket = grouped.get(groupId) ?? [];
    bucket.push(row);
    grouped.set(groupId, bucket);
  }

  return [...grouped.entries()]
    .map(([groupId, groupRows]) => {
      const sortedRows = [...groupRows].sort((left, right) => {
        const leftIsSource = (left.lineage?.parentId ?? null) === null ? 1 : 0;
        const rightIsSource = (right.lineage?.parentId ?? null) === null ? 1 : 0;

        if (leftIsSource !== rightIsSource) {
          return rightIsSource - leftIsSource;
        }

        return new Date(right.resume.meta.updatedAt).getTime() - new Date(left.resume.meta.updatedAt).getTime();
      });

      const sourceRow = sortedRows.find((row) => (row.lineage?.parentId ?? null) === null) ?? sortedRows[0];
      const variantRows = sortedRows.filter((row) => row.resume.meta.id !== sourceRow.resume.meta.id);

      return {
        id: groupId,
        sourceRow,
        variantRows,
        allRows: sortedRows,
        latestUpdatedAt: Math.max(...sortedRows.map((row) => new Date(row.resume.meta.updatedAt).getTime())),
      } satisfies VersionGroup;
    })
    .sort((left, right) => right.latestUpdatedAt - left.latestUpdatedAt);
}

function getGroupKindLabel(row: LibraryRow) {
  return row.lineage?.kind === "source" ? "主稿" : "独立稿";
}

export function ResumeLibraryPage({
  resumes,
}: {
  resumes: ResumeDashboardSummary[];
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [status, setStatus] = useState(
    resumes.length > 0 ? `共 ${resumes.length} 份简历草稿` : "还没有简历草稿",
  );
  const [confirmation, setConfirmation] = useState<PendingLibraryConfirmation | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo(() => buildRowData(resumes), [resumes]);
  const versionGroups = useMemo(() => buildVersionGroups(rows), [rows]);
  const latestResume = versionGroups[0]?.allRows[0] ?? null;
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(versionGroups[0]?.id ?? null);

  useEffect(() => {
    if (versionGroups.length === 0) {
      setSelectedGroupId(null);
      return;
    }

    if (!selectedGroupId || !versionGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(versionGroups[0]?.id ?? null);
    }
  }, [selectedGroupId, versionGroups]);

  const selectedGroup = versionGroups.find((group) => group.id === selectedGroupId) ?? versionGroups[0] ?? null;
  const readyCount = rows.filter(({ hasContent, report }) => hasContent && report.readiness === "ready").length;
  const targetingCount = rows.filter(
    ({ resume }) => resume.targeting.role.trim() || resume.targeting.company.trim(),
  ).length;
  const recentlyUpdatedCount = rows.filter(({ resume }) => {
    const updatedAt = new Date(resume.meta.updatedAt).getTime();
    return Date.now() - updatedAt < 1000 * 60 * 60 * 24 * 7;
  }).length;
  const variantCount = rows.filter(({ lineage }) => lineage?.kind === "variant").length;

  const journeySteps = [
    {
      title: "选择起点",
      description: "从模板新建，或导入网站、Markdown、纯文本、旧版 PDF。",
    },
    {
      title: "补齐核心内容",
      description: "先完成抬头、摘要、经历与结果要点，形成可读主稿。",
    },
    {
      title: "按岗位定向",
      description: "补岗位信息后生成版本，并在同一组里持续管理它们。",
    },
    {
      title: "检查后导出",
      description: "在预览页完成最终检查，再导出 PDF。",
    },
  ];

  const startOptions = [
    {
      href: "/templates",
      icon: FilePlus2,
      title: "从模板开始",
      description: "适合先搭主稿、先确定版式的人。",
    },
    {
      href: "/import",
      icon: Sparkles,
      title: "导入在线经历",
      description: "适合已有个人网站、Notion 或 Markdown 素材的人。",
    },
    {
      href: "/import?tab=pdf",
      icon: UploadCloud,
      title: "导入旧版 PDF",
      description: "适合先把旧简历拉进来，再逐条核对和润色。",
    },
  ] as const;

  const deleteResume = async (id: string, title: string) => {
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

  const requestDeleteResume = (id: string, title: string) => {
    setConfirmation({
      title: `删除「${title}」？`,
      description: "删除后会移除这份草稿及其导出文件，且无法自动恢复。",
      confirmLabel: "删除简历",
      onConfirm: async () => {
        setConfirmation(null);
        await deleteResume(id, title);
      },
    });
  };

  const generateTailoredVariant = async (row: LibraryRow) => {
    setPendingKey(`generate:${row.resume.meta.id}`);
    setStatus(`正在基于 ${row.resume.meta.title} 生成岗位定制版`);

    try {
      const clientAiApiKey = readClientAiConfig().apiKey;
      const result = await getJson<{
        document: ResumeDocument;
        plan: ReturnType<typeof buildTailoredVariantPlan>;
        remoteSummaryApplied?: boolean;
        remoteSummaryError?: string | null;
      }>(
        await fetch(`/api/resumes/${row.resume.meta.id}/generate-tailored-variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: row.tailoredPlan.titleSuggestion,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setStatus(
        result.remoteSummaryApplied
          ? "已生成岗位定制版，并补上 AI 摘要建议"
          : result.plan.missingKeywords.length > 0
            ? `已生成定制版，仍缺 ${result.plan.missingKeywords.length} 个关键词`
            : result.remoteSummaryError
              ? `已生成岗位定制版，但 AI 摘要未应用：${result.remoteSummaryError}`
              : "已生成岗位定制版",
      );
      router.push(`/studio/${result.document.meta.id}?focus=ai`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "生成定制版失败");
      setPendingKey(null);
    }
  };

  return (
    <main className="page-wrap">
      <section className="page-header-copy">
        <div className="section-heading-row items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--ink-strong)]">我的简历</h1>
            <p className="mt-2 text-[0.95rem] text-[color:var(--ink-soft)]">
              在这里管理主稿、岗位定向版本，以及每份简历当前最值得推进的下一步。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {latestResume ? (
              <ButtonLink href={latestResume.studioHref} variant="secondary">
                <PencilLine className="size-4" />
                继续当前链路
              </ButtonLink>
            ) : null}
            <ButtonLink href="/templates">
              <FilePlus2 className="size-4" />
              开始新简历
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="library-summary-strip mt-6">
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">总草稿数</span>
          <strong className="library-summary-value">{rows.length}</strong>
          <span className="library-summary-label">全部版本</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">主稿组数</span>
          <strong className="library-summary-value">{versionGroups.length}</strong>
          <span className="library-summary-label">按主稿分组</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">定制版本</span>
          <strong className="library-summary-value">{variantCount}</strong>
          <span className="library-summary-label">岗位定向产物</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">接近可导出</span>
          <strong className="library-summary-value">{readyCount}</strong>
          <span className="library-summary-label">可直接预览</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">已做岗位定向</span>
          <strong className="library-summary-value">{targetingCount}</strong>
          <span className="library-summary-label">已填写岗位信息</span>
        </article>
        <article className="workspace-sidebar-card p-5">
          <span className="library-meta-label">最近 7 天更新</span>
          <strong className="library-summary-value">{recentlyUpdatedCount}</strong>
          <span className="library-summary-label">近期活跃</span>
        </article>
      </section>

      <section className="library-journey-grid">
        <article className="workspace-sidebar-card p-5">
          <p className="section-kicker">推荐链路</p>
          <h2 className="library-card-title">先稳定主稿，再围绕岗位生成版本</h2>
          <p className="library-focus-copy">
            现在的简历库不再只是按时间堆列表，而是按主稿组织。你可以先把一份主稿打磨稳定，再在同一组里持续管理不同岗位的定制版。
          </p>

          <div className="home-flow-strip mt-5">
            {journeySteps.map((step, index) => (
              <article className="home-flow-step" key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="workspace-sidebar-card p-5">
          <p className="section-kicker">{latestResume ? "当前建议" : "开始方式"}</p>
          <h2 className="library-card-title">
            {latestResume ? `优先推进「${latestResume.resume.meta.title}」` : "选择最适合你的入口"}
          </h2>
          <p className="library-focus-copy">
            {latestResume
              ? `${latestResume.report.workflow.currentDescription} 当前最值得推进的是：${latestResume.report.openTasks[0]?.title ?? "进入预览导出"}。`
              : "如果你还没有任何草稿，建议先选一个入口建立第一版，再进入编辑器逐步完善。"}
          </p>

          {latestResume ? (
            <div className="library-focus-panel">
              <div className="library-progress-track" aria-label={`当前完成度 ${latestResume.report.score}%`}>
                <div className="library-progress-fill" style={{ width: `${latestResume.report.score}%` }} />
              </div>
              <p className="library-progress-copy">
                当前完成度 {latestResume.report.score}% · {latestResume.report.readinessLabel}
              </p>

              <div className="library-action-list">
                {(latestResume.report.openTasks.length > 0
                  ? latestResume.report.openTasks.slice(0, 3)
                  : [
                      {
                        id: "ready-preview",
                        title: "进入预览导出",
                        detail: "这份简历已经具备进入最终检查和导出的条件。",
                      },
                    ]
                ).map((task) => (
                  <article className="library-action-item" key={task.id}>
                    <strong>{task.title}</strong>
                    <p>{task.detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <ButtonLink href={latestResume.studioHref}>
                  <PencilLine className="size-4" />
                  继续编辑
                </ButtonLink>
                <ButtonLink href={latestResume.previewHref} variant="secondary">
                  <Eye className="size-4" />
                  打开预览
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="library-start-grid">
              {startOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <ButtonLink className="library-start-card" href={option.href} key={option.title} variant="ghost">
                    <span className="library-start-icon">
                      <Icon className="size-4" />
                    </span>
                    <span className="library-start-copy">
                      <strong>{option.title}</strong>
                      <span>{option.description}</span>
                    </span>
                  </ButtonLink>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      {versionGroups.length > 0 ? (
        <section className="library-master-detail">
          <div className="library-master-list" aria-label="简历版本组列表">
            {versionGroups.map((group) => {
              const source = group.sourceRow;
              const active = selectedGroup?.id === group.id;

              return (
                <button
                  aria-pressed={active}
                  className={`library-master-card ${active ? "library-master-card-active" : ""}`}
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  type="button"
                >
                  <div className="library-master-card-head">
                    <div className="min-w-0">
                      <div className="library-master-card-titleline">
                        <strong>{source.resume.meta.title}</strong>
                        <ChevronRight className="size-4" />
                      </div>
                      <p>{source.resume.basics.headline.trim() || "先补齐基本信息，让这份主稿具备可读内容。"}</p>
                    </div>

                    <div className="library-row-pills">
                      <Badge tone="neutral">{getGroupKindLabel(source)}</Badge>
                      {source.tailoredPlan.canGenerate ? <Badge tone="success">可直接生成定制版</Badge> : null}
                      {group.variantRows.length > 0 ? <Badge tone="accent">{group.variantRows.length} 个版本</Badge> : null}
                    </div>
                  </div>

                  <div className="library-master-meta">
                    <span>最近更新：{formatDateTime(source.resume.meta.updatedAt)}</span>
                    <span>下一步：{source.report.openTasks[0]?.title ?? "进入预览导出"}</span>
                  </div>

                  <div className="library-progress-track" aria-hidden="true">
                    <div className="library-progress-fill" style={{ width: `${source.report.score}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedGroup ? (
            <div className="library-detail-panel">
              <article className="library-detail-hero">
                <div className="library-detail-hero-head">
                  <div>
                    <p className="section-kicker">当前版本组</p>
                    <h2 className="library-card-title">{selectedGroup.sourceRow.resume.meta.title}</h2>
                    <p className="library-focus-copy">
                      {selectedGroup.variantRows.length > 0
                        ? `这份主稿下共有 ${selectedGroup.variantRows.length} 个岗位定制版，可以在右侧集中切换和管理。`
                        : "这是一份独立主稿，当前还没有派生岗位定制版。"}
                    </p>
                  </div>

                  <div className="library-row-pills">
                    <Badge tone="neutral">{getGroupKindLabel(selectedGroup.sourceRow)}</Badge>
                    {selectedGroup.sourceRow.tailoredPlan.canGenerate ? (
                      <Badge tone="success">已具备定制条件</Badge>
                    ) : null}
                    <Badge tone={selectedGroup.sourceRow.report.readiness === "ready" ? "success" : "accent"}>
                      {selectedGroup.sourceRow.report.readinessLabel}
                    </Badge>
                  </div>
                </div>

                <div className="library-meta-strip">
                  <div>
                    <p className="library-meta-label">目标岗位</p>
                    <p className="library-meta-value">
                      {[
                        selectedGroup.sourceRow.resume.targeting.role,
                        selectedGroup.sourceRow.resume.targeting.company,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "尚未设置"}
                    </p>
                  </div>
                  <div>
                    <p className="library-meta-label">版本数量</p>
                    <p className="library-meta-value">{selectedGroup.allRows.length}</p>
                  </div>
                  <div>
                    <p className="library-meta-label">下一步</p>
                    <p className="library-meta-value">
                      {selectedGroup.sourceRow.report.openTasks[0]?.title ?? "可以进入预览导出"}
                    </p>
                  </div>
                </div>

                <div className="library-detail-actions">
                  <ButtonLink href={selectedGroup.sourceRow.studioHref}>
                    <PencilLine className="size-4" />
                    编辑主稿
                  </ButtonLink>
                  {selectedGroup.sourceRow.tailoredPlan.canGenerate ? (
                    <Button
                      disabled={pendingKey !== null}
                      onClick={() => void generateTailoredVariant(selectedGroup.sourceRow)}
                      variant="secondary"
                    >
                      {pendingKey === `generate:${selectedGroup.sourceRow.resume.meta.id}` ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      直接生成定制版
                    </Button>
                  ) : null}
                  <ButtonLink href={selectedGroup.sourceRow.previewHref} variant="secondary">
                    <Eye className="size-4" />
                    预览主稿
                  </ButtonLink>
                  <ButtonLink href={selectedGroup.sourceRow.targetingHref} variant="ghost">
                    <Target className="size-4" />
                    去做岗位定向
                  </ButtonLink>
                </div>
              </article>

              <section className="library-detail-section">
                <div className="library-detail-section-head">
                  <strong>{selectedGroup.sourceRow.lineage?.kind === "source" ? "主稿" : "当前草稿"}</strong>
                  <span>
                    {selectedGroup.variantRows.length > 0
                      ? "建议保持稳定，作为所有定制版的源头"
                      : "当前还没有派生版本"}
                  </span>
                </div>

                <article className="library-version-card library-version-card-source">
                  <div className="library-version-card-head">
                    <div>
                      <strong>{selectedGroup.sourceRow.resume.meta.title}</strong>
                      <p>{selectedGroup.sourceRow.resume.basics.headline.trim() || "先补齐基本信息和摘要。"}</p>
                    </div>
                    <div className="library-row-pills">
                      <Badge tone="neutral">{getGroupKindLabel(selectedGroup.sourceRow)}</Badge>
                      <Badge tone={selectedGroup.sourceRow.report.readiness === "ready" ? "success" : "neutral"}>
                        {selectedGroup.sourceRow.report.readinessLabel}
                      </Badge>
                    </div>
                  </div>

                  <div className="library-version-card-meta">
                    <span>更新时间：{formatDateTime(selectedGroup.sourceRow.resume.meta.updatedAt)}</span>
                    <span>完成度：{selectedGroup.sourceRow.report.score}%</span>
                  </div>

                  {selectedGroup.sourceRow.resume.targeting.focusKeywords.length > 0 ? (
                    <div className="library-keywords-row">
                      <span className="library-keywords-label">关键词</span>
                      <p className="library-keywords-text">
                        {selectedGroup.sourceRow.resume.targeting.focusKeywords.join(" · ")}
                      </p>
                    </div>
                  ) : null}
                </article>
              </section>

              <section className="library-detail-section">
                <div className="library-detail-section-head">
                  <strong>岗位定制版</strong>
                  <span>
                    {selectedGroup.variantRows.length > 0
                      ? `共 ${selectedGroup.variantRows.length} 份版本`
                      : "补岗位信息后即可在编辑器中生成"}
                  </span>
                </div>

                {selectedGroup.variantRows.length > 0 ? (
                  <div className="library-version-list">
                    {selectedGroup.variantRows.map((variant) => (
                      <article className="library-version-card" key={variant.resume.meta.id}>
                        <div className="library-version-card-head">
                          <div>
                            <strong>{variant.resume.meta.title}</strong>
                            <p>{variant.resume.basics.headline.trim() || "这份定制版还需要继续补内容。"}</p>
                          </div>
                          <div className="library-row-pills">
                            <Badge tone="accent">定制版</Badge>
                            <Badge tone={variant.report.readiness === "ready" ? "success" : "neutral"}>
                              {variant.report.readinessLabel}
                            </Badge>
                          </div>
                        </div>

                        <div className="library-version-card-meta">
                          <span>
                            目标岗位：
                            {[variant.resume.targeting.role, variant.resume.targeting.company]
                              .filter(Boolean)
                              .join(" / ") || "尚未设置"}
                          </span>
                          <span>更新时间：{formatDateTime(variant.resume.meta.updatedAt)}</span>
                          <span>基于「{variant.lineage?.parentTitle ?? selectedGroup.sourceRow.resume.meta.title}」生成</span>
                        </div>

                        {variant.resume.targeting.focusKeywords.length > 0 ? (
                          <div className="library-keywords-row">
                            <span className="library-keywords-label">关键词</span>
                            <p className="library-keywords-text">{variant.resume.targeting.focusKeywords.join(" · ")}</p>
                          </div>
                        ) : null}

                        <div className="library-version-card-actions">
                          <Link className="btn btn-primary" href={variant.studioHref}>
                            <PencilLine className="size-4" />
                            编辑版本
                          </Link>
                          <Link className="btn btn-secondary" href={variant.previewHref}>
                            <Eye className="size-4" />
                            预览导出
                          </Link>
                          <button
                            aria-label={`删除 ${variant.resume.meta.title}`}
                            className="icon-button"
                            disabled={isPending}
                            onClick={() => requestDeleteResume(variant.resume.meta.id, variant.resume.meta.title)}
                            type="button"
                          >
                            {pendingKey === `delete:${variant.resume.meta.id}` && isPending ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <section className="empty-surface empty-surface-left">
                    <p className="empty-surface-title">这份主稿还没有定制版</p>
                    <p className="empty-surface-text">
                      {selectedGroup.sourceRow.tailoredPlan.canGenerate
                        ? "这份主稿已经具备生成条件。你可以直接在这里生成第一份定制版，或继续回编辑器微调岗位信息。"
                        : "先进入岗位定向，补齐目标岗位、JD 和关键词，再在编辑器里生成对应版本。"}
                    </p>
                    <div className="empty-surface-actions">
                      {selectedGroup.sourceRow.tailoredPlan.canGenerate ? (
                        <Button
                          disabled={pendingKey !== null}
                          onClick={() => void generateTailoredVariant(selectedGroup.sourceRow)}
                        >
                          {pendingKey === `generate:${selectedGroup.sourceRow.resume.meta.id}` ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <Sparkles className="size-4" />
                          )}
                          直接生成定制版
                        </Button>
                      ) : null}
                      <ButtonLink href={selectedGroup.sourceRow.targetingHref} variant="secondary">
                        {selectedGroup.sourceRow.tailoredPlan.canGenerate ? "继续完善岗位定向" : "去做岗位定向"}
                      </ButtonLink>
                    </div>
                  </section>
                )}
              </section>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-dashed border-[color:var(--line)] bg-[rgba(255,255,255,0.6)] px-6 py-12 text-center shadow-sm">
          <FilePlus2 className="mx-auto mb-4 size-8 text-[color:var(--ink-muted)]" />
          <h2 className="text-xl font-bold text-[color:var(--ink-strong)]">第一份简历</h2>
          <p className="mx-auto mt-3 max-w-[30rem] text-[0.95rem] text-[color:var(--ink-soft)]">
            你可以从模板开始，也可以先导入旧版 PDF 或在线经历，再进入编辑器继续完善。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/templates">挑选版式开始</ButtonLink>
            <ButtonLink
              className="border-[color:var(--line)] bg-white text-[color:var(--ink-strong)] shadow-sm hover:bg-slate-50"
              href="/import"
            >
              智能提取在线经历
            </ButtonLink>
            <ButtonLink
              className="bg-transparent px-3 text-[color:var(--ink-muted)] shadow-none hover:text-[color:var(--ink)]"
              href="/import?tab=pdf"
            >
              导入旧版 PDF
            </ButtonLink>
          </div>
        </section>
      )}

      <ConfirmDialog
        cancelLabel="保留简历"
        confirmLabel={confirmation?.confirmLabel}
        confirmVariant="danger"
        description={confirmation?.description}
        onClose={() => setConfirmation(null)}
        onConfirm={() => void confirmation?.onConfirm()}
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "请确认"}
      />
    </main>
  );
}
