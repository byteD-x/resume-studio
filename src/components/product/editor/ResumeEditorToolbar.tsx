"use client";

import { ArrowLeft, Code2, Eye, FilePenLine, History, LayoutTemplate, Redo2, Save, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resumeTemplateOptions } from "@/data/template-catalog";
import type { ResumeTemplate } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type EditorMode = "form" | "markdown";

function saveStateLabel(saveState: SaveState) {
  switch (saveState) {
    case "dirty":
      return "未保存";
    case "saving":
      return "保存中";
    case "error":
      return "保存失败";
    default:
      return "已保存";
  }
}

export function ResumeEditorToolbar({
  title,
  template,
  saveState,
  statusMessage,
  editorMode,
  currentPanelGroupLabel,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  recentHistoryLabels,
  onTitleChange,
  onTemplateChange,
  onModeChange,
  onUndo,
  onRedo,
  onBack,
  onSave,
  onOpenPreview,
}: {
  title: string;
  template: ResumeTemplate;
  saveState: SaveState;
  statusMessage: string;
  editorMode: EditorMode;
  currentPanelGroupLabel: string;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  recentHistoryLabels: string[];
  onTitleChange: (value: string) => void;
  onTemplateChange: (template: ResumeTemplate) => void;
  onModeChange: (mode: EditorMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onSave: () => void;
  onOpenPreview: () => void;
}) {
  return (
    <section className="editor-toolbar">
      <div className="editor-toolbar-primary">
        <button className="btn btn-ghost" onClick={onBack} type="button">
          <ArrowLeft className="size-4" />
          返回
        </button>

        <div className="editor-toolbar-titleblock">
          <div className="editor-toolbar-heading">
            <div>
              <p className="editor-toolbar-kicker">编辑台</p>
              <div className="editor-toolbar-crumbs">
                <Badge tone="neutral">{currentPanelGroupLabel}</Badge>
              </div>
            </div>

            <div className="editor-toolbar-mode">
              <p className="editor-toolbar-mode-label">编辑方式</p>
              <div className="editor-toolbar-mode-switch" aria-label="编辑方式切换">
                <button
                  aria-pressed={editorMode === "form"}
                  className={`editor-mode-tab ${editorMode === "form" ? "editor-mode-tab-active" : ""}`}
                  onClick={() => onModeChange("form")}
                  type="button"
                >
                  <FilePenLine className="size-4" />
                  表单
                </button>
                <button
                  aria-pressed={editorMode === "markdown"}
                  className={`editor-mode-tab ${editorMode === "markdown" ? "editor-mode-tab-active" : ""}`}
                  onClick={() => onModeChange("markdown")}
                  type="button"
                >
                  <Code2 className="size-4" />
                  Markdown
                </button>
              </div>
            </div>
          </div>

          <input
            aria-label="简历标题"
            className="editor-toolbar-titleinput"
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="未命名简历"
            value={title}
          />

          <div aria-live="polite" className="editor-toolbar-meta">
            <Badge tone={saveState === "error" ? "warning" : "neutral"}>{saveStateLabel(saveState)}</Badge>
            <span className="editor-toolbar-hint">{statusMessage}</span>
          </div>

          <div className="editor-toolbar-history" aria-label="编辑历史">
            <div className="editor-toolbar-history-actions">
              <button
                aria-label={undoLabel ? `撤销：${undoLabel}` : "撤销"}
                className="editor-history-button"
                disabled={!canUndo}
                onClick={onUndo}
                title={undoLabel ? `撤销：${undoLabel}` : "没有可撤销的操作"}
                type="button"
              >
                <Undo2 className="size-4" />
                <span>{undoLabel ?? "撤销"}</span>
              </button>
              <button
                aria-label={redoLabel ? `重做：${redoLabel}` : "重做"}
                className="editor-history-button"
                disabled={!canRedo}
                onClick={onRedo}
                title={redoLabel ? `重做：${redoLabel}` : "没有可重做的操作"}
                type="button"
              >
                <Redo2 className="size-4" />
                <span>{redoLabel ?? "重做"}</span>
              </button>
            </div>

            {recentHistoryLabels.length > 0 ? (
              <div className="editor-toolbar-history-list">
                <span className="editor-toolbar-history-label">
                  <History className="size-3.5" />
                  最近编辑
                </span>
                <div className="editor-toolbar-history-chips">
                  {recentHistoryLabels.map((label, index) => (
                    <span className="editor-history-chip" key={`${label}-${index}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="editor-toolbar-actions">
        <label className="editor-toolbar-template">
          <LayoutTemplate className="size-4" />
          <select
            aria-label="选择简历模板"
            className="input-control"
            onChange={(event) => onTemplateChange(event.target.value as ResumeTemplate)}
            value={template}
          >
            {resumeTemplateOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <Button onClick={onSave} variant="secondary">
          <Save className="size-4" />
          保存
        </Button>
        <button className="btn btn-ghost" onClick={onOpenPreview} type="button">
          <Eye className="size-4" />
          导出预览
        </button>
      </div>
    </section>
  );
}
