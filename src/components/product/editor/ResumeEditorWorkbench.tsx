"use client";

import type { ReactNode, RefObject } from "react";
import { Badge } from "@/components/ui/Badge";
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

export function ResumeEditorWorkbench({
  activePanelGroup,
  activePanelMeta,
  children,
  editorMode,
  editorSurfaceRef,
  focusLabel,
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
  notices?: ReactNode;
  onModeChange: (mode: "visual" | "markdown") => void;
  onSurfaceFocusCapture: () => void;
}) {
  return (
    <div className="resume-editor-stack flex min-h-0 flex-1 flex-col overflow-hidden">
      <section className="editor-workbench-header shrink-0">
        <div className="editor-workbench-row">
          <div className="editor-workbench-caption">
            <strong className="editor-workbench-title">{activePanelMeta?.label ?? focusLabel ?? "编辑"}</strong>
            <div className="editor-workbench-tagrow">
              {activePanelGroup?.label ? <Badge tone="neutral">{activePanelGroup.label}</Badge> : null}
              <Badge tone={resolveStatusTone(activePanelMeta?.status ?? "empty")}>
                {resolveStatusLabel(activePanelMeta?.status ?? "empty")}
              </Badge>
              {activePanelMeta?.countLabel ? <Badge tone="neutral">{activePanelMeta.countLabel}</Badge> : null}
            </div>
          </div>

          <div className="editor-workbench-controls">
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

        {notices ? <div className="editor-workbench-notices">{notices}</div> : null}
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
