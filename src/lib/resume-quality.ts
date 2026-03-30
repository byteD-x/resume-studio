import type { ResumeDocument, ResumeWriterProfile } from "@/types/resume";
import { stripHtml } from "@/lib/utils";

export type ResumeQualityTarget = "basics" | "summary" | "content" | "targeting" | "export";

export interface ResumeDiagnostic {
  id: string;
  severity: "info" | "warning" | "blocker";
  target: ResumeQualityTarget;
  message: string;
  suggestion: string;
}

export interface ResumeQualityReport {
  blockingIssues: ResumeDiagnostic[];
  warnings: ResumeDiagnostic[];
  suggestions: ResumeDiagnostic[];
  issues: ResumeDiagnostic[];
  stats: {
    contactCount: number;
    summaryLength: number;
    visibleSections: number;
    totalBullets: number;
    weakBulletCount: number;
    resultBulletCount: number;
    hasExperience: boolean;
    hasProjects: boolean;
  };
}

export interface ResumeExportChecklistItem {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  required: boolean;
  target: ResumeQualityTarget;
}

const weakBulletPattern = /^(负责|参与|协助|支持|配合|跟进|了解|熟悉|helped|worked on|responsible for)\b/i;
const resultSignalPattern =
  /\d|提升|增长|降低|减少|节省|缩短|覆盖|达成|转化|营收|效率|留存|满意度|上线|交付|reduced|increased|improved|launched|shipped|saved|grew|cut\b/i;

const qualityThresholds: Record<
  ResumeWriterProfile,
  {
    summaryMinLength: number;
    minimumBullets: number;
    coreContentLabel: string;
  }
> = {
  campus: {
    summaryMinLength: 30,
    minimumBullets: 3,
    coreContentLabel: "至少保留一段实习 / 校园经历或一段项目经历",
  },
  experienced: {
    summaryMinLength: 40,
    minimumBullets: 4,
    coreContentLabel: "至少保留一段工作经历",
  },
  "career-switch": {
    summaryMinLength: 40,
    minimumBullets: 4,
    coreContentLabel: "至少保留一段相关经历或转岗证明项目",
  },
};

function buildCoreContentIssue(
  writerProfile: ResumeWriterProfile,
): Pick<ResumeDiagnostic, "message" | "suggestion"> {
  if (writerProfile === "campus") {
    return {
      message: "请补充一段经历或项目。",
      suggestion: "补充相关内容。",
    };
  }

  if (writerProfile === "career-switch") {
    return {
      message: "请补充相关经历或项目。",
      suggestion: "补充相关内容。",
    };
  }

  return {
    message: "请补充工作经历。",
    suggestion: "补充工作经历。",
  };
}

function buildDiagnostics(document: ResumeDocument) {
  const writerProfile = document.meta.writerProfile;
  const thresholds = qualityThresholds[writerProfile];
  const visibleSections = document.sections.filter((section) => section.visible);
  const summaryLength = stripHtml(document.basics.summaryHtml).length;
  const totalBullets = document.sections.reduce(
    (sum, section) =>
      sum + section.items.reduce((itemSum, item) => itemSum + item.bulletPoints.length, 0),
    0,
  );
  const allBullets = document.sections.flatMap((section) =>
    section.items.flatMap((item) => item.bulletPoints.map((bullet) => bullet.trim()).filter(Boolean)),
  );
  const weakBulletCount = allBullets.filter((bullet) => weakBulletPattern.test(bullet)).length;
  const resultBulletCount = allBullets.filter((bullet) => resultSignalPattern.test(bullet)).length;
  const contactCount = [
    document.basics.email,
    document.basics.phone,
    document.basics.website,
    ...document.basics.links.map((link) => link.url),
  ].filter((value) => value.trim().length > 0).length;
  const hasExperience = document.sections.some(
    (section) => section.type === "experience" && section.items.length > 0,
  );
  const hasProjects = document.sections.some(
    (section) => section.type === "projects" && section.items.length > 0,
  );
  const issues: ResumeDiagnostic[] = [];

  if (!document.basics.name.trim() || !document.basics.headline.trim()) {
    issues.push({
      id: "missing-header",
      severity: "blocker",
      target: "basics",
      message: "请填写姓名和职位。",
      suggestion: "补全基本信息。",
    });
  }

  if (contactCount < 2) {
    issues.push({
      id: "weak-contact",
      severity: "blocker",
      target: "basics",
      message: "请补充联系方式。",
      suggestion: "至少填写两项。",
    });
  }

  if (summaryLength < thresholds.summaryMinLength) {
    issues.push({
      id: "short-summary",
      severity: "blocker",
      target: "summary",
      message: "请补充自我介绍。",
      suggestion: "写清方向和经验。",
    });
  }

  const lacksCoreContent =
    writerProfile === "experienced"
      ? !hasExperience
      : !hasExperience && !hasProjects;
  if (lacksCoreContent) {
    const issue = buildCoreContentIssue(writerProfile);
    issues.push({
      id: "missing-core-content",
      severity: "blocker",
      target: "content",
      ...issue,
    });
  }

  if (totalBullets < thresholds.minimumBullets) {
    issues.push({
      id: "few-bullets",
      severity: "warning",
      target: "content",
      message: "要点偏少。",
      suggestion: `至少补充 ${thresholds.minimumBullets} 条。`,
    });
  }

  if (weakBulletCount >= 2) {
    issues.push({
      id: "weak-bullets",
      severity: "warning",
      target: "content",
      message: "部分要点不够具体。",
      suggestion: "补充动作和结果。",
    });
  }

  if (allBullets.length > 0 && resultBulletCount === 0) {
    issues.push({
      id: "missing-results",
      severity: "warning",
      target: "content",
      message: "结果不够明确。",
      suggestion: "补充数字或结果。",
    });
  }

  if (summaryLength > 320) {
    issues.push({
      id: "long-summary",
      severity: "warning",
      target: "export",
      message: "自我介绍偏长。",
      suggestion: "控制在 2 到 3 句。",
    });
  }

  if (visibleSections.length > 5) {
    issues.push({
      id: "many-sections",
      severity: "warning",
      target: "export",
      message: "模块偏多。",
      suggestion: "只保留必要内容。",
    });
  }

  if (totalBullets > 22) {
    issues.push({
      id: "many-bullets",
      severity: "warning",
      target: "export",
      message: "要点偏多。",
      suggestion: "删掉重复内容。",
    });
  }

  if (!document.basics.links.length) {
    issues.push({
      id: "missing-links",
      severity: "info",
      target: "basics",
      message: "还没有附加链接。",
      suggestion: "如有作品集可补充。",
    });
  }

  if (document.layout.marginsMm <= 10) {
    issues.push({
      id: "tight-margins",
      severity: "info",
      target: "export",
      message: "页边距较小。",
      suggestion: "必要时调大页边距。",
    });
  }

  return {
    issues,
    stats: {
      contactCount,
      summaryLength,
      visibleSections: visibleSections.length,
      totalBullets,
      weakBulletCount,
      resultBulletCount,
      hasExperience,
      hasProjects,
    },
    thresholds,
  };
}

export function buildResumeQualityReport(document: ResumeDocument): ResumeQualityReport {
  const { issues, stats } = buildDiagnostics(document);

  return {
    blockingIssues: issues.filter((issue) => issue.severity === "blocker"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    suggestions: issues.filter((issue) => issue.severity === "info"),
    issues,
    stats,
  };
}

export function analyzeResumeDocument(document: ResumeDocument) {
  return buildResumeQualityReport(document).issues;
}

export function buildResumeExportChecklist(
  document: ResumeDocument,
  report = buildResumeQualityReport(document),
): ResumeExportChecklistItem[] {
  const thresholds = qualityThresholds[document.meta.writerProfile];
  const hasTargetingInputs =
    !!document.targeting.role.trim() && document.targeting.focusKeywords.length > 0;

  return [
    {
      id: "header",
      title: "姓名和职位",
      detail: "填写姓名和职位。",
      done: !report.blockingIssues.some((item) => item.id === "missing-header"),
      required: true,
      target: "basics",
    },
    {
      id: "contact",
      title: "联系方式",
      detail: "至少填写两项。",
      done: !report.blockingIssues.some((item) => item.id === "weak-contact"),
      required: true,
      target: "basics",
    },
    {
      id: "summary",
      title: "自我介绍",
      detail: `至少 ${thresholds.summaryMinLength} 个字。`,
      done: !report.blockingIssues.some((item) => item.id === "short-summary"),
      required: true,
      target: "summary",
    },
    {
      id: "core-content",
      title: "核心经历",
      detail: thresholds.coreContentLabel,
      done: !report.blockingIssues.some((item) => item.id === "missing-core-content"),
      required: true,
      target: "content",
    },
    {
      id: "bullets",
      title: "结果要点",
      detail: `至少 ${thresholds.minimumBullets} 条。`,
      done: !report.warnings.some((item) => item.id === "few-bullets"),
      required: false,
      target: "content",
    },
    {
      id: "layout",
      title: "版式",
      detail:
        report.warnings.filter((item) => item.target === "export").length === 0
          ? "可直接导出。"
          : "导出前检查篇幅。",
      done: report.warnings.filter((item) => item.target === "export").length === 0,
      required: true,
      target: "export",
    },
    {
      id: "targeting",
      title: "岗位信息",
      detail: "补充岗位和关键词。",
      done: hasTargetingInputs,
      required: false,
      target: "targeting",
    },
  ];
}
