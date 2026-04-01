"use client";

import { numberValue, type ResumeDesignPanelProps } from "@/components/product/editor/resume-design-panel-shared";

export function ResumeDesignTypographySection({
  document,
  onLayoutChange,
}: Pick<ResumeDesignPanelProps, "document" | "onLayoutChange">) {
  const { layout } = document;

  return (
    <div className="resume-editor-group">
      <div className="resume-editor-group-head">
        <h3>文字与层级</h3>
      </div>
      <div className="resume-editor-field-grid">
        <label className="field-shell">
          <span className="field-label">正文字号</span>
          <input
            className="input-control"
            max={14}
            min={8}
            onChange={(event) => onLayoutChange("bodyFontSizePt", numberValue(event.target.value, layout.bodyFontSizePt))}
            step={0.1}
            type="range"
            value={layout.bodyFontSizePt}
          />
          <span className="field-help">{layout.bodyFontSizePt.toFixed(1)} pt</span>
        </label>
        <label className="field-shell">
          <span className="field-label">姓名字号</span>
          <input
            className="input-control"
            max={32}
            min={18}
            onChange={(event) => onLayoutChange("nameSizePt", numberValue(event.target.value, layout.nameSizePt))}
            step={1}
            type="range"
            value={layout.nameSizePt}
          />
          <span className="field-help">{layout.nameSizePt} pt</span>
        </label>
        <label className="field-shell">
          <span className="field-label">职位标题字号</span>
          <input
            className="input-control"
            max={16}
            min={9}
            onChange={(event) => onLayoutChange("headlineSizePt", numberValue(event.target.value, layout.headlineSizePt))}
            step={0.2}
            type="range"
            value={layout.headlineSizePt}
          />
          <span className="field-help">{layout.headlineSizePt.toFixed(1)} pt</span>
        </label>
        <label className="field-shell">
          <span className="field-label">章节标题字号</span>
          <input
            className="input-control"
            max={18}
            min={9}
            onChange={(event) =>
              onLayoutChange("sectionTitleSizePt", numberValue(event.target.value, layout.sectionTitleSizePt))
            }
            step={0.5}
            type="range"
            value={layout.sectionTitleSizePt}
          />
          <span className="field-help">{layout.sectionTitleSizePt.toFixed(1)} pt</span>
        </label>
        <label className="field-shell">
          <span className="field-label">条目标题字号</span>
          <input
            className="input-control"
            max={16}
            min={9}
            onChange={(event) =>
              onLayoutChange("itemTitleSizePt", numberValue(event.target.value, layout.itemTitleSizePt))
            }
            step={0.5}
            type="range"
            value={layout.itemTitleSizePt}
          />
          <span className="field-help">{layout.itemTitleSizePt.toFixed(1)} pt</span>
        </label>
        <label className="field-shell">
          <span className="field-label">辅助信息字号</span>
          <input
            className="input-control"
            max={12}
            min={7}
            onChange={(event) => onLayoutChange("metaFontSizePt", numberValue(event.target.value, layout.metaFontSizePt))}
            step={0.2}
            type="range"
            value={layout.metaFontSizePt}
          />
          <span className="field-help">{layout.metaFontSizePt.toFixed(1)} pt</span>
        </label>
        <label className="field-shell">
          <span className="field-label">行距</span>
          <input
            className="input-control"
            max={2}
            min={1.1}
            onChange={(event) => onLayoutChange("lineHeight", numberValue(event.target.value, layout.lineHeight))}
            step={0.05}
            type="range"
            value={layout.lineHeight}
          />
          <span className="field-help">{layout.lineHeight.toFixed(2)}</span>
        </label>
        <label className="field-shell">
          <span className="field-label">段落间距</span>
          <input
            className="input-control"
            max={8}
            min={1}
            onChange={(event) =>
              onLayoutChange("paragraphGapMm", numberValue(event.target.value, layout.paragraphGapMm))
            }
            step={0.2}
            type="range"
            value={layout.paragraphGapMm}
          />
          <span className="field-help">{layout.paragraphGapMm.toFixed(1)} mm</span>
        </label>
        <label className="field-shell">
          <span className="field-label">章节间距</span>
          <input
            className="input-control"
            max={14}
            min={2}
            onChange={(event) => onLayoutChange("sectionGapMm", numberValue(event.target.value, layout.sectionGapMm))}
            step={0.5}
            type="range"
            value={layout.sectionGapMm}
          />
          <span className="field-help">{layout.sectionGapMm.toFixed(1)} mm</span>
        </label>
        <label className="field-shell">
          <span className="field-label">条目间距</span>
          <input
            className="input-control"
            max={10}
            min={1}
            onChange={(event) => onLayoutChange("itemGapMm", numberValue(event.target.value, layout.itemGapMm))}
            step={0.5}
            type="range"
            value={layout.itemGapMm}
          />
          <span className="field-help">{layout.itemGapMm.toFixed(1)} mm</span>
        </label>
        <label className="field-shell">
          <span className="field-label">分栏间距</span>
          <input
            className="input-control"
            max={16}
            min={0}
            onChange={(event) => onLayoutChange("columnGapMm", numberValue(event.target.value, layout.columnGapMm))}
            step={0.5}
            type="range"
            value={layout.columnGapMm}
          />
          <span className="field-help">{layout.columnGapMm.toFixed(1)} mm</span>
        </label>
        <label className="field-shell">
          <span className="field-label">列表项间距</span>
          <input
            className="input-control"
            max={4}
            min={0}
            onChange={(event) => onLayoutChange("listGapMm", numberValue(event.target.value, layout.listGapMm))}
            step={0.1}
            type="range"
            value={layout.listGapMm}
          />
          <span className="field-help">{layout.listGapMm.toFixed(1)} mm</span>
        </label>
      </div>
    </div>
  );
}
