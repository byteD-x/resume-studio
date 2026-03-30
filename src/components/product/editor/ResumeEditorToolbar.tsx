"use client";

import { ArrowLeft, Code2, Eye, FilePenLine, Save } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type SaveState = "saved" | "dirty" | "saving" | "error";
type EditorMode = "form" | "markdown";

function saveStateLabel(saveState: SaveState) {
  switch (saveState) {
    case "dirty":
      return "未保存修改";
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
  saveState,
  statusMessage,
  editorMode,
  onTitleChange,
  onModeChange,
  onBack,
  onSave,
  onOpenPreview,
}: {
  title: string;
  saveState: SaveState;
  statusMessage: string;
  editorMode: EditorMode;
  onTitleChange: (value: string) => void;
  onModeChange: (mode: EditorMode) => void;
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
          <input
            className="editor-toolbar-titleinput"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="未命名简历"
          />
          <div className="editor-toolbar-meta">
            <Badge tone={saveState === "error" ? "warning" : "neutral"}>{saveStateLabel(saveState)}</Badge>
            <span className="editor-toolbar-hint">{statusMessage}</span>
          </div>
        </div>

        <div className="editor-toolbar-mode">
          <div className="editor-toolbar-mode-switch" role="tablist" aria-label="编辑方式切换">
            <button
              aria-selected={editorMode === "form"}
              className={`editor-mode-tab ${editorMode === "form" ? "editor-mode-tab-active" : ""}`}
              onClick={() => onModeChange("form")}
              role="tab"
              type="button"
            >
              <FilePenLine className="size-4" />
              表单
            </button>
            <button
              aria-selected={editorMode === "markdown"}
              className={`editor-mode-tab ${editorMode === "markdown" ? "editor-mode-tab-active" : ""}`}
              onClick={() => onModeChange("markdown")}
              role="tab"
              type="button"
            >
              <Code2 className="size-4" />
              Markdown
            </button>
          </div>
        </div>
      </div>

      <div className="editor-toolbar-actions">
        <Button onClick={onSave} variant="secondary">
          <Save className="size-4" />
          保存
        </Button>
        <button className="btn btn-ghost" onClick={onOpenPreview} type="button">
          <Eye className="size-4" />
          预览
        </button>
      </div>
    </section>
  );
}
