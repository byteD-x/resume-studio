import { escapeHtml } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";
import { sanitizeCustomCss } from "@/lib/resume-preview/custom-css";

export function buildEmptyPreviewState(document: ResumeDocument, accent: string) {
  const customCss = document.layout.customCss.trim();

  return `<!DOCTYPE html>
<html lang="${escapeHtml(document.meta.locale)}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.meta.title)}</title>
    <style>
      :root {
        --accent: ${accent};
        --ink: ${escapeHtml(document.layout.textColor)};
        --ink-soft: ${escapeHtml(document.layout.mutedTextColor)};
        --line: ${escapeHtml(document.layout.dividerColor)};
        --paper: ${escapeHtml(document.layout.paperColor)};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: ${escapeHtml(document.layout.pageBackground)};
        color: var(--ink);
        font-family: "${escapeHtml(document.layout.bodyFont)}", "Segoe UI", sans-serif;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: ${document.layout.marginsMm}mm;
        background: var(--paper);
      }
      .empty-shell {
        min-height: calc(297mm - ${document.layout.marginsMm * 2}mm);
        display: grid;
        place-items: center;
      }
      .empty-card {
        width: min(126mm, 100%);
        padding: 18mm 14mm;
        border: 1px dashed var(--line);
        border-radius: 10mm;
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--accent) 5%, white), rgba(255, 255, 255, 0.98));
        text-align: center;
      }
      .empty-mark {
        width: 18mm;
        height: 18mm;
        margin: 0 auto 7mm;
        border-radius: 999px;
        background: color-mix(in srgb, var(--accent) 14%, white);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent);
      }
      h1 {
        margin: 0;
        font-family: "${escapeHtml(document.layout.headingFont)}", "Times New Roman", serif;
        font-size: ${document.layout.nameSizePt}pt;
        line-height: 1.1;
      }
      p {
        margin: 4mm auto 0;
        max-width: 88mm;
        color: var(--ink-soft);
        font-size: ${document.layout.bodyFontSizePt + 0.8}pt;
        line-height: 1.65;
      }
      .empty-notes {
        margin: 8mm auto 0;
        display: grid;
        gap: 2.2mm;
        text-align: left;
        max-width: 78mm;
      }
      .empty-note {
        padding: 3mm 3.4mm;
        border-radius: 4mm;
        background: rgba(255, 255, 255, 0.86);
        font-size: ${document.layout.metaFontSizePt + 0.4}pt;
        color: var(--ink);
      }
      @page {
        size: A4;
        margin: 0;
      }
    </style>
    ${customCss ? `<style id="resume-custom-css">${sanitizeCustomCss(customCss)}</style>` : ""}
  </head>
  <body>
    <div class="page resume-document template-${escapeHtml(document.meta.template)}">
      <div class="empty-shell">
        <section class="empty-card">
          <div class="empty-mark" aria-hidden="true"></div>
          <h1>从这里开始</h1>
          <p>右侧会按当前模板实时排版。</p>
          <div class="empty-notes">
            <div class="empty-note">先写姓名、职位和联系方式。</div>
            <div class="empty-note">再补经历、项目与技能。</div>
            <div class="empty-note">确认后即可导出 PDF。</div>
          </div>
        </section>
      </div>
    </div>
  </body>
</html>`;
}
