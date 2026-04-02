"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import type { MutableRefObject } from "react";
import { useResumeEditorFieldActions } from "@/components/product/editor/useResumeEditorFieldActions";
import {
  useResumeEditorSectionActions,
  type PendingEditorConfirmation,
  type RecentDeletion,
} from "@/components/product/editor/useResumeEditorSectionActions";
import {
  createBlankMarkdownDocument,
  validateMarkdownDraft,
} from "@/components/product/editor/resume-editor-workspace";
import { getJsonOrThrow } from "@/lib/client-auth";
import { useEditorHistory } from "@/lib/editor-history";
import { ensureEditorDocument } from "@/lib/resume-editor";
import { parseResumeFromMarkdown, serializeResumeToMarkdown } from "@/lib/resume-markdown";
import type { ResumeDocument } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";

interface ResumeEditorSnapshot {
  document: ResumeDocument;
  markdownDraft: string;
}

export function useResumeEditorPersistence({
  clientAiApiKey,
  document,
  editorMode,
  history,
  latestDocumentRef,
  markdownError,
  latestMarkdownErrorRef,
  latestMarkdownRef,
  lastSavedRef,
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
  suggestedKeywords,
  timerRef,
}: {
  clientAiApiKey: string;
  document: ResumeDocument;
  editorMode: "form" | "markdown";
  history: ReturnType<typeof useEditorHistory<ResumeEditorSnapshot>>;
  latestDocumentRef: MutableRefObject<ResumeDocument>;
  markdownError: string | null;
  latestMarkdownErrorRef: MutableRefObject<string | null>;
  latestMarkdownRef: MutableRefObject<string>;
  lastSavedRef: MutableRefObject<string>;
  recentDeletion: RecentDeletion | null;
  saveQueueRef: MutableRefObject<Promise<boolean>>;
  saveState: SaveState;
  setActiveSectionItemId: (value: string | null) => void;
  setClientAiApiKey: (value: string) => void;
  setConfirmation: (value: PendingEditorConfirmation | null) => void;
  setDocument: (value: ResumeDocument) => void;
  setFocusItemId: (value: string | null) => void;
  setMarkdownDraft: (value: string) => void;
  setMarkdownError: (value: string | null) => void;
  setRecentDeletion: (value: RecentDeletion | null) => void;
  setSaveState: (value: SaveState) => void;
  setStatusMessage: (value: string) => void;
  suggestedKeywords: string[];
  timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  const createSnapshot = () => ({
    document: latestDocumentRef.current,
    markdownDraft: latestMarkdownRef.current,
  });

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
      next.markdownError === undefined
        ? validateMarkdownDraft(next.markdownDraft, normalized)
        : next.markdownError;

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
    setStatusMessage(`${direction === "undo" ? "已撤销" : "已重做"}${label ? `：${label}` : ""}`);
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

  const fieldActions = useResumeEditorFieldActions({
    clientAiApiKey,
    latestDocumentRef,
    setClientAiApiKey,
    setStatusMessage,
    suggestedKeywords,
    updateDocument,
  });

  const sectionActions = useResumeEditorSectionActions({
    latestDocumentRef,
    recentDeletion,
    setActiveSectionItemId,
    setConfirmation,
    setFocusItemId,
    setRecentDeletion,
    setStatusMessage,
    updateDocument,
  });

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
      const saved = await getJsonOrThrow<ResumeDocument>(
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
    if (serialized === lastSavedRef.current || latestMarkdownErrorRef.current) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      triggerAutosave();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [document, lastSavedRef, latestMarkdownErrorRef, timerRef]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "saved" && !markdownError) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [markdownError, saveState]);

  return {
    ...fieldActions,
    ...sectionActions,
    applyMarkdownDraft,
    redoLastChange,
    saveDocument,
    undoLastChange,
    updateDocument,
  };
}
