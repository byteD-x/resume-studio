"use client";

import { useEffect, useEffectEvent } from "react";
import type { ResumeSection } from "@/types/resume";
import { isModKey, isTextEntryTarget } from "@/lib/editor-input";
import { isSectionPanel, type ResumeEditorSectionPanel } from "@/components/product/editor/resume-editor-workspace";
import type { EditorPanel } from "@/components/product/editor/ResumeEditorSidebar";

export function useResumeEditorKeyboardShortcuts({
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
}: {
  activePanel: EditorPanel;
  activeSection: ResumeSection | null;
  activeSectionItemId: string | null;
  deleteSectionItem: (sectionType: ResumeEditorSectionPanel, itemId: string) => void;
  handleOpenPreview: () => Promise<void>;
  insertSectionItem: (
    sectionType: ResumeEditorSectionPanel,
    options?: {
      afterItemId?: string;
      duplicateFrom?: ResumeSection["items"][number];
    },
  ) => void;
  moveSectionItem: (sectionType: ResumeEditorSectionPanel, itemId: string, direction: "up" | "down") => void;
  redoLastChange: () => void;
  saveDocument: (mode: "manual" | "auto") => Promise<boolean>;
  setActiveSectionItemId: (value: string | null) => void;
  setFocusItemId: (value: string | null) => void;
  setShortcutOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  setStatusMessage: (value: string) => void;
  shortcutOpen: boolean;
  undoLastChange: () => void;
}) {
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

    if (
      (isModKey(event) && event.key.toLowerCase() === "z" && event.shiftKey) ||
      (event.ctrlKey && event.key.toLowerCase() === "y")
    ) {
      event.preventDefault();
      redoLastChange();
      return;
    }

    if (shortcutOpen) {
      return;
    }

    if (event.key === "Escape") {
      setActiveSectionItemId(null);
      setFocusItemId(null);
      setStatusMessage("已取消选择");
      return;
    }

    if (!isSectionPanel(activePanel) || !activeSection || !activeSectionItemId) {
      return;
    }

    if (isTextEntryTarget(event.target) && !(isModKey(event) && event.key === "Enter")) {
      return;
    }

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
}
