"use client";

import type { ResumeDocument } from "@/types/resume";
import { numberValue, type ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignPhotoSection({
  document,
  onPhotoChange,
}: Pick<ResumeDesignPanelProps, "document" | "onPhotoChange">) {
  const { basics } = document;

  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>头像与图片位置</h3>
      </div>
      <div className="resume-editor-field-grid">
        <label className="field-shell">
          <span className="field-label">头像链接</span>
          <input
            className="input-control"
            onChange={(event) => onPhotoChange("photoUrl", event.target.value)}
            placeholder="https://example.com/avatar.jpg"
            value={basics.photoUrl}
          />
        </label>
        <label className="field-shell">
          <span className="field-label">替代文本</span>
          <input
            className="input-control"
            onChange={(event) => onPhotoChange("photoAlt", event.target.value)}
            placeholder="例如：求职者头像"
            value={basics.photoAlt}
          />
        </label>
        <label className="field-shell">
          <span className="field-label">头像位置</span>
          <select
            className="input-control"
            onChange={(event) =>
              onPhotoChange("photoPosition", event.target.value as ResumeDocument["basics"]["photoPosition"])
            }
            value={basics.photoPosition}
          >
            <option value="top-right">页眉右侧</option>
            <option value="top-left">页眉左侧</option>
            <option value="sidebar">侧栏顶部</option>
          </select>
        </label>
        <label className="field-shell">
          <span className="field-label">头像形状</span>
          <select
            className="input-control"
            onChange={(event) =>
              onPhotoChange("photoShape", event.target.value as ResumeDocument["basics"]["photoShape"])
            }
            value={basics.photoShape}
          >
            <option value="square">方形</option>
            <option value="rounded">圆角</option>
            <option value="circle">圆形</option>
          </select>
        </label>
        <label className="field-shell">
          <span className="field-label">头像尺寸</span>
          <input
            className="input-control"
            max={60}
            min={18}
            onChange={(event) => onPhotoChange("photoSizeMm", numberValue(event.target.value, basics.photoSizeMm))}
            step={1}
            type="range"
            value={basics.photoSizeMm}
          />
          <span className="field-help">{basics.photoSizeMm} mm</span>
        </label>
      </div>
      <div className="resume-editor-toggle-row">
        <label className="editor-toggle">
          <input
            checked={basics.photoVisible}
            onChange={(event) => onPhotoChange("photoVisible", event.target.checked)}
            type="checkbox"
          />
          <span>在简历中显示头像</span>
        </label>
      </div>
    </div>
  );
}
