"use client";

import type { ReactNode, RefObject } from "react";
import { BellDot, MoreHorizontal } from "lucide-react";
import type { EditorPanelGroup, EditorPanelItem } from "@/components/product/editor/ResumeEditorSidebar";

function resolveStatusTone(status: EditorPanelItem["status"]): "neutral" | "accent" | "success" | "warning" {
  switch (status) {
    case "ready":
      return "success";
    case "in_progress":
      return "accent";
    default:
      return "neutral";
  }
}

function resolveStatusLabel(status: EditorPanelItem["status"]) {
  switch (status) {
    case "ready":
      return "已就绪";
    case "in_progress":
      return "编辑中";
    default:
      return "待补充";
  }
}

function shouldShowInlineStatus(status: EditorPanelItem["status"]) {
  return status !== "ready";
}

export function ResumeEditorWorkbench({
  activePanelGroup,
  activePanelMeta,
  children,
  editorMode,
  editorSurfaceRef,
  focusLabel,
  noticeCount = 0,
  notices,
  onModeChange,
  onSurfaceFocusCapture,
}: {
  activePanelGroup?: EditorPanelGroup;
  activePanelMeta?: EditorPanelItem;
  children: ReactNode;
  editorMode: "visual" | "markdown";
  editorSurfaceRef: RefObject<HTMLElement | null>;
  focusLabel?: string;
  noticeCount?: number;
  notices?: ReactNode;
  onModeChange: (mode: "visual" | "markdown") => void;
  onSurfaceFocusCapture: () => void;
}) {
  const resolvedStatus = activePanelMeta?.status ?? "empty";

  return (
    <div className="resume-editor-stack flex min-h-0 flex-1 flex-col overflow-hidden">
      <section className="editor-workbench-header shrink-0">
        <div className="editor-workbench-row">
          <div className="editor-workbench-caption">
            <strong className="editor-workbench-title" title={activePanelGroup?.label}>
              {activePanelMeta?.label ?? focusLabel ?? "编辑"}
            </strong>

            <div className="editor-workbench-meta">
              {activePanelMeta?.countLabel ? (
                <span className="editor-workbench-count">{activePanelMeta.countLabel}</span>
              ) : null}
              {shouldShowInlineStatus(resolvedStatus) ? (
                <span className={`editor-workbench-status editor-workbench-status-${resolveStatusTone(resolvedStatus)}`}>
                  {resolveStatusLabel(resolvedStatus)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="editor-workbench-controls">
            {notices ? (
              <details className="editor-workbench-menu">
                <summary aria-label="提示与版本信息" className="editor-workbench-menu-trigger">
                  <BellDot className="size-3.5" />
                  <span>提示</span>
                  {noticeCount > 0 ? <span className="editor-workbench-menu-count">{noticeCount}</span> : null}
                  <MoreHorizontal className="size-3.5" />
                </summary>

                <div className="editor-workbench-menu-popover">{notices}</div>
              </details>
            ) : null}

            <div aria-label="编辑模式" className="editor-input-mode">
              <button
                aria-pressed={editorMode === "visual"}
                className={`editor-input-mode-tab ${editorMode === "visual" ? "editor-input-mode-tab-active" : ""}`}
                onClick={() => onModeChange("visual")}
                type="button"
              >
                可视化
              </button>
              <button
                aria-pressed={editorMode === "markdown"}
                className={`editor-input-mode-tab ${editorMode === "markdown" ? "editor-input-mode-tab-active" : ""}`}
                onClick={() => onModeChange("markdown")}
                type="button"
              >
                Markdown
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="editor-surface-section editor-surface-section-active flex-1 overflow-y-auto"
        onFocusCapture={onSurfaceFocusCapture}
        ref={editorSurfaceRef}
      >
        {children}
      </section>
    </div>
  );
}
