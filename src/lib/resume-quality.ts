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
      message: "当前缺少能支撑简历的实习 / 校园经历或项目经历。",
      suggestion: "至少补一段实习、校园经历或项目经历，再进入导出阶段。",
    };
  }

  if (writerProfile === "career-switch") {
    return {
      message: "当前缺少能证明转岗方向的相关经历或项目。",
      suggestion: "先补一段可迁移经历，或新增一段转岗证明项目。",
    };
  }

  return {
    message: "当前缺少能支撑简历可信度的工作经历。",
    suggestion: "至少补一段工作经历，再进入导出阶段。",
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
      message: "页眉信息不完整，姓名和职位标题至少需要填写。",
      suggestion: "先补齐姓名和职位标题，再继续写作或导出。",
    });
  }

  if (contactCount < 2) {
    issues.push({
      id: "weak-contact",
      severity: "blocker",
      target: "basics",
      message: "联系方式不足，当前少于两种可用联系方式或链接。",
      suggestion: "至少补充两种联系方式，例如邮箱、手机号、作品集或社交链接。",
    });
  }

  if (summaryLength < thresholds.summaryMinLength) {
    issues.push({
      id: "short-summary",
      severity: "blocker",
      target: "summary",
      message: "职业摘要还不够成形，当前信息不足以快速说明你的方向和价值。",
      suggestion: "用 2 到 3 句话写清楚方向、核心能力和代表性结果。",
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
      message: "结果型要点偏少，当前内容还不足以支撑一份成熟简历。",
      suggestion: `建议至少补到 ${thresholds.minimumBullets} 条结果型 bullet，优先写最核心经历。`,
    });
  }

  if (weakBulletCount >= 2) {
    issues.push({
      id: "weak-bullets",
      severity: "warning",
      target: "content",
      message: "存在多条弱表达要点，像“负责 / 参与 / 协助”这类表述很难形成说服力。",
      suggestion: "把弱表达改成“动作 + 场景 + 做法 + 结果”的结果型句式。",
    });
  }

  if (allBullets.length > 0 && resultBulletCount === 0) {
    issues.push({
      id: "missing-results",
      severity: "warning",
      target: "content",
      message: "当前要点里几乎没有结果信号，招聘方可能只能看到“做过”，看不到“做成了什么”。",
      suggestion: "优先为最关键的 1 到 2 段经历补上数字、规模、效率或业务结果。",
    });
  }

  if (summaryLength > 320) {
    issues.push({
      id: "long-summary",
      severity: "warning",
      target: "export",
      message: "职业摘要偏长，可能把核心经历挤到第一页以下。",
      suggestion: "把摘要收敛到 2 到 3 句话，保留方向、能力和结果即可。",
    });
  }

  if (visibleSections.length > 5) {
    issues.push({
      id: "many-sections",
      severity: "warning",
      target: "export",
      message: "可见章节超过 5 个时，单页简历通常会更难收住。",
      suggestion: "优先合并弱相关章节，保留最能支撑岗位匹配度的内容。",
    });
  }

  if (totalBullets > 22) {
    issues.push({
      id: "many-bullets",
      severity: "warning",
      target: "export",
      message: "要点数量偏多，建议精简 bullet，避免 PDF 过于拥挤。",
      suggestion: "删除重复或弱相关要点，只保留最强的结果和难题案例。",
    });
  }

  if (!document.basics.links.length) {
    issues.push({
      id: "missing-links",
      severity: "info",
      target: "basics",
      message: "页眉里还没有作品集或社交链接。",
      suggestion: "如果你有作品集、GitHub 或领英，建议至少补一个。",
    });
  }

  if (document.layout.marginsMm <= 10) {
    issues.push({
      id: "tight-margins",
      severity: "info",
      target: "export",
      message: "页边距较小虽然更省空间，但也更容易让 PDF 显得拥挤。",
      suggestion: "如果最终导出看起来过挤，优先回到 12 到 16mm 的页边距。",
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
      title: "页眉信息完整",
      detail: "姓名和职位标题会直接决定这份简历在第一眼是否可识别。",
      done: !report.blockingIssues.some((item) => item.id === "missing-header"),
      required: true,
      target: "basics",
    },
    {
      id: "contact",
      title: "联系方式足够",
      detail: "建议至少保留两种联系方式或链接，避免导出后无法快速联系到你。",
      done: !report.blockingIssues.some((item) => item.id === "weak-contact"),
      required: true,
      target: "basics",
    },
    {
      id: "summary",
      title: "职业摘要已成形",
      detail: `当前写作档案至少需要 ${thresholds.summaryMinLength} 个字符，才能让招聘方快速理解你的方向。`,
      done: !report.blockingIssues.some((item) => item.id === "short-summary"),
      required: true,
      target: "summary",
    },
    {
      id: "core-content",
      title: "核心内容可支撑简历",
      detail: thresholds.coreContentLabel,
      done: !report.blockingIssues.some((item) => item.id === "missing-core-content"),
      required: true,
      target: "content",
    },
    {
      id: "bullets",
      title: "结果型要点已补足",
      detail: `建议至少保留 ${thresholds.minimumBullets} 条结果型 bullet，优先覆盖最关键的经历。`,
      done: !report.warnings.some((item) => item.id === "few-bullets"),
      required: false,
      target: "content",
    },
    {
      id: "layout",
      title: "版式检查通过",
      detail:
        report.warnings.filter((item) => item.target === "export").length === 0
          ? "当前没有明显版式风险，可以进入导出。"
          : "先处理布局或篇幅风险，避免导出后出现过长、过挤或结构失衡。",
      done: report.warnings.filter((item) => item.target === "export").length === 0,
      required: true,
      target: "export",
    },
    {
      id: "targeting",
      title: "岗位定制信息已补充",
      detail: "如果这是岗位定制版，建议补齐目标岗位和关键词后再导出。",
      done: hasTargetingInputs,
      required: false,
      target: "targeting",
    },
  ];
}
