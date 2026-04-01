"use client";

import type { MutableRefObject } from "react";
import {
  createEditorItem,
  duplicateEditorItem,
  editorSectionDefinitions,
  getEditorSection,
  moveItem,
  sectionItemToPlainText,
} from "@/lib/resume-editor";
import type { ResumeDocument, ResumeSectionItem } from "@/types/resume";
import { hasMeaningfulItemContent, type ResumeEditorSectionPanel } from "@/components/product/editor/resume-editor-workspace";

export interface RecentDeletion {
  sectionType: ResumeEditorSectionPanel;
  sectionTitle: string;
  item: ResumeSectionItem;
  index: number;
}

export interface PendingEditorConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
  onConfirm: () => void | Promise<void>;
}

type UpdateDocument = (
  updater: (current: ResumeDocument) => ResumeDocument,
  options?: {
    message?: string;
    historyLabel?: string;
    clearDeletion?: boolean;
  },
) => void;

export function useResumeEditorSectionActions({
  latestDocumentRef,
  recentDeletion,
  setActiveSectionItemId,
  setConfirmation,
  setFocusItemId,
  setRecentDeletion,
  setStatusMessage,
  updateDocument,
}: {
  latestDocumentRef: MutableRefObject<ResumeDocument>;
  recentDeletion: RecentDeletion | null;
  setActiveSectionItemId: (value: string | null) => void;
  setConfirmation: (value: PendingEditorConfirmation | null) => void;
  setFocusItemId: (value: string | null) => void;
  setRecentDeletion: (value: RecentDeletion | null) => void;
  setStatusMessage: (value: string) => void;
  updateDocument: UpdateDocument;
}) {
  const insertSectionItem = (
    sectionType: ResumeEditorSectionPanel,
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

  const moveSectionItem = (sectionType: ResumeEditorSectionPanel, itemId: string, direction: "up" | "down") => {
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

  const removeSectionItem = (sectionType: ResumeEditorSectionPanel, itemId: string) => {
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

  const deleteSectionItem = (sectionType: ResumeEditorSectionPanel, itemId: string) => {
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

  const copySectionItem = async (sectionType: ResumeEditorSectionPanel, itemId: string) => {
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

  return {
    copySectionItem,
    deleteSectionItem,
    insertSectionItem,
    moveSectionItem,
    removeSectionItem,
    restoreDeletedItem,
  };
}
