"use client";

import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { Badge } from "@/components/ui/Badge";

export function ResumePreviewPanel({
  html,
  saveLabel,
}: {
  html: string;
  saveLabel: string;
}) {
  return (
    <aside className="editor-preview-panel">
      <div className="editor-preview-head">
        <p className="editor-preview-kicker">预览</p>
        <Badge tone="neutral">{saveLabel}</Badge>
      </div>

      <div className="editor-preview-canvas">
        <div className="editor-preview-canvas-head">
          <span />
          <span />
          <span />
        </div>
        <div className="editor-preview-canvas-body">
          <div className="editor-preview-frame-scale">
            <PreviewFrame html={html} />
          </div>
        </div>
      </div>
    </aside>
  );
}
