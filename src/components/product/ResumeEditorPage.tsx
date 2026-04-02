"use client";

import dynamic from "next/dynamic";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { ResumeEditorNoticeList } from "@/components/product/editor/ResumeEditorNoticeList";
import { ResumeEditorPanelContent } from "@/components/product/editor/ResumeEditorPanelContent";
import { ResumeEditorPreviewPane } from "@/components/product/editor/ResumeEditorPreviewPane";
import type { OptimizationTarget } from "@/components/product/editor/resume-design-panel-shared";
import { ResumeEditorSidebar, type EditorPanel } from "@/components/product/editor/ResumeEditorSidebar";
import { ResumeEditorToolbar, type WorkspaceView } from "@/components/product/editor/ResumeEditorToolbar";
import { ResumeEditorWorkbench } from "@/components/product/editor/ResumeEditorWorkbench";
import { useResumeEditorKeyboardShortcuts } from "@/components/product/editor/useResumeEditorKeyboardShortcuts";
import { useResumeEditorPageActions } from "@/components/product/editor/useResumeEditorPageActions";
import { useResumeEditorPreviewBridge } from "@/components/product/editor/useResumeEditorPreviewBridge";
import { useResumeEditorPersistence } from "@/components/product/editor/useResumeEditorPersistence";
import type {
  PendingEditorConfirmation,
  RecentDeletion,
} from "@/components/product/editor/useResumeEditorSectionActions";
import {
  buildImportReview,
  buildSidebarGroups,
  buildSidebarItems,
  createMarkdownStarter,
  isSectionPanel,
  resolveInitialEditorPanel,
  resolveInitialStatusMessage,
} from "@/components/product/editor/resume-editor-workspace";
import { buildResumeEditorNotices } from "@/components/product/editor/resume-editor-notices";
import { useRouteWarmup } from "@/components/product/useRouteWarmup";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import { applyResumeOptimization, getResumeOptimizationGoalLabel } from "@/lib/resume-derivatives";
import { useEditorHistory } from "@/lib/editor-history";
import { ensureEditorDocument, getEditorSection } from "@/lib/resume-editor";
import type { ResumeOptimizationGoal } from "@/lib/resume-layout";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
import { serializeResumeToMarkdown } from "@/lib/resume-markdown";
import { buildResumeQualityReport } from "@/lib/resume-quality";
import { buildTailoredVariantPlan } from "@/lib/resume-tailoring";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import type { ResumeDocument } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type FormPanel = Exclude<EditorPanel, "markdown">;

const ConfirmDialog = dynamic(
  () => import("@/components/ui/ConfirmDialog").then((module) => module.ConfirmDialog),
);

const EditorShortcutDialog = dynamic(
  () => import("@/components/product/editor/EditorShortcutDialog").then((module) => module.EditorShortcutDialog),
);

interface ResumeEditorSnapshot {
  document: ResumeDocument;
  markdownDraft: string;
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
  useRouteWarmup({
    resumeId: seededDocument.meta.id,
    routes: ["/resumes", "/templates"],
  });
  const seededMarkdown = serializeResumeToMarkdown(seededDocument);
  const initialPanel = resolveInitialEditorPanel(focusParam);
  const seededStatusMessage = resolveInitialStatusMessage(seededDocument, focusParam, onboardingParam);
  const [document, setDocument] = useState(seededDocument);
  const [activePanel, setActivePanel] = useState<EditorPanel>(initialPanel);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("split");
  const [activeSectionItemId, setActiveSectionItemId] = useState<string | null>(null);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [statusMessage, setStatusMessage] = useState(seededStatusMessage);
  const [markdownDraft, setMarkdownDraft] = useState(seededMarkdown);
  const [markdownError, setMarkdownError] = useState<string | null>(null);
  const [recentDeletion, setRecentDeletion] = useState<RecentDeletion | null>(null);
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [isCreatingOptimizedVersion, setIsCreatingOptimizedVersion] = useState(false);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [generatedAiSummarySuggestions, setGeneratedAiSummarySuggestions] = useState<ResumeAssistSuggestion[]>([]);
  const [clientAiApiKey, setClientAiApiKey] = useState("");
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<PendingEditorConfirmation | null>(null);
  const [optimizationGoal, setOptimizationGoal] = useState<ResumeOptimizationGoal>("two-page");
  const [optimizationTarget, setOptimizationTarget] = useState<OptimizationTarget>("derived");
  const [isOptimizationPreviewActive, setIsOptimizationPreviewActive] = useState(false);
  const latestDocumentRef = useRef(seededDocument);
  const latestMarkdownRef = useRef(seededMarkdown);
  const latestMarkdownErrorRef = useRef<string | null>(null);
  const lastSavedRef = useRef(JSON.stringify(seededDocument));
  const lastFormPanelRef = useRef<FormPanel>(initialPanel === "markdown" ? "basics" : initialPanel);
  const editorSurfaceRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const editorMode = activePanel === "markdown" ? "markdown" : "visual";
  const history = useEditorHistory<ResumeEditorSnapshot>(120);

  const markdownStarter = useMemo(() => createMarkdownStarter(document), [document]);
  const importReview = useMemo(() => buildImportReview(document), [document]);
  const targetingAnalysis = useMemo(() => analyzeResumeTargeting(document), [document]);
  const tailoredVariantPlan = useMemo(() => buildTailoredVariantPlan(document), [document]);
  const qualityReport = useMemo(() => buildResumeQualityReport(document), [document]);
  const optimizationPreviewDocument = useMemo(
    () => (isOptimizationPreviewActive ? applyResumeOptimization(document, optimizationGoal) : null),
    [document, isOptimizationPreviewActive, optimizationGoal],
  );
  const effectivePreviewDocument = optimizationPreviewDocument ?? document;
  const deferredPreviewDocument = useDeferredValue(effectivePreviewDocument);
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
  const activeSection = useMemo(
    () => (isSectionPanel(activePanel) ? getEditorSection(document, activePanel) : null),
    [activePanel, document],
  );
  const activeSectionItem = useMemo(
    () => activeSection?.items.find((item) => item.id === activeSectionItemId) ?? null,
    [activeSection, activeSectionItemId],
  );

  const optimizationGoalLabel = getResumeOptimizationGoalLabel(optimizationGoal);
  const activePreviewTargetLabel = useMemo(() => {
    if (isOptimizationPreviewActive && activePanel === "design") {
      return `${optimizationGoalLabel}预览`;
    }

    if (activePanel === "basics" || isSectionPanel(activePanel)) {
      return activePanelMeta?.label;
    }

    return undefined;
  }, [activePanel, activePanelMeta, isOptimizationPreviewActive, optimizationGoalLabel]);

  const activeWorkbenchFocusLabel = useMemo(() => {
    if (editorMode === "markdown") {
      return "Markdown 源码";
    }

    if (activePanel === "basics") {
      return "头部信息与职业摘要";
    }

    if (activeSectionItem) {
      return activeSectionItem.title.trim() || "未命名条目";
    }

    if (activeSection) {
      return activeSection.title;
    }

    if (activePanel === "targeting") {
      return "岗位定向";
    }

    if (activePanel === "design") {
      return "模板与版式";
    }

    if (activePanel === "ai") {
      return "AI 辅助";
    }

    return undefined;
  }, [activePanel, activeSection, activeSectionItem, editorMode]);

  const {
    applyAiPreset,
    applyGeneratedAiSummarySuggestion,
    applyMarkdownDraft,
    applyStylePreset,
    applySuggestedKeywords,
    copySectionItem,
    deleteSectionItem,
    insertSectionItem,
    moveSectionItem,
    redoLastChange,
    restoreDeletedItem,
    saveDocument,
    undoLastChange,
    updateAiApiKey,
    updateAiField,
    updateBasicsField,
    updateBasicsSummaryHtml,
    updateBasicsVisualField,
    updateDocument,
    updateLayoutField,
    updateResumeTitle,
    updateTargetingField,
    updateTemplate,
  } = useResumeEditorPersistence({
    clientAiApiKey,
    document,
    editorMode,
    history,
    latestDocumentRef,
    latestMarkdownErrorRef,
    latestMarkdownRef,
    lastSavedRef,
    markdownError,
    recentDeletion,
    saveQueueRef,
    saveState,
    setActiveSectionItemId,
    setClientAiApiKey,
    setConfirmation,
    setDocument,
    setFocusItemId,
    setMarkdownDraft,
    setMarkdownError,
    setRecentDeletion,
    setSaveState,
    setStatusMessage,
    suggestedKeywords: targetingAnalysis.suggestedKeywords,
    timerRef,
  });

  const navigateBack = (fallbackPath: string) => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackPath as Route);
  };

  const {
    focusFormPanel,
    handleBack,
    handleFocusDiagnostic,
    handleFocusImportedBasics,
    handleCreateOptimizedVersion,
    handleGenerateAiSummary,
    handleGenerateTailoredVariant,
    handleModeChange,
    handleOpenPreview,
    handlePanelSelect,
  } = useResumeEditorPageActions({
    clientAiApiKey,
    editorSurfaceRef,
    latestDocumentRef,
    latestMarkdownErrorRef,
    lastFormPanelRef,
    navigateBack,
    panelMetaMap,
    pushRoute: (href) => router.push(href as Route),
    saveDocument,
    searchParams,
    setActivePanel,
    setClientAiApiKey,
    setConfirmation,
    setIsCreatingOptimizedVersion,
    setGeneratedAiSummarySuggestions,
    setIsGeneratingAiSummary,
    setIsGeneratingVariant,
    setStatusMessage,
    updateDocument,
  });

  const handlePreviewOptimization = () => {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown 源码错误");
      return;
    }

    lastFormPanelRef.current = "design";
    setActivePanel("design");
    setIsOptimizationPreviewActive(true);
    if (workspaceView === "edit") {
      setWorkspaceView("split");
    }
    setStatusMessage(`正在预览${optimizationGoalLabel}，右侧结果尚未写回文档`);
  };

  const handleRestoreOptimizationPreview = () => {
    setIsOptimizationPreviewActive(false);
    setStatusMessage("已恢复原始版式，当前文档内容没有被改写");
  };

  const handleApplyCurrentOptimization = () => {
    if (latestMarkdownErrorRef.current) {
      setActivePanel("markdown");
      setStatusMessage("请先修正 Markdown 源码错误");
      return;
    }

    updateDocument(
      (current) => applyResumeOptimization(current, optimizationGoal),
      {
        historyLabel: `应用${optimizationGoalLabel}`,
        message: `已将${optimizationGoalLabel}应用到当前文档`,
        clearDeletion: true,
      },
    );
    setIsOptimizationPreviewActive(false);
  };

  const handleDeriveOptimizedDocument = async () => {
    await handleCreateOptimizedVersion(optimizationGoal, {
      focus: "design",
      successMessage: `已派生${optimizationGoalLabel}，可以在新稿里继续压缩与微调`,
    });
  };

  useResumeEditorKeyboardShortcuts({
    activePanel,
    activeSection,
    activeSectionItemId,
    deleteSectionItem,
    handleOpenPreview,
    insertSectionItem,
    moveSectionItem,
    redoLastChange,
    saveDocument,
    setActiveSectionItemId,
    setFocusItemId,
    setShortcutOpen,
    setStatusMessage,
    shortcutOpen,
    undoLastChange,
  });

  const {
    handlePreviewNavigate,
    highlightedTarget,
    previewHtml,
    previewNavigationItems,
  } = useResumeEditorPreviewBridge({
    activePanel,
    activeSectionItemId,
    document: deferredPreviewDocument,
    focusFormPanel,
    panelMetaMap,
    setActivePanel,
    setActiveSectionItemId,
    setFocusItemId,
    setStatusMessage,
    setWorkspaceView,
    workspaceView,
  });

  const notices = buildResumeEditorNotices({
    highlightedDiagnostics,
    importReview,
    lineage,
    onFocusDiagnostic: handleFocusDiagnostic,
    onFocusImportedBasics: handleFocusImportedBasics,
    onOpenParent: () => {
      if (lineage?.parentId) {
        router.push(`/studio/${lineage.parentId}`);
      }
    },
    onRestoreDeletion: restoreDeletedItem,
    recentDeletion,
  });

  return (
    <main className="resume-editor-workspace">
      <ResumeEditorToolbar
        canRedo={history.canRedo}
        canUndo={history.canUndo}
        lineage={lineage}
        onBack={() => void handleBack()}
        onOpenPreview={() => void handleOpenPreview()}
        onOpenShortcuts={() => setShortcutOpen(true)}
        onRedo={redoLastChange}
        onSave={() => void saveDocument("manual")}
        onTitleChange={updateResumeTitle}
        onUndo={undoLastChange}
        onWorkspaceViewChange={setWorkspaceView}
        parentStudioHref={lineage?.parentId ? (`/studio/${lineage.parentId}` as Route) : null}
        recentHistoryLabels={history.recentLabels}
        redoLabel={history.redoLabel}
        saveState={saveState}
        statusMessage={statusMessage}
        title={document.meta.title}
        undoLabel={history.undoLabel}
        workspaceView={workspaceView}
      />

      <div className={`resume-editor-layout resume-editor-layout-${workspaceView}`}>
        <ResumeEditorSidebar activePanel={activePanel} groups={sidebarGroups} onSelect={handlePanelSelect} />

        <div className="resume-editor-main">
          <ResumeEditorWorkbench
            activePanelGroup={activePanelGroup}
            activePanelMeta={activePanelMeta}
            editorMode={editorMode}
            editorSurfaceRef={editorSurfaceRef}
            focusLabel={activeWorkbenchFocusLabel}
            notices={notices.length > 0 ? <ResumeEditorNoticeList notices={notices} /> : null}
            onModeChange={handleModeChange}
            onSurfaceFocusCapture={() => setActivePanel(activePanel)}
          >
            <ResumeEditorPanelContent
              activePanel={activePanel}
              activeSectionItemId={activeSectionItemId}
              apiKey={clientAiApiKey}
              document={document}
              editorMode={editorMode}
              focusItemId={focusItemId}
              generatedSummarySuggestions={generatedAiSummarySuggestions}
              importReview={importReview}
              isCreatingOptimizedVersion={isCreatingOptimizedVersion}
              isGeneratingAiSummary={isGeneratingAiSummary}
              isGeneratingVariant={isGeneratingVariant}
              isOptimizationPreviewActive={isOptimizationPreviewActive}
              markdownDraft={markdownDraft}
              markdownError={markdownError}
              onActiveItemChange={(panel, itemId) => {
                setActivePanel(panel);
                setActiveSectionItemId(itemId);
              }}
              onFocusItemHandled={() => {
                setFocusItemId(null);
              }}
              onAiApiKeyChange={updateAiApiKey}
              onAiChange={updateAiField}
              onAiPresetApply={applyAiPreset}
              onApplyCurrentOptimization={handleApplyCurrentOptimization}
              onApplyGeneratedSummary={applyGeneratedAiSummarySuggestion}
              onApplyStylePreset={applyStylePreset}
              onApplySuggestedKeywords={applySuggestedKeywords}
              onBasicsChange={updateBasicsField}
              onClearMarkdown={() => {
                setConfirmation({
                  title: "清空 Markdown 源码？",
                  description: "这会移除当前源码内容，但你仍然可以通过撤销立即找回。",
                  confirmLabel: "清空源码",
                  confirmVariant: "danger",
                  onConfirm: () => {
                    setConfirmation(null);
                    applyMarkdownDraft("", "已清空 Markdown 源码");
                  },
                });
              }}
              onCopySectionItem={(sectionType, itemId) => void copySectionItem(sectionType, itemId)}
              onDeleteSectionItem={deleteSectionItem}
              onDeriveOptimizedDocument={() => void handleDeriveOptimizedDocument()}
              onDuplicateSectionItem={(sectionType, itemId) => {
                const section = getEditorSection(document, sectionType);
                const source = section?.items.find((item) => item.id === itemId);
                if (source) {
                  insertSectionItem(sectionType, {
                    afterItemId: itemId,
                    duplicateFrom: source,
                  });
                }
              }}
              onGenerateAiSummary={() => void handleGenerateAiSummary()}
              onGenerateTailoredVariant={() => void handleGenerateTailoredVariant()}
              onInsertSectionItem={(sectionType, afterItemId) => insertSectionItem(sectionType, { afterItemId })}
              onInsertStarterMarkdown={() => applyMarkdownDraft(markdownStarter, "已插入结构化 Markdown 草稿")}
              onLayoutChange={updateLayoutField}
              onMarkdownChange={(value) => applyMarkdownDraft(value, "已更新 Markdown 源码")}
              onMoveSectionItem={moveSectionItem}
              onOptimizationGoalChange={setOptimizationGoal}
              onOptimizationTargetChange={setOptimizationTarget}
              onPhotoChange={updateBasicsVisualField}
              onPreviewOptimization={handlePreviewOptimization}
              onRestoreOptimizationPreview={handleRestoreOptimizationPreview}
              onSectionChange={(nextSection, title) =>
                updateDocument(
                  (current) => ({
                    ...current,
                    sections: current.sections.map((item) => (item.id === nextSection.id ? nextSection : item)),
                  }),
                  {
                    historyLabel: `修改${title}`,
                    clearDeletion: true,
                  },
                )
              }
              onSummaryHtmlChange={updateBasicsSummaryHtml}
              onTargetingChange={updateTargetingField}
              onTemplateChange={updateTemplate}
              optimizationGoal={optimizationGoal}
              optimizationTarget={optimizationTarget}
              setActivePanel={setActivePanel}
              tailoredPlan={tailoredVariantPlan}
              targetingAnalysis={targetingAnalysis}
            />
          </ResumeEditorWorkbench>
        </div>

        <ResumeEditorPreviewPane
          activeTargetLabel={activePreviewTargetLabel}
          focusedTarget={highlightedTarget}
          html={previewHtml}
          navigationItems={previewNavigationItems}
          onApplyPreset={applyStylePreset}
          onNavigateTarget={handlePreviewNavigate}
          onTemplateChange={updateTemplate}
          previewModeLabel={isOptimizationPreviewActive ? `${optimizationGoalLabel} · 临时预览` : undefined}
          saveState={saveState}
          template={effectivePreviewDocument.meta.template}
          workspaceView={workspaceView}
        />
      </div>

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
