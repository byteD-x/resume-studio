"use client";

import { ResumePreviewPanel } from "@/components/product/editor/ResumePreviewPanel";
import type { PreviewNavigationItem } from "@/components/product/editor/useResumeEditorPreviewBridge";
import type { WorkspaceView } from "@/components/product/editor/ResumeEditorToolbar";
import type { PreviewNavigateTarget } from "@/lib/resume-preview/types";
import type { ResumeTemplate } from "@/types/resume";

type SaveState = "saved" | "dirty" | "saving" | "error";
type DesignPreset = "balanced" | "compact" | "editorial";

export function ResumeEditorPreviewPane({
  activeTargetLabel,
  html,
  navigationItems,
  onApplyPreset,
  onNavigateTarget,
  onTemplateChange,
  saveState,
  template,
  workspaceView,
}: {
  activeTargetLabel?: string;
  html: string;
  navigationItems: PreviewNavigationItem[];
  onApplyPreset: (preset: DesignPreset) => void;
  onNavigateTarget: (target: PreviewNavigateTarget) => void;
  onTemplateChange: (template: ResumeTemplate) => void;
  saveState: SaveState;
  template: ResumeTemplate;
  workspaceView: WorkspaceView;
}) {
  return (
    <div className="resume-editor-right">
      <ResumePreviewPanel
        activeTargetLabel={activeTargetLabel}
        html={html}
        navigationItems={navigationItems}
        onApplyPreset={onApplyPreset}
        onNavigateTarget={onNavigateTarget}
        onTemplateChange={onTemplateChange}
        saveLabel={resolveSaveLabel(saveState)}
        template={template}
        workspaceView={workspaceView}
      />
    </div>
  );
}

function resolveSaveLabel(saveState: SaveState) {
  if (saveState === "dirty") {
    return "未保存修改";
  }

  if (saveState === "saving") {
    return "正在保存";
  }

  if (saveState === "error") {
    return "保存失败";
  }

  return "已保存";
}
