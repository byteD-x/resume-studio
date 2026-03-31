"use client";

import { resumeTemplateOptions } from "@/data/template-catalog";
import type { ResumeDocument } from "@/types/resume";

type LayoutField = keyof ResumeDocument["layout"];
type PhotoField = "photoUrl" | "photoAlt" | "photoVisible" | "photoShape" | "photoPosition" | "photoSizeMm";
type DesignPreset = "balanced" | "compact" | "editorial";

function numberValue(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const quickPresets: Array<{
  id: DesignPreset;
  title: string;
  description: string;
}> = [
  {
    id: "balanced",
    title: "平衡排版",
    description: "适合大多数简历，信息密度和留白更均衡。",
  },
  {
    id: "compact",
    title: "紧凑一页",
    description: "压缩字号和间距，更容易把内容收进一页。",
  },
  {
    id: "editorial",
    title: "作品集感",
    description: "更大的标题和更明显的层级，适合有展示感的内容。",
  },
];

export function ResumeDesignPanel({
  document,
  onApplyPreset,
  onLayoutChange,
  onTemplateChange,
  onPhotoChange,
}: {
  document: ResumeDocument;
  onApplyPreset: (preset: DesignPreset) => void;
  onLayoutChange: <K extends LayoutField>(field: K, value: ResumeDocument["layout"][K]) => void;
  onTemplateChange: (template: ResumeDocument["meta"]["template"]) => void;
  onPhotoChange: <K extends PhotoField>(field: K, value: ResumeDocument["basics"][K]) => void;
}) {
  const { layout, basics, meta } = document;

  return (
    <section className="resume-editor-panel">
      <div className="resume-editor-panel-head">
        <div>
          <p className="resume-editor-panel-kicker">版式与外观</p>
          <h2 className="resume-editor-panel-title">版式与模板</h2>
          <p className="resume-editor-panel-copy">先定模板，再微调字号、间距、颜色和头像。</p>
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>快速风格</h3>
          <p>先定整体气质，再细调参数。</p>
        </div>
        <div className="editor-preset-grid">
          {quickPresets.map((preset) => (
            <button
              className="editor-preset-card"
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              type="button"
            >
              <strong>{preset.title}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>模板与整体结构</h3>
          <p>先定结构，再看密度和对齐。</p>
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

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>文字与层级</h3>
          <p>控制字体大小、层级和阅读节奏。</p>
        </div>
        <div className="resume-editor-field-grid">
          <label className="field-shell">
            <span className="field-label">正文大小</span>
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
            <span className="field-label">姓名大小</span>
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
            <span className="field-label">职位标题大小</span>
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
            <span className="field-label">章节标题大小</span>
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
            <span className="field-label">经历标题大小</span>
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
            <span className="field-label">辅助信息大小</span>
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
            <span className="field-label">正文间距</span>
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

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>颜色与字体</h3>
          <p>统一纸张、文字、链接与强调色。</p>
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
          {[
            ["accentColor", "强调色"],
            ["pageBackground", "外层背景"],
            ["paperColor", "纸张背景"],
            ["textColor", "正文颜色"],
            ["mutedTextColor", "辅助文字"],
            ["dividerColor", "分隔线"],
            ["linkColor", "链接颜色"],
          ].map(([field, label]) => (
            <label className="field-shell field-shell-color" key={field}>
              <span className="field-label">{label}</span>
              <div className="color-control">
                <input
                  className="color-input"
                  onChange={(event) => onLayoutChange(field as LayoutField, event.target.value)}
                  type="color"
                  value={String(layout[field as LayoutField]).startsWith("#") ? String(layout[field as LayoutField]) : "#3559b7"}
                />
                <input
                  className="input-control"
                  onChange={(event) => onLayoutChange(field as LayoutField, event.target.value)}
                  value={String(layout[field as LayoutField])}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>头像与图片位置</h3>
          <p>提供稳定的头像布局，不影响导出效果。</p>
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

      <div className="resume-editor-group">
        <div className="resume-editor-group-head">
          <h3>高级样式</h3>
          <p>
            参考成熟开源编辑器的做法，允许直接写自定义 CSS。这样你可以控制多级标题、局部间距、特殊排版和更细的视觉细节。
          </p>
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
            value={layout.customCss}
          />
          <span className="field-help">
            建议优先使用上面的可视化控件；需要更高自由度时，再用 CSS 精调。
          </span>
        </label>
      </div>
    </section>
  );
}
