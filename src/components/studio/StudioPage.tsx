"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  ArrowUp,
  Copy,
  FileDown,
  FilePlus2,
  FileUp,
  RefreshCw,
  Link2,
  LoaderCircle,
  Plus,
  Save,
  Target,
  Trash2,
} from "lucide-react";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { RichTextEditor } from "@/components/studio/RichTextEditor";
import {
  buildResumeExportChecklist,
  buildResumeQualityReport,
} from "@/lib/resume-analysis";
import {
  getResumeTemplateLayoutPreset,
  resumeWriterProfileMeta,
} from "@/lib/resume-document";
import {
  buildResumeWorkbenchReport,
  resumeWorkflowStateMeta,
  type ResumeWorkbenchTask,
} from "@/lib/resume-workbench";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import {
  analyzeResumeTargeting,
  parseFocusKeywords,
} from "@/lib/resume-targeting";
import { buildTailoredVariantPlan } from "@/lib/resume-tailoring";
import { createId, slugify } from "@/lib/utils";
import type {
  ResumeDocument,
  ResumeSection,
  ResumeSectionItem,
  ResumeTemplate,
  ResumeWorkflowState,
  ResumeWriterProfile,
} from "@/types/resume";

function createSection(type: ResumeSection["type"]): ResumeSection {
  return {
    id: createId("section"),
    type,
    title:
      type === "experience"
        ? "新的工作经历"
        : type === "projects"
          ? "新的项目章节"
          : type === "skills"
            ? "技能清单"
            : type === "summary"
              ? "职业概述"
              : type === "education"
                ? "教育经历"
                : "自定义章节",
    visible: true,
    layout: type === "skills" ? "tag-grid" : type === "summary" ? "rich-text" : "stacked-list",
    contentHtml: "",
    items: [],
  };
}

function createItem(): ResumeSectionItem {
  return {
    id: createId("item"),
    title: "",
    subtitle: "",
    location: "",
    dateRange: "",
    meta: "",
    summaryHtml: "<p></p>",
    bulletPoints: [],
    tags: [],
  };
}

function moveByOffset<T>(items: T[], index: number, offset: number) {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const cloned = [...items];
  const [value] = cloned.splice(index, 1);
  cloned.splice(nextIndex, 0, value);
  return cloned;
}

function normalizeLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function countDocumentItems(document: ResumeDocument) {
  return document.sections.reduce((total, section) => total + section.items.length, 0);
}

function formatDateTime(value: string) {
  if (!value) return "";
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "";
  return timestamp.toLocaleString("zh-CN");
}

function getLatestImportInfo(document: ResumeDocument) {
  const portfolioTimestamp = document.importTrace.portfolioImportedAt
    ? Date.parse(document.importTrace.portfolioImportedAt)
    : Number.NaN;
  const pdfTimestamp = document.importTrace.pdfImportedAt
    ? Date.parse(document.importTrace.pdfImportedAt)
    : Number.NaN;

  if (Number.isNaN(portfolioTimestamp) && Number.isNaN(pdfTimestamp)) {
    return null;
  }

  if (!Number.isNaN(pdfTimestamp) && (Number.isNaN(portfolioTimestamp) || pdfTimestamp >= portfolioTimestamp)) {
    return {
      sourceLabel: "PDF",
      importedAt: document.importTrace.pdfImportedAt,
      note: "已经把旧 PDF 重建成结构化草稿，接下来重点检查待确认内容。",
    };
  }

  return {
    sourceLabel: "Portfolio",
    importedAt: document.importTrace.portfolioImportedAt,
    note: "已经把 portfolio 内容提取进简历草稿，接下来重点补写结果和排序。",
  };
}

const keywordAreaLabels = {
  headline: "标题",
  summary: "摘要",
  experience: "工作经历",
  projects: "项目经历",
  skills: "技能",
  education: "教育经历",
  custom: "自定义章节",
} as const;

const sectionTypeLabels = {
  summary: "摘要",
  experience: "工作经历",
  projects: "项目经历",
  skills: "技能",
  education: "教育经历",
  custom: "自定义章节",
} as const;

const templateOptions: Array<{
  value: ResumeTemplate;
  label: string;
  description: string;
  chips: string[];
}> = [
  {
    value: "modern-two-column",
    label: "现代双栏",
    description: "左侧放摘要/技能，右侧放主经历，适合信息密度高的岗位简历。",
    chips: ["双栏", "强调摘要", "信息密度高"],
  },
  {
    value: "classic-single-column",
    label: "经典单栏",
    description: "单列连续阅读路径，更稳妥，适合传统行业、通用投递和打印阅读。",
    chips: ["单栏", "连续阅读", "更传统"],
  },
];

const workflowStateOptions = [
  "drafting",
  "tailoring",
  "ready",
] satisfies ResumeWorkflowState[];

const writerProfileOptions = [
  "campus",
  "experienced",
  "career-switch",
] satisfies ResumeWriterProfile[];

type DraftSaveState = "saved" | "dirty" | "autosaving" | "saving" | "error";

function getDraftSaveLabel(saveState: DraftSaveState) {
  switch (saveState) {
    case "dirty":
      return "有未保存更改";
    case "autosaving":
      return "自动保存中…";
    case "saving":
      return "保存中…";
    case "error":
      return "保存失败";
    default:
      return "已全部保存";
  }
}

async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export function StudioPage({
  initialDocument,
}: {
  initialDocument: ResumeDocument;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [document, setDocument] = useState(initialDocument);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialDocument.sections[0]?.id ?? null,
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(
    initialDocument.sections[0]?.items[0]?.id ?? null,
  );
  const [statusMessage, setStatusMessage] = useState("简历草稿已就绪。");
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("saved");
  const [busyLabel, setBusyLabel] = useState("");
  const [tailoringBusy, setTailoringBusy] = useState(false);
  const [tailoringError, setTailoringError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestDocumentRef = useRef(initialDocument);
  const lastSavedSerializedRef = useRef(JSON.stringify(initialDocument));
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedAutosaveRef = useRef(false);
  const handledOnboardingRef = useRef<string | null>(null);
  const handledFocusRef = useRef<string | null>(null);
  const deferredDocument = useDeferredValue(document);

  const activeSection = document.sections.find((section) => section.id === activeSectionId)
    ?? document.sections[0]
    ?? null;
  const activeItem =
    activeSection?.items.find((item) => item.id === activeItemId) ?? activeSection?.items[0] ?? null;
  const previewHtml = useMemo(
    () => buildResumePreviewHtml(deferredDocument),
    [deferredDocument],
  );
  const qualityReport = useMemo(() => buildResumeQualityReport(document), [document]);
  const diagnostics = qualityReport.issues;
  const targetingAnalysis = useMemo(
    () => analyzeResumeTargeting(document),
    [document],
  );
  const tailoredPlan = useMemo(() => buildTailoredVariantPlan(document), [document]);
  const tailoredPreviewItems = useMemo(
    () =>
      [...tailoredPlan.itemPlans]
        .filter((itemPlan) => itemPlan.action !== "drop")
        .sort((left, right) => right.score - left.score || left.itemTitle.localeCompare(right.itemTitle))
        .slice(0, 6),
    [tailoredPlan],
  );
  const serializedDocument = useMemo(() => JSON.stringify(document), [document]);
  const hasUnsavedChanges = serializedDocument !== lastSavedSerializedRef.current;
  const workbenchReport = useMemo(
    () =>
      buildResumeWorkbenchReport(document, {
        diagnostics,
        qualityReport,
        targetingAnalysis,
      }),
    [diagnostics, document, qualityReport, targetingAnalysis],
  );
  const latestImportInfo = useMemo(
    () => getLatestImportInfo(document),
    [document],
  );
  const importSummary = useMemo(() => {
    const totalItems = countDocumentItems(document);
    return {
      latestImportInfo,
      hasImportedContent: !!latestImportInfo,
      sectionCount: document.sections.length,
      itemCount: totalItems,
      pendingReviewCount: document.importTrace.pendingReview.length,
      unmappedCount: document.importTrace.unmapped.length,
    };
  }, [document, latestImportInfo]);
  const exportChecklist = useMemo(
    () => buildResumeExportChecklist(document, qualityReport),
    [document, qualityReport],
  );
  const exportChecklistSummary = useMemo(() => {
    const completedCount = exportChecklist.filter((item) => item.done).length;
    const requiredPendingCount = exportChecklist.filter((item) => item.required && !item.done).length;
    return {
      completedCount,
      totalCount: exportChecklist.length,
      requiredPendingCount,
    };
  }, [exportChecklist]);
  const onboardingAction = searchParams.get("onboarding");
  const focusAction = searchParams.get("focus");
  const isGuidedStarter = document.meta.sourceRefs.includes("starter:guided");
  const writerProfileMeta = resumeWriterProfileMeta[document.meta.writerProfile];
  const showStarterChecklist = useMemo(
    () =>
      isGuidedStarter &&
      !document.basics.name.trim() &&
      !document.basics.headline.trim() &&
      document.sections.every((section) =>
        section.items.every((item) =>
          [
            item.title,
            item.subtitle,
            item.location,
            item.dateRange,
            item.meta,
            ...item.bulletPoints,
            ...item.tags,
          ]
            .join("")
            .trim().length > 0,
        ),
      ),
    [document, isGuidedStarter],
  );

  const syncEditorSelection = (nextDocument: ResumeDocument) => {
    setActiveSectionId(nextDocument.sections[0]?.id ?? null);
    setActiveItemId(nextDocument.sections[0]?.items[0]?.id ?? null);
  };

  const adoptSavedDocument = (
    nextDocument: ResumeDocument,
    options: { resetSelection?: boolean } = {},
  ) => {
    const serialized = JSON.stringify(nextDocument);
    lastSavedSerializedRef.current = serialized;
    latestDocumentRef.current = nextDocument;
    setDraftSaveState("saved");
    startTransition(() => {
      setDocument(nextDocument);
      if (options.resetSelection) {
        syncEditorSelection(nextDocument);
      }
    });
  };

  const updateDocument = (
    updater: (current: ResumeDocument) => ResumeDocument,
    message?: string,
  ) => {
    setDocument((current) => updater(current));
    if (message) setStatusMessage(message);
  };

  const updateBasics = (field: keyof ResumeDocument["basics"], value: string) => {
    updateDocument(
      (current) => ({
        ...current,
        basics: {
          ...current.basics,
          [field]: value,
        },
      }),
      "基础信息已更新。",
    );
  };

  const focusEditorSurface = (surfaceId: string) => {
    requestAnimationFrame(() => {
      window.document
        .getElementById(surfaceId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const setWorkflowState = (workflowState: ResumeWorkflowState, message?: string) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          workflowState,
        },
      }),
      message ?? `当前状态已切换为${resumeWorkflowStateMeta[workflowState].label}。`,
    );
  };

  const setWriterProfile = (writerProfile: ResumeWriterProfile) => {
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          writerProfile,
          sourceRefs: Array.from(
            new Set([
              ...current.meta.sourceRefs.filter((ref) => !ref.startsWith("writer-profile:")),
              `writer-profile:${writerProfile}`,
            ]),
          ),
        },
      }),
      `当前写作档案已切换为${resumeWriterProfileMeta[writerProfile].label}。`,
    );
  };

  const persistDocument = async (mode: "manual" | "autosave") => {
    const currentDocument = latestDocumentRef.current;
    const serializedCurrent = JSON.stringify(currentDocument);
    if (serializedCurrent === lastSavedSerializedRef.current) {
      setDraftSaveState("saved");
      return;
    }

    if (saveInFlightRef.current) {
      queuedAutosaveRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    setDraftSaveState(mode === "manual" ? "saving" : "autosaving");

    try {
      const saved = await getJson<ResumeDocument>(
        await fetch(`/api/resumes/${currentDocument.meta.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serializedCurrent,
        }),
      );

      adoptSavedDocument(saved);
      setStatusMessage(mode === "manual" ? "草稿已保存。" : "草稿已自动保存。");
    } catch (error) {
      setDraftSaveState("error");
      setStatusMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      saveInFlightRef.current = false;

      if (queuedAutosaveRef.current) {
        queuedAutosaveRef.current = false;
        const latestSerialized = JSON.stringify(latestDocumentRef.current);
        if (latestSerialized !== lastSavedSerializedRef.current) {
          void persistDocument("autosave");
        }
      }
    }
  };

  const triggerAutosave = useEffectEvent(() => {
    void persistDocument("autosave");
  });

  useEffect(() => {
    latestDocumentRef.current = document;
  }, [document]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      if (!saveInFlightRef.current) {
        setDraftSaveState("saved");
      }
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      return;
    }

    if (!saveInFlightRef.current) {
      setDraftSaveState("dirty");
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      triggerAutosave();
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [hasUnsavedChanges, serializedDocument]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const latestSerialized = JSON.stringify(latestDocumentRef.current);
      if (latestSerialized === lastSavedSerializedRef.current && !saveInFlightRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const updateSection = (
    sectionId: string,
    updater: (section: ResumeSection) => ResumeSection,
    message?: string,
  ) => {
    updateDocument(
      (current) => ({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? updater(section) : section,
        ),
      }),
      message,
    );
  };

  const updateActiveItem = (
    updater: (item: ResumeSectionItem) => ResumeSectionItem,
    message?: string,
  ) => {
    if (!activeSection || !activeItem) return;
    const targetSectionId = activeSection.id;
    const targetItemId = activeItem.id;

    updateSection(
      targetSectionId,
      (section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === targetItemId ? updater(item) : item,
        ),
      }),
      message,
    );
  };

  const saveDocument = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    await persistDocument("manual");
  };

  const importPortfolio = async () => {
    setBusyLabel("正在导入 portfolio");

    try {
      const result = await getJson<{ document: ResumeDocument }>(
        await fetch("/api/import/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: document.meta.id }),
        }),
      );

      adoptSavedDocument(result.document, { resetSelection: true });
      const itemCount = countDocumentItems(result.document);
      const reviewCount = result.document.importTrace.pendingReview.length;
      setStatusMessage(
        `已导入 portfolio：${result.document.sections.length} 个章节 / ${itemCount} 条内容${reviewCount > 0 ? `，另有 ${reviewCount} 条待确认` : ""}。`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "导入 portfolio 失败。");
    } finally {
      setBusyLabel("");
    }
  };

  const importPdf = async (file: File) => {
    setBusyLabel("正在导入 PDF");

    try {
      const formData = new FormData();
      formData.set("resumeId", document.meta.id);
      formData.set("file", file);

      const result = await getJson<{ document: ResumeDocument }>(
        await fetch("/api/import/pdf", {
          method: "POST",
          body: formData,
        }),
      );

      adoptSavedDocument(result.document, { resetSelection: true });
      const itemCount = countDocumentItems(result.document);
      const reviewCount = result.document.importTrace.pendingReview.length;
      setStatusMessage(
        `PDF 已导入：${result.document.sections.length} 个章节 / ${itemCount} 条内容${reviewCount > 0 ? `，另有 ${reviewCount} 条待确认` : ""}。`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "导入 PDF 失败。");
    } finally {
      setBusyLabel("");
    }
  };

  const exportPdf = async () => {
    if (qualityReport.blockingIssues.length > 0) {
      focusEditorSurface("editor-export-checklist");
      setStatusMessage(`导出前还缺 ${qualityReport.blockingIssues.length} 项必查内容，请先完成导出前检查。`);
      return;
    }

    setBusyLabel("正在导出 PDF");

    try {
      const response = await fetch(`/api/resumes/${document.meta.id}/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const browserDocument = window.document;
      const anchor = browserDocument.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${slugify(document.meta.title)}.pdf`;
      browserDocument.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setStatusMessage(`PDF 已导出，并留档到 data/resumes/${document.meta.id}/exports。`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "导出 PDF 失败。");
    } finally {
      setBusyLabel("");
    }
  };

  const addSection = (type: ResumeSection["type"]) => {
    const nextSection = createSection(type);
    updateDocument(
      (current) => ({
        ...current,
        sections: [...current.sections, nextSection],
      }),
      "章节已添加。",
    );
    setActiveSectionId(nextSection.id);
    setActiveItemId(null);
  };

  const addItemToActiveSection = () => {
    if (!activeSection) return;
    const nextItem = createItem();

    updateSection(
      activeSection.id,
      (section) => ({
        ...section,
        items: [...section.items, nextItem],
      }),
      "条目已添加。",
    );
    setActiveItemId(nextItem.id);
  };

  const removeActiveSection = () => {
    if (!activeSection) return;
    const nextSections = document.sections.filter(
      (section) => section.id !== activeSection.id,
    );
    updateDocument(
      (current) => ({
        ...current,
        sections: nextSections,
      }),
      "章节已删除。",
    );
    setActiveSectionId(nextSections[0]?.id ?? null);
    setActiveItemId(nextSections[0]?.items[0]?.id ?? null);
  };

  const removeActiveItem = () => {
    if (!activeSection || !activeItem) return;
    const nextItems = activeSection.items.filter((item) => item.id !== activeItem.id);
    updateSection(
      activeSection.id,
      (section) => ({
        ...section,
        items: nextItems,
      }),
      "条目已删除。",
    );
    setActiveItemId(nextItems[0]?.id ?? null);
  };

  const busy = busyLabel !== "";

  const applySuggestedKeywords = () => {
    if (targetingAnalysis.suggestedKeywords.length === 0) return;

    updateDocument(
      (current) => ({
        ...current,
        targeting: {
          ...current.targeting,
          focusKeywords: targetingAnalysis.suggestedKeywords,
        },
      }),
      "已应用建议关键词。",
    );
  };

  const openSectionEditor = (
    sectionType: ResumeSection["type"],
    options: { ensureItem?: boolean } = {},
  ) => {
    const existingSection = document.sections.find((section) => section.type === sectionType);

    if (existingSection) {
      if (options.ensureItem && existingSection.items.length === 0) {
        const nextItem = createItem();
        updateSection(
          existingSection.id,
          (section) => ({
            ...section,
            items: [...section.items, nextItem],
          }),
          "已为该章节添加第一条内容。",
        );
        setActiveSectionId(existingSection.id);
        setActiveItemId(nextItem.id);
        focusEditorSurface("editor-item-detail");
        return;
      }

      setActiveSectionId(existingSection.id);
      setActiveItemId(existingSection.items[0]?.id ?? null);
      focusEditorSurface(options.ensureItem ? "editor-item-detail" : "editor-section-detail");
      return;
    }

    const nextSection = createSection(sectionType);
    const nextItem = options.ensureItem ? createItem() : null;
    if (nextItem) {
      nextSection.items = [nextItem];
    }

    updateDocument(
      (current) => ({
        ...current,
        sections: [...current.sections, nextSection],
      }),
      `已添加${sectionTypeLabels[sectionType]}章节。`,
    );
    setActiveSectionId(nextSection.id);
    setActiveItemId(nextItem?.id ?? null);
    focusEditorSurface(options.ensureItem ? "editor-item-detail" : "editor-section-detail");
  };

  const handleWorkbenchTask = (task: ResumeWorkbenchTask) => {
    switch (task.action.type) {
      case "focus-basics":
        focusEditorSurface("editor-basics");
        break;
      case "focus-summary":
        focusEditorSurface("editor-summary");
        break;
      case "focus-targeting":
        focusEditorSurface("editor-targeting");
        break;
      case "focus-export":
        focusEditorSurface("editor-export-checklist");
        break;
      case "ensure-experience":
        openSectionEditor("experience", { ensureItem: true });
        break;
      case "ensure-bullet": {
        const preferredSection =
          document.sections.find((section) => section.type === "experience")
          ?? document.sections.find((section) => section.type === "projects");

        if (preferredSection) {
          if (preferredSection.items.length === 0) {
            openSectionEditor(preferredSection.type, { ensureItem: true });
            return;
          }

          setActiveSectionId(preferredSection.id);
          setActiveItemId(preferredSection.items[0]?.id ?? null);
          focusEditorSurface("editor-item-detail");
          return;
        }

        openSectionEditor("experience", { ensureItem: true });
        break;
      }
      case "apply-suggested-keywords":
        if (targetingAnalysis.suggestedKeywords.length > 0) {
          applySuggestedKeywords();
        }
        focusEditorSurface("editor-targeting");
        break;
      case "set-workflow":
        setWorkflowState(task.action.workflowState);
        focusEditorSurface("editor-workbench");
        break;
      default:
        break;
    }
  };

  const confirmLeaveStudio = () => {
    if (!hasUnsavedChanges && !saveInFlightRef.current) {
      return true;
    }

      return window.confirm(
      "还有未保存的修改。确认离开工作台并丢弃最近的本地编辑吗？",
    );
  };

  const generateTailoredVariant = async () => {
    setTailoringBusy(true);
    setTailoringError(null);
    setBusyLabel("正在生成定制版本");

    try {
      const result = await getJson<{ document: ResumeDocument }>(
        await fetch(`/api/resumes/${document.meta.id}/generate-tailored-variant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document,
            title: tailoredPlan.titleSuggestion,
          }),
        }),
      );

      setStatusMessage("已生成定制版本。");
      router.push(`/studio/${encodeURIComponent(result.document.meta.id)}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "生成定制版本失败。";
      setTailoringError(message);
      setStatusMessage(message);
    } finally {
      setTailoringBusy(false);
      setBusyLabel("");
    }
  };

  const runOnboardingAction = useEffectEvent((action: string) => {
    if (action === "portfolio") {
      void importPortfolio();
      setStatusMessage("正在根据 portfolio 生成第一版草稿。");
      return;
    }

    if (action === "pdf") {
      setStatusMessage("请选择一份旧 PDF，我们会把它导入成可编辑草稿。");
      fileInputRef.current?.click();
    }
  });

  useEffect(() => {
    if (!onboardingAction) return;

    const handledKey = `${document.meta.id}:${onboardingAction}`;
    if (handledOnboardingRef.current === handledKey) return;
    handledOnboardingRef.current = handledKey;

    runOnboardingAction(onboardingAction);
    router.replace(`/studio/${document.meta.id}`);
  }, [document.meta.id, onboardingAction, router]);

  const runFocusAction = useEffectEvent((target: string) => {
    switch (target) {
      case "basics":
        focusEditorSurface("editor-basics");
        break;
      case "summary":
        focusEditorSurface("editor-summary");
        break;
      case "targeting":
        focusEditorSurface("editor-targeting");
        break;
      case "content":
        openSectionEditor("experience", { ensureItem: true });
        break;
      case "export":
        focusEditorSurface("editor-export-checklist");
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    if (!focusAction) return;

    const handledKey = `${document.meta.id}:${focusAction}`;
    if (handledFocusRef.current === handledKey) return;
    handledFocusRef.current = handledKey;

    runFocusAction(focusAction);
    router.replace(`/studio/${document.meta.id}`);
  }, [document.meta.id, focusAction, router]);

  const applyTemplate = (template: ResumeTemplate) => {
    const preset = getResumeTemplateLayoutPreset(template);
    updateDocument(
      (current) => ({
        ...current,
        meta: {
          ...current.meta,
          template,
        },
        layout: preset,
      }),
      `已切换到${template === "modern-two-column" ? "现代双栏" : "经典单栏"}模板。`,
    );
  };

  const reapplyTemplatePreset = () => {
    const preset = getResumeTemplateLayoutPreset(document.meta.template);
    updateDocument(
      (current) => ({
        ...current,
        layout: preset,
      }),
      "已重新应用当前模板的排版预设。",
    );
  };

  const applySuggestedWorkflowState = () => {
    if (document.meta.workflowState === workbenchReport.workflow.suggestedState) return;
    setWorkflowState(
      workbenchReport.workflow.suggestedState,
      `已切换为${workbenchReport.workflow.suggestedLabel}。`,
    );
  };

  return (
    <main className="app-shell">
      <div className="grain" />
      <div className="mx-auto flex max-w-[1700px] flex-col gap-6">
        <header className="panel rounded-[30px] px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <Link
                href="/"
                className="pill w-fit"
                onClick={(event) => {
                  if (!confirmLeaveStudio()) {
                    event.preventDefault();
                  }
                }}
              >
                <ArrowLeft size={14} />
                返回简历库
              </Link>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.05em]">
                  {document.meta.title}
                </h1>
                <p className="meta-note">
                  {document.meta.id} · 最后更新于{" "}
                  {new Date(document.meta.updatedAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="ghost-button" type="button" onClick={importPortfolio}>
                <FileUp size={16} />
                导入 portfolio
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <FilePlus2 size={16} />
                导入 PDF
              </button>
              <button className="ghost-button" type="button" onClick={saveDocument}>
                <Save size={16} />
                保存草稿
              </button>
              <Link
                className="ghost-button"
                href={`/studio/${document.meta.id}/preview`}
                target="_blank"
              >
                <ArrowUpRight size={16} />
                打印预览
              </Link>
              <button
                className="action-button"
                type="button"
                onClick={() => focusEditorSurface("editor-export-checklist")}
              >
                <FileDown size={16} />
                查看导出前检查
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="pill">{document.sections.length} 个章节</span>
            <span className="pill">{document.importTrace.pendingReview.length} 条审阅备注</span>
            <span className="pill">{workbenchReport.workflow.currentLabel}</span>
            <span className="pill">{writerProfileMeta.label}</span>
            <span className="pill">
              {(draftSaveState === "autosaving" || draftSaveState === "saving") ? (
                <>
                  <LoaderCircle className="animate-spin" size={14} />
                  {getDraftSaveLabel(draftSaveState)}
                </>
              ) : (
                getDraftSaveLabel(draftSaveState)
              )}
            </span>
            <span className="pill">
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={14} />
                  {busyLabel}
                </>
              ) : (
                statusMessage
              )}
            </span>
          </div>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void importPdf(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </header>

        <div className="studio-layout">
          <aside className="panel studio-pane editor-scroll">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">大纲</h2>
                <p className="meta-note">在章节和条目之间快速切换，专注当前简历内容。</p>
              </div>
            </div>
            <div className="stack">
              {document.sections.map((section, sectionIndex) => (
                <div key={section.id} className="stack">
                  <button
                    className="section-nav-item"
                    data-active={section.id === activeSection?.id}
                    type="button"
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setActiveItemId(section.items[0]?.id ?? null);
                    }}
                  >
                    <strong>{section.title}</strong>
                    <span className="meta-note">
                      {sectionTypeLabels[section.type]} · {section.items.length} 条内容
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        updateDocument((current) => ({
                          ...current,
                          sections: moveByOffset(current.sections, sectionIndex, -1),
                        }))
                      }
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        updateDocument((current) => ({
                          ...current,
                          sections: moveByOffset(current.sections, sectionIndex, 1),
                        }))
                      }
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  {section.items.length > 0 ? (
                    <div className="ml-3 space-y-2 border-l border-[var(--line)] pl-3">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="section-nav-item"
                          data-active={item.id === activeItem?.id}
                          onClick={() => {
                            setActiveSectionId(section.id);
                            setActiveItemId(item.id);
                          }}
                        >
                          <strong>{item.title || "未命名条目"}</strong>
                          <span className="meta-note">
                            {[item.subtitle, item.dateRange].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-6 stack">
              <div className="toolbar">
                <button type="button" onClick={() => addSection("summary")}>
                  <Plus size={14} />
                  摘要
                </button>
                <button type="button" onClick={() => addSection("experience")}>
                  <Plus size={14} />
                  工作经历
                </button>
                <button type="button" onClick={() => addSection("projects")}>
                  <Plus size={14} />
                  项目经历
                </button>
                <button type="button" onClick={() => addSection("skills")}>
                  <Plus size={14} />
                  技能
                </button>
                <button type="button" onClick={() => addSection("custom")}>
                  <Plus size={14} />
                  自定义
                </button>
              </div>
            </div>
          </aside>

          <section className="panel studio-pane editor-scroll">
            <div className="stack">
              <div id="editor-basics" className="editor-card stack">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="field-label">简历标题</label>
                    <input
                      className="text-field"
                      value={document.meta.title}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          meta: {
                            ...current.meta,
                            title: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="field-label">模板</label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {templateOptions.map((templateOption) => {
                        const active = document.meta.template === templateOption.value;
                        return (
                          <button
                            key={templateOption.value}
                            type="button"
                            className="template-option"
                            data-active={active}
                            onClick={() => applyTemplate(templateOption.value)}
                          >
                            <div className="template-option__preview" data-template={templateOption.value}>
                              <span />
                              <span />
                              <span />
                            </div>
                            <div className="template-option__body">
                              <div className="template-option__title-row">
                                <strong>{templateOption.label}</strong>
                                <span className="pill">{active ? "当前模板" : "可切换"}</span>
                              </div>
                              <p className="meta-note">{templateOption.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {templateOption.chips.map((chip) => (
                                  <span key={chip} className="pill">
                                    {chip}
                                  </span>
                                ))}
                              </div>
                              <p className="meta-note">
                                预设：{getResumeTemplateLayoutPreset(templateOption.value).headingFont}
                                {" / "}
                                {getResumeTemplateLayoutPreset(templateOption.value).bodyFont}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--line)] bg-white/60 p-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[var(--ink-strong)]">
                          当前模板预设
                        </p>
                        <p className="meta-note">
                          {document.meta.template === "modern-two-column"
                            ? "现代双栏"
                            : "经典单栏"}
                          {" · "}
                          标题字体 {document.layout.headingFont}
                          {" · "}
                          正文字体 {document.layout.bodyFont}
                          {" · "}
                          页边距 {document.layout.marginsMm}mm
                          {" · "}
                          行高 {document.layout.lineHeight}
                        </p>
                      </div>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={reapplyTemplatePreset}
                      >
                        <RefreshCw size={14} />
                        重新应用模板预设
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="field-label">姓名</label>
                    <input
                      className="text-field"
                      value={document.basics.name}
                      onChange={(event) => updateBasics("name", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">职位标题</label>
                    <input
                      className="text-field"
                      value={document.basics.headline}
                      onChange={(event) => updateBasics("headline", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">所在地</label>
                    <input
                      className="text-field"
                      value={document.basics.location}
                      onChange={(event) => updateBasics("location", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">强调色</label>
                    <input
                      className="text-field"
                      type="color"
                      value={document.layout.accentColor}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          layout: {
                            ...current.layout,
                            accentColor: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">页边距（mm）</label>
                    <input
                      className="text-field"
                      type="number"
                      min={8}
                      max={24}
                      value={document.layout.marginsMm}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          layout: {
                            ...current.layout,
                            marginsMm: Number(event.target.value || 14),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">行高</label>
                    <input
                      className="text-field"
                      type="number"
                      min={1.1}
                      max={2}
                      step={0.05}
                      value={document.layout.lineHeight}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          layout: {
                            ...current.layout,
                            lineHeight: Number(event.target.value || 1.45),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">段落间距（mm）</label>
                    <input
                      className="text-field"
                      type="number"
                      min={1}
                      max={8}
                      step={0.5}
                      value={document.layout.paragraphGapMm}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          layout: {
                            ...current.layout,
                            paragraphGapMm: Number(event.target.value || 3),
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">正文字体</label>
                    <input
                      className="text-field"
                      value={document.layout.bodyFont}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          layout: {
                            ...current.layout,
                            bodyFont: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">标题字体</label>
                    <input
                      className="text-field"
                      value={document.layout.headingFont}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          layout: {
                            ...current.layout,
                            headingFont: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">邮箱</label>
                    <input
                      className="text-field"
                      value={document.basics.email}
                      onChange={(event) => updateBasics("email", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">电话</label>
                    <input
                      className="text-field"
                      value={document.basics.phone}
                      onChange={(event) => updateBasics("phone", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">个人网站</label>
                    <input
                      className="text-field"
                      value={document.basics.website}
                      onChange={(event) => updateBasics("website", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div id="editor-workbench" className="editor-card stack">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      工作台总览
                    </h2>
                    <p className="meta-note">
                      用完成度、风险和下一步动作来管理这份简历，而不是只盯着字段本身。
                    </p>
                  </div>
                  <div className="workbench-score-card">
                    <strong>{workbenchReport.score}</strong>
                    <span>{workbenchReport.readinessLabel}</span>
                  </div>
                </div>

                <div className="workbench-stat-grid">
                  <article className="workbench-stat-card">
                    <span className="meta-note">可见章节</span>
                    <strong>{workbenchReport.stats.visibleSections}</strong>
                  </article>
                  <article className="workbench-stat-card">
                    <span className="meta-note">内容条目</span>
                    <strong>{workbenchReport.stats.totalItems}</strong>
                  </article>
                  <article className="workbench-stat-card">
                    <span className="meta-note">结果型要点</span>
                    <strong>{workbenchReport.stats.totalBullets}</strong>
                  </article>
                  <article className="workbench-stat-card">
                    <span className="meta-note">关键词</span>
                    <strong>{workbenchReport.stats.keywords}</strong>
                  </article>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {workbenchReport.areaScores.map((areaScore) => (
                    <article key={areaScore.id} className="workbench-area-card">
                      <div className="flex items-center justify-between gap-3">
                        <strong>{areaScore.label}</strong>
                        <span className="pill">{areaScore.score} / 100</span>
                      </div>
                      <div className="progress-track">
                        <span style={{ width: `${areaScore.score}%` }} />
                      </div>
                      <p className="meta-note">{areaScore.note}</p>
                    </article>
                  ))}
                </div>

                <div className="stack">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-strong)]">写作阶段</p>
                      <p className="meta-note">
                        当前为 {workbenchReport.workflow.currentLabel}。
                        {document.meta.workflowState !== workbenchReport.workflow.suggestedState
                          ? ` 推荐切换到 ${workbenchReport.workflow.suggestedLabel}。`
                          : ` ${workbenchReport.workflow.currentDescription}`}
                      </p>
                    </div>
                    {document.meta.workflowState !== workbenchReport.workflow.suggestedState ? (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={applySuggestedWorkflowState}
                      >
                        <RefreshCw size={14} />
                        应用推荐状态
                      </button>
                    ) : null}
                  </div>
                  <div className="workflow-state-grid">
                    {workflowStateOptions.map((workflowState) => {
                      const meta = resumeWorkflowStateMeta[workflowState];
                      const active = workflowState === document.meta.workflowState;
                      const suggested = workflowState === workbenchReport.workflow.suggestedState;
                      return (
                        <button
                          key={workflowState}
                          type="button"
                          className="workflow-state-card"
                          data-active={active}
                          data-suggested={suggested}
                          onClick={() => setWorkflowState(workflowState)}
                        >
                          <strong>{meta.label}</strong>
                          <span className="meta-note">{meta.description}</span>
                          <span className="pill">
                            {active ? "当前状态" : suggested ? "推荐状态" : "可切换"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="stack">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink-strong)]">下一步动作</p>
                    <span className="pill">{workbenchReport.openTasks.length} 项待处理</span>
                  </div>
                  {workbenchReport.openTasks.length > 0 ? (
                    workbenchReport.openTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="workbench-task">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="grid gap-1">
                            <strong>{task.title}</strong>
                            <span className="meta-note">{task.detail}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="pill">
                              {task.status === "warning" ? "风险" : "待做"}
                            </span>
                            <button
                              className="ghost-button"
                              type="button"
                              onClick={() => handleWorkbenchTask(task)}
                            >
                              {task.action.label}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="meta-note">这份简历已经覆盖了工作台当前的主要检查项，可以重点做措辞和岗位定制。</p>
                  )}
                </div>
              </div>

              <div id="editor-writer-profile" className="editor-card stack">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      写作档案
                    </h2>
                    <p className="meta-note">
                      当前为 {writerProfileMeta.label}。{writerProfileMeta.description}
                    </p>
                  </div>
                  <span className="pill">{document.meta.writerProfile}</span>
                </div>

                <div className="workflow-state-grid">
                  {writerProfileOptions.map((writerProfile) => {
                    const meta = resumeWriterProfileMeta[writerProfile];
                    const active = writerProfile === document.meta.writerProfile;
                    return (
                      <button
                        key={writerProfile}
                        type="button"
                        className="workflow-state-card"
                        data-active={active}
                        onClick={() => setWriterProfile(writerProfile)}
                      >
                        <strong>{meta.label}</strong>
                        <span className="meta-note">{meta.description}</span>
                        <span className="pill">{active ? "当前档案" : "切换档案"}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="stack text-sm leading-7 text-[var(--ink-soft)]">
                  {writerProfileMeta.workflowSteps.map((step, index) => (
                    <div key={step} className="workflow-step">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {showStarterChecklist ? (
                <div className="editor-card stack">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      起稿清单
                    </h2>
                    <p className="meta-note">
                      这是一份带提示的起稿草稿。先把以下内容补全，再进入岗位定制和导出阶段。
                    </p>
                  </div>
                  <div className="stack text-sm leading-7 text-[var(--ink-soft)]">
                    {writerProfileMeta.workflowSteps.map((step, index) => (
                      <div key={step} className="workflow-step">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(importSummary.hasImportedContent
                || importSummary.pendingReviewCount > 0
                || importSummary.unmappedCount > 0) ? (
                <div id="editor-import-summary" className="editor-card stack">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                        导入结果
                      </h2>
                      <p className="meta-note">
                        {importSummary.latestImportInfo
                          ? `${importSummary.latestImportInfo.sourceLabel} 导入完成于 ${formatDateTime(importSummary.latestImportInfo.importedAt)}。${importSummary.latestImportInfo.note}`
                          : "这里会汇总最近一次导入带来的结构、待确认内容和未映射信息。"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="pill">{importSummary.sectionCount} 个章节</span>
                      <span className="pill">{importSummary.itemCount} 条内容</span>
                      <span className="pill">{importSummary.pendingReviewCount} 条待确认</span>
                      <span className="pill">{importSummary.unmappedCount} 条未映射</span>
                    </div>
                  </div>

                  {document.importTrace.pendingReview.length > 0 ? (
                    <div className="stack">
                      <p className="text-sm font-semibold text-[var(--ink-strong)]">待确认内容</p>
                      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
                        {document.importTrace.pendingReview.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {document.importTrace.unmapped.length > 0 ? (
                    <div className="stack">
                      <p className="text-sm font-semibold text-[var(--ink-strong)]">未映射内容</p>
                      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
                        {document.importTrace.unmapped.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div id="editor-targeting" className="editor-card stack">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      目标岗位与 JD 匹配度
                    </h2>
                    <p className="meta-note">
                      为每个定制版本记录目标岗位、公司和关键词覆盖情况。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {targetingAnalysis.targetLabel ? (
                      <span className="pill">
                        <Target size={14} />
                        {targetingAnalysis.targetLabel}
                      </span>
                    ) : null}
                    {targetingAnalysis.coveragePercent !== null ? (
                      <span className="pill">
                        {targetingAnalysis.coveragePercent}% 关键词覆盖率
                      </span>
                    ) : null}
                    {targetingAnalysis.evaluatedKeywords.length > 0 ? (
                      <span className="pill">
                        {targetingAnalysis.matchedKeywords.length}/
                        {targetingAnalysis.evaluatedKeywords.length} 已匹配
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="field-label">目标岗位</label>
                    <input
                      className="text-field"
                      value={document.targeting.role}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            role: event.target.value,
                          },
                        }))
                      }
                      placeholder="例如：高级前端工程师"
                    />
                  </div>
                  <div>
                    <label className="field-label">目标公司</label>
                    <input
                      className="text-field"
                      value={document.targeting.company}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            company: event.target.value,
                          },
                        }))
                      }
                      placeholder="例如：Vercel"
                    />
                  </div>
                  <div>
                    <label className="field-label">职位链接</label>
                    <input
                      className="text-field"
                      value={document.targeting.postingUrl}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            postingUrl: event.target.value,
                          },
                        }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="field-label">关注关键词</label>
                      {targetingAnalysis.keywordSource === "job-description"
                      && targetingAnalysis.suggestedKeywords.length > 0 ? (
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={applySuggestedKeywords}
                        >
                          <RefreshCw size={14} />
                          应用建议关键词
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      className="text-area min-h-48"
                      value={document.targeting.focusKeywords.join("\n")}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            focusKeywords: parseFocusKeywords(event.target.value),
                          },
                        }))
                      }
                      placeholder={"TypeScript\nNext.js\n设计系统\n增长实验"}
                    />
                    <p className="meta-note">
                      每行一个关键词或短语，它们会驱动匹配度检查。
                    </p>
                  </div>

                  <div>
                    <label className="field-label">职位描述 / 招聘简述</label>
                    <textarea
                      className="text-area min-h-48"
                      value={document.targeting.jobDescription}
                      onChange={(event) =>
                        updateDocument((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            jobDescription: event.target.value,
                          },
                        }))
                      }
                      placeholder="把 JD、核心要求或招聘方备注粘贴到这里。"
                    />
                    <p className="meta-note">
                      如果你还没手动填写关键词，工作台会从这里自动提炼一组选项。
                    </p>
                  </div>
                </div>

                <div>
                  <label className="field-label">定制备注</label>
                  <textarea
                    className="text-area"
                    value={document.targeting.notes}
                    onChange={(event) =>
                      updateDocument((current) => ({
                        ...current,
                        targeting: {
                          ...current.targeting,
                          notes: event.target.value,
                        },
                      }))
                    }
                    placeholder="记录这一版的定位策略、必须保留的成果或措辞限制。"
                  />
                </div>

                {targetingAnalysis.keywordSource === "job-description"
                && targetingAnalysis.suggestedKeywords.length > 0 ? (
                  <div className="stack rounded-[20px] border border-[color:color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color:color-mix(in_srgb,white_58%,var(--paper)_42%)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">建议关注词</h3>
                        <p className="meta-note">
                          因为你还没有手动设置关键词，这里根据已粘贴的 JD 自动提炼。
                        </p>
                      </div>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={applySuggestedKeywords}
                      >
                        <RefreshCw size={14} />
                        应用建议关键词
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {targetingAnalysis.suggestedKeywords.map((keyword) => (
                        <span key={keyword} className="pill">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {targetingAnalysis.evaluatedKeywords.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="stack rounded-[20px] border border-[color:color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color:color-mix(in_srgb,white_58%,var(--paper)_42%)] p-4">
                      <div>
                        <h3 className="text-lg font-semibold">已覆盖关键词</h3>
                        <p className="meta-note">
                          当前草稿里已经体现出来的关键词。
                        </p>
                      </div>
                      {targetingAnalysis.keywordMatches.some((entry) => entry.matched) ? (
                        <div className="stack">
                          {targetingAnalysis.keywordMatches
                            .filter((entry) => entry.matched)
                            .map((entry) => (
                              <div key={entry.keyword} className="rounded-[16px] border border-[var(--line)] px-4 py-3">
                                <p className="text-sm font-semibold text-[var(--ink-strong)]">
                                  {entry.keyword}
                                </p>
                                <p className="meta-note">
                                  出现在{" "}
                                  {entry.matchedAreas
                                    .map((area) => keywordAreaLabels[area])
                                    .join(", ")}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="meta-note">
                          还没有命中任何关键词，导出前建议继续补强内容。
                        </p>
                      )}
                    </div>

                    <div className="stack rounded-[20px] border border-[color:color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color:color-mix(in_srgb,white_58%,var(--paper)_42%)] p-4">
                      <div>
                        <h3 className="text-lg font-semibold">覆盖缺口</h3>
                        <p className="meta-note">
                          当前简历叙事里仍然缺失的关键词。
                        </p>
                      </div>
                      {targetingAnalysis.missingKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {targetingAnalysis.missingKeywords.map((keyword) => (
                            <span key={keyword} className="pill">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="meta-note">
                          当前关键词集合已经全部在草稿中体现。
                        </p>
                      )}
                    </div>
                  </div>
                ) : targetingAnalysis.active ? (
                  <p className="meta-note">
                    添加关键词或粘贴 JD 后，就可以评估这份草稿与目标岗位的匹配度。
                  </p>
                ) : (
                  <p className="meta-note">
                    当你在做公司定制版或岗位定制版时，可以重点使用这一块。
                  </p>
                )}
              </div>

              <div className="editor-card stack">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      自动生成定制版本
                    </h2>
                    <p className="meta-note">
                      根据目标岗位自动生成一份新草稿，优先保留最相关的章节和条目。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tailoredPlan.keywordSource !== "none" ? (
                      <span className="pill">
                        关键词来源：
                        {tailoredPlan.keywordSource === "manual" ? "手动列表" : "职位描述"}
                      </span>
                    ) : null}
                    {tailoredPlan.canGenerate ? (
                      <span className="pill">
                        保留 {tailoredPlan.keptItems} 条 / 删除 {tailoredPlan.droppedItems} 条
                      </span>
                    ) : null}
                    <button
                      className="action-button"
                      type="button"
                      onClick={() => void generateTailoredVariant()}
                      disabled={!tailoredPlan.canGenerate || tailoringBusy || busy}
                    >
                      {tailoringBusy ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                      {tailoringBusy ? "生成中…" : "生成定制版本"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
                  <div className="stack rounded-[20px] border border-[color:color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color:color-mix(in_srgb,white_58%,var(--paper)_42%)] p-4">
                    <div>
                      <h3 className="text-lg font-semibold">生成计划</h3>
                      <p className="meta-note">
                        新草稿会保留当前编辑状态，并另外生成一个独立的本地版本。
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[var(--line)] px-4 py-3">
                      <p className="meta-note">建议标题</p>
                      <p className="text-sm font-semibold text-[var(--ink-strong)]">
                        {tailoredPlan.titleSuggestion}
                      </p>
                    </div>
                    {tailoredPlan.keywords.length > 0 ? (
                      <div className="stack">
                        <p className="meta-note">
                          用于筛选的关键词
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tailoredPlan.keywords.map((keyword) => (
                            <span key={keyword} className="pill">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="meta-note">
                        先补充关键词或粘贴 JD，才能启用定制版本生成。
                      </p>
                    )}
                    {tailoredPlan.missingKeywords.length > 0 ? (
                      <div>
                        <p className="meta-note">当前草稿里仍缺失</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tailoredPlan.missingKeywords.map((keyword) => (
                            <span key={keyword} className="pill">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : tailoredPlan.canGenerate ? (
                      <p className="meta-note">
                        当前草稿中已经覆盖了所有被追踪的关键词。
                      </p>
                    ) : null}
                  </div>

                  <div className="stack rounded-[20px] border border-[color:color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color:color-mix(in_srgb,white_58%,var(--paper)_42%)] p-4">
                    <div>
                      <h3 className="text-lg font-semibold">章节决策</h3>
                      <p className="meta-note">
                        没有相关证明内容的章节会在生成版本里被移除。
                      </p>
                    </div>
                    <div className="stack">
                      {tailoredPlan.sectionPlans.map((sectionPlan) => (
                        <div
                          key={sectionPlan.sectionId}
                          className="rounded-[16px] border border-[var(--line)] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--ink-strong)]">
                              {sectionPlan.title}
                            </p>
                            <span className="pill">
                              {sectionPlan.action === "keep" ? "保留" : "移除"}
                            </span>
                          </div>
                          <p className="meta-note">
                            保留 {sectionPlan.keptItems}/{sectionPlan.totalItems} 条
                            {sectionPlan.totalItems > 0 ? ` · 分数 ${sectionPlan.score}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {tailoredPreviewItems.length > 0 ? (
                  <div className="stack rounded-[20px] border border-[color:color-mix(in_srgb,var(--line)_82%,transparent)] bg-[color:color-mix(in_srgb,white_58%,var(--paper)_42%)] p-4">
                    <div>
                      <h3 className="text-lg font-semibold">优先保留条目</h3>
                      <p className="meta-note">
                        这些条目会优先进入生成版本。作为兜底保留的内容会单独标记。
                      </p>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {tailoredPreviewItems.map((itemPlan) => (
                        <div
                          key={itemPlan.itemId}
                          className="rounded-[16px] border border-[var(--line)] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--ink-strong)]">
                              {itemPlan.itemTitle}
                            </p>
                            <span className="pill">
                              {itemPlan.action === "fallback" ? "兜底保留" : "命中保留"}
                            </span>
                          </div>
                          <p className="meta-note">
                            {itemPlan.sectionTitle} · 分数 {itemPlan.score}
                          </p>
                          {itemPlan.matchedKeywords.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {itemPlan.matchedKeywords.map((keyword) => (
                                <span key={`${itemPlan.itemId}-${keyword}`} className="pill">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="meta-note mt-2">
                              因为命中目标的条目过少，所以这条内容作为上下文兜底保留。
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

              </div>

              <div className="editor-card stack">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      链接
                    </h2>
                    <p className="meta-note">
                      这些链接会出现在页眉信息中，并一起导出到 PDF。
                    </p>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      updateDocument((current) => ({
                        ...current,
                        basics: {
                          ...current.basics,
                          links: [
                            ...current.basics.links,
                            {
                              label: "新链接",
                              url: "",
                            },
                          ],
                        },
                      }))
                    }
                  >
                    <Link2 size={14} />
                    添加链接
                  </button>
                </div>
                {document.basics.links.length > 0 ? (
                  <div className="stack">
                    {document.basics.links.map((link, linkIndex) => (
                      <div
                        key={`${link.label}-${linkIndex}`}
                        className="grid gap-4 md:grid-cols-[1fr,1.6fr,auto]"
                      >
                        <input
                          className="text-field"
                          value={link.label}
                          onChange={(event) =>
                            updateDocument((current) => ({
                              ...current,
                              basics: {
                                ...current.basics,
                                links: current.basics.links.map((item, itemIndex) =>
                                  itemIndex === linkIndex
                                    ? {
                                        ...item,
                                        label: event.target.value,
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                        <input
                          className="text-field"
                          value={link.url}
                          onChange={(event) =>
                            updateDocument((current) => ({
                              ...current,
                              basics: {
                                ...current.basics,
                                links: current.basics.links.map((item, itemIndex) =>
                                  itemIndex === linkIndex
                                    ? {
                                        ...item,
                                        url: event.target.value,
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() =>
                            updateDocument((current) => ({
                              ...current,
                              basics: {
                                ...current.basics,
                                links: current.basics.links.filter(
                                  (_, itemIndex) => itemIndex !== linkIndex,
                                ),
                              },
                            }))
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="meta-note">
                    还没有任何链接。
                  </p>
                )}
              </div>

              <div id="editor-summary">
                <label className="field-label">职业摘要</label>
                <RichTextEditor
                  value={document.basics.summaryHtml}
                  onChange={(nextValue) => updateBasics("summaryHtml", nextValue)}
                />
              </div>

              {activeSection ? (
                <div id="editor-section-detail" className="editor-card stack">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                        章节设置
                      </h2>
                      <p className="meta-note">
                        在这里编辑章节标题、显示状态、布局和章节正文。
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="ghost-button" type="button" onClick={addItemToActiveSection}>
                        <Plus size={14} />
                        添加条目
                      </button>
                      <button className="ghost-button" type="button" onClick={removeActiveSection}>
                        <Trash2 size={14} />
                        删除章节
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="field-label">章节标题</label>
                      <input
                        className="text-field"
                        value={activeSection.title}
                        onChange={(event) =>
                          updateSection(activeSection.id, (section) => ({
                            ...section,
                            title: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">布局</label>
                      <select
                        className="select-field"
                        value={activeSection.layout}
                        onChange={(event) =>
                          updateSection(activeSection.id, (section) => ({
                            ...section,
                            layout: event.target.value as ResumeSection["layout"],
                          }))
                        }
                      >
                        <option value="rich-text">富文本</option>
                        <option value="stacked-list">堆叠列表</option>
                        <option value="tag-grid">标签网格</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label">是否显示</label>
                      <select
                        className="select-field"
                        value={String(activeSection.visible)}
                        onChange={(event) =>
                          updateSection(activeSection.id, (section) => ({
                            ...section,
                            visible: event.target.value === "true",
                          }))
                        }
                      >
                        <option value="true">显示</option>
                        <option value="false">隐藏</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">章节引言 / 正文</label>
                    <RichTextEditor
                      value={activeSection.contentHtml}
                      onChange={(nextValue) =>
                        updateSection(activeSection.id, (section) => ({
                          ...section,
                          contentHtml: nextValue,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {activeSection && activeItem ? (
                <div id="editor-item-detail" className="editor-card stack">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                        条目详情
                      </h2>
                      <p className="meta-note">
                        在这里编辑标题、元信息、要点、标签和描述正文。
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => removeActiveItem()}
                      >
                        <Trash2 size={14} />
                        删除条目
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="field-label">标题</label>
                      <input
                        className="text-field"
                        value={activeItem.title}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            title: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">副标题</label>
                      <input
                        className="text-field"
                        value={activeItem.subtitle}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            subtitle: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">时间范围</label>
                      <input
                        className="text-field"
                        value={activeItem.dateRange}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            dateRange: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">地点</label>
                      <input
                        className="text-field"
                        value={activeItem.location}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            location: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="field-label">补充信息</label>
                      <input
                        className="text-field"
                        value={activeItem.meta}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            meta: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">正文描述</label>
                    <RichTextEditor
                      value={activeItem.summaryHtml}
                      onChange={(nextValue) =>
                        updateActiveItem((item) => ({
                          ...item,
                          summaryHtml: nextValue,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="field-label">要点</label>
                      <textarea
                        className="text-area"
                        value={activeItem.bulletPoints.join("\n")}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            bulletPoints: normalizeLines(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">标签</label>
                      <textarea
                        className="text-area"
                        value={activeItem.tags.join("\n")}
                        onChange={(event) =>
                          updateActiveItem((item) => ({
                            ...item,
                            tags: normalizeLines(event.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  {activeSection.items.length > 1 ? (
                    <div className="flex gap-2">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          const itemIndex = activeSection.items.findIndex(
                            (item) => item.id === activeItem.id,
                          );
                          if (itemIndex < 0) return;
                          const moved = moveByOffset(activeSection.items, itemIndex, -1);
                          updateSection(activeSection.id, (section) => ({
                            ...section,
                            items: moved,
                          }));
                        }}
                      >
                        <ArrowUp size={14} />
                        上移
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          const itemIndex = activeSection.items.findIndex(
                            (item) => item.id === activeItem.id,
                          );
                          if (itemIndex < 0) return;
                          const moved = moveByOffset(activeSection.items, itemIndex, 1);
                          updateSection(activeSection.id, (section) => ({
                            ...section,
                            items: moved,
                          }));
                        }}
                      >
                        <ArrowDown size={14} />
                        下移
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div id="editor-export-checklist" className="editor-card stack">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      导出前检查
                    </h2>
                    <p className="meta-note">
                      导出 PDF 之前，先把最关键的内容和版式检查一遍，避免把半成品直接导出。
                    </p>
                  </div>
                  <div className="workbench-score-card">
                    <strong>
                      {exportChecklistSummary.completedCount}/{exportChecklistSummary.totalCount}
                    </strong>
                    <span>
                      {exportChecklistSummary.requiredPendingCount > 0 ? "还有必查项" : "可以导出"}
                    </span>
                  </div>
                </div>

                <div className="stack">
                  {exportChecklist.map((item) => (
                    <div key={item.id} className="workbench-task">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="grid gap-1">
                          <strong>{item.title}</strong>
                          <span className="meta-note">{item.detail}</span>
                        </div>
                        <span className="pill">
                          {item.done ? "已满足" : item.required ? "必查" : "建议"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    className="ghost-button"
                    href={`/studio/${document.meta.id}/preview`}
                    target="_blank"
                  >
                    <ArrowUpRight size={14} />
                    打开打印预览
                  </Link>
                  <button
                    className="action-button"
                    type="button"
                    onClick={exportPdf}
                    disabled={busy || exportChecklistSummary.requiredPendingCount > 0}
                  >
                    <FileDown size={14} />
                    通过检查后导出 PDF
                  </button>
                </div>
              </div>

              {diagnostics.length > 0 ? (
                <div id="editor-diagnostics" className="editor-card stack">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                      质量诊断
                    </h2>
                    <p className="meta-note">
                      这里会把阻止导出的硬问题、质量风险和优化建议分开显示。
                    </p>
                  </div>
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
                    {diagnostics.map((diagnostic) => (
                      <li key={diagnostic.id}>
                        {diagnostic.severity === "blocker"
                          ? "阻塞："
                          : diagnostic.severity === "warning"
                            ? "警告："
                            : "提示："}
                        {diagnostic.message}
                        {` 建议：${diagnostic.suggestion}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {tailoringError ? (
                <div className="editor-card stack">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                    定制版本生成失败
                  </h2>
                  <p className="meta-note">{tailoringError}</p>
                </div>
              ) : null}
            </div>
          </section>

          <aside id="editor-preview" className="panel studio-pane preview-shell">
            <div className="border-b border-[var(--line)] px-6 py-4">
              <h2 className="text-xl font-semibold tracking-[-0.04em]">预览</h2>
              <p className="meta-note">
                使用与 PDF 导出相同的 HTML 源，专门用于最后检查版式和内容。
              </p>
            </div>
            <PreviewFrame html={previewHtml} />
          </aside>
        </div>
      </div>
    </main>
  );
}
