"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileArchive,
  FileSearch,
  FileStack,
  FileUp,
  LoaderCircle,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  buildResumeWorkbenchReport,
  getResumeWorkbenchTaskFocusTarget,
  resumeWorkflowStateMeta,
} from "@/lib/resume-workbench";
import { resumeWriterProfileMeta } from "@/lib/resume-document";
import type { ResumeDocument, ResumeWriterProfile } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

type DashboardStarter = "blank" | "guided";
type DashboardOnboarding = "portfolio" | "pdf" | null;
const writerProfileOptions = [
  "campus",
  "experienced",
  "career-switch",
] satisfies ResumeWriterProfile[];

async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function DashboardPage({ resumes }: { resumes: ResumeDashboardSummary[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [writerProfile, setWriterProfile] = useState<ResumeWriterProfile>("experienced");
  const [busy, setBusy] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [status, setStatus] = useState("从空白稿开始，或者继续打磨你已有的简历版本。");
  const deferredQuery = useDeferredValue(query);

  const filteredResumes = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return resumes;

    return resumes.filter((resume) => {
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
  }, [deferredQuery, resumes]);

  const resumeReports = useMemo(
    () =>
      new Map(
        resumes.map((resume) => [resume.meta.id, buildResumeWorkbenchReport(resume)]),
      ),
    [resumes],
  );

  const overview = useMemo(() => {
    const sectionTotal = resumes.reduce((total, resume) => total + resume.sections.length, 0);
    const keywordTotal = new Set(
      resumes.flatMap((resume) =>
        resume.targeting.focusKeywords.map((keyword) => keyword.trim().toLowerCase()),
      ),
    ).size;

    return {
      sectionTotal,
      keywordTotal,
      latestUpdatedAt: resumes[0]?.meta.updatedAt ?? null,
    };
  }, [resumes]);

  const workspaceOverview = useMemo(() => {
    const reports = [...resumeReports.values()];
    const averageScore =
      reports.length > 0
        ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length)
        : 0;
    const readyCount = reports.filter((report) => report.readiness === "ready").length;
    const needsAttentionCount = reports.filter((report) => report.score < 50).length;
    const repeatedTasks = new Map<string, { title: string; count: number }>();

    for (const report of reports) {
      for (const task of report.openTasks.slice(0, 2)) {
        const current = repeatedTasks.get(task.id) ?? { title: task.title, count: 0 };
        current.count += 1;
        repeatedTasks.set(task.id, current);
      }
    }

    const topWorkspaceTasks = [...repeatedTasks.values()]
      .sort((left, right) => right.count - left.count || left.title.localeCompare(right.title))
      .slice(0, 3);
    const workflowCounts = resumes.reduce(
      (counts, resume) => {
        counts[resume.meta.workflowState] += 1;
        return counts;
      },
      {
        drafting: 0,
        tailoring: 0,
        ready: 0,
      },
    );

    return {
      averageScore,
      readyCount,
      needsAttentionCount,
      topWorkspaceTasks,
      workflowCounts,
    };
  }, [resumeReports, resumes]);

  const createResume = async ({
    starter = "guided",
    onboarding = null,
  }: {
    starter?: DashboardStarter;
    onboarding?: DashboardOnboarding;
  } = {}) => {
    setBusy(true);

    try {
      const created = await getJson<ResumeDocument>(
        await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "未命名简历",
            starter,
            writerProfile,
          }),
        }),
      );

      const nextPath = onboarding
        ? `/studio/${created.meta.id}?onboarding=${onboarding}`
        : `/studio/${created.meta.id}`;

      startTransition(() => router.push(nextPath));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建简历失败。");
      setBusy(false);
    }
  };

  const duplicateResume = async (resume: ResumeDashboardSummary) => {
    setActionKey(`duplicate:${resume.meta.id}`);

    try {
      const duplicated = await getJson<ResumeDocument>(
        await fetch(`/api/resumes/${resume.meta.id}/duplicate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `${resume.meta.title} 副本` }),
        }),
      );

      startTransition(() => router.push(`/studio/${duplicated.meta.id}`));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "复制简历失败。");
      setActionKey(null);
    }
  };

  const deleteResume = async (resume: ResumeDashboardSummary) => {
    const confirmed = window.confirm(
      `确认删除“${resume.meta.title}”吗？这会移除 data/resumes/${resume.meta.id} 下的本地简历文件。`,
    );
    if (!confirmed) return;

    setActionKey(`delete:${resume.meta.id}`);

    try {
      const response = await fetch(`/api/resumes/${resume.meta.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "删除简历失败。");
      }

      setStatus(`已删除：${resume.meta.title}`);
      startTransition(() => router.refresh());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除简历失败。");
      setActionKey(null);
    }
  };

  return (
    <main className="app-shell dashboard-shell">
      <div className="grain" />
      <div className="dashboard-glow dashboard-glow-left" />
      <div className="dashboard-glow dashboard-glow-right" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="dashboard-hero">
          <div className="hero-copy">
            <span className="dash-kicker">Resume Studio / Resume-first writing desk</span>
            <h1 className="hero-title">把经历写成招聘方愿意继续看的简历。</h1>
            <p className="hero-lead">
              这套项目现在只围绕“写简历”组织能力：从空白稿起笔、导入旧 PDF
              重构、为目标岗位定制版本，再直接预览与导出。
            </p>

            <div className="hero-actions">
              <button
                className="action-button"
                type="button"
                onClick={() => void createResume({ starter: "guided" })}
                disabled={busy}
              >
                <Sparkles size={18} />
                创建引导草稿
              </button>
              <a className="ghost-button" href="#resume-library">
                <FileStack size={16} />
                查看简历库
              </a>
            </div>

            <div className="hero-stats">
              <span className="pill">{resumes.length} 份简历草稿</span>
              <span className="pill">{overview.sectionTotal} 个章节</span>
              <span className="pill">{overview.keywordTotal} 个岗位关键词</span>
            </div>

            {overview.latestUpdatedAt ? (
              <p className="meta-note">
                最近一次修改于 {new Date(overview.latestUpdatedAt).toLocaleString("zh-CN")}
              </p>
            ) : (
              <p className="meta-note">当前还没有任何简历草稿，可以先创建一份主简历。</p>
            )}
          </div>

          <aside className="hero-sheet">
            <div className="stack">
              <div>
                <span className="pill w-fit">新建起稿</span>
                <h2 className="section-heading mt-4">选择你的第一条起稿路径</h2>
                <p className="meta-note mt-2">
                  给简历命名后会直接进入 Studio。可以从引导草稿开始写，也可以先导入旧材料。
                </p>
              </div>

              <div>
                <label className="field-label">简历名称</label>
                <input
                  className="text-field"
                  placeholder="例如：前端工程师 / 产品经理 / 英文版简历"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div className="stack">
                <label className="field-label">写作档案</label>
                <div className="workflow-state-grid">
                  {writerProfileOptions.map((profile) => {
                    const meta = resumeWriterProfileMeta[profile];
                    const active = profile === writerProfile;
                    return (
                      <button
                        key={profile}
                        type="button"
                        className="workflow-state-card"
                        data-active={active}
                        onClick={() => setWriterProfile(profile)}
                      >
                        <strong>{meta.label}</strong>
                        <span className="meta-note">{meta.description}</span>
                        <span className="pill">{active ? "当前档案" : "使用该档案"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="stack">
                <button
                  className="action-button w-full"
                  type="button"
                  onClick={() => void createResume({ starter: "guided" })}
                  disabled={busy}
                >
                  {busy ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {busy ? "正在创建…" : "从引导草稿开始"}
                </button>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    className="ghost-button w-full"
                    type="button"
                    onClick={() => void createResume({ starter: "blank", onboarding: "portfolio" })}
                    disabled={busy}
                  >
                    <FileUp size={16} />
                    从 portfolio 起稿
                  </button>
                  <button
                    className="ghost-button w-full"
                    type="button"
                    onClick={() => void createResume({ starter: "blank", onboarding: "pdf" })}
                    disabled={busy}
                  >
                    <FileArchive size={16} />
                    导入旧 PDF
                  </button>
                </div>
              </div>
              <p className="meta-note">{status}</p>
            </div>

            <div className="sheet-divider" />

            <div className="stack">
              <div>
                <span className="pill w-fit">写作路径</span>
              </div>
              {[
                ...resumeWriterProfileMeta[writerProfile].workflowSteps,
                "如果你已有材料，也可以直接导入旧 PDF 或 portfolio 内容。",
                "复制出公司或岗位定制版，逐份优化措辞和排序。",
                "预览版式、检查诊断结果，再导出 PDF。",
              ].map((step, index) => (
                <div key={step} className="workflow-step">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </aside>
        </header>

        <section className="dashboard-grid" id="resume-library">
          <article className="panel rounded-[32px] p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileStack className="text-[var(--accent)]" />
                <div>
                  <h2 className="section-heading">简历库</h2>
                  <p className="meta-note">
                    所有草稿都保存在 <code>data/resumes</code>，适合管理主简历、岗位定制版和语言版本。
                  </p>
                </div>
              </div>

              <div className="w-full max-w-sm">
                <label className="field-label">搜索简历</label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
                    size={16}
                  />
                  <input
                    className="text-field pl-11"
                    placeholder="按标题、岗位、公司、地点或 id 搜索"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              <span className="pill">{resumes.length} 份总草稿</span>
              <span className="pill">{filteredResumes.length} 份当前可见</span>
            </div>

            <div className="stack">
              {filteredResumes.length > 0 ? (
                filteredResumes.map((resume) => {
                  const duplicateBusy = actionKey === `duplicate:${resume.meta.id}`;
                  const deleteBusy = actionKey === `delete:${resume.meta.id}`;
                  const report = resumeReports.get(resume.meta.id);
                  const nextTaskFocus = getResumeWorkbenchTaskFocusTarget(report?.openTasks[0] ?? null);
                  const studioHref = nextTaskFocus
                    ? `/studio/${resume.meta.id}?focus=${nextTaskFocus}`
                    : `/studio/${resume.meta.id}`;

                  return (
                    <article key={resume.meta.id} className="resume-card">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-2xl font-semibold tracking-[-0.04em]">
                            {resume.meta.title}
                          </h3>
                          <p className="meta-note">
                            {resume.basics.name || "未命名候选人"}
                            {resume.basics.headline ? ` · ${resume.basics.headline}` : ""}
                          </p>
                          <p className="meta-note">
                            {resume.targeting.role || resume.targeting.company
                              ? `当前定位：${[resume.targeting.role, resume.targeting.company]
                                  .filter(Boolean)
                                  .join(" / ")}`
                              : "当前还没有设置目标岗位，可在 Studio 中补充。"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {report ? (
                            <>
                              <span className="pill">{report.score} 分</span>
                              <span className="pill">{report.workflow.currentLabel}</span>
                              <span className="pill">{report.readinessLabel}</span>
                            </>
                          ) : null}
                          <span className="pill">
                            {resumeWriterProfileMeta[resume.meta.writerProfile].shortLabel}
                          </span>
                          <span className="pill">{resume.sections.length} 个章节</span>
                          {resume.basics.location ? (
                            <span className="pill">{resume.basics.location}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm leading-7 text-[var(--ink-soft)]">
                        <span>ID：{resume.meta.id}</span>
                        <span>
                          最后更新：{new Date(resume.meta.updatedAt).toLocaleString("zh-CN")}
                        </span>
                        {resume.targeting.focusKeywords.length > 0 ? (
                          <span>
                            关键词：{resume.targeting.focusKeywords.slice(0, 4).join(" / ")}
                            {resume.targeting.focusKeywords.length > 4 ? "…" : ""}
                          </span>
                        ) : (
                          <span>关键词：尚未填写</span>
                        )}
                        {report?.openTasks[0] ? (
                          <span>下一步：{report.openTasks[0].title}</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link className="action-button" href={studioHref}>
                          <FileSearch size={14} />
                          {report?.openTasks[0] ? "继续下一步" : "进入工作台"}
                        </Link>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => void duplicateResume(resume)}
                          disabled={!!actionKey}
                        >
                          {duplicateBusy ? (
                            <LoaderCircle className="animate-spin" size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                          {duplicateBusy ? "正在复制…" : "复制成定制版"}
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => void deleteResume(resume)}
                          disabled={!!actionKey}
                        >
                          {deleteBusy ? (
                            <LoaderCircle className="animate-spin" size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          {deleteBusy ? "正在删除…" : "删除"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="editor-card">
                  <p className="text-base leading-7 text-[var(--ink-soft)]">
                    {resumes.length > 0
                      ? "换一个关键词试试，或者直接打开某份已有简历继续改写。"
                      : "你还没有任何草稿。先创建一份主简历，或者打开默认主简历开始写。"}
                  </p>
                </div>
              )}
            </div>
          </article>

          <aside className="flex flex-col gap-6">
            <section className="panel rounded-[32px] p-8">
              <div className="mb-6 flex items-center gap-3">
                <Target className="text-[var(--accent)]" />
                <div>
                  <h2 className="section-heading">工作台状态</h2>
                  <p className="meta-note">用完成度和下一步动作来管理整套简历工作流。</p>
                </div>
              </div>

              <div className="workbench-stat-grid">
                <article className="workbench-stat-card">
                  <span className="meta-note">平均完成度</span>
                  <strong>{workspaceOverview.averageScore}</strong>
                </article>
                <article className="workbench-stat-card">
                  <span className="meta-note">接近可导出</span>
                  <strong>{workspaceOverview.readyCount}</strong>
                </article>
                <article className="workbench-stat-card">
                  <span className="meta-note">需要优先处理</span>
                  <strong>{workspaceOverview.needsAttentionCount}</strong>
                </article>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(resumeWorkflowStateMeta).map(([state, meta]) => (
                  <article key={state} className="workbench-stat-card">
                    <span className="meta-note">{meta.label}</span>
                    <strong>
                      {
                        workspaceOverview.workflowCounts[
                          state as keyof typeof workspaceOverview.workflowCounts
                        ]
                      }
                    </strong>
                    <p className="meta-note">{meta.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 stack">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">全局下一步</p>
                {workspaceOverview.topWorkspaceTasks.length > 0 ? (
                  workspaceOverview.topWorkspaceTasks.map((task) => (
                    <div key={task.title} className="workbench-task">
                      <strong>{task.title}</strong>
                      <span className="meta-note">{task.count} 份简历都还缺这一步</span>
                    </div>
                  ))
                ) : (
                  <p className="meta-note">当前所有简历都已经走完主要工作流。</p>
                )}
              </div>
            </section>

            <section className="panel rounded-[32px] p-8">
              <div className="mb-6 flex items-center gap-3">
                <FileUp className="text-[var(--accent)]" />
                <div>
                  <h2 className="section-heading">写作工作流</h2>
                  <p className="meta-note">现在这套项目只围绕写简历这一件事组织能力。</p>
                </div>
              </div>

              <div className="stack text-sm leading-7 text-[var(--ink-soft)]">
                <div className="workflow-step">
                  <span>01</span>
                  <p>引导起稿：先用结构化提示写出基础信息、摘要、经历与项目。</p>
                </div>
                <div className="workflow-step">
                  <span>02</span>
                  <p>内容重建：用 portfolio 或 PDF 导入已有材料，转成可编辑结构。</p>
                </div>
                <div className="workflow-step">
                  <span>03</span>
                  <p>岗位定制：补充目标岗位、公司、JD 摘要与 focus keywords。</p>
                </div>
                <div className="workflow-step">
                  <span>04</span>
                  <p>预览导出：检查版式与布局提示，确认无误后导出 PDF。</p>
                </div>
              </div>
            </section>

            <section className="panel rounded-[32px] p-8">
              <div className="mb-6 flex items-center gap-3">
                <FileSearch className="text-[var(--accent)]" />
                <div>
                  <h2 className="section-heading">工作台能力</h2>
                  <p className="meta-note">不是泛用文档编辑器，而是完整的简历写作工作台。</p>
                </div>
              </div>

              <div className="stack text-sm leading-7 text-[var(--ink-soft)]">
                <p>统一管理主简历、岗位定制版和语言版本。</p>
                <p>把起稿、导入、岗位定制、模板选择、导出放在同一套流程里。</p>
                <p>直接看到每份简历的完成度、风险和下一步动作，而不是只看文件列表。</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
