"use client";

import { RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ResumeSectionEditor } from "@/components/product/ResumeSectionEditor";
import { ResumeBasicsPanel } from "@/components/product/editor/ResumeBasicsPanel";
import { ResumeAiPanel } from "@/components/product/editor/ResumeAiPanel";
import { EditorShortcutDialog } from "@/components/product/editor/EditorShortcutDialog";
import {
  ResumeEditorSidebar,
  type EditorPanel,
  type EditorPanelItem,
} from "@/components/product/editor/ResumeEditorSidebar";
import { ResumeEditorToolbar } from "@/components/product/editor/ResumeEditorToolbar";
import { ResumeMarkdownPanel } from "@/components/product/editor/ResumeMarkdownPanel";
import { ResumePreviewPanel } from "@/components/product/editor/ResumePreviewPanel";
import { ResumeTargetingPanel } from "@/components/product/editor/ResumeTargetingPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { readClientAiConfig, writeClientAiConfig } from "@/lib/client-ai-config";
import { hasResumeRenderableContent } from "@/lib/resume-content";
import { createEmptyResumeDocument } from "@/lib/resume-document";
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
import { buildResumeWorkbenchReport } from "@/lib/resume-workbench";
import type { ResumeDocument, ResumeImportFieldSuggestion, ResumeSectionItem } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type FormPanel = Exclude<EditorPanel, "markdown">;
type SectionPanel = (typeof editorSectionDefinitions)[number]["type"];
type ImportReviewKind = "pdf" | "portfolio";

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
      hint: "姓名、职位、链接",
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
      key: "targeting",
      label: "岗位信息",
      hint: "岗位、关键词、JD",
      status: deriveTargetingStatus(document, targetingAnalysis),
    },
    {
      key: "ai",
      label: "AI",
      hint: "设置、分析、定制版",
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
        ? "先看抬头信息、章节归类和待核对项。"
        : "先看基础信息、经历映射和待核对项。",
    primaryActionLabel: kind === "pdf" ? "核对基本信息" : "先看基础信息",
    secondaryActionLabel: kind === "pdf" ? "继续核对内容" : "继续整理内容",
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
      { label: "Basics", value: basicsCount },
      { label: "Experience", value: experienceCount },
      { label: "Projects", value: projectCount },
      { label: "Education / Skills", value: educationCount + skillsCount },
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

  if (focus === "summary") {
    return "先补摘要。";
  }

  if (focus === "targeting") {
    return "先定岗位和关键词。";
  }

  if (focus === "ai") {
    return "先看 AI 分析和定制版计划。";
  }

  if (focus === "content") {
    return "先补经历和结果。";
  }

  return hasResumeRenderableContent(document) ? "继续编辑" : "开始填写";
}

export function ResumeEditorPage({
  initialDocument,
}: {
  initialDocument: ResumeDocument;
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
  const [generatedAiSummary, setGeneratedAiSummary] = useState<string | null>(null);
  const [clientAiApiKey, setClientAiApiKey] = useState("");
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const latestDocumentRef = useRef(seededDocument);
  const latestMarkdownRef = useRef(seededMarkdown);
  const latestMarkdownErrorRef = useRef<string | null>(null);
  const lastSavedRef = useRef(JSON.stringify(seededDocument));
  const lastFormPanelRef = useRef<FormPanel>(
    initialPanel === "targeting" || initialPanel === "ai" ? initialPanel : "basics",
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const nextTask = workbenchReport.openTasks[0] ?? null;
  const highlightedDiagnostics = useMemo(
    () => [...qualityReport.blockingIssues, ...qualityReport.warnings].slice(0, 3),
    [qualityReport],
  );

  useEffect(() => {
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
  }, []);

  const previewHtml = useMemo(
    () =>
      buildResumePreviewHtml(deferredDocument, {
        highlightedTarget:
          activePanel === "basics" || activePanel === "targeting"
            ? activePanel
            : activePanel === "markdown" || activePanel === "ai"
              ? undefined
              : { sectionType: activePanel },
      }),
    [activePanel, deferredDocument],
  );

  const activeSection = useMemo(
    () => (isSectionPanel(activePanel) ? getEditorSection(document, activePanel) : null),
    [activePanel, document],
  );

  const activeSectionDefinition = useMemo(
    () => editorSectionDefinitions.find((definition) => definition.type === activePanel) ?? null,
    [activePanel],
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

  const deleteSectionItem = (sectionType: SectionPanel, itemId: string) => {
    const definition = editorSectionDefinitions.find((item) => item.type === sectionType);
    const section = getEditorSection(latestDocumentRef.current, sectionType);
    if (!definition || !section) return;

    const index = section.items.findIndex((item) => item.id === itemId);
    if (index === -1) return;
    const target = section.items[index];

    if (
      hasMeaningfulItemContent(target) &&
      !window.confirm(`删除“${target.title || definition.title}”？`)
    ) {
      return;
    }

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

  const updateBasicsField = (field: keyof ResumeDocument["basics"], value: string) => {
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

  const saveDocument = async (mode: "manual" | "auto") => {
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
      const nextMarkdown = serializeResumeToMarkdown(normalized);
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
      const confirmed = window.confirm("当前 Markdown 有误，离开后未保存修改可能丢失。仍要返回？");
      if (!confirmed) return;
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackPath);
      }
      return;
    }

    await saveDocument("manual");
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackPath);
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

  const handlePanelSelect = (panel: EditorPanel) => {
    if (panel === "markdown") {
      setActivePanel("markdown");
      setStatusMessage("已切换到 Markdown");
      return;
    }

    lastFormPanelRef.current = panel;
    setActivePanel(panel);
    setStatusMessage("继续编辑");
  };

  const handleModeChange = (mode: "form" | "markdown") => {
    if (mode === "markdown") {
      handlePanelSelect("markdown");
      return;
    }

    handlePanelSelect(lastFormPanelRef.current);
  };

  const handleFocusImportedBasics = () => {
    setActivePanel("basics");
    lastFormPanelRef.current = "basics";
    setStatusMessage("先核对基本信息。");
  };

  const handleFocusImportedContent = () => {
    setActivePanel("experience");
    lastFormPanelRef.current = "experience";
    setStatusMessage("继续整理导入内容。");
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

  const applyGeneratedAiSummary = () => {
    if (!generatedAiSummary) {
      setStatusMessage("当前还没有可应用的 AI 摘要建议");
      return;
    }

    updateBasicsField("summaryHtml", generatedAiSummary);
    setStatusMessage("已应用 AI 摘要建议");
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
      const result = await getJson<{ summary: string }>(
        await fetch("/api/ai/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document: latestDocumentRef.current,
            apiKey: clientAiApiKey,
          }),
        }),
      );

      setGeneratedAiSummary(result.summary);
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
      setActivePanel("basics");
      lastFormPanelRef.current = "basics";
      setStatusMessage(target === "summary" ? "鍏堣ˉ鎽樿銆?" : "鍏堝畬鍠勫熀鏈俊鎭€?");
      return;
    }

    if (target === "targeting") {
      setActivePanel("targeting");
      lastFormPanelRef.current = "targeting";
      setStatusMessage("鍏堣ˉ鍏呭矖浣嶅拰鍏抽敭璇嶃€?");
      return;
    }

    if (target === "content") {
      setActivePanel("experience");
      lastFormPanelRef.current = "experience";
      setStatusMessage("鍏堟暣鐞嗙粡鍘嗗拰缁撴灉瑕佺偣銆?");
      return;
    }

    void handleOpenPreview();
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const focus = searchParams.get("focus");
    const onboarding = searchParams.get("onboarding");

    if (focus === "basics" || focus === "summary") {
      setActivePanel("basics");
      if (focus === "summary") setStatusMessage("先补摘要。");
    } else if (focus === "targeting") {
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
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleJumpToNextTask = () => {
    if (!nextTask) {
      void handleOpenPreview();
      return;
    }

    switch (nextTask.action.type) {
      case "focus-basics":
      case "focus-summary":
        setActivePanel("basics");
        lastFormPanelRef.current = "basics";
        break;
      case "focus-targeting":
        setActivePanel("targeting");
        lastFormPanelRef.current = "targeting";
        break;
      case "apply-suggested-keywords":
        applySuggestedKeywords();
        setActivePanel("ai");
        lastFormPanelRef.current = "ai";
        return;
      case "focus-export":
        void handleOpenPreview();
        return;
      case "ensure-experience":
      case "ensure-bullet":
        setActivePanel("experience");
        lastFormPanelRef.current = "experience";
        break;
      case "set-workflow":
        const workflowState = nextTask.action.workflowState;
        updateDocument(
          (current) => ({
            ...current,
            meta: {
              ...current.meta,
              workflowState,
            },
          }),
          {
            historyLabel: "更新工作流阶段",
            clearDeletion: true,
            message: `已切换到“${workbenchReport.workflow.suggestedLabel}”阶段`,
          },
        );
        return;
      default:
        return;
    }

    setStatusMessage(nextTask.title);
  };

  const renderCurrentPanel = () => {
    if (activePanel === "basics") {
      return <ResumeBasicsPanel document={document} onBasicsChange={updateBasicsField} />;
    }

    if (activePanel === "targeting") {
      return <ResumeTargetingPanel document={document} onTargetingChange={updateTargetingField} />;
    }

    if (activePanel === "ai") {
      return (
        <ResumeAiPanel
          analysis={targetingAnalysis}
          apiKey={clientAiApiKey}
          document={document}
          generatedSummary={generatedAiSummary}
          isGenerating={isGeneratingVariant}
          isGeneratingSummary={isGeneratingAiSummary}
          onAiChange={updateAiField}
          onAiApiKeyChange={updateAiApiKey}
          onAiPresetApply={applyAiPreset}
          onApplyGeneratedSummary={applyGeneratedAiSummary}
          onApplySuggestedKeywords={applySuggestedKeywords}
          onGenerateSummary={() => void handleGenerateAiSummary()}
          onGenerateTailoredVariant={() => void handleGenerateTailoredVariant()}
          tailoredPlan={tailoredVariantPlan}
        />
      );
    }

    if (activePanel === "markdown") {
      return (
        <ResumeMarkdownPanel
          onChange={(value) => applyMarkdownDraft(value, "已更新")}
          onClear={() => {
            if (window.confirm("清空 Markdown？")) {
              applyMarkdownDraft("", "已清空");
            }
          }}
          onInsertStarter={() => applyMarkdownDraft(markdownStarter, "已插入结构")}
          parseError={markdownError}
          value={markdownDraft}
        />
      );
    }

    if (!activeSectionDefinition || !activeSection) return null;

    return (
      <ResumeSectionEditor
        activeItemId={activeSectionItemId}
        document={document}
        definition={activeSectionDefinition}
        focusItemId={focusItemId}
        onActiveItemChange={setActiveSectionItemId}
        onAddItem={(options) => insertSectionItem(activePanel, { afterItemId: options?.afterItemId })}
        onChange={(nextSection) =>
          updateDocument(
            (current) => ({
              ...current,
              sections: current.sections.map((item) => (item.id === nextSection.id ? nextSection : item)),
            }),
            {
              historyLabel: `修改${activeSectionDefinition.title}`,
              clearDeletion: true,
            },
          )
        }
        onCopyItem={(itemId) => void copySectionItem(activePanel, itemId)}
        onDeleteItem={(itemId) => deleteSectionItem(activePanel, itemId)}
        onDuplicateItem={(itemId) => {
          const source = activeSection.items.find((item) => item.id === itemId);
          if (source) {
            insertSectionItem(activePanel, {
              afterItemId: itemId,
              duplicateFrom: source,
            });
          }
        }}
        onMoveItem={(itemId, direction) => moveSectionItem(activePanel, itemId, direction)}
        section={activeSection}
        writerProfile={document.meta.writerProfile}
      />
    );
  };

  return (
    <main className="resume-editor-workspace">
      <ResumeEditorToolbar
        editorMode={editorMode}
        onBack={() => void handleBack()}
        onModeChange={handleModeChange}
        onOpenPreview={() => void handleOpenPreview()}
        onSave={() => void saveDocument("manual")}
        onTitleChange={updateResumeTitle}
        saveState={saveState}
        statusMessage={statusMessage}
        title={document.meta.title}
      />

      {importReview ? (
        <section className="resume-editor-import-banner">
          <div>
            <p className="editor-workflow-kicker">导入校对</p>
            <div className="editor-workflow-head">
              <strong>{importReview.title}</strong>
              <span>
                {importReview.remainingCount > 0
                  ? `${importReview.remainingCount} 个待核对项`
                  : "已进入整理阶段"}
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
              {importReview.reviewTaskCount > 0 ? (
                <Badge tone="neutral">{importReview.reviewTaskCount} 个待处理任务</Badge>
              ) : null}
              {importReview.fieldSuggestionCount > 0 ? (
                <Badge tone="neutral">{importReview.fieldSuggestionCount} 个字段核对建议</Badge>
              ) : null}
              {importReview.snapshotCount > 0 ? (
                <Badge tone="neutral">{importReview.snapshotCount} 个原始片段</Badge>
              ) : null}
              {importReview.unmappedItemCount > 0 ? (
                <Badge tone="warning">{importReview.unmappedItemCount} 个未映射提示</Badge>
              ) : null}
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
              当前导入结果已结构化为可编辑草稿，建议先核对待确认项，再决定是否继续润色或补全。
            </p>
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

          {importReview.unmappedItems.length > 0 ? (
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
          ) : null}

          {importReview.fieldSuggestions.length > 0 ? (
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
          ) : null}

          {importReview.reviewTasks.length > 0 ? (
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
          ) : null}

          {importReview.snapshots.length > 0 ? (
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
          ) : null}

          <div className="editor-workflow-actions">
            <Button onClick={handleFocusImportedBasics} variant="secondary">
              {importReview.primaryActionLabel}
            </Button>
            <Button onClick={handleFocusImportedContent}>
              {importReview.secondaryActionLabel}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="editor-workflow-strip">
        <div>
          <p className="editor-workflow-kicker">当前阶段</p>
          <div className="editor-workflow-head">
            <strong>{workbenchReport.workflow.currentLabel}</strong>
            <span>{workbenchReport.score} / 100</span>
          </div>
          <p className="editor-workflow-copy">{workbenchReport.workflow.currentDescription}</p>
        </div>
        <div>
          <p className="editor-workflow-kicker">下一步</p>
          <div className="editor-workflow-head">
            <strong>{nextTask?.title ?? "可以进入预览导出"}</strong>
            <span>{nextTask ? "下一项" : "可去预览"}</span>
          </div>
          <p className="editor-workflow-copy">
            {nextTask?.detail ?? "继续检查版式与导出风险，确认后再导出 PDF。"}
          </p>
        </div>
        <div className="editor-workflow-actions">
          <Button onClick={() => handleJumpToNextTask()} variant="secondary">
            {nextTask?.action.label ?? "进入预览导出"}
          </Button>
          <Button onClick={() => void handleOpenPreview()}>
            预览导出
          </Button>
        </div>
      </section>

      {highlightedDiagnostics.length > 0 ? (
        <section className="editor-diagnostic-strip">
          <div className="editor-diagnostic-strip-head">
            <div>
              <p className="editor-workflow-kicker">优先优化</p>
              <div className="editor-workflow-head">
                <strong>先处理这几个最影响完成度的问题</strong>
                <span>{highlightedDiagnostics.length} 项</span>
              </div>
              <p className="editor-workflow-copy">
                这些建议直接来自当前草稿诊断，优先处理后，整份简历会更容易进入可导出状态。
              </p>
            </div>
          </div>

          <div className="editor-diagnostic-list">
            {highlightedDiagnostics.map((issue) => (
              <article className="editor-diagnostic-item" key={issue.id}>
                <div className="editor-diagnostic-copy">
                  <div className="editor-diagnostic-head">
                    <strong>{issue.message}</strong>
                    <Badge tone={issue.severity === "blocker" ? "warning" : "neutral"}>
                      {issue.severity === "blocker" ? "必改" : "建议"}
                    </Badge>
                  </div>
                  <p>{issue.suggestion}</p>
                </div>
                <Button onClick={() => handleFocusDiagnostic(issue.target)} variant="secondary">
                  {issue.target === "export" ? "去预览检查" : "去处理"}
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {recentDeletion ? (
        <section className="resume-editor-notice">
          <div>
            <strong>已删除“{recentDeletion.item.title || recentDeletion.sectionTitle}”</strong>
            <p>可恢复</p>
          </div>
          <Button onClick={() => restoreDeletedItem()} variant="secondary">
            <RotateCcw className="size-4" />
            恢复
          </Button>
        </section>
      ) : null}

      <section className="resume-editor-layout">
        <ResumeEditorSidebar activePanel={activePanel} items={sidebarItems} onSelect={handlePanelSelect} />

        <div className="resume-editor-main">
          {renderCurrentPanel()}
        </div>

        <ResumePreviewPanel
          html={previewHtml}
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

      <EditorShortcutDialog onClose={() => setShortcutOpen(false)} open={shortcutOpen} />
    </main>
  );
}
