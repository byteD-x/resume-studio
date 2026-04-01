"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PreviewFrame, type PreviewFrameMetrics, type PreviewZoomPreset } from "@/components/studio/PreviewFrame";
import { resumeTemplateOptions } from "@/data/template-catalog";
import type { ResumeTemplate } from "@/types/resume";
import type { PreviewNavigateTarget } from "@/lib/resume-preview/types";
import type { PreviewNavigationItem } from "@/components/product/editor/useResumeEditorPreviewBridge";

type WorkspaceView = "edit" | "split" | "preview";
type DesignPreset = "balanced" | "compact" | "editorial";

const zoomOptions: Array<{ value: PreviewZoomPreset; label: string }> = [
  { value: "fit-width", label: "适应宽度" },
  { value: "fit-page", label: "适应整页" },
  { value: 80, label: "80%" },
  { value: 100, label: "100%" },
  { value: 120, label: "120%" },
];

const presetOptions: Array<{ value: DesignPreset; label: string }> = [
  { value: "balanced", label: "平衡" },
  { value: "compact", label: "紧凑" },
  { value: "editorial", label: "编辑感" },
];

export function ResumePreviewPanel({
  activeTargetLabel,
  html,
  navigationItems,
  saveLabel,
  template,
  workspaceView = "split",
  onNavigateTarget,
  onTemplateChange,
  onApplyPreset,
}: {
  activeTargetLabel?: string;
  html: string;
  navigationItems?: PreviewNavigationItem[];
  saveLabel: string;
  template?: ResumeTemplate;
  workspaceView?: WorkspaceView;
  onNavigateTarget?: (target: PreviewNavigateTarget) => void;
  onTemplateChange?: (template: ResumeTemplate) => void;
  onApplyPreset?: (preset: DesignPreset) => void;
}) {
  const [zoom, setZoom] = useState<PreviewZoomPreset>("fit-width");
  const [pageIndex, setPageIndex] = useState(0);
  const [metrics, setMetrics] = useState<PreviewFrameMetrics>({
    pageCount: 1,
    scale: 1,
    intrinsicWidth: 794,
    intrinsicHeight: 1123,
  });

  const pagedMode = workspaceView === "split";
  const currentPage = Math.min(pageIndex, Math.max(0, metrics.pageCount - 1));
  const resolvedZoom = workspaceView === "preview" && zoom === "fit-width" ? 100 : zoom;
  const previewMeta =
    workspaceView === "preview"
      ? "连续校对"
      : pagedMode
        ? `第 ${currentPage + 1} 页 / 共 ${metrics.pageCount} 页`
        : "实时排版";

  return (
    <aside className="editor-preview-panel">
      <div className="editor-preview-header">
        <div className="editor-preview-header-main">
          <div className="editor-preview-heading">
            <span className="editor-preview-eyebrow">Preview</span>
            <div>
              <strong className="editor-preview-title">A4 页面预览</strong>
              <p className="editor-preview-copy">{previewMeta}</p>
            </div>
          </div>

          <span className="editor-preview-save">{saveLabel}</span>
        </div>

        <div className="editor-preview-controls">
          {template && onTemplateChange ? (
            <label className="editor-preview-select">
              <span>模板</span>
              <select onChange={(event) => onTemplateChange(event.target.value as ResumeTemplate)} value={template}>
                {resumeTemplateOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="editor-preview-select">
            <span>缩放</span>
            <select
              onChange={(event) => {
                const selected = zoomOptions.find((item) => String(item.value) === event.target.value);
                if (selected) setZoom(selected.value);
              }}
              value={String(resolvedZoom)}
            >
              {zoomOptions.map((item) => (
                <option key={String(item.value)} value={String(item.value)}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          {onApplyPreset ? (
            <label className="editor-preview-select">
              <span>版式</span>
              <select defaultValue="" onChange={(event) => onApplyPreset(event.target.value as DesignPreset)}>
                <option disabled value="">
                  选择预设
                </option>
                {presetOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {pagedMode ? (
            <div className="editor-preview-pagination">
              <button
                aria-label="上一页"
                className="editor-preview-pagebutton"
                disabled={currentPage === 0}
                onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="editor-preview-pagecount">
                {currentPage + 1}/{metrics.pageCount}
              </span>
              <button
                aria-label="下一页"
                className="editor-preview-pagebutton"
                disabled={currentPage >= metrics.pageCount - 1}
                onClick={() => setPageIndex((value) => Math.min(metrics.pageCount - 1, value + 1))}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : (
            <span className="editor-preview-pagehint">A4 / {metrics.pageCount} 页</span>
          )}
        </div>

        {navigationItems && navigationItems.length > 0 ? (
          <div className="editor-preview-outline">
            <div className="editor-preview-outline-meta">
              <span className="editor-preview-outline-label">双向定位</span>
              <span className="editor-preview-outline-copy">
                {activeTargetLabel ? `当前联动：${activeTargetLabel}` : "点击预览区块可回到对应编辑位置"}
              </span>
            </div>

            <div className="editor-preview-outline-chips">
              {navigationItems.map((item) => (
                <button
                  className={`editor-preview-chip ${item.isActive ? "editor-preview-chip-active" : ""}`}
                  key={item.id}
                  onClick={() => onNavigateTarget?.(item.target)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="editor-preview-canvas">
        <div className={`editor-preview-canvas-body ${pagedMode ? "editor-preview-canvas-body-paged" : ""}`}>
          <PreviewFrame
            html={html}
            onMetricsChange={setMetrics}
            onNavigateTarget={onNavigateTarget}
            pageIndex={currentPage}
            paged={pagedMode}
            zoom={resolvedZoom}
          />
        </div>
      </div>
    </aside>
  );
}
