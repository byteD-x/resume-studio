import {
  hasMeaningfulRichText,
  hasResumeSectionItemContent,
} from "@/lib/resume-content";
import { escapeHtml, sanitizeHref, sanitizeRichTextHtml } from "@/lib/utils";
import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";
import { serializePreviewTarget, type PreviewBuildOptions } from "@/lib/resume-preview/types";

export function renderLinks(document: ResumeDocument) {
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

function renderItem(item: ResumeSectionItem, sectionType: ResumeSection["type"], highlightedItemId?: string) {
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
  const highlighted = highlightedItemId === item.id;
  const target = serializePreviewTarget({
    kind: "section",
    sectionType,
    itemId: item.id,
  });

  return `
    <article class="resume-item resume-preview-focusable${highlighted ? " resume-item-highlighted" : ""}" data-preview-target='${escapeHtml(target)}'>
      ${
        item.title
          ? `<div class="item-header">
              <div class="item-headingline">
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

export function renderSection(
  section: ResumeSection,
  options?: PreviewBuildOptions,
) {
  if (!section.visible) return "";
  const highlightedTarget = options?.highlightedTarget;
  const highlighted = highlightedTarget?.kind === "section" && highlightedTarget.sectionType === section.type;
  const highlightedItemId = highlighted ? highlightedTarget.itemId : undefined;

  const items = section.items.filter(hasResumeSectionItemContent);
  const itemsHtml = items.map((item) => renderItem(item, section.type, highlightedItemId)).join("");
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
    <section class="resume-section resume-preview-focusable${highlighted ? " resume-section-highlighted" : ""}" data-preview-target='${escapeHtml(serializePreviewTarget({ kind: "section", sectionType: section.type }))}'>
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

export function renderSummarySection(document: ResumeDocument, options?: PreviewBuildOptions) {
  return hasMeaningfulRichText(document.basics.summaryHtml)
    ? `
        <section class="resume-section resume-preview-focusable${options?.highlightedTarget?.kind === "basics" ? " resume-section-highlighted" : ""}" data-preview-target='${escapeHtml(serializePreviewTarget({ kind: "basics" }))}'>
          <header class="section-header">
            <h2>自我评价</h2>
          </header>
          <div class="rich-text">${sanitizeRichTextHtml(document.basics.summaryHtml)}</div>
        </section>
      `
    : "";
}
