import { getResumeTemplateLayoutPreset } from "@/lib/resume-document";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import { editorSectionDefinitions, getEditorSection } from "@/lib/resume-editor";
import type { TailoredVariantPlan } from "@/lib/resume-tailoring";
import type { ResumeDocument } from "@/types/resume";
import type {
  EditorPanel,
  EditorPanelGroup,
  EditorPanelItem,
} from "@/components/product/editor/ResumeEditorSidebar";
import { hasMeaningfulItemContent, stripHtmlToText } from "@/components/product/editor/workspace/shared";
import type { ResumeEditorSectionPanel } from "@/components/product/editor/workspace/types";

const editorPanelGroupDefinitions = [
  {
    key: "foundation",
    label: "核心信息",
    description: "先补姓名、定位和岗位信息。",
    panels: ["basics", "targeting"] as const,
  },
  {
    key: "content",
    label: "简历内容",
    description: "集中整理经历、项目和技能。",
    panels: ["experience", "projects", "education", "skills"] as const,
  },
  {
    key: "advanced",
    label: "版式工具",
    description: "调整版式，处理 AI 与 Markdown。",
    panels: ["design", "ai", "markdown"] as const,
  },
] satisfies Array<{
  key: string;
  label: string;
  description: string;
  panels: readonly EditorPanel[];
}>;

function deriveBasicsStatus(document: ResumeDocument): EditorPanelItem["status"] {
  const contacts = [document.basics.email, document.basics.phone, document.basics.website].filter((item) =>
    item.trim(),
  ).length;
  const summary = stripHtmlToText(document.basics.summaryHtml);

  if (!document.basics.name.trim() && !document.basics.headline.trim() && !summary) {
    return "empty";
  }

  if (document.basics.name.trim() && document.basics.headline.trim() && contacts >= 2 && summary.length >= 24) {
    return "ready";
  }

  return "in_progress";
}

function deriveTargetingStatus(
  document: ResumeDocument,
  targetingAnalysis: ReturnType<typeof analyzeResumeTargeting>,
): EditorPanelItem["status"] {
  if (
    !document.targeting.role.trim() &&
    !document.targeting.company.trim() &&
    document.targeting.focusKeywords.length === 0 &&
    !document.targeting.jobDescription.trim()
  ) {
    return "empty";
  }

  if (document.targeting.role.trim() && targetingAnalysis.evaluatedKeywords.length >= 2) {
    return "ready";
  }

  return "in_progress";
}

function deriveAiStatus(
  document: ResumeDocument,
  targetingAnalysis: ReturnType<typeof analyzeResumeTargeting>,
  tailoredPlan: TailoredVariantPlan,
): EditorPanelItem["status"] {
  if (
    document.ai.provider === "local" &&
    !document.ai.model.trim() &&
    !document.ai.baseUrl.trim() &&
    !targetingAnalysis.active
  ) {
    return "empty";
  }

  if (tailoredPlan.canGenerate || targetingAnalysis.coveragePercent !== null) {
    return "ready";
  }

  return "in_progress";
}

function deriveMarkdownStatus(markdownDraft: string): EditorPanelItem["status"] {
  const trimmed = markdownDraft.trim();
  if (!trimmed) {
    return "empty";
  }

  return trimmed.length >= 180 ? "ready" : "in_progress";
}

function deriveDesignStatus(document: ResumeDocument): EditorPanelItem["status"] {
  const preset = getResumeTemplateLayoutPreset(document.meta.template);
  const layoutChanged = JSON.stringify(document.layout) !== JSON.stringify(preset);
  const customCssEnabled = document.layout.customCss.trim().length > 0;
  const photoEnabled = document.basics.photoVisible && document.basics.photoUrl.trim().length > 0;

  if (!layoutChanged && !photoEnabled && !customCssEnabled) {
    return "empty";
  }

  return "ready";
}

export function buildSidebarItems(
  document: ResumeDocument,
  markdownDraft: string,
  targetingAnalysis: ReturnType<typeof analyzeResumeTargeting>,
  tailoredPlan: TailoredVariantPlan,
): EditorPanelItem[] {
  return [
    {
      key: "basics",
      label: "基本信息",
      hint: "姓名、定位、链接",
      status: deriveBasicsStatus(document),
    },
    ...editorSectionDefinitions.map((definition) => {
      const section = getEditorSection(document, definition.type);
      const items = section?.items ?? [];
      const count = items.length;
      const meaningfulCount = items.filter(hasMeaningfulItemContent).length;

      return {
        key: definition.type as EditorPanel,
        label: definition.title,
        hint: definition.description,
        status: count === 0 ? "empty" : meaningfulCount === count ? "ready" : "in_progress",
        countLabel: count > 0 ? `${count} 项` : undefined,
      } satisfies EditorPanelItem;
    }),
    {
      key: "design",
      label: "版式与外观",
      hint: "模板、字体、间距、颜色",
      status: deriveDesignStatus(document),
    },
    {
      key: "targeting",
      label: "岗位信息",
      hint: "岗位、关键词、JD",
      status: deriveTargetingStatus(document, targetingAnalysis),
    },
    {
      key: "ai",
      label: "AI",
      hint: "摘要、分析、定制版",
      status: deriveAiStatus(document, targetingAnalysis, tailoredPlan),
    },
    {
      key: "markdown",
      label: "Markdown",
      hint: "直接编辑源码",
      status: deriveMarkdownStatus(markdownDraft),
      countLabel: markdownDraft.trim() ? `${markdownDraft.split("\n").length} 行` : undefined,
    },
  ];
}

export function buildSidebarGroups(items: EditorPanelItem[]): EditorPanelGroup[] {
  const itemMap = new Map(items.map((item) => [item.key, item] as const));

  return editorPanelGroupDefinitions.map((group) => ({
    key: group.key,
    label: group.label,
    description: group.description,
    items: group.panels
      .map((panel) => itemMap.get(panel))
      .filter((item): item is EditorPanelItem => Boolean(item)),
  }));
}

export function isSectionPanel(panel: EditorPanel): panel is ResumeEditorSectionPanel {
  return editorSectionDefinitions.some((definition) => definition.type === panel);
}

export function resolveInitialEditorPanel(focus: string | null): EditorPanel {
  switch (focus) {
    case "design":
      return "design";
    case "ai":
      return "ai";
    case "targeting":
      return "targeting";
    case "content":
      return "experience";
    default:
      return "basics";
  }
}
