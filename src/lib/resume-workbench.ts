import type { ResumeDocument, ResumeWorkflowState } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";
import {
  buildResumeQualityReport,
  type ResumeDiagnostic,
  type ResumeQualityReport,
} from "@/lib/resume-analysis";
import type { ResumeTargetingAnalysis } from "@/lib/resume-targeting";
import { stripHtml } from "@/lib/utils";

type ResumeWorkbenchSource = Pick<
  ResumeDocument,
  "meta" | "basics" | "targeting" | "layout" | "sections"
>;

type WorkbenchAreaId = "basics" | "content" | "targeting" | "export";

export const resumeWorkflowStateMeta: Record<
  ResumeWorkflowState,
  { label: string; description: string }
> = {
  drafting: {
    label: "起稿中",
    description: "先补齐基础信息、摘要和核心经历，建立主简历骨架。",
  },
  tailoring: {
    label: "定制中",
    description: "已经进入岗位定制阶段，正在补充 JD、关键词和版本差异。",
  },
  ready: {
    label: "待导出",
    description: "内容和版式已经接近成稿，可以进入最终检查与导出。",
  },
};

export type ResumeWorkbenchTaskAction =
  | {
      type: "focus-basics";
      label: string;
    }
  | {
      type: "focus-summary";
      label: string;
    }
  | {
      type: "focus-targeting";
      label: string;
    }
  | {
      type: "focus-export";
      label: string;
    }
  | {
      type: "ensure-experience";
      label: string;
    }
  | {
      type: "ensure-bullet";
      label: string;
    }
  | {
      type: "apply-suggested-keywords";
      label: string;
    }
  | {
      type: "set-workflow";
      label: string;
      workflowState: ResumeWorkflowState;
    };

export interface ResumeWorkbenchTask {
  id: string;
  title: string;
  detail: string;
  area: WorkbenchAreaId;
  status: "todo" | "warning";
  action: ResumeWorkbenchTaskAction;
}

export interface ResumeWorkbenchAreaScore {
  id: WorkbenchAreaId;
  label: string;
  score: number;
  note: string;
}

export interface ResumeWorkbenchReport {
  score: number;
  readiness: "starting" | "building" | "ready";
  readinessLabel: string;
  workflow: {
    currentState: ResumeWorkflowState;
    currentLabel: string;
    currentDescription: string;
    suggestedState: ResumeWorkflowState;
    suggestedLabel: string;
    suggestedDescription: string;
  };
  areaScores: ResumeWorkbenchAreaScore[];
  openTasks: ResumeWorkbenchTask[];
  stats: {
    visibleSections: number;
    totalItems: number;
    totalBullets: number;
    keywords: number;
    links: number;
  };
}

function toPercent(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function buildAreaScore(
  id: WorkbenchAreaId,
  label: string,
  completed: number,
  total: number,
  note: string,
) {
  return {
    id,
    label,
    score: toPercent(completed, total),
    note,
  } satisfies ResumeWorkbenchAreaScore;
}

function resolveSuggestedWorkflowState(params: {
  score: number;
  warningCount: number;
  hasTargetingInput: boolean;
  hasRole: boolean;
  hasKeywordIntent: boolean;
}) {
  const {
    score,
    warningCount,
    hasTargetingInput,
    hasRole,
    hasKeywordIntent,
  } = params;

  if (score >= 82 && warningCount === 0 && hasRole && hasKeywordIntent) {
    return "ready" satisfies ResumeWorkflowState;
  }

  if (hasTargetingInput || score >= 50) {
    return "tailoring" satisfies ResumeWorkflowState;
  }

  return "drafting" satisfies ResumeWorkflowState;
}

export function getResumeWorkbenchTaskFocusTarget(task?: ResumeWorkbenchTask | null) {
  if (!task) return null;

  switch (task.action.type) {
    case "focus-basics":
      return "basics";
    case "focus-summary":
      return "summary";
    case "focus-targeting":
    case "apply-suggested-keywords":
      return "targeting";
    case "focus-export":
      return "export";
    case "ensure-experience":
    case "ensure-bullet":
      return "content";
    case "set-workflow":
      return null;
    default:
      return null;
  }
}

export function buildResumeWorkbenchReport(
  source: ResumeWorkbenchSource | ResumeDashboardSummary,
  options: {
    diagnostics?: ResumeDiagnostic[];
    qualityReport?: ResumeQualityReport;
    targetingAnalysis?: ResumeTargetingAnalysis;
  } = {},
): ResumeWorkbenchReport {
  const qualityReport = options.qualityReport ?? buildResumeQualityReport(source as ResumeDocument);
  const visibleSections = source.sections.filter((section) => section.visible);
  const totalItems = source.sections.reduce((sum, section) => sum + section.items.length, 0);
  const totalBullets = source.sections.reduce(
    (sum, section) =>
      sum + section.items.reduce((itemSum, item) => itemSum + item.bulletPoints.length, 0),
    0,
  );
  const summaryText = stripHtml(source.basics.summaryHtml).trim();
  const contactCount = [
    source.basics.email,
    source.basics.phone,
    source.basics.website,
    source.basics.location,
  ].filter(Boolean).length;
  const hasExperience = source.sections.some(
    (section) => section.type === "experience" && section.items.length > 0,
  );
  const hasProjectOrSkills = source.sections.some(
    (section) =>
      (section.type === "projects" || section.type === "skills") &&
      (section.items.length > 0 || stripHtml(section.contentHtml).trim().length > 0),
  );
  const targetingAnalysis = options.targetingAnalysis;
  const matchedKeywords = targetingAnalysis?.matchedKeywords.length ?? 0;
  const evaluatedKeywords = targetingAnalysis?.evaluatedKeywords.length ?? source.targeting.focusKeywords.length;
  const suggestedKeywordCount = targetingAnalysis?.suggestedKeywords.length ?? 0;
  const diagnostics = options.diagnostics ?? qualityReport.issues;
  const warningCount = qualityReport.warnings.length + qualityReport.blockingIssues.length;
  const summaryMinLength = source.meta.writerProfile === "campus" ? 30 : 40;
  const minimumBullets = source.meta.writerProfile === "campus" ? 3 : 4;
  const hasCoreContent =
    source.meta.writerProfile === "experienced"
      ? hasExperience
      : hasExperience || hasProjectOrSkills;

  const areaScores = [
    buildAreaScore(
      "basics",
      "基础信息",
      [
        !!source.basics.name.trim(),
        !!source.basics.headline.trim(),
        summaryText.length >= summaryMinLength,
        contactCount >= 2,
        source.basics.links.length > 0,
      ].filter(Boolean).length,
      5,
      "页眉、联系方式和职业摘要是否完整。",
    ),
    buildAreaScore(
      "content",
      "内容证据",
      [
        visibleSections.length >= 3,
        totalItems >= 3,
        totalBullets >= minimumBullets,
        hasCoreContent,
        hasProjectOrSkills,
      ].filter(Boolean).length,
      5,
      "经历、项目和结果型要点是否足够支撑一份完整简历。",
    ),
    buildAreaScore(
      "targeting",
      "岗位定制",
      [
        !!source.targeting.role.trim(),
        !!source.targeting.company.trim() || !!source.targeting.postingUrl.trim(),
        source.targeting.focusKeywords.length > 0,
        !!source.targeting.jobDescription.trim() || !!source.targeting.notes.trim(),
        evaluatedKeywords > 0 ? matchedKeywords > 0 : false,
      ].filter(Boolean).length,
      5,
      "目标岗位、关键词和 JD 输入是否足够支撑岗位定制。",
    ),
    buildAreaScore(
      "export",
      "导出准备",
      [
        source.meta.template.length > 0,
        visibleSections.length > 0 && visibleSections.length <= 5,
        totalBullets > 0 && totalBullets <= 22,
        summaryText.length > 0 && summaryText.length <= 320,
        warningCount === 0,
      ].filter(Boolean).length,
      5,
      "版式、篇幅和诊断风险是否适合最终导出。",
    ),
  ];
  const score = Math.round(
    areaScores.reduce(
      (sum, areaScore, index) =>
        sum + areaScore.score * [0.26, 0.34, 0.22, 0.18][index],
      0,
    ),
  );

  const openTasks: ResumeWorkbenchTask[] = [];
  const currentWorkflowState = source.meta.workflowState;

  if (!source.basics.name.trim() || !source.basics.headline.trim()) {
    openTasks.push({
      id: "complete-header",
      title: "补齐页眉信息",
      detail: "先填写姓名和职位标题，避免导出的简历缺少最基础的识别信息。",
      area: "basics",
      status: "todo",
      action: {
        type: "focus-basics",
        label: "定位到基础信息",
      },
    });
  }

  if (summaryText.length < 40) {
    openTasks.push({
      id: "write-summary",
      title: "补写职业摘要",
      detail: "用 2 到 3 句话概括方向、核心能力和代表性结果。",
      area: "basics",
      status: "todo",
      action: {
        type: "focus-summary",
        label: "定位到职业摘要",
      },
    });
  }

  if (!hasCoreContent) {
    openTasks.push({
      id: "add-experience",
      title:
        source.meta.writerProfile === "campus"
          ? "补充实习 / 项目经历"
          : source.meta.writerProfile === "career-switch"
            ? "补充相关经历或转岗项目"
            : "添加工作经历",
      detail:
        source.meta.writerProfile === "campus"
          ? "至少补一段实习、校园经历或项目经历，否则简历很难形成可信度。"
          : source.meta.writerProfile === "career-switch"
            ? "至少补一段相关经历或转岗证明项目，避免转岗叙事停留在口头层面。"
            : "至少补一段工作经历，否则简历很难形成可信度。",
      area: "content",
      status: "todo",
      action: {
        type: "ensure-experience",
        label:
          source.meta.writerProfile === "experienced"
            ? "添加或定位工作经历"
            : "添加或定位相关内容",
      },
    });
  }

  if (totalBullets < minimumBullets) {
    openTasks.push({
      id: "add-bullets",
      title: "补充结果型要点",
      detail: "当前结果型 bullet 偏少，建议给核心经历补上指标、规模或影响。",
      area: "content",
      status: "todo",
      action: {
        type: "ensure-bullet",
        label: "补第一条结果要点",
      },
    });
  }

  if (!source.targeting.role.trim()) {
    openTasks.push({
      id: "set-role",
      title: "填写目标岗位",
      detail: "写清楚当前这版简历面向什么岗位，工作台才能开始做定制分析。",
      area: "targeting",
      status: "todo",
      action: {
        type: "focus-targeting",
        label: "定位到岗位定制",
      },
    });
  }

  if (source.targeting.focusKeywords.length === 0 && !source.targeting.jobDescription.trim()) {
    openTasks.push({
      id: "set-keywords",
      title: "补充关键词或 JD",
      detail: "至少填写一组 focus keywords，或粘贴 JD，让匹配分析和定制版生成可用。",
      area: "targeting",
      status: "todo",
      action:
        suggestedKeywordCount > 0
          ? {
              type: "apply-suggested-keywords",
              label: "应用建议关键词",
            }
          : {
              type: "focus-targeting",
              label: "定位到岗位定制",
            },
    });
  }

  diagnostics
    .filter((item) => item.severity === "warning" || item.severity === "blocker")
    .slice(0, 2)
    .forEach((item) => {
      openTasks.push({
        id: `diagnostic-${item.id}`,
        title: item.target === "content" ? "处理内容风险" : "处理版式风险",
        detail: item.message,
        area: item.target === "content" ? "content" : "export",
        status: item.severity === "blocker" ? "todo" : "warning",
        action: {
          type: item.target === "content" ? "ensure-bullet" : "focus-export",
          label: item.target === "content" ? "定位到内容编辑" : "查看布局提示",
        },
      });
    });

  const readiness =
    score >= 82 ? "ready" : score >= 50 ? "building" : "starting";
  const readinessLabel =
    readiness === "ready" ? "接近可导出" : readiness === "building" ? "仍在完善" : "需要起稿";
  const suggestedWorkflowState = resolveSuggestedWorkflowState({
    score,
    warningCount,
    hasTargetingInput: [
      source.targeting.role,
      source.targeting.company,
      source.targeting.postingUrl,
      source.targeting.jobDescription,
      source.targeting.notes,
    ].some((value) => value.trim().length > 0),
    hasRole: source.targeting.role.trim().length > 0,
    hasKeywordIntent:
      source.targeting.focusKeywords.length > 0 ||
      source.targeting.jobDescription.trim().length > 0,
  });

  if (currentWorkflowState !== suggestedWorkflowState) {
    openTasks.push({
      id: `workflow-${suggestedWorkflowState}`,
      title: `切换到“${resumeWorkflowStateMeta[suggestedWorkflowState].label}”`,
      detail: `当前内容更适合标记为${resumeWorkflowStateMeta[suggestedWorkflowState].label}，方便你在简历库里按阶段推进。`,
      area: suggestedWorkflowState === "ready" ? "export" : "targeting",
      status: "todo",
      action: {
        type: "set-workflow",
        label: "应用推荐状态",
        workflowState: suggestedWorkflowState,
      },
    });
  }

  return {
    score,
    readiness,
    readinessLabel,
    workflow: {
      currentState: currentWorkflowState,
      currentLabel: resumeWorkflowStateMeta[currentWorkflowState].label,
      currentDescription: resumeWorkflowStateMeta[currentWorkflowState].description,
      suggestedState: suggestedWorkflowState,
      suggestedLabel: resumeWorkflowStateMeta[suggestedWorkflowState].label,
      suggestedDescription: resumeWorkflowStateMeta[suggestedWorkflowState].description,
    },
    areaScores,
    openTasks,
    stats: {
      visibleSections: visibleSections.length,
      totalItems,
      totalBullets,
      keywords: source.targeting.focusKeywords.length,
      links: source.basics.links.length,
    },
  };
}
