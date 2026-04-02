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
  { value: "fit-width", label: "适宽" },
  { value: "fit-page", label: "整页" },
  { value: 80, label: "80%" },
  { value: 100, label: "100%" },
  { value: 110, label: "110%" },
];

const presetOptions: Array<{ value: DesignPreset; label: string }> = [
  { value: "balanced", label: "均衡" },
  { value: "compact", label: "紧凑" },
  { value: "editorial", label: "编辑感" },
];

export function ResumePreviewPanel({
  activeTargetLabel,
  focusedTarget,
  html,
  navigationItems,
  previewModeLabel,
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
  previewModeLabel?: string;
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

  return (
    <aside className="editor-preview-panel">
      <div className="editor-preview-header">
        <div className="editor-preview-utilitybar">
          <div className="editor-preview-utilitymeta">
            <span className={`editor-preview-save editor-preview-save-${saveState}`}>{saveLabel}</span>
            {previewModeLabel ? (
              <span className="editor-preview-save editor-preview-save-preview">{previewModeLabel}</span>
            ) : null}
            {activeTargetLabel ? <span className="editor-preview-current">{activeTargetLabel}</span> : null}
            <span className="editor-preview-pages">{metrics.pageCount} 页</span>
          </div>

          <div className="editor-preview-controls">
            {template && onTemplateChange ? (
              <label className="editor-preview-control" htmlFor="editor-preview-template">
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
                <span className="editor-preview-select-shell">
                  <SlidersHorizontal className="editor-preview-select-icon size-4" />
                  <select
                    className="editor-preview-select-input"
                    defaultValue=""
                    id="editor-preview-preset"
                    onChange={(event) => onApplyPreset(event.target.value as DesignPreset)}
                  >
                    <option disabled value="">
                      版式
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
          </div>
        </div>

        {navigationItems && navigationItems.length > 0 ? (
          <div className="editor-preview-outline">
            <div className="editor-preview-outline-chips">
              {navigationItems.map((item) => (
                <button
                  aria-label={activeTargetLabel && item.isActive ? `${item.label}，当前` : item.label}
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
