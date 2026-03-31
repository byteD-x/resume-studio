"use client";

import { PreviewFrame } from "@/components/studio/PreviewFrame";

export function ResumePreviewPanel({
  html,
  saveLabel,
  panelLabel,
  groupLabel,
  countLabel,
}: {
  html: string;
  saveLabel: string;
  panelLabel: string;
  groupLabel: string;
  countLabel?: string;
}) {
  return (
    <aside className="editor-preview-panel">
      <div className="editor-preview-head">
        <div>
          <p className="editor-preview-kicker">成稿</p>
          <p className="editor-preview-title">当前编辑「{panelLabel}」</p>
          <p className="editor-preview-copy">版式与导出保持一致。</p>
        </div>
        <span className="editor-preview-save">{saveLabel}</span>
      </div>

      <div className="editor-preview-meta">
        <span>{groupLabel}</span>
        <span>A4</span>
        {countLabel ? <span>{countLabel}</span> : null}
      </div>

      <div className="editor-preview-canvas">
        <div className="editor-preview-canvas-body">
          <PreviewFrame html={html} />
        </div>
      </div>
    </aside>
  );
}
