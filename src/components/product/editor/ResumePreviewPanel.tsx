"use client";

import { useState } from "react";
import { ChevronDown, LayoutTemplate, List, Minus, Plus, SlidersHorizontal, ZoomIn } from "lucide-react";
import { PreviewFrame, type PreviewFrameMetrics, type PreviewZoomPreset } from "@/components/studio/PreviewFrame";
import type { PreviewNavigationItem } from "@/components/product/editor/useResumeEditorPreviewBridge";
import { resumeTemplateOptions } from "@/data/template-catalog";
import type { PreviewNavigateTarget } from "@/lib/resume-preview/types";
import type { ResumeTemplate } from "@/types/resume";

type WorkspaceView = "edit" | "split" | "preview";
type DesignPreset = "balanced" | "compact" | "editorial";
type PreviewSaveState = "saved" | "dirty" | "saving" | "error";

const zoomModeOptions: Array<{ value: "fit-width" | "fit-page" | number; label: string }> = [
  { value: "fit-width", label: "适宽" },
  { value: "fit-page", label: "整页" },
  { value: 60, label: "60%" },
  { value: 70, label: "70%" },
  { value: 80, label: "80%" },
  { value: 90, label: "90%" },
  { value: 100, label: "100%" },
  { value: 110, label: "110%" },
  { value: 120, label: "120%" },
  { value: 130, label: "130%" },
  { value: 140, label: "140%" },
  { value: 150, label: "150%" },
  { value: 160, label: "160%" },
];

const presetOptions: Array<{ value: DesignPreset; label: string }> = [
  { value: "balanced", label: "均衡" },
  { value: "compact", label: "紧凑" },
  { value: "editorial", label: "编辑感" },
];

const MIN_ZOOM = 60;
const MAX_ZOOM = 160;
const ZOOM_STEP = 10;

function clampZoomValue(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(value / ZOOM_STEP) * ZOOM_STEP));
}

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
  const activeNavigationItem = navigationItems?.find((item) => item.isActive);
  const currentZoomPercent = clampZoomValue(Math.round(metrics.scale * 100));
  const canZoomOut = currentZoomPercent > MIN_ZOOM;
  const canZoomIn = currentZoomPercent < MAX_ZOOM;

  const handleZoomStep = (direction: -1 | 1) => {
    const baseValue = typeof resolvedZoom === "number" ? resolvedZoom : currentZoomPercent;
    setZoom(clampZoomValue(baseValue + direction * ZOOM_STEP));
  };

  return (
    <aside className="editor-preview-panel">
      <div className="editor-preview-header">
        <div className="editor-preview-toolbar">
          <div className="editor-preview-meta">
            <span className={`editor-preview-save editor-preview-save-${saveState}`}>
              <span aria-hidden className="editor-preview-save-dot" />
              {saveLabel}
            </span>
            {previewModeLabel ? <span className="editor-preview-meta-item">{previewModeLabel}</span> : null}
            {!navigationItems?.length && activeTargetLabel ? (
              <span className="editor-preview-meta-item">{activeTargetLabel}</span>
            ) : null}
            <span className="editor-preview-meta-item">{metrics.pageCount} 页</span>
          </div>

          <div className="editor-preview-controls">
            {navigationItems && navigationItems.length > 0 ? (
              <label className="editor-preview-control editor-preview-control-section" htmlFor="editor-preview-section">
                <span className="editor-preview-select-shell">
                  <List className="editor-preview-select-icon size-4" />
                  <select
                    className="editor-preview-select-input"
                    id="editor-preview-section"
                    onChange={(event) => {
                      const next = navigationItems.find((item) => item.id === event.target.value);
                      if (next) {
                        onNavigateTarget?.(next.target);
                      }
                    }}
                    value={activeNavigationItem?.id ?? ""}
                  >
                    {navigationItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="editor-preview-select-caret size-4" />
                </span>
              </label>
            ) : null}

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

            <div className="editor-preview-control editor-preview-zoom-group">
              <label className="editor-preview-zoom-mode" htmlFor="editor-preview-zoom-mode">
                <span className="editor-preview-select-shell">
                  <ZoomIn className="editor-preview-select-icon size-4" />
                  <select
                    className="editor-preview-select-input"
                    id="editor-preview-zoom-mode"
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "fit-width" || value === "fit-page") {
                        setZoom(value);
                      } else {
                        setZoom(Number(value));
                      }
                    }}
                    value={zoom}
                  >
                    {zoomModeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="editor-preview-select-caret size-4" />
                </span>
              </label>

              <div aria-label="预览缩放" className="editor-preview-zoom-stepper" role="group">
                <button
                  aria-label="缩小预览"
                  className="editor-preview-zoom-button"
                  disabled={!canZoomOut}
                  onClick={() => handleZoomStep(-1)}
                  type="button"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="editor-preview-zoom-value">{currentZoomPercent}%</span>
                <button
                  aria-label="放大预览"
                  className="editor-preview-zoom-button"
                  disabled={!canZoomIn}
                  onClick={() => handleZoomStep(1)}
                  type="button"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

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
