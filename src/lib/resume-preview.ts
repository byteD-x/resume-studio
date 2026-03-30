import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";
import {
  getResumeRenderableSections,
  hasMeaningfulRichText,
  hasResumeRenderableContent,
  hasResumeSectionItemContent,
} from "@/lib/resume-content";
import { escapeHtml, sanitizeRichTextHtml } from "@/lib/utils";

interface PreviewBuildOptions {
  highlightedTarget?: "basics" | "targeting" | { sectionType: ResumeSection["type"] };
}

function renderLinks(document: ResumeDocument) {
  return document.basics.links
    .filter((link) => link.label.trim() && link.url.trim())
    .map(
      (link) =>
        `<a class="resume-link" href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`,
    )
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
  return `<!DOCTYPE html>
<html lang="${escapeHtml(document.meta.locale)}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.meta.title)}</title>
    <style>
      :root {
        --accent: ${accent};
        --ink: #182132;
        --ink-soft: #5f6b7d;
        --line: rgba(24, 33, 50, 0.12);
        --paper: #fffdf8;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: ${document.meta.template === "modern-two-column" ? "#f3ede4" : "#ede6dc"};
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
        font-size: 22pt;
        line-height: 1.1;
      }
      p {
        margin: 4mm auto 0;
        max-width: 88mm;
        color: var(--ink-soft);
        font-size: 10.5pt;
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
        font-size: 9.5pt;
        color: var(--ink);
      }
      @page {
        size: A4;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="page template-${escapeHtml(document.meta.template)}">
      <div class="empty-shell">
        <section class="empty-card">
          <div class="empty-mark" aria-hidden="true"></div>
          <h1>开始填写</h1>
          <p>内容会按当前模板排版。</p>
          <div class="empty-notes">
            <div class="empty-note">先填写姓名和职位。</div>
            <div class="empty-note">再补充经历、项目或技能。</div>
            <div class="empty-note">完成后导出 PDF。</div>
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
  const isModern = document.meta.template === "modern-two-column";
  const accent = document.layout.accentColor;
  if (!hasResumeRenderableContent(document)) {
    return buildEmptyPreviewState(document, accent);
  }
  const density = getPreviewDensity(document);
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
        --ink: #182132;
        --ink-soft: #49556a;
        --line: rgba(24, 33, 50, 0.15);
        --paper: #fffdf8;
        --shell-gap: ${isModern ? "10mm" : "0"};
        --column-padding: ${isModern ? "5mm" : "0"};
        --section-gap: ${isModern ? "6mm" : "5mm"};
        --section-header-gap: ${isModern ? "3mm" : "3.2mm"};
        --item-gap: ${isModern ? "5mm" : "4.2mm"};
        --body-size: 9.7pt;
        --bullet-size: 9.6pt;
        --meta-size: 9pt;
        --tag-size: 8.5pt;
        --name-size: ${isModern ? "24pt" : "26pt"};
        --headline-size: ${isModern ? "11pt" : "10.5pt"};
        --section-title-size: ${isModern ? "11pt" : "12pt"};
        --item-title-size: 11pt;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: ${isModern ? "#f3ede4" : "#ede6dc"};
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
        justify-content: ${isModern ? "flex-start" : "center"};
      }
      .resume-links {
        margin-top: ${isModern ? "2mm" : "3mm"};
        justify-content: ${isModern ? "flex-start" : "center"};
      }
      .resume-link {
        color: var(--accent);
        text-decoration: none;
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
        border-bottom: ${isModern ? "1px solid var(--line)" : "0"};
        border-top: ${isModern ? "0" : "1px solid var(--line)"};
        margin-bottom: var(--section-header-gap);
        padding: ${isModern ? "0 0 2mm" : "2.2mm 0 0"};
        break-after: avoid;
        page-break-after: avoid;
      }
      .section-header h2 {
        margin: 0;
        color: ${isModern ? "var(--accent)" : "var(--ink)"};
        font-family: "${escapeHtml(document.layout.headingFont)}", "Times New Roman", serif;
        font-size: var(--section-title-size);
        letter-spacing: ${isModern ? "0.08em" : "0.03em"};
        text-transform: ${isModern ? "uppercase" : "none"};
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
        color: var(--accent);
        text-decoration: none;
        border-bottom: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
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
        margin-top: 0.8mm;
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
      .template-modern-two-column .masthead::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -1px;
        width: 32mm;
        height: 2px;
        background: var(--accent);
      }
      .template-classic-single-column .page {
        box-shadow: inset 0 0 0 1px rgba(24, 33, 50, 0.06);
      }
      .template-classic-single-column .masthead {
        text-align: center;
      }
      .template-classic-single-column .resume-item {
        padding-bottom: 3mm;
        border-bottom: 1px dashed rgba(24, 33, 50, 0.08);
      }
      .template-classic-single-column .resume-item:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .masthead-empty {
        display: none;
      }
      @page {
        size: A4;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="page template-${escapeHtml(document.meta.template)} density-${density.mode}">
      <header class="masthead${document.basics.name.trim() || document.basics.headline.trim() || document.basics.location.trim() || document.basics.email.trim() || document.basics.phone.trim() || document.basics.website.trim() || document.basics.links.length > 0 ? "" : " masthead-empty"}">
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
      </header>
      <div class="resume-shell">
        ${
          isModern
            ? `<aside class="column sidebar-column">${summarySection}${asideSections.map((section) => renderSection(section, options)).join("")}</aside>
               <main class="column main-column">${mainSections.map((section) => renderSection(section, options)).join("")}</main>`
            : `<main class="column main-column">${summarySection}${mainSections.map((section) => renderSection(section, options)).join("")}</main>`
        }
      </div>
    </div>
  </body>
</html>`;
}
