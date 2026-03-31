import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";
import { getTemplateCatalogItem } from "@/data/template-catalog";
import {
  getResumeRenderableSections,
  hasMeaningfulRichText,
  hasResumeRenderableContent,
  hasResumeSectionItemContent,
} from "@/lib/resume-content";
import { escapeHtml, sanitizeHref, sanitizeImageSrc, sanitizeRichTextHtml } from "@/lib/utils";

interface PreviewBuildOptions {
  highlightedTarget?: "basics" | "targeting" | { sectionType: ResumeSection["type"] };
}

function sanitizeCustomCss(value: string) {
  return value
    .replace(/<\/style/gi, "<\\/style")
    .replace(/@import/gi, "")
    .replace(/url\s*\(/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "")
    .replace(/javascript:/gi, "");
}

function renderLinks(document: ResumeDocument) {
  return document.basics.links
    .filter((link) => link.label.trim() && link.url.trim())
    .map((link) => {
      const href = sanitizeHref(link.url);
      if (!href) return "";

      return `<a class="resume-link" href="${escapeHtml(href)}" rel="noreferrer" target="_blank">${escapeHtml(link.label)}</a>`;
    })
    .filter(Boolean)
    .join("");
}

function renderItem(item: ResumeSectionItem) {
  const meta = [item.dateRange, item.location, item.meta].filter(Boolean).join(" · ");
  const bullets =
    item.bulletPoints.length > 0
      ? `<ul>${item.bulletPoints
          .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
          .join("")}</ul>`
      : "";
  const tags =
    item.tags.length > 0
      ? `<div class="tag-row">${item.tags
          .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
          .join("")}</div>`
      : "";

  return `
    <article class="resume-item">
      ${
        item.title
          ? `<div class="item-header">
              <div>
                <h3>${escapeHtml(item.title)}</h3>
                ${item.subtitle ? `<p class="item-subtitle">${escapeHtml(item.subtitle)}</p>` : ""}
              </div>
              ${meta ? `<p class="item-meta">${escapeHtml(meta)}</p>` : ""}
            </div>`
          : ""
      }
      ${hasMeaningfulRichText(item.summaryHtml) ? `<div class="rich-text">${sanitizeRichTextHtml(item.summaryHtml)}</div>` : ""}
      ${bullets}
      ${tags}
    </article>
  `;
}

function renderSection(
  section: ResumeSection,
  options?: PreviewBuildOptions,
) {
  if (!section.visible) return "";
  const highlighted =
    typeof options?.highlightedTarget === "object" &&
    options.highlightedTarget.sectionType === section.type;

  const items = section.items.filter(hasResumeSectionItemContent);
  const itemsHtml = items.map(renderItem).join("");
  const tagsHtml =
    section.layout === "tag-grid"
      ? items
          .flatMap((item) => item.tags)
          .filter(Boolean)
          .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
          .join("")
      : "";
  const hasBody =
    hasMeaningfulRichText(section.contentHtml) ||
    items.length > 0 ||
    (section.layout === "tag-grid" && tagsHtml.length > 0);

  if (!hasBody) return "";

  return `
    <section class="resume-section${highlighted ? " resume-section-highlighted" : ""}">
      <header class="section-header">
        <h2>${escapeHtml(section.title)}</h2>
      </header>
      ${
        hasMeaningfulRichText(section.contentHtml)
          ? `<div class="rich-text">${sanitizeRichTextHtml(section.contentHtml)}</div>`
          : ""
      }
      ${section.layout === "tag-grid" ? `<div class="tag-row">${tagsHtml}</div>` : itemsHtml}
    </section>
  `;
}

function getPreviewDensity(document: ResumeDocument) {
  const visibleSections = getResumeRenderableSections(document);
  const totalItems = visibleSections.reduce((sum, section) => sum + section.items.length, 0);
  const totalBullets = visibleSections.reduce(
    (sum, section) =>
      sum + section.items.reduce((itemSum, item) => itemSum + item.bulletPoints.length, 0),
    0,
  );
  const summaryLength = document.basics.summaryHtml.replace(/<[^>]+>/g, "").trim().length;

  const needsCompactMode =
    visibleSections.length >= 5 ||
    totalItems >= 8 ||
    totalBullets >= 16 ||
    summaryLength >= 180;

  return {
    mode: needsCompactMode ? "compact" : "comfortable",
    visibleSections,
  } as const;
}

function buildEmptyPreviewState(document: ResumeDocument, accent: string) {
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

export function buildResumePreviewHtml(
  document: ResumeDocument,
  options?: PreviewBuildOptions,
) {
  const templateDefinition = getTemplateCatalogItem(document.meta.template);
  const isModern = templateDefinition.family === "two-column";
  const accent = document.layout.accentColor;
  const customCss = document.layout.customCss.trim();
  if (!hasResumeRenderableContent(document)) {
    return buildEmptyPreviewState(document, accent);
  }
  const density = getPreviewDensity(document);
  const safePhotoSrc = sanitizeImageSrc(document.basics.photoUrl);
  const hasPhoto = document.basics.photoVisible && safePhotoSrc.length > 0;
  const photoInSidebar = hasPhoto && isModern && document.basics.photoPosition === "sidebar";
  const headerTextAlign = document.layout.headerAlign === "center" ? "center" : "left";
  const contactJustify = document.layout.headerAlign === "center" ? "center" : "flex-start";
  const sectionDivider = document.layout.showSectionDividers ? "1px solid var(--line)" : "0";
  const sectionHeaderBackground =
    document.layout.sectionTitleStyle === "filled"
      ? "color-mix(in srgb, var(--accent) 12%, white)"
      : "transparent";
  const sectionHeaderPadding =
    document.layout.sectionTitleStyle === "filled"
      ? "1.8mm 2.2mm"
      : isModern
        ? "0 0 2mm"
        : "2.2mm 0 0";
  const visibleSections = density.visibleSections;
  const asideSections =
    isModern
      ? visibleSections.filter((section) =>
          ["summary", "skills", "education"].includes(section.type),
        )
      : [];
  const mainSections =
    isModern
      ? visibleSections.filter(
          (section) => !["summary", "skills", "education"].includes(section.type),
        )
      : visibleSections;

  const summarySection =
    hasMeaningfulRichText(document.basics.summaryHtml)
      ? `
        <section class="resume-section${options?.highlightedTarget === "basics" ? " resume-section-highlighted" : ""}">
          <header class="section-header">
            <h2>自我评价</h2>
          </header>
          <div class="rich-text">${sanitizeRichTextHtml(document.basics.summaryHtml)}</div>
        </section>
      `
      : "";

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
        --link: ${escapeHtml(document.layout.linkColor)};
        --shell-gap: ${isModern ? `${document.layout.columnGapMm}mm` : "0"};
        --column-padding: ${isModern ? "5mm" : "0"};
        --section-gap: ${document.layout.sectionGapMm}mm;
        --section-header-gap: ${isModern ? "3mm" : "3.2mm"};
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
        display: ${isModern ? "grid" : "block"};
        grid-template-columns: ${isModern ? "0.84fr 1.16fr" : "1fr"};
        gap: var(--shell-gap);
      }
      .masthead {
        border-bottom: ${isModern ? "1px solid var(--line)" : "0"};
        margin-bottom: ${isModern ? "8mm" : "6mm"};
        padding-bottom: ${isModern ? "6mm" : "0"};
        position: relative;
        text-align: ${headerTextAlign};
      }
      .masthead-layout {
        display: grid;
        grid-template-columns: ${
          hasPhoto && !photoInSidebar
            ? document.basics.photoPosition === "top-left"
              ? `${document.basics.photoSizeMm}mm minmax(0, 1fr)`
              : `minmax(0, 1fr) ${document.basics.photoSizeMm}mm`
            : "1fr"
        };
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
        letter-spacing: ${isModern ? "-0.03em" : "-0.02em"};
        line-height: 1.05;
      }
      .headline {
        margin: ${isModern ? "3mm 0 2mm" : "2mm 0 3mm"};
        color: ${isModern ? "var(--accent)" : "var(--ink-soft)"};
        font-size: var(--headline-size);
        font-weight: ${isModern ? "700" : "600"};
        letter-spacing: ${isModern ? "0" : "0.08em"};
        text-transform: ${isModern ? "none" : "uppercase"};
      }
      .contact-row, .resume-links {
        display: flex;
        flex-wrap: wrap;
        gap: ${isModern ? "10px 12px" : "8px 14px"};
        color: var(--ink-soft);
        font-size: 9pt;
      }
      .contact-row {
        justify-content: ${contactJustify};
      }
      .resume-links {
        margin-top: ${isModern ? "2mm" : "3mm"};
        justify-content: ${contactJustify};
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
        border-radius: ${
          document.basics.photoShape === "circle"
            ? "999px"
            : document.basics.photoShape === "rounded"
              ? "8px"
              : "0"
        };
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
      .column {
        display: grid;
        align-content: start;
        gap: var(--section-gap);
      }
      .sidebar-column {
        ${isModern
          ? `background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 5%, white), transparent 24%);
        border-right: 1px solid var(--line);
        padding-right: var(--column-padding);`
          : ""}
      }
      .main-column {
        ${isModern ? "padding-left: 1mm;" : ""}
      }
      .resume-section {
        break-inside: avoid;
        break-inside: avoid-page;
        page-break-inside: avoid;
      }
      .section-header {
        border-bottom: ${document.layout.sectionTitleStyle === "line" ? sectionDivider : "0"};
        border-top: ${!isModern && document.layout.sectionTitleStyle === "line" ? sectionDivider : "0"};
        margin-bottom: var(--section-header-gap);
        padding: ${sectionHeaderPadding};
        break-after: avoid;
        page-break-after: avoid;
        background: ${sectionHeaderBackground};
        border-radius: ${document.layout.sectionTitleStyle === "filled" ? "6px" : "0"};
      }
      .section-header h2 {
        margin: 0;
        color: ${isModern ? "var(--accent)" : "var(--ink)"};
        font-family: "${escapeHtml(document.layout.headingFont)}", "Times New Roman", serif;
        font-size: var(--section-title-size);
        letter-spacing: ${isModern ? "0.08em" : "0.03em"};
        text-transform: ${document.layout.sectionTitleStyle === "minimal" ? "none" : isModern ? "uppercase" : "none"};
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
        align-items: ${isModern ? "baseline" : "flex-start"};
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
        text-align: ${isModern ? "right" : "left"};
        min-width: ${isModern ? "auto" : "30mm"};
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
        border: 1px solid ${isModern ? "color-mix(in srgb, var(--accent) 24%, var(--line))" : "var(--line)"};
        border-radius: ${isModern ? "999px" : "4px"};
        padding: ${isModern ? "4px 8px" : "3px 7px"};
        font-size: var(--tag-size);
        color: ${isModern ? "var(--ink-soft)" : "var(--ink)"};
        text-transform: ${isModern ? "none" : "uppercase"};
        letter-spacing: ${isModern ? "0" : "0.04em"};
      }
      .density-compact {
        --shell-gap: ${isModern ? "7mm" : "0"};
        --column-padding: ${isModern ? "3.5mm" : "0"};
        --section-gap: ${isModern ? "4.2mm" : "3.8mm"};
        --section-header-gap: 2.2mm;
        --item-gap: ${isModern ? "3.2mm" : "3mm"};
        --body-size: 9.1pt;
        --bullet-size: 9pt;
        --meta-size: 8.5pt;
        --tag-size: 8.1pt;
        --name-size: ${isModern ? "21pt" : "23pt"};
        --headline-size: ${isModern ? "10pt" : "9.8pt"};
        --section-title-size: ${isModern ? "10.2pt" : "11pt"};
        --item-title-size: 10.2pt;
      }
      .density-compact .masthead {
        margin-bottom: ${isModern ? "5.5mm" : "4.6mm"};
        padding-bottom: ${isModern ? "4.2mm" : "0"};
      }
      .density-compact .headline {
        margin: ${isModern ? "2mm 0 1.4mm" : "1.6mm 0 2mm"};
      }
      .density-compact .contact-row,
      .density-compact .resume-links {
        gap: ${isModern ? "6px 10px" : "6px 12px"};
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
        grid-template-columns: ${
          hasPhoto && !photoInSidebar
            ? document.basics.photoPosition === "top-left"
              ? `${document.basics.photoSizeMm}mm minmax(0, 1fr)`
              : `minmax(0, 1fr) ${document.basics.photoSizeMm}mm`
            : "1fr"
        };
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
      }
    </style>
    ${customCss ? `<style id="resume-custom-css">${sanitizeCustomCss(customCss)}</style>` : ""}
  </head>
  <body>
    <div class="page resume-document template-${escapeHtml(document.meta.template)} density-${density.mode}">
      <header class="masthead${document.basics.name.trim() || document.basics.headline.trim() || document.basics.location.trim() || document.basics.email.trim() || document.basics.phone.trim() || document.basics.website.trim() || document.basics.links.length > 0 || hasPhoto ? "" : " masthead-empty"}">
        <div class="masthead-layout">
          ${
            hasPhoto && !photoInSidebar && document.basics.photoPosition === "top-left"
              ? `<div class="resume-photo-wrap"><img alt="${escapeHtml(document.basics.photoAlt || `${document.basics.name || "头像"}`)}" class="resume-photo" src="${escapeHtml(safePhotoSrc)}" /></div>`
              : ""
          }
          <div class="masthead-copy">
            ${document.basics.name.trim() ? `<h1>${escapeHtml(document.basics.name)}</h1>` : ""}
            ${
              document.basics.headline
                ? `<p class="headline">${escapeHtml(document.basics.headline)}</p>`
                : ""
            }
            ${
              [document.basics.location, document.basics.email, document.basics.phone, document.basics.website]
                .filter(Boolean)
                .length > 0
                ? `<div class="contact-row">${
                    [document.basics.location, document.basics.email, document.basics.phone, document.basics.website]
                      .filter(Boolean)
                      .map((item) => `<span>${escapeHtml(item)}</span>`)
                      .join("")
                  }</div>`
                : ""
            }
            ${document.basics.links.length > 0 ? `<div class="resume-links">${renderLinks(document)}</div>` : ""}
          </div>
          ${
            hasPhoto && !photoInSidebar && document.basics.photoPosition !== "top-left"
              ? `<div class="resume-photo-wrap"><img alt="${escapeHtml(document.basics.photoAlt || `${document.basics.name || "头像"}`)}" class="resume-photo" src="${escapeHtml(safePhotoSrc)}" /></div>`
              : ""
          }
        </div>
      </header>
      <div class="resume-shell">
        ${
          isModern
            ? `<aside class="column sidebar-column">${
                photoInSidebar
                  ? `<div class="resume-photo-wrap"><img alt="${escapeHtml(document.basics.photoAlt || `${document.basics.name || "头像"}`)}" class="resume-photo" src="${escapeHtml(safePhotoSrc)}" /></div>`
                  : ""
              }${summarySection}${asideSections.map((section) => renderSection(section, options)).join("")}</aside>
               <main class="column main-column">${mainSections.map((section) => renderSection(section, options)).join("")}</main>`
            : `<main class="column main-column">${summarySection}${mainSections.map((section) => renderSection(section, options)).join("")}</main>`
        }
      </div>
    </div>
  </body>
</html>`;
}
