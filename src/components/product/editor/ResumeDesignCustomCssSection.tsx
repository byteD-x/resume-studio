"use client";

import type { ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignCustomCssSection({
  document,
  onLayoutChange,
}: Pick<ResumeDesignPanelProps, "document" | "onLayoutChange">) {
  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>高级样式</h3>
      </div>
      <label className="field-shell field-shell-full">
        <span className="field-label">Custom CSS</span>
        <textarea
          className="input-control input-control-code"
          onChange={(event) => onLayoutChange("customCss", event.target.value)}
          placeholder={[
            ".resume-document .section-header h2 {",
            "  letter-spacing: 0.14em;",
            "}",
            "",
            ".resume-document .rich-text h3 {",
            "  font-size: 10.5pt;",
            "  margin-top: 3mm;",
            "}",
          ].join("\n")}
          rows={12}
          spellCheck={false}
          value={document.layout.customCss}
        />
        <span className="field-help">
          建议优先使用上面的可视化控件；需要更高自由度时，再用 CSS 精调。
        </span>
      </label>
    </div>
  );
}
