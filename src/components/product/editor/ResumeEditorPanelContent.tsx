"use client";

import dynamic from "next/dynamic";
import { ResumeBasicsPanel } from "@/components/product/editor/ResumeBasicsPanel";
import type { EditorPanel } from "@/components/product/editor/ResumeEditorSidebar";
import {
  isSectionPanel,
  type ResumeEditorSectionPanel,
  type ResumeEditorStylePreset,
} from "@/components/product/editor/resume-editor-workspace";
import { editorSectionDefinitions, getEditorSection } from "@/lib/resume-editor";
import type { TailoredVariantPlan } from "@/lib/resume-tailoring";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeTargetingAnalysis } from "@/lib/resume-targeting";

function EditorPanelLoading({
  label = "正在载入面板…",
}: {
  label?: string;
}) {
  return (
    <div aria-live="polite" className="text-sm text-[var(--muted-text)]">
      {label}
    </div>
  );
}

const ResumeSectionEditor = dynamic(
  () => import("@/components/product/ResumeSectionEditor").then((module) => module.ResumeSectionEditor),
  {
    loading: () => <EditorPanelLoading label="正在载入内容面板…" />,
  },
);

const ResumeAiPanel = dynamic(
  () => import("@/components/product/editor/ResumeAiPanel").then((module) => module.ResumeAiPanel),
  {
    loading: () => <EditorPanelLoading label="正在载入 AI 面板…" />,
  },
);

const ResumeDesignPanel = dynamic(
  () => import("@/components/product/editor/ResumeDesignPanel").then((module) => module.ResumeDesignPanel),
  {
    loading: () => <EditorPanelLoading label="正在载入样式面板…" />,
  },
);

const ResumeMarkdownPanel = dynamic(
  () => import("@/components/product/editor/ResumeMarkdownPanel").then((module) => module.ResumeMarkdownPanel),
  {
    loading: () => <EditorPanelLoading label="正在载入 Markdown…" />,
  },
);

const ResumeTargetingPanel = dynamic(
  () => import("@/components/product/editor/ResumeTargetingPanel").then((module) => module.ResumeTargetingPanel),
  {
    loading: () => <EditorPanelLoading label="正在载入定向面板…" />,
  },
);

export function ResumeEditorPanelContent({
  activePanel,
  activeSectionItemId,
  apiKey,
  document,
  editorMode,
  focusItemId,
  generatedSummarySuggestions,
  isGeneratingAiSummary,
  isGeneratingVariant,
  markdownDraft,
  markdownError,
  onActiveItemChange,
  onAiApiKeyChange,
  onAiChange,
  onAiPresetApply,
  onApplyGeneratedSummary,
  onApplyStylePreset,
  onApplySuggestedKeywords,
  onBasicsChange,
  onClearMarkdown,
  onCopySectionItem,
  onDeleteSectionItem,
  onDuplicateSectionItem,
  onGenerateAiSummary,
  onGenerateTailoredVariant,
  onInsertSectionItem,
  onInsertStarterMarkdown,
  onLayoutChange,
  onMarkdownChange,
  onMoveSectionItem,
  onPhotoChange,
  onSectionChange,
  onSummaryHtmlChange,
  onTargetingChange,
  onTemplateChange,
  setActivePanel,
  tailoredPlan,
  targetingAnalysis,
}: {
  activePanel: EditorPanel;
  activeSectionItemId: string | null;
  apiKey: string;
  document: ResumeDocument;
  editorMode: "form" | "markdown";
  focusItemId: string | null;
  generatedSummarySuggestions: ResumeAssistSuggestion[];
  isGeneratingAiSummary: boolean;
  isGeneratingVariant: boolean;
  markdownDraft: string;
  markdownError: string | null;
  onActiveItemChange: (panel: ResumeEditorSectionPanel, itemId: string | null) => void;
  onAiApiKeyChange: (value: string) => void;
  onAiChange: (field: keyof ResumeDocument["ai"], value: string) => void;
  onAiPresetApply: (presetId: string) => void;
  onApplyGeneratedSummary: (suggestion: ResumeAssistSuggestion) => void;
  onApplyStylePreset: (presetId: ResumeEditorStylePreset) => void;
  onApplySuggestedKeywords: () => void;
  onBasicsChange: (field: "name" | "headline" | "location" | "website" | "email" | "phone" | "summaryHtml" | "links", value: string) => void;
  onClearMarkdown: () => void;
  onCopySectionItem: (sectionType: ResumeEditorSectionPanel, itemId: string) => void;
  onDeleteSectionItem: (sectionType: ResumeEditorSectionPanel, itemId: string) => void;
  onDuplicateSectionItem: (sectionType: ResumeEditorSectionPanel, itemId: string) => void;
  onGenerateAiSummary: () => void;
  onGenerateTailoredVariant: () => void;
  onInsertSectionItem: (sectionType: ResumeEditorSectionPanel, afterItemId?: string) => void;
  onInsertStarterMarkdown: () => void;
  onLayoutChange: <K extends keyof ResumeDocument["layout"]>(field: K, value: ResumeDocument["layout"][K]) => void;
  onMarkdownChange: (value: string) => void;
  onMoveSectionItem: (sectionType: ResumeEditorSectionPanel, itemId: string, direction: "up" | "down") => void;
  onPhotoChange: <
    K extends "photoUrl" | "photoAlt" | "photoVisible" | "photoShape" | "photoPosition" | "photoSizeMm",
  >(
    field: K,
    value: ResumeDocument["basics"][K],
  ) => void;
  onSectionChange: (nextSection: ResumeDocument["sections"][number], title: string) => void;
  onSummaryHtmlChange: (value: string) => void;
  onTargetingChange: (field: keyof ResumeDocument["targeting"], value: string) => void;
  onTemplateChange: (template: ResumeDocument["meta"]["template"]) => void;
  setActivePanel: (panel: EditorPanel) => void;
  tailoredPlan: TailoredVariantPlan;
  targetingAnalysis: ResumeTargetingAnalysis;
}) {
  if (editorMode === "markdown") {
    return (
      <ResumeMarkdownPanel
        onChange={onMarkdownChange}
        onClear={onClearMarkdown}
        onInsertStarter={onInsertStarterMarkdown}
        parseError={markdownError}
        value={markdownDraft}
      />
    );
  }

  if (activePanel === "basics") {
    return (
      <ResumeBasicsPanel
        document={document}
        onBasicsChange={onBasicsChange}
        onSummaryHtmlChange={onSummaryHtmlChange}
      />
    );
  }

  if (activePanel === "design") {
    return (
      <ResumeDesignPanel
        document={document}
        onApplyPreset={onApplyStylePreset}
        onLayoutChange={onLayoutChange}
        onPhotoChange={onPhotoChange}
        onTemplateChange={onTemplateChange}
      />
    );
  }

  if (activePanel === "targeting") {
    return <ResumeTargetingPanel document={document} onTargetingChange={onTargetingChange} />;
  }

  if (activePanel === "ai") {
    return (
      <ResumeAiPanel
        analysis={targetingAnalysis}
        apiKey={apiKey}
        document={document}
        generatedSummarySuggestions={generatedSummarySuggestions}
        isGenerating={isGeneratingVariant}
        isGeneratingSummary={isGeneratingAiSummary}
        onAiChange={onAiChange}
        onAiApiKeyChange={onAiApiKeyChange}
        onAiPresetApply={onAiPresetApply}
        onApplyGeneratedSummary={onApplyGeneratedSummary}
        onApplySuggestedKeywords={onApplySuggestedKeywords}
        onGenerateSummary={onGenerateAiSummary}
        onGenerateTailoredVariant={onGenerateTailoredVariant}
        tailoredPlan={tailoredPlan}
      />
    );
  }

  if (!isSectionPanel(activePanel)) {
    return null;
  }

  const definition = editorSectionDefinitions.find((item) => item.type === activePanel);
  const section = getEditorSection(document, activePanel);
  if (!definition || !section) return null;

  return (
    <ResumeSectionEditor
      activeItemId={activeSectionItemId}
      document={document}
      definition={definition}
      focusItemId={focusItemId}
      onActiveItemChange={(itemId) => {
        setActivePanel(activePanel);
        onActiveItemChange(activePanel, itemId);
      }}
      onAddItem={(options) => onInsertSectionItem(activePanel, options?.afterItemId)}
      onChange={(nextSection) => onSectionChange(nextSection, definition.title)}
      onCopyItem={(itemId) => onCopySectionItem(activePanel, itemId)}
      onDeleteItem={(itemId) => onDeleteSectionItem(activePanel, itemId)}
      onDuplicateItem={(itemId) => onDuplicateSectionItem(activePanel, itemId)}
      onMoveItem={(itemId, direction) => onMoveSectionItem(activePanel, itemId, direction)}
      section={section}
      writerProfile={document.meta.writerProfile}
    />
  );
}
