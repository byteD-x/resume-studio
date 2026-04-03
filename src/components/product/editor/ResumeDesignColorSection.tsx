"use client";

import { colorFieldOptions, type ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignColorSection({
  document,
  onLayoutChange,
}: Pick<ResumeDesignPanelProps, "document" | "onLayoutChange">) {
  const { layout } = document;

  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>颜色与字体</h3>
      </div>
      <div className="resume-editor-field-grid">
        <label className="field-shell">
          <span className="field-label">正文字体</span>
          <input
            className="input-control"
            onChange={(event) => onLayoutChange("bodyFont", event.target.value)}
            placeholder="Aptos, Source Sans 3, Georgia"
            value={layout.bodyFont}
          />
        </label>
        <label className="field-shell">
          <span className="field-label">标题字体</span>
          <input
            className="input-control"
            onChange={(event) => onLayoutChange("headingFont", event.target.value)}
            placeholder="Iowan Old Style, Fraunces"
            value={layout.headingFont}
          />
        </label>
        {colorFieldOptions.map(({ field, label }) => (
          <label className="field-shell field-shell-color" key={field}>
            <span className="field-label">{label}</span>
            <div className="color-control">
              <input
                className="color-input color-input-swatch"
                onChange={(event) => onLayoutChange(field, event.target.value)}
                type="color"
                value={String(layout[field]).startsWith("#") ? String(layout[field]) : "#3559b7"}
              />
              <input
                className="input-control color-input-text"
                onChange={(event) => onLayoutChange(field, event.target.value)}
                value={String(layout[field])}
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
