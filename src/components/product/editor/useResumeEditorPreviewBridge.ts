"use client";

import { useMemo } from "react";
import { hasMeaningfulRichText, hasResumeSectionItemContent } from "@/lib/resume-content";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import type { PreviewNavigateTarget } from "@/lib/resume-preview/types";
import type { ResumeDocument, ResumeSection } from "@/types/resume";
import type { EditorPanel, EditorPanelItem } from "@/components/product/editor/ResumeEditorSidebar";

export interface PreviewNavigationItem {
  id: string;
  label: string;
  target: PreviewNavigateTarget;
  isActive: boolean;
}

export function useResumeEditorPreviewBridge({
  activePanel,
  activeSectionItemId,
  document,
  focusFormPanel,
  panelMetaMap,
  setActivePanel,
  setActiveSectionItemId,
  setFocusItemId,
  setStatusMessage,
  setWorkspaceView,
  workspaceView,
}: {
  activePanel: EditorPanel;
  activeSectionItemId: string | null;
  document: ResumeDocument;
  focusFormPanel: (panel: Exclude<EditorPanel, "markdown">, message?: string) => void;
  panelMetaMap: Map<EditorPanel, EditorPanelItem>;
  setActivePanel: (value: EditorPanel) => void;
  setActiveSectionItemId: (value: string | null) => void;
  setFocusItemId: (value: string | null) => void;
  setStatusMessage: (value: string) => void;
  setWorkspaceView: (value: "edit" | "split" | "preview") => void;
  workspaceView: "edit" | "split" | "preview";
}) {
  const previewHtml = useMemo(
    () =>
      buildResumePreviewHtml(document, {
        highlightedTarget:
          activePanel === "basics"
            ? { kind: "basics" }
            : activePanel === "markdown" || activePanel === "ai" || activePanel === "design" || activePanel === "targeting"
              ? undefined
              : { kind: "section", sectionType: activePanel, itemId: activeSectionItemId ?? undefined },
        interactive: true,
      }),
    [activePanel, activeSectionItemId, document],
  );

  const previewNavigationItems = useMemo(() => {
    const items: PreviewNavigationItem[] = [];
    const hasBasicsPreview =
      document.basics.name.trim() ||
      document.basics.headline.trim() ||
      document.basics.location.trim() ||
      document.basics.email.trim() ||
      document.basics.phone.trim() ||
      document.basics.website.trim() ||
      document.basics.links.length > 0 ||
      document.basics.photoVisible;

    if (hasBasicsPreview || hasMeaningfulRichText(document.basics.summaryHtml)) {
      items.push({
        id: "basics",
        label: "抬头 / 摘要",
        target: { kind: "basics" },
        isActive: activePanel === "basics",
      });
    }

    document.sections
      .filter(
        (section) =>
          section.visible &&
          (hasMeaningfulRichText(section.contentHtml) || section.items.some(hasResumeSectionItemContent)),
      )
      .forEach((section) => {
        items.push({
          id: section.id,
          label: resolveSectionChipLabel(section),
          target: { kind: "section", sectionType: section.type },
          isActive:
            (section.type === "summary" && activePanel === "basics") ||
            (section.type === "custom" && activePanel === "markdown") ||
            activePanel === section.type,
        });
      });

    return items;
  }, [activePanel, document]);

  const handlePreviewNavigate = (target: PreviewNavigateTarget) => {
    if (workspaceView === "preview") {
      setWorkspaceView("split");
    }

    if (target.kind === "basics") {
      setActiveSectionItemId(null);
      setFocusItemId(null);
      focusFormPanel("basics", "已定位到抬头与摘要。");
      return;
    }

    if (target.sectionType === "summary") {
      setActiveSectionItemId(null);
      setFocusItemId(null);
      focusFormPanel("basics", "已定位到摘要。");
      return;
    }

    if (target.sectionType === "custom") {
      setActiveSectionItemId(null);
      setFocusItemId(null);
      setActivePanel("markdown");
      setStatusMessage("已定位到自定义小节，请在 Markdown 中编辑。");
      return;
    }

    const panelLabel = panelMetaMap.get(target.sectionType)?.label ?? "对应模块";
    setActiveSectionItemId(target.itemId ?? null);
    setFocusItemId(target.itemId ?? null);
    focusFormPanel(target.sectionType, target.itemId ? `已定位到${panelLabel}中的条目。` : `已定位到${panelLabel}。`);
    if (!target.itemId) {
      setStatusMessage(`已定位到${panelLabel}。`);
    }
  };

  return {
    handlePreviewNavigate,
    previewHtml,
    previewNavigationItems,
  };
}

function resolveSectionChipLabel(section: ResumeSection) {
  const compactTitle = section.title.replace(/\s+/g, "").trim();
  return compactTitle.length > 8 ? compactTitle.slice(0, 8) : compactTitle;
}
