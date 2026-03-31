"use client";

import { RotateCcw } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, type ReactNode, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ResumeSectionEditor } from "@/components/product/ResumeSectionEditor";
import { ResumeBasicsPanel } from "@/components/product/editor/ResumeBasicsPanel";
import { ResumeDesignPanel } from "@/components/product/editor/ResumeDesignPanel";
import { ResumeAiPanel } from "@/components/product/editor/ResumeAiPanel";
import { EditorShortcutDialog } from "@/components/product/editor/EditorShortcutDialog";
import {
  ResumeEditorSidebar,
  type EditorPanel,
  type EditorPanelGroup,
  type EditorPanelItem,
} from "@/components/product/editor/ResumeEditorSidebar";
import { ResumeEditorToolbar } from "@/components/product/editor/ResumeEditorToolbar";
import { ResumeMarkdownPanel } from "@/components/product/editor/ResumeMarkdownPanel";
import { ResumePreviewPanel } from "@/components/product/editor/ResumePreviewPanel";
import { ResumeTargetingPanel } from "@/components/product/editor/ResumeTargetingPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getTemplateFamily } from "@/data/template-catalog";
import { readClientAiConfig, writeClientAiConfig } from "@/lib/client-ai-config";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import { createEmptyResumeDocument, getResumeTemplateLayoutPreset } from "@/lib/resume-document";
import { useEditorHistory } from "@/lib/editor-history";
import { isModKey, isTextEntryTarget } from "@/lib/editor-input";
import {
  createEditorItem,
  duplicateEditorItem,
  editorSectionDefinitions,
  ensureEditorDocument,
  getEditorSection,
  moveItem,
  sectionItemToPlainText,
  tagsToList,
} from "@/lib/resume-editor";
import { parseResumeFromMarkdown, serializeResumeToMarkdown } from "@/lib/resume-markdown";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { enhancedResumeAiPresets } from "@/lib/resume-ai";
import {
  buildResumeImportReviewTasks,
  getActiveImportFieldSuggestions,
  getActiveImportSnapshots,
  getActivePendingReviewItems,
  getActiveUnmappedItems,
} from "@/lib/resume-import-review";
import { buildResumeQualityReport } from "@/lib/resume-quality";
import { buildTailoredVariantPlan, type TailoredVariantPlan } from "@/lib/resume-tailoring";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import { buildResumeWorkbenchReport, type ResumeWorkbenchTask } from "@/lib/resume-workbench";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type {
  ResumeDocument,
  ResumeImportFieldSuggestion,
  ResumeSectionItem,
} from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type FormPanel = Exclude<EditorPanel, "markdown">;
type SectionPanel = (typeof editorSectionDefinitions)[number]["type"];
type WorkbenchAreaId = "basics" | "content" | "targeting" | "export";
type ImportReviewKind = "pdf" | "portfolio";
type BasicsTextField = "name" | "headline" | "location" | "website" | "email" | "phone" | "summaryHtml" | "links";

interface ResumeEditorSnapshot {
  document: ResumeDocument;
  markdownDraft: string;
}

interface RecentDeletion {
  sectionType: SectionPanel;
  sectionTitle: string;
  item: ResumeSectionItem;
  index: number;
}

interface PendingEditorConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
  onConfirm: () => void | Promise<void>;
}

interface EditorOnboardingState {
  title: string;
  description: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
  actions: Array<{
    label: string;
    target: "basics" | "content" | "targeting" | "preview";
  }>;
}

async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function stripHtmlToText(value: string) {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

function textToParagraphHtml(value: string) {
  const trimmed = value.trim();
  return trimmed ? `<p>${trimmed.replace(/\n/g, "<br />")}</p>` : "";
}

function hasMeaningfulItemContent(item: ResumeSectionItem) {
  return Boolean(
    item.title.trim() ||
      item.subtitle.trim() ||
      item.location.trim() ||
      item.dateRange.trim() ||
      item.meta.trim() ||
      stripHtmlToText(item.summaryHtml) ||
      item.bulletPoints.length > 0 ||
      item.tags.length > 0,
  );
}

function validateMarkdownDraft(markdownDraft: string, document: ResumeDocument) {
  if (!markdownDraft.trim()) return null;

  try {
    parseResumeFromMarkdown(markdownDraft, {
      existingDocument: document,
      resumeId: document.meta.id,
    });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Markdown 解析失败";
  }
}

function deriveBasicsStatus(document: ResumeDocument): EditorPanelItem["status"] {
  const contacts = [document.basics.email, document.basics.phone, document.basics.website].filter((item) =>
    item.trim(),
  ).length;
  const summary = stripHtmlToText(document.basics.summaryHtml);

  if (!document.basics.name.trim() && !document.basics.headline.trim() && !summary) return "empty";
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

  if (document.targeting.role.trim() && targetingAnalysis.evaluatedKeywords.length >= 2) return "ready";
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

  if (tailoredPlan.canGenerate || targetingAnalysis.coveragePercent !== null) return "ready";
  return "in_progress";
}

function deriveMarkdownStatus(markdownDraft: string): EditorPanelItem["status"] {
  const trimmed = markdownDraft.trim();
  if (!trimmed) return "empty";
  return trimmed.length >= 180 ? "ready" : "in_progress";
}

function deriveDesignStatus(document: ResumeDocument): EditorPanelItem["status"] {
  const preset = getResumeTemplateLayoutPreset(document.meta.template);
  const layoutChanged = JSON.stringify(document.layout) !== JSON.stringify(preset);
  const customCssEnabled = document.layout.customCss.trim().length > 0;
  const photoEnabled = document.basics.photoVisible && document.basics.photoUrl.trim().length > 0;

  if (!layoutChanged && !photoEnabled && !customCssEnabled) return "empty";
  return "ready";
}

function buildSidebarItems(
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

function buildSidebarGroups(items: EditorPanelItem[]): EditorPanelGroup[] {
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

function createBlankMarkdownDocument(current: ResumeDocument) {
  const empty = createEmptyResumeDocument(current.meta.id, current.meta.title, {
    writerProfile: current.meta.writerProfile,
    template: current.meta.template,
  });

  return ensureEditorDocument({
    ...empty,
    meta: {
      ...empty.meta,
      title: current.meta.title,
    },
    basics: {
      ...empty.basics,
      summaryHtml: "",
    },
  });
}

function createMarkdownStarter(current: ResumeDocument) {
  return serializeResumeToMarkdown(createBlankMarkdownDocument(current));
}

function isSectionPanel(panel: EditorPanel): panel is SectionPanel {
  return editorSectionDefinitions.some((definition) => definition.type === panel);
}

function resolveInitialEditorPanel(focus: string | null): EditorPanel {
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

function resolveLatestImportKind(document: ResumeDocument): ImportReviewKind | null {
  const { pdfImportedAt, portfolioImportedAt } = document.importTrace;

  if (pdfImportedAt && portfolioImportedAt) {
    return portfolioImportedAt > pdfImportedAt ? "portfolio" : "pdf";
  }

  if (portfolioImportedAt) return "portfolio";
  if (pdfImportedAt) return "pdf";
  return null;
}

function resolveImportSourcePath(document: ResumeDocument) {
  return document.meta.sourceRefs.find((entry) => /[\\/]/.test(entry)) ?? null;
}

function resolveImportStatusMessage(kind: ImportReviewKind) {
  if (kind === "pdf") {
    return "先核对 PDF 导入结果。";
  }

  return "先核对作品集导入结果。";
}

function mergeLayoutForTemplateSwitch(document: ResumeDocument, template: ResumeDocument["meta"]["template"]) {
  const currentPreset = getResumeTemplateLayoutPreset(document.meta.template);
  const nextPreset = getResumeTemplateLayoutPreset(template);
  const mergedLayout: ResumeDocument["layout"] = {
    ...nextPreset,
  };

  for (const key of Object.keys(nextPreset) as Array<keyof ResumeDocument["layout"]>) {
    if (key === "customCss") {
      mergedLayout.customCss = document.layout.customCss;
      continue;
    }

    if (document.layout[key] !== currentPreset[key]) {
      mergedLayout[key] = document.layout[key] as never;
    }
  }

  return mergedLayout;
}

function buildImportReview(document: ResumeDocument) {
  const kind = resolveLatestImportKind(document);
  if (!kind) return null;
  const pendingItems = getActivePendingReviewItems(document);
  const snapshots = getActiveImportSnapshots(document);
  const fieldSuggestions = getActiveImportFieldSuggestions(document);
  const unmappedItems = getActiveUnmappedItems(document);
  const basicsCount = [
    document.basics.name,
    document.basics.headline,
    document.basics.email,
    document.basics.phone,
    document.basics.website,
  ].filter((value) => value.trim()).length;
  const experienceCount = document.sections
    .filter((section) => section.type === "experience")
    .reduce((sum, section) => sum + section.items.length, 0);
  const projectCount = document.sections
    .filter((section) => section.type === "projects")
    .reduce((sum, section) => sum + section.items.length, 0);
  const educationCount = document.sections
    .filter((section) => section.type === "education")
    .reduce((sum, section) => sum + section.items.length, 0);
  const skillsCount = document.sections
    .filter((section) => section.type === "skills")
    .reduce((sum, section) => sum + section.items.length, 0);
  const reviewTasks = buildResumeImportReviewTasks(document);
  const remainingCount =
    pendingItems.length +
    reviewTasks.length +
    snapshots.length +
    fieldSuggestions.length +
    unmappedItems.length;

  return {
    kind,
    title: kind === "pdf" ? "PDF 导入已完成" : "作品集导入已完成",
    description:
      kind === "pdf"
        ? "先核对抬头、章节归类和待办项。"
        : "先核对基础信息、经历映射和待办项。",
    primaryActionLabel: "核对基础信息",
    secondaryActionLabel: "核对内容",
    pendingItems,
    pendingItemsPreview: pendingItems.slice(0, 3),
    pendingItemCount: pendingItems.length,
    reviewTaskCount: reviewTasks.length,
    snapshotCount: snapshots.length,
    fieldSuggestionCount: fieldSuggestions.length,
    unmappedItemCount: unmappedItems.length,
    remainingCount,
    sourcePath: kind === "portfolio" ? resolveImportSourcePath(document) : null,
    mappedStats: [
      { label: "基础信息", value: basicsCount },
      { label: "工作经历", value: experienceCount },
      { label: "项目经历", value: projectCount },
      { label: "教育 / 技能", value: educationCount + skillsCount },
    ],
    reviewTasks,
    fieldSuggestions: fieldSuggestions.slice(0, 3),
    snapshots: snapshots.slice(0, 3),
    unmappedItems: unmappedItems.slice(0, 3),
  };
}

function resolveInitialStatusMessage(document: ResumeDocument, focus: string | null, onboarding: string | null) {
  const importedKind = resolveLatestImportKind(document);
  if (importedKind) {
    return resolveImportStatusMessage(importedKind);
  }

  if (onboarding === "pdf") {
    return "先核对 PDF 导入结果。";
  }

  if (onboarding === "portfolio") {
    return "先核对作品集导入结果。";
  }

  if (onboarding === "template") {
    return "先把模板示例替换成你的真实信息。";
  }

  if (onboarding === "guided") {
    return "先补齐基础信息，再逐步添加内容。";
  }

  if (focus === "summary") {
    return "先补摘要。";
  }

  if (focus === "targeting") {
    return "先定岗位和关键词。";
  }

  if (focus === "design") {
    return "先调整版式和外观。";
  }

  if (focus === "ai") {
    return "先看 AI 分析和定制版计划。";
  }

  if (focus === "content") {
    return "先补经历和结果。";
  }

  return hasResumeRenderableContent(document) ? "继续编辑" : "开始填写";
}

function detectStarterKind(document: ResumeDocument) {
  if (document.meta.sourceRefs.includes("starter:template-sample")) return "template";
  if (document.meta.sourceRefs.includes("starter:guided")) return "guided";
  return null;
}

function buildEditorOnboardingState(
  document: ResumeDocument,
  onboarding: string | null,
  report: ReturnType<typeof buildResumeWorkbenchReport>,
  hasImportReview: boolean,
) {
  if (hasImportReview || onboarding === "pdf" || onboarding === "portfolio") return null;

  const starter = onboarding === "template" || onboarding === "guided" ? onboarding : detectStarterKind(document);
  const shouldGuideBlankDraft =
    !starter && !hasResumeRenderableContent(document) && report.readiness === "starting";

  if (!starter && !shouldGuideBlankDraft) return null;

  if (starter === "template") {
    return {
      title: "先把模板示例改成你的真实经历",
      description: "这份草稿已经带有示例内容。建议先替换抬头与摘要，再改工作经历，最后补岗位定向信息。",
      steps: [
        {
          title: "替换抬头与摘要",
          description: "先改姓名、定位和个人摘要，避免示例信息继续残留。",
        },
        {
          title: "替换经历与项目",
          description: "把模板示例逐段替换成你自己的经历、项目与结果。",
        },
        {
          title: "补岗位定向",
          description: "写清目标岗位、关键词和 JD，再去预览页检查导出。",
        },
      ],
      actions: [
        { label: "先改基础信息", target: "basics" },
        { label: "继续改经历", target: "content" },
        { label: "补岗位定向", target: "targeting" },
      ],
    } satisfies EditorOnboardingState;
  }

  if (starter === "guided" || shouldGuideBlankDraft) {
    return {
      title: "先完成第一版主稿",
      description: "现在最重要的是先形成一份可读主稿，不必一开始就处理全部设置或所有高级功能。",
      steps: [
        {
          title: "补齐基础信息",
          description: "先写姓名、定位、联系方式和一段摘要。",
        },
        {
          title: "添加核心经历",
          description: "至少补一段工作经历或项目经历，并写出结果要点。",
        },
        {
          title: "确认后再导出",
          description: "补岗位信息后去预览页检查，再决定是否导出 PDF。",
        },
      ],
      actions: [
        { label: "填写基础信息", target: "basics" },
        { label: "添加经历内容", target: "content" },
        { label: "打开预览清单", target: "preview" },
      ],
    } satisfies EditorOnboardingState;
  }

  return null;
}

function resolveWorkbenchAreaFromPanel(panel: EditorPanel): WorkbenchAreaId {
  if (panel === "targeting" || panel === "ai") return "targeting";
  if (panel === "design" || panel === "markdown") return "export";
  if (panel === "basics") return "basics";
  return "content";
}

export function ResumeEditorPage({
  initialDocument,
  lineage,
}: {
  initialDocument: ResumeDocument;
  lineage: ResumeLineageMeta | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");
  const onboardingParam = searchParams.get("onboarding");
  const seededDocument = ensureEditorDocument(initialDocument);
  const seededMarkdown = serializeResumeToMarkdown(seededDocument);
  const initialPanel = resolveInitialEditorPanel(focusParam);
  const seededStatusMessage = resolveInitialStatusMessage(seededDocument, focusParam, onboardingParam);
  const [document, setDocument] = useState(seededDocument);
  const [activePanel, setActivePanel] = useState<EditorPanel>(initialPanel);
  const [activeSectionItemId, setActiveSectionItemId] = useState<string | null>(null);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [statusMessage, setStatusMessage] = useState(seededStatusMessage);
  const [markdownDraft, setMarkdownDraft] = useState(seededMarkdown);
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [recentDeletion, setRecentDeletion] = useState<RecentDeletion | null>(null);
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [generatedAiSummarySuggestions, setGeneratedAiSummarySuggestions] = useState<ResumeAssistSuggestion[]>([]);
  const [clientAiApiKey, setClientAiApiKey] = useState("");
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<PendingEditorConfirmation | null>(null);
  const latestDocumentRef = useRef(seededDocument);
  const latestMarkdownRef = useRef(seededMarkdown);
  const latestMarkdownErrorRef = useRef<string | null>(null);
  const lastSavedRef = useRef(JSON.stringify(seededDocument));
  const lastFormPanelRef = useRef<FormPanel>(initialPanel === "markdown" ? "basics" : initialPanel);
  const editorSurfaceRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const deferredDocument = useDeferredValue(document);
  const editorMode = activePanel === "markdown" ? "markdown" : "form";
  const history = useEditorHistory<ResumeEditorSnapshot>(120);

  const createSnapshot = () => ({
    document: latestDocumentRef.current,
    markdownDraft: latestMarkdownRef.current,
  });

  const markdownStarter = useMemo(() => createMarkdownStarter(document), [document]);
  const importReview = useMemo(() => buildImportReview(document), [document]);
  const targetingAnalysis = useMemo(() => analyzeResumeTargeting(document), [document]);
  const tailoredVariantPlan = useMemo(() => buildTailoredVariantPlan(document), [document]);
  const qualityReport = useMemo(() => buildResumeQualityReport(document), [document]);
  const workbenchReport = useMemo(
    () =>
      buildResumeWorkbenchReport(document, {
        qualityReport,
        targetingAnalysis,
      }),
    [document, qualityReport, targetingAnalysis],
  );
  const sidebarItems = useMemo(
    () => buildSidebarItems(document, markdownDraft, targetingAnalysis, tailoredVariantPlan),
    [document, markdownDraft, targetingAnalysis, tailoredVariantPlan],
  );
  const sidebarGroups = useMemo(() => buildSidebarGroups(sidebarItems), [sidebarItems]);
  const panelMetaMap = useMemo(() => new Map(sidebarItems.map((item) => [item.key, item] as const)), [sidebarItems]);
  const activePanelMeta = panelMetaMap.get(activePanel) ?? sidebarItems[0];
  const activePanelGroup =
    sidebarGroups.find((group) => group.items.some((item) => item.key === activePanel)) ?? sidebarGroups[0];
  const highlightedDiagnostics = useMemo(
    () => [...qualityReport.blockingIssues, ...qualityReport.warnings].slice(0, 3),
    [qualityReport],
  );
  const activeWorkbenchArea = resolveWorkbenchAreaFromPanel(activePanel);
  const editorOnboarding = useMemo(
    () => buildEditorOnboardingState(document, onboardingParam, workbenchReport, Boolean(importReview)),
    [document, onboardingParam, workbenchReport, importReview],
  );

  const syncClientAiConfig = useEffectEvent(() => {
    const config = readClientAiConfig();
    setClientAiApiKey(config.apiKey);

    const currentAi = latestDocumentRef.current.ai;
    if (
      currentAi.provider !== config.provider ||
      currentAi.model !== config.model ||
      currentAi.baseUrl !== config.baseUrl
    ) {
      updateDocument(
        (current) => ({
          ...current,
          ai: {
            ...current.ai,
            provider: config.provider,
            model: config.model,
            baseUrl: config.baseUrl,
          },
        }),
        {
          historyLabel: "同步本地 AI 配置",
          clearDeletion: true,
        },
      );
    }
  });

  useEffect(() => {
    syncClientAiConfig();
  }, []);

  const previewHtml = useMemo(
    () =>
      buildResumePreviewHtml(deferredDocument, {
        highlightedTarget:
          activePanel === "basics" || activePanel === "targeting"
            ? activePanel
            : activePanel === "markdown" || activePanel === "ai" || activePanel === "design"
              ? undefined
              : { sectionType: activePanel },
      }),
    [activePanel, deferredDocument],
  );

  const activeSection = useMemo(
    () => (isSectionPanel(activePanel) ? getEditorSection(document, activePanel) : null),
    [activePanel, document],
  );

  const setEditorState = (
    next: {
      document: ResumeDocument;
      markdownDraft: string;
      markdownError?: string | null;
    },
    options?: {
      message?: string;
      historyLabel?: string;
      saveState?: SaveState;
      clearDeletion?: boolean;
    },
  ) => {
    if (options?.historyLabel) {
      history.record(createSnapshot(), options.historyLabel);
    }

    const normalized = ensureEditorDocument(next.document);
    const nextError =
      next.markdownError === undefined ? validateMarkdownDraft(next.markdownDraft, normalized) : next.markdownError;

    latestDocumentRef.current = normalized;
    latestMarkdownRef.current = next.markdownDraft;
    latestMarkdownErrorRef.current = nextError;

    startTransition(() => {
      setDocument(normalized);
      setMarkdownDraft(next.markdownDraft);
      setMarkdownError(nextError);
    });

    setSaveState(nextError ? "error" : (options?.saveState ?? "dirty"));
    if (options?.message) setStatusMessage(options.message);
    if (options?.clearDeletion) setRecentDeletion(null);
  };

  const applyHistoryEntry = (snapshot: ResumeEditorSnapshot, direction: "undo" | "redo", label?: string) => {
    const nextError = validateMarkdownDraft(snapshot.markdownDraft, snapshot.document);
    latestDocumentRef.current = snapshot.document;
    latestMarkdownRef.current = snapshot.markdownDraft;
    latestMarkdownErrorRef.current = nextError;
    startTransition(() => {
      setDocument(snapshot.document);
      setMarkdownDraft(snapshot.markdownDraft);
      setMarkdownError(nextError);
    });
    setSaveState(nextError ? "error" : "dirty");
    setRecentDeletion(null);
    setStatusMessage(
      `${direction === "undo" ? "已撤销" : "已重做"}${label ? `：${label}` : ""}`,
    );
  };

  const updateDocument = (
    updater: (current: ResumeDocument) => ResumeDocument,
    options?: {
      message?: string;
      historyLabel?: string;
      clearDeletion?: boolean;
    },
  ) => {
    const nextDocument = ensureEditorDocument(updater(latestDocumentRef.current));
    setEditorState(
      {
        document: nextDocument,
        markdownDraft: serializeResumeToMarkdown(nextDocument),
        markdownError: null,
      },
      options,
    );
  };

  const insertSectionItem = (
    sectionType: SectionPanel,
    options: {
      afterItemId?: string;
      duplicateFrom?: ResumeSectionItem;
    } = {},
  ) => {
    const nextItem = options.duplicateFrom ? duplicateEditorItem(options.duplicateFrom) : createEditorItem(sectionType);
    const definition = editorSectionDefinitions.find((item) => item.type === sectionType);
    if (!definition) return;

    updateDocument(
      (current) => ({
        ...current,
        sections: current.sections.map((section) => {
          if (section.type !== sectionType) return section;
          const items = [...section.items];
          const insertIndex =
            options.afterItemId != null
              ? Math.max(
                  0,
                  section.items.findIndex((item) => item.id === options.afterItemId) + 1,
                )
              : items.length;
          items.splice(insertIndex, 0, nextItem);
          return { ...section, items };
        }),
      }),
      {
        message: options.duplicateFrom ? `已复制${definition.title}` : `已添加${definition.title}`,
        historyLabel: options.duplicateFrom ? `克隆${definition.title}` : `新增${definition.title}`,
        clearDeletion: true,
      },
    );

    setFocusItemId(nextItem.id);
    setActiveSectionItemId(nextItem.id);
  };

  const moveSectionItem = (sectionType: SectionPanel, itemId: string, direction: "up" | "down") => {
    const definition = editorSectionDefinitions.find((item) => item.type === sectionType);
    const section = getEditorSection(latestDocumentRef.current, sectionType);
    if (!definition || !section) return;

    const index = section.items.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    updateDocument(
      (current) => ({
        ...current,
        sections: current.sections.map((currentSection) =>
          currentSection.type === sectionType
            ? {
                ...currentSection,
                items: moveItem(currentSection.items, index, direction),
              }
            : currentSection,
        ),
      }),
      {
        message: direction === "up" ? "已上移" : "已下移",
        historyLabel: `${direction === "up" ? "上移" : "下移"}${definition.title}`,
        clearDeletion: true,
      },
    );

    setFocusItemId(itemId);
    setActiveSectionItemId(itemId);
  };

  const restoreDeletedItem = () => {
    if (!recentDeletion) return;

    updateDocument(
      (current) => ({
        ...current,
        sections: current.sections.map((section) => {
          if (section.type !== recentDeletion.sectionType) return section;
          const items = [...section.items];
          items.splice(Math.min(recentDeletion.index, items.length), 0, recentDeletion.item);
          return { ...section, items };
        }),
      }),
      {
        message: "已恢复",
        historyLabel: `恢复删除的${recentDeletion.sectionTitle}`,
        clearDeletion: true,
      },
    );

    setFocusItemId(recentDeletion.item.id);
    setActiveSectionItemId(recentDeletion.item.id);
    setRecentDeletion(null);
  };

  const navigateBack = (fallbackPath: Route) => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackPath);
  };

  const removeSectionItem = (sectionType: SectionPanel, itemId: string) => {
    const definition = editorSectionDefinitions.find((item) => item.type === sectionType);
    const section = getEditorSection(latestDocumentRef.current, sectionType);
    if (!definition || !section) return;

    const index = section.items.findIndex((item) => item.id === itemId);
    if (index === -1) return;
    const target = section.items[index];
    const nextFocus = section.items[index + 1]?.id ?? section.items[index - 1]?.id ?? null;

    updateDocument(
      (current) => ({
        ...current,
        sections: current.sections.map((currentSection) =>
          currentSection.type === sectionType
            ? {
                ...currentSection,
                items: currentSection.items.filter((item) => item.id !== itemId),
              }
            : currentSection,
        ),
      }),
      {
        message: "已删除",
        historyLabel: `删除${definition.title}`,
        clearDeletion: false,
      },
    );

    setRecentDeletion({
      sectionType,
      sectionTitle: definition.title,
      item: target,
      index,
    });
    setFocusItemId(nextFocus);
    setActiveSectionItemId(nextFocus);
  };

  const deleteSectionItem = (sectionType: SectionPanel, itemId: string) => {
    const definition = editorSectionDefinitions.find((item) => item.type === sectionType);
    const section = getEditorSection(latestDocumentRef.current, sectionType);
    if (!definition || !section) return;

    const index = section.items.findIndex((item) => item.id === itemId);
    if (index === -1) return;
    const target = section.items[index];

    if (!hasMeaningfulItemContent(target)) {
      removeSectionItem(sectionType, itemId);
      return;
    }

    setConfirmation({
      title: `删除“${target.title || definition.title}”？`,
      description: "删除后会从当前章节移除这条内容，但你仍可以通过撤销或“恢复”立即找回。",
      confirmLabel: "删除条目",
      confirmVariant: "danger",
      onConfirm: () => {
        setConfirmation(null);
        removeSectionItem(sectionType, itemId);
      },
    });
  };

  const copySectionItem = async (sectionType: SectionPanel, itemId: string) => {
    const section = getEditorSection(latestDocumentRef.current, sectionType);
    const item = section?.items.find((current) => current.id === itemId);
    if (!item) return;

    try {
      await navigator.clipboard.writeText(sectionItemToPlainText(item));
      setStatusMessage("已复制");
    } catch {
      setStatusMessage("复制失败");
    }
  };

  const applyMarkdownDraft = (value: string, message: string) => {
    history.record(createSnapshot(), "编辑 Markdown");

    if (value.trim().length === 0) {
      const blank = createBlankMarkdownDocument(latestDocumentRef.current);
      latestDocumentRef.current = blank;
      latestMarkdownRef.current = value;
      latestMarkdownErrorRef.current = null;
      startTransition(() => {
        setDocument(blank);
        setMarkdownDraft(value);
        setMarkdownError(null);
      });
      setSaveState("dirty");
      setRecentDeletion(null);
      setStatusMessage(message);
      return;
    }

    try {
      const parsed = ensureEditorDocument(
        parseResumeFromMarkdown(value, {
          existingDocument: latestDocumentRef.current,
          resumeId: latestDocumentRef.current.meta.id,
        }),
      );
      parsed.meta.title = latestDocumentRef.current.meta.title;
      latestDocumentRef.current = parsed;
      latestMarkdownRef.current = value;
      latestMarkdownErrorRef.current = null;
      startTransition(() => {
        setDocument(parsed);
        setMarkdownDraft(value);
        setMarkdownError(null);
      });
      setSaveState("dirty");
      setRecentDeletion(null);
      setStatusMessage(message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Markdown 解析失败";
      latestMarkdownRef.current = value;
      latestMarkdownErrorRef.current = errorMessage;
      setMarkdownDraft(value);
      setMarkdownError(errorMessage);
      setSaveState("error");
      setStatusMessage("Markdown 有误");
    }
  };

  const updateResumeTitle = (value: string) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          title: value || "未命名简历",
        },
      }),
      {
        historyLabel: "修改简历标题",
        clearDeletion: true,
      },
    );
  };

  const updateBasicsField = (field: BasicsTextField, value: string) => {
    updateDocument(
      (current) => {
        if (field === "summaryHtml") {
          return {
            ...current,
            basics: {
              ...current.basics,
              summaryHtml: textToParagraphHtml(value),
            },
          };
        }

        if (field === "links") {
          return {
            ...current,
            basics: {
              ...current.basics,
              links: value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [label, ...rest] = line.split(" ");
                  return {
                    label,
                    url: rest.join(" ") || label,
                  };
                }),
            },
          };
        }

        return {
          ...current,
          basics: {
            ...current.basics,
            [field]: value,
          },
        };
      },
      {
        historyLabel: "修改基本信息",
        clearDeletion: true,
      },
    );
  };

  const updateTargetingField = (field: keyof ResumeDocument["targeting"], value: string) => {
    updateDocument(
      (current) => ({
        ...current,
        targeting: {
          ...current.targeting,
          [field]: field === "focusKeywords" ? tagsToList(value) : value,
        },
      }),
      {
        historyLabel: "修改岗位定向",
        clearDeletion: true,
      },
    );
  };

  const updateLayoutField = <K extends keyof ResumeDocument["layout"]>(
    field: K,
    value: ResumeDocument["layout"][K],
  ) => {
    updateDocument(
      (current) => ({
        ...current,
        layout: {
          ...current.layout,
          [field]: value,
        },
      }),
      {
        historyLabel: "修改版式设置",
        clearDeletion: true,
      },
    );
  };

  const updateTemplate = (template: ResumeDocument["meta"]["template"]) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          template,
        },
        layout: mergeLayoutForTemplateSwitch(current, template),
      }),
      {
        historyLabel: "切换简历模板",
        clearDeletion: true,
      },
    );
  };

  const applyStylePreset = (presetId: "balanced" | "compact" | "editorial") => {
    updateDocument(
      (current) => {
        const preset =
          presetId === "compact"
            ? {
                marginsMm: 11,
                lineHeight: 1.33,
                paragraphGapMm: 2.2,
                bodyFontSizePt: 9.2,
                sectionTitleSizePt: 10.4,
                itemTitleSizePt: 10.2,
                metaFontSizePt: 8.6,
                nameSizePt: 22,
                headlineSizePt: 10.2,
                sectionGapMm: 4.3,
                itemGapMm: 3.2,
                columnGapMm: getTemplateFamily(current.meta.template) === "two-column" ? 7 : 0,
                listGapMm: 0.45,
                sectionTitleStyle: "minimal" as const,
                sectionTitleAlign: "left" as const,
                pageShadowVisible: true,
                showSectionDividers: false,
              }
            : presetId === "editorial"
              ? {
                  marginsMm: 16,
                  lineHeight: 1.56,
                  paragraphGapMm: 3.8,
                  bodyFontSizePt: 9.9,
                  sectionTitleSizePt: 12.4,
                  itemTitleSizePt: 11.4,
                  metaFontSizePt: 9.2,
                  nameSizePt: 27,
                  headlineSizePt: 11.6,
                  sectionGapMm: 6.8,
                  itemGapMm: 4.8,
                  columnGapMm: getTemplateFamily(current.meta.template) === "two-column" ? 10 : 0,
                  listGapMm: 0.9,
                  sectionTitleStyle: "filled" as const,
                  sectionTitleAlign: "left" as const,
                  pageShadowVisible: true,
                  showSectionDividers: true,
                }
              : {
                  marginsMm: getResumeTemplateLayoutPreset(current.meta.template).marginsMm,
                  lineHeight: getResumeTemplateLayoutPreset(current.meta.template).lineHeight,
                  paragraphGapMm: getResumeTemplateLayoutPreset(current.meta.template).paragraphGapMm,
                  bodyFontSizePt: getResumeTemplateLayoutPreset(current.meta.template).bodyFontSizePt,
                  sectionTitleSizePt: getResumeTemplateLayoutPreset(current.meta.template).sectionTitleSizePt,
                  itemTitleSizePt: getResumeTemplateLayoutPreset(current.meta.template).itemTitleSizePt,
                  metaFontSizePt: getResumeTemplateLayoutPreset(current.meta.template).metaFontSizePt,
                  nameSizePt: getResumeTemplateLayoutPreset(current.meta.template).nameSizePt,
                  headlineSizePt: getResumeTemplateLayoutPreset(current.meta.template).headlineSizePt,
                  sectionGapMm: getResumeTemplateLayoutPreset(current.meta.template).sectionGapMm,
                  itemGapMm: getResumeTemplateLayoutPreset(current.meta.template).itemGapMm,
                  columnGapMm: getResumeTemplateLayoutPreset(current.meta.template).columnGapMm,
                  listGapMm: getResumeTemplateLayoutPreset(current.meta.template).listGapMm,
                  sectionTitleStyle: getResumeTemplateLayoutPreset(current.meta.template).sectionTitleStyle,
                  sectionTitleAlign: getResumeTemplateLayoutPreset(current.meta.template).sectionTitleAlign,
                  pageShadowVisible: getResumeTemplateLayoutPreset(current.meta.template).pageShadowVisible,
                  showSectionDividers: getResumeTemplateLayoutPreset(current.meta.template).showSectionDividers,
                };

        return {
          ...current,
          layout: {
            ...current.layout,
            ...preset,
          },
        };
      },
      {
        historyLabel: "套用风格预设",
        clearDeletion: true,
      },
    );
  };

  const updateBasicsVisualField = <
    K extends "photoUrl" | "photoAlt" | "photoVisible" | "photoShape" | "photoPosition" | "photoSizeMm",
  >(
    field: K,
    value: ResumeDocument["basics"][K],
  ) => {
    updateDocument(
      (current) => ({
        ...current,
        basics: {
          ...current.basics,
          [field]: value,
        },
      }),
      {
        historyLabel: "修改头像与视觉设置",
        clearDeletion: true,
      },
    );
  };

  const performSave = async (mode: "manual" | "auto") => {
    if (latestMarkdownErrorRef.current) {
      setSaveState("error");
      setStatusMessage("请先修正 Markdown");
      return false;
    }

    const serialized = JSON.stringify(latestDocumentRef.current);
    if (serialized === lastSavedRef.current) {
      setSaveState("saved");
      return true;
    }

    setSaveState("saving");

    try {
      const saved = await getJson<ResumeDocument>(
        await fetch(`/api/resumes/${latestDocumentRef.current.meta.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        }),
      );

      const normalized = ensureEditorDocument(saved);
      const nextMarkdown =
        editorMode === "markdown" ? latestMarkdownRef.current : serializeResumeToMarkdown(normalized);
      lastSavedRef.current = JSON.stringify(normalized);
      latestDocumentRef.current = normalized;
      latestMarkdownRef.current = nextMarkdown;
      latestMarkdownErrorRef.current = null;
      setDocument(normalized);
      setMarkdownDraft(nextMarkdown);
      setMarkdownError(null);
      setSaveState("saved");
      setStatusMessage(mode === "manual" ? "已保存" : "已自动保存");
      return true;
    } catch (error) {
      setSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "保存失败");
      return false;
    }
  };

  const saveDocument = (mode: "manual" | "auto") => {
    const nextSave = saveQueueRef.current.then(
      () => performSave(mode),
      () => performSave(mode),
    );
    saveQueueRef.current = nextSave.catch(() => false);
    return nextSave;
  };

  const triggerAutosave = useEffectEvent(() => {
    void saveDocument("auto");
  });

  const undoLastChange = () => {
    const entry = history.undo(createSnapshot());
    if (!entry) {
      setStatusMessage("没有更早的记录");
      return;
    }

    applyHistoryEntry(entry.snapshot, "undo", entry.label);
  };

  const redoLastChange = () => {
    const entry = history.redo(createSnapshot());
    if (!entry) {
      setStatusMessage("没有可重做的记录");
      return;
    }

    applyHistoryEntry(entry.snapshot, "redo", entry.label);
  };

  useEffect(() => {
    const serialized = JSON.stringify(document);
    if (serialized === lastSavedRef.current || latestMarkdownErrorRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      triggerAutosave();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [document]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "saved" && !markdownError) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState, markdownError]);

  async function handleOpenPreview() {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return;
    }

    const saved = await saveDocument("manual");
    if (!saved) return;
    router.push(`/studio/${latestDocumentRef.current.meta.id}/preview`);
  }

  async function handleGenerateTailoredVariant() {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return;
    }

    const plan = buildTailoredVariantPlan(latestDocumentRef.current);
    if (!plan.canGenerate) {
      setActivePanel("targeting");
      lastFormPanelRef.current = "targeting";
      setStatusMessage("先补关键词或 JD");
      return;
    }

    const saved = await saveDocument("manual");
    if (!saved) return;

    setIsGeneratingVariant(true);

    try {
      const result = await getJson<{
        document: ResumeDocument;
        plan: TailoredVariantPlan;
        remoteSummaryApplied?: boolean;
        remoteSummaryError?: string | null;
      }>(
        await fetch(`/api/resumes/${latestDocumentRef.current.meta.id}/generate-tailored-variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document: latestDocumentRef.current,
            title: plan.titleSuggestion,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setStatusMessage(
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
      setStatusMessage(error instanceof Error ? error.message : "生成定制版失败");
    } finally {
      setIsGeneratingVariant(false);
    }
  }

  async function handleBack() {
    const fallbackPath = "/";

    if (latestMarkdownErrorRef.current) {
      setConfirmation({
        title: "Markdown 还存在解析错误",
        description: "现在返回会放弃未保存的 Markdown 修改。确认后我会直接离开当前编辑页。",
        confirmLabel: "仍然返回",
        confirmVariant: "danger",
        onConfirm: () => {
          setConfirmation(null);
          navigateBack(fallbackPath);
        },
      });
      return;
    }

    const saved = await saveDocument("manual");
    if (!saved) return;

    navigateBack(fallbackPath);
  }

  const handleGlobalKeydown = useEffectEvent((event: KeyboardEvent) => {
    if (isModKey(event) && event.key === "/") {
      event.preventDefault();
      setShortcutOpen((current) => !current);
      return;
    }

    if (shortcutOpen && event.key === "Escape") {
      event.preventDefault();
      setShortcutOpen(false);
      return;
    }

    if (isModKey(event) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void saveDocument("manual");
      return;
    }

    if (isModKey(event) && event.key.toLowerCase() === "p") {
      event.preventDefault();
      void handleOpenPreview();
      return;
    }

    if (isModKey(event) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      undoLastChange();
      return;
    }

    if ((isModKey(event) && event.key.toLowerCase() === "z" && event.shiftKey) || (event.ctrlKey && event.key.toLowerCase() === "y")) {
      event.preventDefault();
      redoLastChange();
      return;
    }

    if (shortcutOpen) return;

    if (event.key === "Escape") {
      setActiveSectionItemId(null);
      setFocusItemId(null);
      setStatusMessage("已取消选择");
      return;
    }

    if (!isSectionPanel(activePanel) || !activeSection || !activeSectionItemId) return;
    if (isTextEntryTarget(event.target) && !(isModKey(event) && event.key === "Enter")) return;

    if (event.altKey && event.key === "ArrowUp") {
      event.preventDefault();
      moveSectionItem(activePanel, activeSectionItemId, "up");
      return;
    }

    if (event.altKey && event.key === "ArrowDown") {
      event.preventDefault();
      moveSectionItem(activePanel, activeSectionItemId, "down");
      return;
    }

    if (isModKey(event) && event.key === "Enter") {
      event.preventDefault();
      const currentItem = activeSection.items.find((item) => item.id === activeSectionItemId);
      insertSectionItem(activePanel, {
        afterItemId: activeSectionItemId,
        duplicateFrom: currentItem && event.shiftKey ? currentItem : undefined,
      });
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSectionItem(activePanel, activeSectionItemId);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, []);

  const focusFormPanel = (panel: FormPanel, message = "继续编辑") => {
    lastFormPanelRef.current = panel;
    setActivePanel(panel);
    setStatusMessage(message);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        editorSurfaceRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  };

  const handlePanelSelect = (panel: EditorPanel) => {
    const nextItem = panelMetaMap.get(panel);

    if (panel === "markdown") {
      setActivePanel("markdown");
      setStatusMessage(nextItem ? `已切换到${nextItem.label}` : "已切换到 Markdown");
      return;
    }

    focusFormPanel(panel, nextItem ? `正在编辑${nextItem.label}` : "继续编辑");
  };

  const handleModeChange = (mode: "form" | "markdown") => {
    if (mode === "markdown") {
      handlePanelSelect("markdown");
      return;
    }

    handlePanelSelect(lastFormPanelRef.current);
  };

  const handleFocusImportedBasics = () => {
    focusFormPanel("basics", "先核对基本信息。");
  };

  const handleFocusImportedContent = () => {
    focusFormPanel("experience", "继续整理导入内容。");
  };

  const handleFocusImportTask = (focus: "basics" | "content") => {
    if (focus === "basics") {
      handleFocusImportedBasics();
      return;
    }

    handleFocusImportedContent();
  };

  const handleResolveImportTask = (taskId: string) => {
    updateDocument(
      (current) => ({
        ...current,
        importTrace: {
          ...current.importTrace,
          reviewState: {
            ...current.importTrace.reviewState,
            completedTaskIds: Array.from(new Set([...current.importTrace.reviewState.completedTaskIds, taskId])),
          },
        },
      }),
      {
        historyLabel: "Mark import review task complete",
        clearDeletion: true,
        message: "已完成一条导入校对任务。",
      },
    );
  };

  const updateAiField = (field: keyof ResumeDocument["ai"], value: string) => {
    const nextConfig = {
      ...readClientAiConfig(),
      [field]: value,
    };
    writeClientAiConfig(nextConfig);

    updateDocument(
      (current) => ({
        ...current,
        ai: {
          ...current.ai,
          [field]: value,
        },
      }),
      {
        historyLabel: "更新 AI 设置",
        clearDeletion: true,
      },
    );
  };

  const updateAiApiKey = (value: string) => {
    setClientAiApiKey(value);
    writeClientAiConfig({
      ...readClientAiConfig(),
      provider: latestDocumentRef.current.ai.provider,
      model: latestDocumentRef.current.ai.model,
      baseUrl: latestDocumentRef.current.ai.baseUrl,
      apiKey: value,
    });
  };

  const applyAiPreset = (presetId: string) => {
    const preset = enhancedResumeAiPresets.find((item) => item.id === presetId);
    if (!preset) return;

    writeClientAiConfig({
      ...readClientAiConfig(),
      ...preset.settings,
      apiKey: clientAiApiKey,
    });

    updateDocument(
      (current) => ({
        ...current,
        ai: {
          ...current.ai,
          ...preset.settings,
        },
      }),
      {
        historyLabel: "应用 AI 预设",
        clearDeletion: true,
        message: `已切换到 ${preset.label} 预设`,
      },
    );
  };

  const applyGeneratedAiSummarySuggestion = (suggestion: ResumeAssistSuggestion) => {
    if (typeof suggestion.nextValue !== "string") {
      setStatusMessage("当前建议无法直接应用");
      return;
    }

    updateBasicsField("summaryHtml", suggestion.nextValue);
    setStatusMessage(`已应用${suggestion.label}`);
  };

  async function handleGenerateAiSummary() {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown");
      return;
    }

    if (latestDocumentRef.current.ai.provider !== "openai-compatible") {
      setActivePanel("ai");
      lastFormPanelRef.current = "ai";
      setStatusMessage("先把 AI 提供方切换到 OpenAI Compatible");
      return;
    }

    setIsGeneratingAiSummary(true);

    try {
      const result = await getJson<{ suggestions?: ResumeAssistSuggestion[] }>(
        await fetch("/api/ai/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summary",
            document: latestDocumentRef.current,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setGeneratedAiSummarySuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
      setStatusMessage("已生成 AI 摘要建议");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "AI 摘要生成失败");
    } finally {
      setIsGeneratingAiSummary(false);
    }
  }

  const applySuggestedKeywords = () => {
    if (targetingAnalysis.suggestedKeywords.length === 0) {
      setStatusMessage("当前没有可应用的建议关键词");
      return;
    }

    updateDocument(
      (current) => ({
        ...current,
        targeting: {
          ...current.targeting,
          focusKeywords: targetingAnalysis.suggestedKeywords,
        },
      }),
      {
        historyLabel: "应用建议关键词",
        clearDeletion: true,
        message: "已应用建议关键词",
      },
    );
  };

  const handleResolvePendingItem = (item: string) => {
    updateDocument(
      (current) => ({
        ...current,
        importTrace: {
          ...current.importTrace,
          reviewState: {
            ...current.importTrace.reviewState,
            reviewedPendingItems: Array.from(new Set([...current.importTrace.reviewState.reviewedPendingItems, item])),
          },
        },
      }),
      {
        historyLabel: "Mark import note checked",
        clearDeletion: true,
        message: "已核对一条导入提示。",
      },
    );
  };

  const handleResolveUnmappedItem = (item: string) => {
    updateDocument(
      (current) => ({
        ...current,
        importTrace: {
          ...current.importTrace,
          reviewState: {
            ...current.importTrace.reviewState,
            reviewedUnmappedItems: Array.from(
              new Set([...current.importTrace.reviewState.reviewedUnmappedItems, item]),
            ),
          },
        },
      }),
      {
        historyLabel: "Mark unmapped note checked",
        clearDeletion: true,
        message: "已核对一条未映射提示。",
      },
    );
  };

  const handleResolveSnapshot = (snapshotId: string) => {
    updateDocument(
      (current) => ({
        ...current,
        importTrace: {
          ...current.importTrace,
          reviewState: {
            ...current.importTrace.reviewState,
            reviewedSnapshotIds: Array.from(
              new Set([...current.importTrace.reviewState.reviewedSnapshotIds, snapshotId]),
            ),
          },
        },
      }),
      {
        historyLabel: "Mark source excerpt checked",
        clearDeletion: true,
        message: "已核对一条原始来源片段。",
      },
    );
  };

  const handleResolveFieldSuggestion = (suggestionId: string, message = "已确认保留导入字段。") => {
    updateDocument(
      (current) => ({
        ...current,
        importTrace: {
          ...current.importTrace,
          reviewState: {
            ...current.importTrace.reviewState,
            reviewedFieldSuggestionIds: Array.from(
              new Set([...current.importTrace.reviewState.reviewedFieldSuggestionIds, suggestionId]),
            ),
          },
        },
      }),
      {
        historyLabel: "Resolve imported field suggestion",
        clearDeletion: true,
        message,
      },
    );
  };

  const handleRestoreImportedFieldPreviousValue = (suggestion: ResumeImportFieldSuggestion) => {
    updateDocument(
      (current) => ({
        ...current,
        basics: {
          ...current.basics,
          [suggestion.field]: suggestion.previousValue,
        },
        importTrace: {
          ...current.importTrace,
          reviewState: {
            ...current.importTrace.reviewState,
            reviewedFieldSuggestionIds: Array.from(
              new Set([...current.importTrace.reviewState.reviewedFieldSuggestionIds, suggestion.id]),
            ),
          },
        },
      }),
      {
        historyLabel: "Restore previous imported field value",
        clearDeletion: true,
        message: `已恢复${suggestion.label}的原值。`,
      },
    );
  };

  const handleFocusDiagnostic = (target: "basics" | "summary" | "content" | "targeting" | "export") => {
    if (target === "basics" || target === "summary") {
      focusFormPanel("basics", target === "summary" ? "先补摘要。" : "先完善基本信息。");
      return;
    }

    if (target === "targeting") {
      focusFormPanel("targeting", "先补充岗位和关键词。");
      return;
    }

    if (target === "content") {
      focusFormPanel("experience", "先整理经历和结果要点。");
      return;
    }

    void handleOpenPreview();
  };

  const handleFocusWorkbenchArea = (area: WorkbenchAreaId) => {
    if (area === "basics") {
      focusFormPanel("basics", "先补齐基本信息。");
      return;
    }

    if (area === "content") {
      focusFormPanel("experience", "先整理经历和结果要点。");
      return;
    }

    if (area === "targeting") {
      focusFormPanel("targeting", "先补充岗位和关键词。");
      return;
    }

    void handleOpenPreview();
  };

  const handleOnboardingAction = (target: "basics" | "content" | "targeting" | "preview") => {
    if (target === "basics") {
      focusFormPanel("basics", "先补齐基本信息。");
      return;
    }

    if (target === "content") {
      focusFormPanel("experience", "先整理经历和结果要点。");
      return;
    }

    if (target === "targeting") {
      focusFormPanel("targeting", "先补充岗位和关键词。");
      return;
    }

    void handleOpenPreview();
  };

  const handleApplyWorkflowState = (workflowState: ResumeDocument["meta"]["workflowState"]) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          workflowState,
        },
      }),
      {
        historyLabel: "切换简历阶段",
        clearDeletion: true,
        message: "已更新当前阶段。",
      },
    );
  };

  const handleWorkbenchTask = (task: ResumeWorkbenchTask) => {
    switch (task.action.type) {
      case "focus-basics":
        focusFormPanel("basics", task.detail);
        return;
      case "focus-summary":
        focusFormPanel("basics", "先补摘要。");
        return;
      case "focus-targeting":
        focusFormPanel("targeting", task.detail);
        return;
      case "focus-export":
        void handleOpenPreview();
        return;
      case "ensure-experience":
      case "ensure-bullet":
        focusFormPanel("experience", task.detail);
        return;
      case "apply-suggested-keywords":
        focusFormPanel("targeting", "正在应用建议关键词。");
        applySuggestedKeywords();
        return;
      case "set-workflow":
        handleApplyWorkflowState(task.action.workflowState);
        return;
      default:
        return;
    }
  };

  useEffect(() => {
    const focus = searchParams.get("focus");
    const onboarding = searchParams.get("onboarding");

    if (focus === "basics" || focus === "summary") {
      lastFormPanelRef.current = "basics";
      setActivePanel("basics");
      if (focus === "summary") setStatusMessage("先补摘要。");
    } else if (focus === "design") {
      lastFormPanelRef.current = "design";
      setActivePanel("design");
      setStatusMessage("先调整版式和外观。");
    } else if (focus === "targeting") {
      lastFormPanelRef.current = "targeting";
      setActivePanel("targeting");
      setStatusMessage("先定岗位和关键词。");
    } else if (focus === "ai") {
      setActivePanel("ai");
      lastFormPanelRef.current = "ai";
      setStatusMessage("先看 AI 分析和定制版计划。");
    } else if (focus === "content") {
      setActivePanel("experience");
      lastFormPanelRef.current = "experience";
      setStatusMessage("先补经历和结果。");
    }

    const importedKind = resolveLatestImportKind(latestDocumentRef.current);
    if (importedKind) {
      setStatusMessage(resolveImportStatusMessage(importedKind));
    } else if (onboarding === "pdf") {
      setStatusMessage("先核对 PDF 导入结果。");
    } else if (onboarding === "portfolio") {
      setStatusMessage("先核对作品集导入结果。");
    } else if (onboarding === "template") {
      setStatusMessage("先把模板示例替换成你的真实信息。");
    } else if (onboarding === "guided") {
      setStatusMessage("先补齐基础信息，再逐步添加内容。");
    }
  }, [searchParams]);


  const renderSectionPanel = (sectionType: SectionPanel) => {
    const definition = editorSectionDefinitions.find((item) => item.type === sectionType);
    const section = getEditorSection(document, sectionType);
    if (!definition || !section) return null;

    return (
      <ResumeSectionEditor
        activeItemId={activeSectionItemId}
        document={document}
        definition={definition}
        focusItemId={focusItemId}
        onActiveItemChange={(itemId) => {
          setActivePanel(sectionType);
          setActiveSectionItemId(itemId);
        }}
        onAddItem={(options) => insertSectionItem(sectionType, { afterItemId: options?.afterItemId })}
        onChange={(nextSection) =>
          updateDocument(
            (current) => ({
              ...current,
              sections: current.sections.map((item) => (item.id === nextSection.id ? nextSection : item)),
            }),
            {
              historyLabel: `修改${definition.title}`,
              clearDeletion: true,
            },
          )
        }
        onCopyItem={(itemId) => void copySectionItem(sectionType, itemId)}
        onDeleteItem={(itemId) => deleteSectionItem(sectionType, itemId)}
        onDuplicateItem={(itemId) => {
          const source = section.items.find((item) => item.id === itemId);
          if (source) {
            insertSectionItem(sectionType, {
              afterItemId: itemId,
              duplicateFrom: source,
            });
          }
        }}
        onMoveItem={(itemId, direction) => moveSectionItem(sectionType, itemId, direction)}
        section={section}
        writerProfile={document.meta.writerProfile}
      />
    );
  };

  const renderEditorSurface = () => {
    const groupItems = activePanelGroup?.items ?? [];

    let panelContent: ReactNode;

    if (editorMode === "markdown") {
      panelContent = (
        <ResumeMarkdownPanel
          onChange={(value) => applyMarkdownDraft(value, "已更新")}
          onClear={() => {
            setConfirmation({
              title: "清空 Markdown 草稿？",
              description: "这会移除当前源码内容，但你仍可以通过撤销立即找回。",
              confirmLabel: "清空 Markdown",
              confirmVariant: "danger",
              onConfirm: () => {
                setConfirmation(null);
                applyMarkdownDraft("", "已清空");
              },
            });
          }}
          onInsertStarter={() => applyMarkdownDraft(markdownStarter, "已插入结构")}
          parseError={markdownError}
          value={markdownDraft}
        />
      );
    } else if (activePanel === "basics") {
      panelContent = <ResumeBasicsPanel document={document} onBasicsChange={updateBasicsField} />;
    } else if (activePanel === "design") {
      panelContent = (
        <ResumeDesignPanel
          document={document}
          onApplyPreset={applyStylePreset}
          onLayoutChange={updateLayoutField}
          onPhotoChange={updateBasicsVisualField}
          onTemplateChange={updateTemplate}
        />
      );
    } else if (activePanel === "targeting") {
      panelContent = (
        <ResumeTargetingPanel
          document={document}
          onTargetingChange={updateTargetingField}
        />
      );
    } else if (activePanel === "ai") {
      panelContent = (
        <ResumeAiPanel
          analysis={targetingAnalysis}
          apiKey={clientAiApiKey}
          document={document}
          generatedSummarySuggestions={generatedAiSummarySuggestions}
          isGenerating={isGeneratingVariant}
          isGeneratingSummary={isGeneratingAiSummary}
          onAiChange={updateAiField}
          onAiApiKeyChange={updateAiApiKey}
          onAiPresetApply={applyAiPreset}
          onApplyGeneratedSummary={applyGeneratedAiSummarySuggestion}
          onApplySuggestedKeywords={applySuggestedKeywords}
          onGenerateSummary={() => void handleGenerateAiSummary()}
          onGenerateTailoredVariant={() => void handleGenerateTailoredVariant()}
          tailoredPlan={tailoredVariantPlan}
        />
      );
    } else if (isSectionPanel(activePanel)) {
      panelContent = renderSectionPanel(activePanel);
    } else {
      panelContent = null;
    }

    return (
      <div className="resume-editor-stack">
        <section className="editor-workbench-header">
          <div className="editor-workbench-caption">
            <span className="editor-workbench-label">{activePanelMeta?.label ?? "编辑"}</span>
            <p className="editor-workbench-copy">
              {(activePanelMeta?.hint ?? "专注当前任务，右侧预览会同步更新。") +
                (activePanelGroup ? ` · ${activePanelGroup.label}` : "")}
            </p>
          </div>

          <div className="editor-workbench-tabs" aria-label="当前工作区导航">
            {groupItems.map((item) => (
              <button
                aria-pressed={item.key === activePanel}
                className={`editor-workbench-tab ${item.key === activePanel ? "editor-workbench-tab-active" : ""}`}
                key={item.key}
                onClick={() => handlePanelSelect(item.key)}
                type="button"
              >
                <span>{item.label}</span>
                {item.countLabel ? <em>{item.countLabel}</em> : null}
              </button>
            ))}
          </div>
        </section>

        <section
          className="editor-surface-section editor-surface-section-active"
          onFocusCapture={() => setActivePanel(activePanel)}
          ref={editorSurfaceRef}
        >
          {panelContent}
        </section>
      </div>
    );
  };

  return (
    <main className="resume-editor-workspace">
      <ResumeEditorToolbar
        canRedo={history.canRedo}
        canUndo={history.canUndo}
        currentPanelGroupLabel={activePanelGroup?.label ?? "工作区"}
        editorMode={editorMode}
        onBack={() => void handleBack()}
        onModeChange={handleModeChange}
        onOpenPreview={() => void handleOpenPreview()}
        onRedo={redoLastChange}
        onSave={() => void saveDocument("manual")}
        onTemplateChange={updateTemplate}
        onTitleChange={updateResumeTitle}
        onUndo={undoLastChange}
        recentHistoryLabels={history.recentLabels}
        redoLabel={history.redoLabel}
        saveState={saveState}
        statusMessage={statusMessage}
        template={document.meta.template}
        title={document.meta.title}
        undoLabel={history.undoLabel}
      />

      {lineage ? (
        <section className="resume-lineage-banner">
          <div>
            <p className="editor-workflow-kicker">版本关系</p>
            <div className="resume-lineage-banner-head">
              <strong>
                {lineage.kind === "variant"
                  ? "当前正在编辑一份岗位定制版。"
                  : lineage.kind === "source"
                    ? "当前正在编辑一份主稿。"
                    : "当前是一份独立草稿。"}
              </strong>
              <div className="resume-lineage-banner-badges">
                <Badge tone={lineage.kind === "variant" ? "accent" : "neutral"}>
                  {lineage.kind === "variant" ? "定制版" : lineage.kind === "source" ? "主稿" : "独立稿"}
                </Badge>
                {lineage.childCount > 0 ? <Badge tone="success">已派生 {lineage.childCount} 份</Badge> : null}
              </div>
            </div>
            <p className="editor-workflow-copy">
              {lineage.parentTitle
                ? `这份版本基于「${lineage.parentTitle}」生成，适合针对岗位继续微调。`
                : lineage.childCount > 0
                  ? "建议把这份主稿保持稳定，再围绕不同岗位生成定制版。"
                  : "如果后续需要面向不同岗位继续扩展，可以在补完岗位信息后生成定制版。"}
            </p>
          </div>

          <div className="editor-workflow-actions">
            {lineage.parentId ? (
              <Button onClick={() => router.push(`/studio/${lineage.parentId}`)} variant="secondary">
                查看来源主稿
              </Button>
            ) : null}
            <Button onClick={() => router.push("/resumes" as Route)} variant="ghost">
              返回简历库
            </Button>
          </div>
        </section>
      ) : null}

      <section className="resume-editor-journey">
        <div className="resume-editor-journey-main">
          <p className="editor-workflow-kicker">当前链路</p>
          <div className="editor-workflow-head">
            <strong>当前处于「{workbenchReport.workflow.currentLabel}」阶段</strong>
            <span>完成度 {workbenchReport.score}%</span>
          </div>
          <p className="editor-workflow-copy">
            {workbenchReport.workflow.currentDescription}
            {workbenchReport.workflow.currentState !== workbenchReport.workflow.suggestedState
              ? ` 当前内容更适合标记为「${workbenchReport.workflow.suggestedLabel}」。`
              : ""}
          </p>

          <div className="resume-editor-journey-grid">
            {workbenchReport.areaScores.map((area) => (
              <button
                aria-pressed={activeWorkbenchArea === area.id}
                className={`resume-editor-journey-step ${activeWorkbenchArea === area.id ? "resume-editor-journey-step-active" : ""}`}
                key={area.id}
                onClick={() => handleFocusWorkbenchArea(area.id)}
                type="button"
              >
                <div className="resume-editor-journey-step-head">
                  <strong>{area.label}</strong>
                  <span>{area.score}%</span>
                </div>
                <p>{area.note}</p>
              </button>
            ))}
          </div>
        </div>

        <aside className="resume-editor-journey-side">
          <div className="resume-editor-journey-side-head">
            <div>
              <p className="editor-workflow-kicker">下一步</p>
              <strong>
                {workbenchReport.openTasks.length > 0 ? "优先处理这几项。" : "这份简历可以进入最终检查。"}
              </strong>
            </div>
            <Badge tone={workbenchReport.openTasks.length > 0 ? "accent" : "success"}>
              {workbenchReport.openTasks.length > 0 ? `${workbenchReport.openTasks.length} 项待推进` : "可预览导出"}
            </Badge>
          </div>

          {workbenchReport.openTasks.length > 0 ? (
            <div className="resume-editor-task-list">
              {workbenchReport.openTasks.slice(0, 3).map((task) => (
                <article className="resume-editor-task-card" key={task.id}>
                  <div className="resume-editor-task-card-head">
                    <strong>{task.title}</strong>
                    <Badge tone={task.status === "warning" ? "warning" : "neutral"}>
                      {task.status === "warning" ? "建议" : "下一步"}
                    </Badge>
                  </div>
                  <p>{task.detail}</p>
                  <Button onClick={() => handleWorkbenchTask(task)} variant="secondary">
                    {task.action.label}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="resume-editor-task-card resume-editor-task-card-ready">
              <div className="resume-editor-task-card-head">
                <strong>内容已经具备导出条件</strong>
                <Badge tone="success">已就绪</Badge>
              </div>
              <p>可以直接进入预览页做最后检查，确认无误后导出 PDF。</p>
              <Button onClick={() => void handleOpenPreview()} variant="secondary">
                打开预览
              </Button>
            </div>
          )}
        </aside>
      </section>

      {editorOnboarding ? (
        <section className="resume-editor-onboarding">
          <div className="resume-editor-onboarding-head">
            <div>
              <p className="editor-workflow-kicker">首次进入</p>
              <strong>{editorOnboarding.title}</strong>
            </div>
          </div>
          <p className="editor-workflow-copy">{editorOnboarding.description}</p>

          <div className="resume-editor-onboarding-grid">
            {editorOnboarding.steps.map((step, index) => (
              <article className="resume-editor-onboarding-step" key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="editor-workflow-actions">
            {editorOnboarding.actions.map((action) => (
              <Button
                key={action.label}
                onClick={() => handleOnboardingAction(action.target)}
                variant={action.target === "basics" ? "primary" : "secondary"}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {importReview ? (
        <section className="resume-editor-import-banner">
          <div className="resume-editor-import-overview">
            <p className="editor-workflow-kicker">导入校对</p>
            <div className="editor-workflow-head">
              <strong>{importReview.title}</strong>
              <span>
                {importReview.remainingCount > 0
                  ? `${importReview.remainingCount} 个待核对项`
                  : "可继续编辑"}
              </span>
            </div>
            <p className="editor-workflow-copy">{importReview.description}</p>
            {importReview.sourcePath ? (
              <p className="resume-editor-import-meta">来源路径：{importReview.sourcePath}</p>
            ) : null}
            <div className="resume-editor-import-badges">
              <Badge tone="accent">{importReview.kind === "pdf" ? "PDF 导入" : "作品集导入"}</Badge>
              {importReview.remainingCount > 0 ? (
                <Badge tone="neutral">{importReview.remainingCount} 个待核对项</Badge>
              ) : (
                <Badge tone="success">已完成首轮导入</Badge>
              )}
            </div>
            <div className="resume-editor-import-stats">
              {importReview.mappedStats.map((stat) => (
                <div className="resume-editor-import-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <p className="resume-editor-import-note">
              当前结果已整理成可编辑草稿，建议先核对，再继续润色。
            </p>
            {highlightedDiagnostics.length > 0 ? (
              <div className="resume-editor-inline-priority">
                <div className="resume-editor-inline-priority-head">
                  <strong>当前提醒</strong>
                  <span>{highlightedDiagnostics.length} 项</span>
                </div>
                <div className="editor-priority-list">
                  {highlightedDiagnostics.map((issue) => (
                    <button
                      className="editor-priority-chip"
                      key={issue.id}
                      onClick={() => handleFocusDiagnostic(issue.target)}
                      type="button"
                    >
                      <div className="editor-priority-chip-copy">
                        <div className="editor-priority-chip-head">
                          <Badge tone={issue.severity === "blocker" ? "warning" : "neutral"}>
                            {issue.severity === "blocker" ? "必改" : "建议"}
                          </Badge>
                          <strong>{issue.message}</strong>
                        </div>
                        <span>{issue.suggestion}</span>
                      </div>
                      <span className="editor-priority-chip-action">
                        {issue.target === "export" ? "去检查" : "去处理"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="editor-workflow-actions">
              <Button onClick={handleFocusImportedBasics} variant="secondary">
                {importReview.primaryActionLabel}
              </Button>
              <Button onClick={handleFocusImportedContent}>
                {importReview.secondaryActionLabel}
              </Button>
            </div>
          </div>

          <section className="resume-editor-import-panel">
            <div className="resume-editor-import-panel-head">
              <strong>优先核对</strong>
              <span>{importReview.pendingItemCount > 0 ? `${importReview.pendingItemCount} 项` : "已清空"}</span>
            </div>
            <div className="resume-editor-import-list">
              {(importReview.pendingItemsPreview.length > 0
                ? importReview.pendingItemsPreview
                : ["没有额外待核对项。"]).map((item) => (
                <div className="resume-editor-import-item" key={item}>
                  <p>{item}</p>
                  {importReview.pendingItemCount > 0 ? (
                    <div className="resume-editor-import-item-actions">
                      <Button onClick={() => handleResolvePendingItem(item)} variant="ghost">
                        标记已核对
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {importReview.unmappedItems.length > 0 ? (
            <details className="resume-editor-import-disclosure" open>
              <summary>
                <strong>未映射内容</strong>
                <span>{importReview.unmappedItemCount} 项</span>
              </summary>
              <div className="resume-editor-import-review-tasks">
                {importReview.unmappedItems.map((item) => (
                  <article className="resume-editor-import-review-task" key={item}>
                    <div className="resume-editor-import-review-task-head">
                      <strong>未映射内容提示</strong>
                      <Badge tone="warning">需要补录</Badge>
                    </div>
                    <p>{item}</p>
                    <div className="resume-editor-import-task-actions">
                      <Button onClick={handleFocusImportedContent} variant="secondary">
                        打开内容编辑
                      </Button>
                      <Button onClick={() => handleResolveUnmappedItem(item)} variant="ghost">
                        标记已核对
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ) : null}

          {importReview.fieldSuggestions.length > 0 ? (
            <details className="resume-editor-import-disclosure">
              <summary>
                <strong>字段核对</strong>
                <span>{importReview.fieldSuggestionCount} 项</span>
              </summary>
              <div className="resume-editor-import-review-tasks">
                {importReview.fieldSuggestions.map((suggestion) => (
                  <article className="resume-editor-import-review-task" key={suggestion.id}>
                    <div className="resume-editor-import-review-task-head">
                      <strong>{suggestion.label}</strong>
                      <Badge tone="neutral">{suggestion.sourceLabel}</Badge>
                    </div>
                    <p className="resume-editor-import-field-value">
                      导入值：{stripHtmlToText(suggestion.importedValue) || "空"}
                    </p>
                    <p className="resume-editor-import-field-previous">
                      原值：{stripHtmlToText(suggestion.previousValue) || "空"}
                    </p>
                    <div className="resume-editor-import-task-actions">
                      <Button onClick={handleFocusImportedBasics} variant="secondary">
                        打开基础信息
                      </Button>
                      <Button
                        onClick={() => handleRestoreImportedFieldPreviousValue(suggestion)}
                        variant="ghost"
                      >
                        恢复原值
                      </Button>
                      <Button onClick={() => handleResolveFieldSuggestion(suggestion.id)} variant="ghost">
                        保留导入值
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ) : null}

          {importReview.reviewTasks.length > 0 ? (
            <details className="resume-editor-import-disclosure" open={importReview.unmappedItems.length === 0}>
              <summary>
                <strong>整理任务</strong>
                <span>{importReview.reviewTaskCount} 项</span>
              </summary>
              <div className="resume-editor-import-review-tasks">
                {importReview.reviewTasks.map((task) => (
                  <article className="resume-editor-import-review-task" key={task.id}>
                    <div className="resume-editor-import-review-task-head">
                      <strong>{task.title}</strong>
                      <Badge tone={task.priority === "high" ? "warning" : "neutral"}>
                        {task.priority === "high" ? "优先处理" : "可稍后"}
                      </Badge>
                    </div>
                    <p>{task.detail}</p>
                    <div className="resume-editor-import-task-actions">
                      <Button onClick={() => handleFocusImportTask(task.focus)} variant="secondary">
                        {task.focus === "basics" ? "打开基础信息" : "打开内容编辑"}
                      </Button>
                      {task.priority === "medium" ? (
                        <Button onClick={() => handleResolveImportTask(task.id)} variant="ghost">
                          标记已完成
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ) : null}

          {importReview.snapshots.length > 0 ? (
            <details className="resume-editor-import-disclosure">
              <summary>
                <strong>原始片段</strong>
                <span>{importReview.snapshotCount} 项</span>
              </summary>
              <div className="resume-editor-import-snapshots">
                {importReview.snapshots.map((snapshot) => (
                  <article className="resume-editor-import-snapshot" key={snapshot.id}>
                    <div className="resume-editor-import-snapshot-head">
                      <strong>{snapshot.label}</strong>
                      <Badge tone="neutral">{snapshot.mappedTo}</Badge>
                    </div>
                    <p className="resume-editor-import-snapshot-source">{snapshot.source}</p>
                    <p className="resume-editor-import-snapshot-excerpt">{snapshot.excerpt}</p>
                    <div className="resume-editor-import-task-actions">
                      <Button onClick={handleFocusImportedContent} variant="secondary">
                        打开内容编辑
                      </Button>
                      <Button onClick={() => handleResolveSnapshot(snapshot.id)} variant="ghost">
                        标记已核对
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}
      {!importReview && highlightedDiagnostics.length > 0 ? (
        <section className="editor-priority-strip">
          <div className="editor-priority-head">
            <div className="editor-priority-title">
              <p className="editor-workflow-kicker">优先处理</p>
              <strong>优先处理这 {highlightedDiagnostics.length} 项。</strong>
            </div>
          </div>

          <div className="editor-priority-list">
            {highlightedDiagnostics.map((issue) => (
              <button
                className="editor-priority-chip"
                key={issue.id}
                onClick={() => handleFocusDiagnostic(issue.target)}
                type="button"
              >
                <div className="editor-priority-chip-copy">
                  <div className="editor-priority-chip-head">
                    <Badge tone={issue.severity === "blocker" ? "warning" : "neutral"}>
                      {issue.severity === "blocker" ? "必改" : "建议"}
                    </Badge>
                    <strong>{issue.message}</strong>
                  </div>
                  <span>{issue.suggestion}</span>
                </div>
                <span className="editor-priority-chip-action">
                  {issue.target === "export" ? "去检查" : "去处理"}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {recentDeletion ? (
        <section className="resume-editor-notice">
          <div>
            <strong>已删除“{recentDeletion.item.title || recentDeletion.sectionTitle}”</strong>
            <p>可撤销</p>
          </div>
          <Button onClick={() => restoreDeletedItem()} variant="secondary">
            <RotateCcw className="size-4" />
            恢复
          </Button>
        </section>
      ) : null}

      <section className="resume-editor-layout">
        <ResumeEditorSidebar activePanel={activePanel} groups={sidebarGroups} onSelect={handlePanelSelect} />

        <div className="resume-editor-main">
          {renderEditorSurface()}
        </div>

        <ResumePreviewPanel
          countLabel={activePanelMeta?.countLabel}
          groupLabel={activePanelGroup?.label ?? "工作区"}
          html={previewHtml}
          panelLabel={activePanelMeta?.label ?? "编辑"}
          saveLabel={
            saveState === "dirty"
              ? "未保存修改"
              : saveState === "saving"
                ? "正在保存"
                : saveState === "error"
                  ? "保存失败"
                  : "已保存"
          }
        />
      </section>

      <ConfirmDialog
        cancelLabel="继续编辑"
        confirmLabel={confirmation?.confirmLabel}
        confirmVariant={confirmation?.confirmVariant ?? "primary"}
        description={confirmation?.description}
        onClose={() => setConfirmation(null)}
        onConfirm={() => void confirmation?.onConfirm()}
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "请确认"}
      />
      <EditorShortcutDialog onClose={() => setShortcutOpen(false)} open={shortcutOpen} />
    </main>
  );
}

