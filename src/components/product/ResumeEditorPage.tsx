"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { EditorShortcutDialog } from "@/components/product/editor/EditorShortcutDialog";
import { ResumeEditorNoticeList } from "@/components/product/editor/ResumeEditorNoticeList";
import { ResumeEditorPanelContent } from "@/components/product/editor/ResumeEditorPanelContent";
import { ResumeEditorPreviewPane } from "@/components/product/editor/ResumeEditorPreviewPane";
import { ResumeEditorSidebar, type EditorPanel } from "@/components/product/editor/ResumeEditorSidebar";
import { ResumeEditorToolbar, type WorkspaceView } from "@/components/product/editor/ResumeEditorToolbar";
import { ResumeEditorWorkbench } from "@/components/product/editor/ResumeEditorWorkbench";
import { useResumeEditorKeyboardShortcuts } from "@/components/product/editor/useResumeEditorKeyboardShortcuts";
import { useResumeEditorPageActions } from "@/components/product/editor/useResumeEditorPageActions";
import { useResumeEditorPreviewBridge } from "@/components/product/editor/useResumeEditorPreviewBridge";
import { useResumeEditorPersistence } from "@/components/product/editor/useResumeEditorPersistence";
import type { PendingEditorConfirmation, RecentDeletion } from "@/components/product/editor/useResumeEditorSectionActions";
import {
  buildImportReview, buildSidebarGroups, buildSidebarItems, createMarkdownStarter,
  isSectionPanel, resolveInitialEditorPanel, resolveInitialStatusMessage,
} from "@/components/product/editor/resume-editor-workspace";
import { buildResumeEditorNotices } from "@/components/product/editor/resume-editor-notices";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ResumeLineageMeta } from "@/lib/resume-lineage";
import { useEditorHistory } from "@/lib/editor-history";
import { ensureEditorDocument, getEditorSection } from "@/lib/resume-editor";
import { serializeResumeToMarkdown } from "@/lib/resume-markdown";
import { buildResumeQualityReport } from "@/lib/resume-quality";
import { buildTailoredVariantPlan } from "@/lib/resume-tailoring";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type FormPanel = Exclude<EditorPanel, "markdown">;

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

  const markdownStarter = useMemo(() => createMarkdownStarter(document), [document]);
  const importReview = useMemo(() => buildImportReview(document), [document]);
  const targetingAnalysis = useMemo(() => analyzeResumeTargeting(document), [document]);
  const tailoredVariantPlan = useMemo(() => buildTailoredVariantPlan(document), [document]);
  const qualityReport = useMemo(() => buildResumeQualityReport(document), [document]);
  const sidebarItems = useMemo(
    () => buildSidebarItems(document, markdownDraft, targetingAnalysis, tailoredVariantPlan),
    [document, markdownDraft, targetingAnalysis, tailoredVariantPlan],
  );
  const sidebarGroups = useMemo(() => buildSidebarGroups(sidebarItems), [sidebarItems]);
  const panelMetaMap = useMemo(() => new Map(sidebarItems.map((item) => [item.key, item] as const)), [sidebarItems]);
  const activePanelMeta = panelMetaMap.get(activePanel) ?? sidebarItems[0];
  const activePanelGroup = sidebarGroups.find((group) => group.items.some((item) => item.key === activePanel)) ?? sidebarGroups[0];
  const highlightedDiagnostics = useMemo(() => [...qualityReport.blockingIssues, ...qualityReport.warnings].slice(0, 3), [qualityReport]);
  const activeSection = useMemo(() => (isSectionPanel(activePanel) ? getEditorSection(document, activePanel) : null), [activePanel, document]);
  const activePreviewTargetLabel = useMemo(() => {
    if (activePanel === "basics" || isSectionPanel(activePanel)) {
      return activePanelMeta?.label;
    }

    return undefined;
  }, [activePanel, activePanelMeta]);

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
    setGeneratedAiSummarySuggestions,
    setIsGeneratingAiSummary,
    setIsGeneratingVariant,
    setStatusMessage,
    updateDocument,
  });

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
    previewHtml,
    previewNavigationItems,
  } = useResumeEditorPreviewBridge({
    activePanel,
    activeSectionItemId,
    document: deferredDocument,
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
        <div className="resume-editor-left">
          <ResumeEditorSidebar activePanel={activePanel} groups={sidebarGroups} onSelect={handlePanelSelect} />

          <div className="resume-editor-main">
            <ResumeEditorWorkbench
              activePanelGroup={activePanelGroup}
              activePanelMeta={activePanelMeta}
              editorMode={editorMode}
              editorSurfaceRef={editorSurfaceRef}
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
                isGeneratingAiSummary={isGeneratingAiSummary}
                isGeneratingVariant={isGeneratingVariant}
                markdownDraft={markdownDraft}
                markdownError={markdownError}
                onActiveItemChange={(panel, itemId) => {
                  setActivePanel(panel);
                  setActiveSectionItemId(itemId);
                }}
                onAiApiKeyChange={updateAiApiKey}
                onAiChange={updateAiField}
                onAiPresetApply={applyAiPreset}
                onApplyGeneratedSummary={applyGeneratedAiSummarySuggestion}
                onApplyStylePreset={applyStylePreset}
                onApplySuggestedKeywords={applySuggestedKeywords}
                onBasicsChange={updateBasicsField}
                onClearMarkdown={() => {
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
                onCopySectionItem={(sectionType, itemId) => void copySectionItem(sectionType, itemId)}
                onDeleteSectionItem={deleteSectionItem}
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
                onInsertStarterMarkdown={() => applyMarkdownDraft(markdownStarter, "已插入结构")}
                onLayoutChange={updateLayoutField}
                onMarkdownChange={(value) => applyMarkdownDraft(value, "已更新")}
                onMoveSectionItem={moveSectionItem}
                onPhotoChange={updateBasicsVisualField}
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
                setActivePanel={setActivePanel}
                tailoredPlan={tailoredVariantPlan}
                targetingAnalysis={targetingAnalysis}
              />
            </ResumeEditorWorkbench>
          </div>
        </div>

        <ResumeEditorPreviewPane
          activeTargetLabel={activePreviewTargetLabel}
          html={previewHtml}
          navigationItems={previewNavigationItems}
          onApplyPreset={applyStylePreset}
          onNavigateTarget={handlePreviewNavigate}
          onTemplateChange={updateTemplate}
          saveState={saveState}
          template={document.meta.template}
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
