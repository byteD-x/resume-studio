"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Keyboard,
  MoreHorizontal,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getResumeDerivativeLabel, type ResumeLineageMeta } from "@/lib/resume-lineage";

type SaveState = "saved" | "dirty" | "saving" | "error";
export type WorkspaceView = "edit" | "split" | "preview";

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

function lineageBadgeTone(kind: ResumeLineageMeta["kind"]): "accent" | "neutral" | "success" {
  if (kind === "variant") return "accent";
  if (kind === "source") return "success";
  return "neutral";
}

function lineageShortLabel(meta: ResumeLineageMeta) {
  if (meta.kind === "variant") return getResumeDerivativeLabel(meta.derivativeKind);
  if (meta.kind === "source") return meta.childCount > 0 ? `源简历 ${meta.childCount}` : "源简历";
  return "草稿";
}

export function ResumeEditorToolbar({
  title,
  saveState,
  statusMessage,
  workspaceView = "split",
  lineage = null,
  parentStudioHref = null,
  canUndo,
  canRedo,
  onTitleChange,
  onWorkspaceViewChange = () => undefined,
  onUndo,
  onRedo,
  onBack,
  onSave,
  onOpenPreview,
  onOpenShortcuts = () => undefined,
  undoLabel,
  redoLabel,
  recentHistoryLabels,
}: {
  title: string;
  saveState: SaveState;
  statusMessage: string;
  workspaceView?: WorkspaceView;
  lineage?: ResumeLineageMeta | null;
  parentStudioHref?: Route | null;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  recentHistoryLabels: string[];
  onTitleChange: (value: string) => void;
  onWorkspaceViewChange?: (mode: WorkspaceView) => void;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onSave: () => void;
  onOpenPreview: () => void;
  onOpenShortcuts?: () => void;
}) {
  return (
    <section className="editor-toolbar">
      <div className="editor-toolbar-shell">
        <div className="editor-toolbar-left">
          <button aria-label="返回" className="btn btn-ghost editor-toolbar-back" onClick={onBack} type="button">
            <ArrowLeft className="size-4" />
            <span>返回</span>
          </button>

          <div className="editor-toolbar-titleblock">
            <div className="editor-toolbar-heading">
              <input
                aria-label="简历标题"
                className="editor-toolbar-titleinput"
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="未命名简历"
                value={title}
              />

              {lineage ? (
                <div className="editor-toolbar-lineage">
                  <Badge tone={lineageBadgeTone(lineage.kind)}>{lineageShortLabel(lineage)}</Badge>
                  {lineage.kind === "variant" && parentStudioHref ? (
                    <Link className="editor-toolbar-lineage-link" href={parentStudioHref}>
                      来源
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="editor-toolbar-meta">
              <span className={`editor-toolbar-save editor-toolbar-save-${saveState}`}>
                <span aria-hidden className="editor-toolbar-save-dot" />
                {saveStateLabel(saveState)}
              </span>
              {statusMessage ? (
                <span className="editor-toolbar-message" title={statusMessage}>
                  {statusMessage}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div aria-label="工作区视图" className="editor-toolbar-center" role="tablist">
          {[
            { key: "edit", label: "编辑" },
            { key: "split", label: "分屏" },
            { key: "preview", label: "预览" },
          ].map((item) => (
            <button
              key={item.key}
              aria-selected={workspaceView === item.key}
              className={`editor-toolbar-viewtab ${workspaceView === item.key ? "editor-toolbar-viewtab-active" : ""}`}
              onClick={() => onWorkspaceViewChange(item.key as WorkspaceView)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="editor-toolbar-actions">
          <Button className="editor-toolbar-export" onClick={onOpenPreview}>
            <ExternalLink className="size-4 shrink-0" />
            导出
          </Button>

          <details className="editor-toolbar-menu">
            <summary aria-label="更多操作" className="editor-toolbar-menu-trigger">
              <MoreHorizontal className="size-4" />
            </summary>

            <div className="editor-toolbar-menu-popover">
              <button className="editor-toolbar-menu-item" onClick={onSave} type="button">
                <Save className="size-4" />
                保存
              </button>
              <button
                className="editor-toolbar-menu-item"
                disabled={!canUndo}
                onClick={onUndo}
                title={undoLabel ?? undefined}
                type="button"
              >
                <Undo2 className="size-4" />
                撤销
              </button>
              <button
                className="editor-toolbar-menu-item"
                disabled={!canRedo}
                onClick={onRedo}
                title={redoLabel ?? undefined}
                type="button"
              >
                <Redo2 className="size-4" />
                重做
              </button>
              <button className="editor-toolbar-menu-item" onClick={onOpenShortcuts} type="button">
                <Keyboard className="size-4" />
                快捷键
              </button>

              {recentHistoryLabels.length > 0 ? (
                <div className="editor-toolbar-menu-history">
                  <span className="editor-toolbar-menu-label">最近修改</span>
                  <div className="editor-toolbar-menu-chips">
                    {recentHistoryLabels.slice(0, 3).map((label, index) => (
                      <span className="editor-toolbar-menu-chip" key={`${label}-${index}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
