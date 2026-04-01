"use client";

import { resumeTemplateOptions } from "@/data/template-catalog";
import type { ResumeDocument } from "@/types/resume";
import { numberValue, type ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignLayoutSection({
  document,
  onLayoutChange,
  onTemplateChange,
}: Pick<ResumeDesignPanelProps, "document" | "onLayoutChange" | "onTemplateChange">) {
  const { layout, meta } = document;

  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>模板与整体结构</h3>
      </div>
      <div className="resume-editor-field-grid">
        <label className="field-shell">
          <span className="field-label">模板</span>
          <select
            className="input-control"
            onChange={(event) => onTemplateChange(event.target.value as ResumeDocument["meta"]["template"])}
            value={meta.template}
          >
            {resumeTemplateOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-shell">
          <span className="field-label">页边距（mm）</span>
          <input
            className="input-control"
            max={24}
            min={8}
            onChange={(event) => onLayoutChange("marginsMm", numberValue(event.target.value, layout.marginsMm))}
            step={1}
            type="range"
            value={layout.marginsMm}
          />
          <span className="field-help">{layout.marginsMm} mm</span>
        </label>
        <label className="field-shell">
          <span className="field-label">页眉对齐</span>
          <select
            className="input-control"
            onChange={(event) => onLayoutChange("headerAlign", event.target.value as ResumeDocument["layout"]["headerAlign"])}
            value={layout.headerAlign}
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
          </select>
        </label>
        <label className="field-shell">
          <span className="field-label">章节标题样式</span>
          <select
            className="input-control"
            onChange={(event) =>
              onLayoutChange("sectionTitleStyle", event.target.value as ResumeDocument["layout"]["sectionTitleStyle"])
            }
            value={layout.sectionTitleStyle}
          >
            <option value="line">线性标题</option>
            <option value="filled">色块标题</option>
            <option value="minimal">极简标题</option>
          </select>
        </label>
        <label className="field-shell">
          <span className="field-label">章节标题对齐</span>
          <select
            className="input-control"
            onChange={(event) =>
              onLayoutChange("sectionTitleAlign", event.target.value as ResumeDocument["layout"]["sectionTitleAlign"])
            }
            value={layout.sectionTitleAlign}
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
          </select>
        </label>
      </div>
      <div className="resume-editor-toggle-row">
        <label className="editor-toggle">
          <input
            checked={layout.showSectionDividers}
            onChange={(event) => onLayoutChange("showSectionDividers", event.target.checked)}
            type="checkbox"
          />
          <span>显示章节分隔线</span>
        </label>
        <label className="editor-toggle">
          <input
            checked={layout.pageShadowVisible}
            onChange={(event) => onLayoutChange("pageShadowVisible", event.target.checked)}
            type="checkbox"
          />
          <span>在预览中显示纸张阴影</span>
        </label>
      </div>
    </div>
  );
}
