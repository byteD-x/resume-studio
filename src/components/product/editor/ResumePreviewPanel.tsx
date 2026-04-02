"use client";

import { useState } from "react";
import { ChevronDown, LayoutTemplate, SlidersHorizontal, ZoomIn } from "lucide-react";
import { PreviewFrame, type PreviewFrameMetrics, type PreviewZoomPreset } from "@/components/studio/PreviewFrame";
import type { PreviewNavigationItem } from "@/components/product/editor/useResumeEditorPreviewBridge";
import { resumeTemplateOptions } from "@/data/template-catalog";
import type { PreviewNavigateTarget } from "@/lib/resume-preview/types";
import type { ResumeTemplate } from "@/types/resume";

type WorkspaceView = "edit" | "split" | "preview";
type DesignPreset = "balanced" | "compact" | "editorial";
type PreviewSaveState = "saved" | "dirty" | "saving" | "error";

const zoomOptions: Array<{ value: PreviewZoomPreset; label: string }> = [
  { value: "fit-width", label: "\u9002\u5e94\u5bbd\u5ea6" },
  { value: "fit-page", label: "\u9002\u5e94\u5355\u9875" },
  { value: 80, label: "80%" },
  { value: 100, label: "100%" },
  { value: 120, label: "120%" },
];

const presetOptions: Array<{ value: DesignPreset; label: string }> = [
  { value: "balanced", label: "\u5e73\u8861" },
  { value: "compact", label: "\u7d27\u51d1" },
  { value: "editorial", label: "\u7f16\u8f91\u611f" },
];

export function ResumePreviewPanel({
  activeTargetLabel,
  focusedTarget,
  html,
  navigationItems,
  saveLabel,
  saveState = "saved",
  template,
  workspaceView = "split",
  onNavigateTarget,
  onTemplateChange,
  onApplyPreset,
}: {
  activeTargetLabel?: string;
  focusedTarget?: PreviewNavigateTarget;
  html: string;
  navigationItems?: PreviewNavigationItem[];
  saveLabel: string;
  saveState?: PreviewSaveState;
  template?: ResumeTemplate;
  workspaceView?: WorkspaceView;
  onNavigateTarget?: (target: PreviewNavigateTarget) => void;
  onTemplateChange?: (template: ResumeTemplate) => void;
  onApplyPreset?: (preset: DesignPreset) => void;
}) {
  const [zoom, setZoom] = useState<PreviewZoomPreset>("fit-width");
  const [metrics, setMetrics] = useState<PreviewFrameMetrics>({
    pageCount: 1,
    scale: 1,
    intrinsicWidth: 794,
    intrinsicHeight: 1123,
  });

  const resolvedZoom = workspaceView === "preview" && zoom === "fit-width" ? 100 : zoom;
  const previewMeta = `\u8fde\u7eed\u6eda\u52a8 \u00b7 \u7ea6 ${metrics.pageCount} \u9875`;
  const pageHint = `A4 \u00b7 \u8fde\u7eed\u6eda\u52a8 \u00b7 \u7ea6 ${metrics.pageCount} \u9875`;
  const outlineCopy = activeTargetLabel
    ? `\u5f53\u524d\u8054\u52a8\uff1a${activeTargetLabel}`
    : "\u70b9\u51fb\u9884\u89c8\u5185\u5bb9\u6216\u6807\u7b7e\uff0c\u4f1a\u540c\u6b65\u5230\u5bf9\u5e94\u7f16\u8f91\u4f4d\u7f6e\u3002";

  return (
    <aside className="editor-preview-panel">
      <div className="editor-preview-header">
        <div className="editor-preview-header-main">
          <div className="editor-preview-heading">
            <span className="editor-preview-eyebrow">Preview</span>
            <div>
              <strong className="editor-preview-title">A4 \u9884\u89c8</strong>
              <p className="editor-preview-copy">{previewMeta}</p>
            </div>
          </div>

          <span className={`editor-preview-save editor-preview-save-${saveState}`}>{saveLabel}</span>
        </div>

        <div className="editor-preview-controls">
          {template && onTemplateChange ? (
            <label className="editor-preview-control" htmlFor="editor-preview-template">
              <span className="editor-preview-control-label">\u6a21\u677f</span>
              <span className="editor-preview-select-shell">
                <LayoutTemplate className="editor-preview-select-icon size-4" />
                <select
                  className="editor-preview-select-input"
                  id="editor-preview-template"
                  onChange={(event) => onTemplateChange(event.target.value as ResumeTemplate)}
                  value={template}
                >
                  {resumeTemplateOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="editor-preview-select-caret size-4" />
              </span>
            </label>
          ) : null}

          <label className="editor-preview-control" htmlFor="editor-preview-zoom">
            <span className="editor-preview-control-label">\u7f29\u653e</span>
            <span className="editor-preview-select-shell">
              <ZoomIn className="editor-preview-select-icon size-4" />
              <select
                className="editor-preview-select-input"
                id="editor-preview-zoom"
                onChange={(event) => {
                  const selected = zoomOptions.find((item) => String(item.value) === event.target.value);
                  if (selected) {
                    setZoom(selected.value);
                  }
                }}
                value={String(resolvedZoom)}
              >
                {zoomOptions.map((item) => (
                  <option key={String(item.value)} value={String(item.value)}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="editor-preview-select-caret size-4" />
            </span>
          </label>

          {onApplyPreset ? (
            <label className="editor-preview-control" htmlFor="editor-preview-preset">
              <span className="editor-preview-control-label">\u7248\u5f0f</span>
              <span className="editor-preview-select-shell">
                <SlidersHorizontal className="editor-preview-select-icon size-4" />
                <select
                  className="editor-preview-select-input"
                  defaultValue=""
                  id="editor-preview-preset"
                  onChange={(event) => onApplyPreset(event.target.value as DesignPreset)}
                >
                  <option disabled value="">
                    {"\u9009\u62e9\u9884\u8bbe"}
                  </option>
                  {presetOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="editor-preview-select-caret size-4" />
              </span>
            </label>
          ) : null}

          <span className="editor-preview-pagehint">{pageHint}</span>
        </div>

        {navigationItems && navigationItems.length > 0 ? (
          <div className="editor-preview-outline">
            <div className="editor-preview-outline-meta">
              <span className="editor-preview-outline-label">{"\u53cc\u5411\u5b9a\u4f4d"}</span>
              <span className="editor-preview-outline-copy">{outlineCopy}</span>
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
        <div className="editor-preview-canvas-body">
          <PreviewFrame
            focusedTarget={focusedTarget}
            html={html}
            onMetricsChange={setMetrics}
            onNavigateTarget={onNavigateTarget}
            zoom={resolvedZoom}
          />
        </div>
      </div>
    </aside>
  );
}
