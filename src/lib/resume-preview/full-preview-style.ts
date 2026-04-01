import { escapeHtml } from "@/lib/utils";
import type { PreviewTemplateContext } from "@/lib/resume-preview/full-preview-shared";
import type { ResumeDocument } from "@/types/resume";

function resolveMastheadColumns(document: ResumeDocument, context: PreviewTemplateContext) {
  if (!context.hasPhoto || context.photoInSidebar) {
    return "1fr";
  }

  return document.basics.photoPosition === "top-left"
    ? `${document.basics.photoSizeMm}mm minmax(0, 1fr)`
    : `minmax(0, 1fr) ${document.basics.photoSizeMm}mm`;
}

function resolvePhotoBorderRadius(document: ResumeDocument) {
  if (document.basics.photoShape === "circle") {
    return "999px";
  }

  if (document.basics.photoShape === "rounded") {
    return "8px";
  }

  return "0";
}

export function buildPreviewStyles(document: ResumeDocument, context: PreviewTemplateContext) {
  const mastheadColumns = resolveMastheadColumns(document, context);
  const photoBorderRadius = resolvePhotoBorderRadius(document);

  return `      :root {
        --accent: ${context.accent};
        --ink: ${escapeHtml(document.layout.textColor)};
        --ink-soft: ${escapeHtml(document.layout.mutedTextColor)};
        --line: ${escapeHtml(document.layout.dividerColor)};
        --paper: ${escapeHtml(document.layout.paperColor)};
        --link: ${escapeHtml(document.layout.linkColor)};
        --shell-gap: ${context.isModern ? `${document.layout.columnGapMm}mm` : "0"};
        --column-padding: ${context.isModern ? "5mm" : "0"};
        --section-gap: ${document.layout.sectionGapMm}mm;
        --section-header-gap: ${context.isModern ? "3mm" : "3.2mm"};
        --item-gap: ${document.layout.itemGapMm}mm;
        --body-size: ${document.layout.bodyFontSizePt}pt;
        --bullet-size: ${Math.max(document.layout.bodyFontSizePt - 0.1, 8)}pt;
        --meta-size: ${document.layout.metaFontSizePt}pt;
        --tag-size: 8.5pt;
        --name-size: ${document.layout.nameSizePt}pt;
        --headline-size: ${document.layout.headlineSizePt}pt;
        --section-title-size: ${document.layout.sectionTitleSizePt}pt;
        --item-title-size: ${document.layout.itemTitleSizePt}pt;
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
        box-shadow: ${document.layout.pageShadowVisible ? "0 18px 42px rgba(15, 23, 42, 0.12)" : "none"};
      }
      .resume-shell {
        display: ${context.isModern ? "grid" : "block"};
        grid-template-columns: ${context.isModern ? "0.84fr 1.16fr" : "1fr"};
        gap: var(--shell-gap);
      }
      .masthead {
        border-bottom: ${context.isModern ? "1px solid var(--line)" : "0"};
        margin-bottom: ${context.isModern ? "8mm" : "6mm"};
        padding-bottom: ${context.isModern ? "6mm" : "0"};
        position: relative;
        text-align: ${context.headerTextAlign};
      }
      .masthead-layout {
        display: grid;
        grid-template-columns: ${mastheadColumns};
        gap: 4mm;
        align-items: start;
      }
      .masthead-copy {
        min-width: 0;
      }
      .masthead h1 {
        margin: 0;
        font-family: "${escapeHtml(document.layout.headingFont)}", "Times New Roman", serif;
        font-size: var(--name-size);
        letter-spacing: ${context.isModern ? "-0.03em" : "-0.02em"};
        line-height: 1.05;
      }
      .headline {
        margin: ${context.isModern ? "3mm 0 2mm" : "2mm 0 3mm"};
        color: ${context.isModern ? "var(--accent)" : "var(--ink-soft)"};
        font-size: var(--headline-size);
        font-weight: ${context.isModern ? "700" : "600"};
        letter-spacing: ${context.isModern ? "0" : "0.08em"};
        text-transform: ${context.isModern ? "none" : "uppercase"};
      }
      .contact-row, .resume-links {
        display: flex;
        flex-wrap: wrap;
        gap: ${context.isModern ? "10px 12px" : "8px 14px"};
        color: var(--ink-soft);
        font-size: 9pt;
      }
      .contact-row {
        justify-content: ${context.contactJustify};
      }
      .resume-links {
        margin-top: ${context.isModern ? "2mm" : "3mm"};
        justify-content: ${context.contactJustify};
      }
      .resume-link {
        color: var(--link);
        text-decoration: none;
      }
      .resume-photo-wrap {
        width: ${document.basics.photoSizeMm}mm;
        justify-self: ${document.basics.photoPosition === "top-left" ? "start" : "end"};
      }
      .resume-photo {
        display: block;
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--line));
        border-radius: ${photoBorderRadius};
        background: color-mix(in srgb, var(--accent) 8%, white);
      }
      .resume-section-highlighted {
        position: relative;
        border-radius: 6px;
        background: color-mix(in srgb, var(--accent) 6%, white);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent);
        padding: 2.2mm;
        margin: -2.2mm;
      }
      .resume-item-highlighted {
        border-radius: 6px;
        background: color-mix(in srgb, var(--accent) 7%, white);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
        padding: 2mm;
        margin: -2mm;
      }
      .resume-preview-focusable {
        transition: background-color 180ms ease, box-shadow 180ms ease;
      }
      .resume-preview-focusable:hover {
        cursor: pointer;
        background: color-mix(in srgb, var(--accent) 4%, transparent);
      }
      .masthead.resume-preview-focusable:hover,
      .resume-section.resume-preview-focusable:hover,
      .resume-item.resume-preview-focusable:hover {
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 16%, transparent);
      }
      .column {
        display: grid;
        align-content: start;
        gap: var(--section-gap);
      }
      .sidebar-column {
        ${context.isModern
          ? `background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 5%, white), transparent 24%);
        border-right: 1px solid var(--line);
        padding-right: var(--column-padding);`
          : ""}
      }
      .main-column {
        ${context.isModern ? "padding-left: 1mm;" : ""}
      }
      .resume-section {
        break-inside: avoid;
        break-inside: avoid-page;
        page-break-inside: avoid;
      }
      .section-header {
        border-bottom: ${document.layout.sectionTitleStyle === "line" ? context.sectionDivider : "0"};
        border-top: ${!context.isModern && document.layout.sectionTitleStyle === "line" ? context.sectionDivider : "0"};
        margin-bottom: var(--section-header-gap);
        padding: ${context.sectionHeaderPadding};
        break-after: avoid;
        page-break-after: avoid;
        background: ${context.sectionHeaderBackground};
        border-radius: ${document.layout.sectionTitleStyle === "filled" ? "6px" : "0"};
      }
      .section-header h2 {
        margin: 0;
        color: ${context.isModern ? "var(--accent)" : "var(--ink)"};
        font-family: "${escapeHtml(document.layout.headingFont)}", "Times New Roman", serif;
        font-size: var(--section-title-size);
        letter-spacing: ${context.isModern ? "0.08em" : "0.03em"};
        text-transform: ${document.layout.sectionTitleStyle === "minimal" ? "none" : context.isModern ? "uppercase" : "none"};
        text-align: ${document.layout.sectionTitleAlign};
      }
      .resume-item + .resume-item {
        margin-top: var(--item-gap);
      }
      .resume-item {
        break-inside: avoid;
        break-inside: avoid-page;
        page-break-inside: avoid;
      }
      .item-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: ${context.isModern ? "baseline" : "flex-start"};
      }
      .item-header h3 {
        margin: 0;
        font-size: var(--item-title-size);
        line-height: 1.18;
      }
      .item-subtitle,
      .item-meta {
        margin: 1mm 0 0;
        color: var(--ink-soft);
        font-size: var(--meta-size);
      }
      .item-meta {
        text-align: ${context.isModern ? "right" : "left"};
        min-width: ${context.isModern ? "auto" : "30mm"};
      }
      .rich-text {
        font-size: var(--body-size);
        line-height: ${document.layout.lineHeight};
        color: var(--ink);
        word-break: break-word;
        overflow-wrap: anywhere;
      }
      .rich-text p {
        margin: 0 0 ${document.layout.paragraphGapMm}mm;
      }
      .rich-text p:last-child {
        margin-bottom: 0;
      }
      .rich-text h1, .rich-text h2, .rich-text h3 {
        font-family: "${escapeHtml(document.layout.headingFont)}", "Times New Roman", serif;
        margin: 0 0 2mm;
      }
      .rich-text a {
        color: var(--link);
        text-decoration: none;
        border-bottom: 1px solid color-mix(in srgb, var(--link) 22%, transparent);
      }
      .rich-text blockquote {
        margin: 0 0 ${document.layout.paragraphGapMm}mm;
        padding-left: 3mm;
        border-left: 1px solid var(--line);
        color: var(--ink-soft);
      }
      .rich-text hr {
        margin: 2.6mm 0;
        border: 0;
        border-top: 1px solid var(--line);
      }
      .rich-text code {
        padding: 0.2mm 0.8mm;
        border-radius: 3px;
        background: rgba(24, 33, 50, 0.06);
        font-family: "SFMono-Regular", "Cascadia Code", "JetBrains Mono", monospace;
        font-size: 0.92em;
      }
      .rich-text pre {
        margin: 2.4mm 0 0;
        padding: 2.4mm;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: rgba(24, 33, 50, 0.04);
        overflow: hidden;
      }
      .rich-text pre code {
        padding: 0;
        background: transparent;
      }
      .rich-text ol {
        margin: 2mm 0 0;
        padding-left: 5mm;
        font-size: var(--bullet-size);
        line-height: ${document.layout.lineHeight};
      }
      .rich-text table {
        width: 100%;
        margin-top: 2.2mm;
        border-collapse: collapse;
        font-size: 8.9pt;
      }
      .rich-text th,
      .rich-text td {
        padding: 1.2mm 1mm;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
      }
      .rich-text th {
        color: var(--ink-soft);
        font-weight: 700;
      }
      ul {
        margin: 2mm 0 0;
        padding-left: 5mm;
        font-size: var(--bullet-size);
        line-height: ${document.layout.lineHeight};
      }
      li + li {
        margin-top: ${document.layout.listGapMm}mm;
      }
      .tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .tag {
        border: 1px solid ${context.isModern ? "color-mix(in srgb, var(--accent) 24%, var(--line))" : "var(--line)"};
        border-radius: ${context.isModern ? "999px" : "4px"};
        padding: ${context.isModern ? "4px 8px" : "3px 7px"};
        font-size: var(--tag-size);
        color: ${context.isModern ? "var(--ink-soft)" : "var(--ink)"};
        text-transform: ${context.isModern ? "none" : "uppercase"};
        letter-spacing: ${context.isModern ? "0" : "0.04em"};
      }
      .density-compact {
        --shell-gap: ${context.isModern ? "7mm" : "0"};
        --column-padding: ${context.isModern ? "3.5mm" : "0"};
        --section-gap: ${context.isModern ? "4.2mm" : "3.8mm"};
        --section-header-gap: 2.2mm;
        --item-gap: ${context.isModern ? "3.2mm" : "3mm"};
        --body-size: 9.1pt;
        --bullet-size: 9pt;
        --meta-size: 8.5pt;
        --tag-size: 8.1pt;
        --name-size: ${context.isModern ? "21pt" : "23pt"};
        --headline-size: ${context.isModern ? "10pt" : "9.8pt"};
        --section-title-size: ${context.isModern ? "10.2pt" : "11pt"};
        --item-title-size: 10.2pt;
      }
      .density-compact .masthead {
        margin-bottom: ${context.isModern ? "5.5mm" : "4.6mm"};
        padding-bottom: ${context.isModern ? "4.2mm" : "0"};
      }
      .density-compact .headline {
        margin: ${context.isModern ? "2mm 0 1.4mm" : "1.6mm 0 2mm"};
      }
      .density-compact .contact-row,
      .density-compact .resume-links {
        gap: ${context.isModern ? "6px 10px" : "6px 12px"};
      }
      .density-compact ul {
        margin-top: 1.4mm;
        padding-left: 4.5mm;
      }
      .density-compact .tag-row {
        gap: 5px;
      }
      .template-aurora-grid .masthead::after,
      .template-campus-line .masthead::after,
      .template-engineer-pro .masthead::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -1px;
        width: 32mm;
        height: 2px;
        background: var(--accent);
      }
      .template-portfolio-brief .page {
        box-shadow: inset 0 0 0 1px rgba(24, 33, 50, 0.06);
      }
      .template-portfolio-brief .masthead-layout {
        grid-template-columns: ${mastheadColumns};
      }
      .template-portfolio-brief .resume-item {
        padding-bottom: 3mm;
        border-bottom: 1px dashed rgba(24, 33, 50, 0.08);
      }
      .template-portfolio-brief .resume-item:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .masthead-empty {
        display: none;
      }
      .sidebar-column .resume-photo-wrap {
        margin-bottom: 2mm;
      }
      @page {
        size: A4;
        margin: 0;
      }`;
}
