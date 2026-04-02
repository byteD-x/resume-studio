"use client";

import type { ReactNode, RefObject } from "react";
import type { EditorPanelGroup, EditorPanelItem } from "@/components/product/editor/ResumeEditorSidebar";

export function ResumeEditorWorkbench({
  activePanelGroup,
  activePanelMeta,
  children,
  editorMode,
  editorSurfaceRef,
  notices,
  onModeChange,
  onSurfaceFocusCapture,
}: {
  activePanelGroup?: EditorPanelGroup;
  activePanelMeta?: EditorPanelItem;
  children: ReactNode;
  editorMode: "form" | "markdown";
  editorSurfaceRef: RefObject<HTMLElement | null>;
  notices?: ReactNode;
  onModeChange: (mode: "form" | "markdown") => void;
  onSurfaceFocusCapture: () => void;
}) {
  const panelDescription =
    editorMode === "markdown"
      ? "适合长文修改、结构重排与批量粘贴。"
      : activePanelMeta?.hint || "聚焦当前模块，右侧同步校对纸面排版。";

  return (
    <div className="resume-editor-stack flex flex-1 flex-col min-h-0 overflow-hidden">
      <section className="editor-workbench-header shrink-0">
        <div className="editor-workbench-row">
          <div className="editor-workbench-caption">
            <div className="editor-workbench-titleblock">
              <span className="editor-workbench-label">{activePanelGroup?.label ?? "编辑模块"}</span>
              <strong className="editor-workbench-title">{activePanelMeta?.label ?? "编辑"}</strong>
              <p className="editor-workbench-copy">{panelDescription}</p>
            </div>
          </div>

          <div className="editor-workbench-controls">
            <div aria-label="内容编辑方式" className="editor-input-mode">
              <button
                aria-pressed={editorMode === "form"}
                className={`editor-input-mode-tab ${editorMode === "form" ? "editor-input-mode-tab-active" : ""}`}
                onClick={() => onModeChange("form")}
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

            <span className="editor-workbench-modehint">
              {editorMode === "markdown" ? "源码模式" : "所见即所得"}
            </span>
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
