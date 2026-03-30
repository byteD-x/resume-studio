"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ResumeSectionEditor } from "@/components/product/ResumeSectionEditor";
import { ResumeBasicsPanel } from "@/components/product/editor/ResumeBasicsPanel";
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
import { Button } from "@/components/ui/Button";
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
import type { ResumeDocument, ResumeSectionItem } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type FormPanel = Exclude<EditorPanel, "markdown">;
type SectionPanel = (typeof editorSectionDefinitions)[number]["type"];

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

function deriveTargetingStatus(document: ResumeDocument): EditorPanelItem["status"] {
  if (
    !document.targeting.role.trim() &&
    !document.targeting.company.trim() &&
    document.targeting.focusKeywords.length === 0
  ) {
    return "empty";
  }

  if (document.targeting.role.trim() && document.targeting.focusKeywords.length >= 2) return "ready";
  return "in_progress";
}

function deriveMarkdownStatus(markdownDraft: string): EditorPanelItem["status"] {
  const trimmed = markdownDraft.trim();
  if (!trimmed) return "empty";
  return trimmed.length >= 180 ? "ready" : "in_progress";
}

function buildSidebarItems(document: ResumeDocument, markdownDraft: string): EditorPanelItem[] {
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
      status: deriveTargetingStatus(document),
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

export function ResumeEditorPage({
  initialDocument,
}: {
  initialDocument: ResumeDocument;
}) {
  const router = useRouter();
  const seededDocument = ensureEditorDocument(initialDocument);
  const seededMarkdown = serializeResumeToMarkdown(seededDocument);
  const initialStatusMessage = hasResumeRenderableContent(seededDocument) ? "自动保存" : "开始填写";
  const [document, setDocument] = useState(seededDocument);
  const [activePanel, setActivePanel] = useState<EditorPanel>("basics");
  const [activeSectionItemId, setActiveSectionItemId] = useState<string | null>(null);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [statusMessage, setStatusMessage] = useState(initialStatusMessage);
  const [markdownDraft, setMarkdownDraft] = useState(seededMarkdown);
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [recentDeletion, setRecentDeletion] = useState<RecentDeletion | null>(null);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const latestDocumentRef = useRef(seededDocument);
  const latestMarkdownRef = useRef(seededMarkdown);
  const latestMarkdownErrorRef = useRef<string | null>(null);
  const lastSavedRef = useRef(JSON.stringify(seededDocument));
  const lastFormPanelRef = useRef<FormPanel>("basics");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredDocument = useDeferredValue(document);
  const editorMode = activePanel === "markdown" ? "markdown" : "form";
  const history = useEditorHistory<ResumeEditorSnapshot>(120);

  const createSnapshot = () => ({
    document: latestDocumentRef.current,
    markdownDraft: latestMarkdownRef.current,
  });

  const markdownStarter = useMemo(() => createMarkdownStarter(document), [document]);
  const sidebarItems = useMemo(() => buildSidebarItems(document, markdownDraft), [document, markdownDraft]);

  const previewHtml = useMemo(
    () =>
      buildResumePreviewHtml(deferredDocument, {
        highlightedTarget:
          activePanel === "basics" || activePanel === "targeting"
            ? activePanel
            : activePanel === "markdown"
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

  const renderCurrentPanel = () => {
    if (activePanel === "basics") {
      return <ResumeBasicsPanel document={document} onBasicsChange={updateBasicsField} />;
    }

    if (activePanel === "targeting") {
      return <ResumeTargetingPanel document={document} onTargetingChange={updateTargetingField} />;
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
