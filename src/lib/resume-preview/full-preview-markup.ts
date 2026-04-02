import { escapeHtml } from "@/lib/utils";
import { renderLinks, renderSection, renderSummarySection } from "@/lib/resume-preview/sections";
import type { PreviewTemplateContext } from "@/lib/resume-preview/full-preview-shared";
import { serializePreviewTarget, type PreviewBuildOptions } from "@/lib/resume-preview/types";
import type { ResumeDocument } from "@/types/resume";

function buildPhotoMarkup(document: ResumeDocument, safePhotoSrc: string) {
  const alt = escapeHtml(document.basics.photoAlt || document.basics.name || "头像");
  return `<div class="resume-photo-wrap"><img alt="${alt}" class="resume-photo" src="${escapeHtml(safePhotoSrc)}" /></div>`;
}

function buildContactMarkup(document: ResumeDocument) {
  const items = [document.basics.location, document.basics.email, document.basics.phone, document.basics.website].filter(
    Boolean,
  );

  if (items.length === 0) {
    return "";
  }

  return `<div class="contact-row">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
}

function buildMastheadMarkup(document: ResumeDocument, context: PreviewTemplateContext) {
  const hasIdentity =
    document.basics.name.trim() ||
    document.basics.headline.trim() ||
    document.basics.location.trim() ||
    document.basics.email.trim() ||
    document.basics.phone.trim() ||
    document.basics.website.trim() ||
    document.basics.links.length > 0 ||
    context.hasPhoto;

  return `      <header class="masthead resume-preview-focusable${hasIdentity ? "" : " masthead-empty"}" data-preview-target='${escapeHtml(serializePreviewTarget({ kind: "basics" }))}'>
        <div class="masthead-layout">
          ${
            context.hasPhoto && !context.photoInSidebar && document.basics.photoPosition === "top-left"
              ? buildPhotoMarkup(document, context.safePhotoSrc)
              : ""
          }
          <div class="masthead-copy">
            ${document.basics.name.trim() ? `<h1>${escapeHtml(document.basics.name)}</h1>` : ""}
            ${document.basics.headline ? `<p class="headline">${escapeHtml(document.basics.headline)}</p>` : ""}
            ${buildContactMarkup(document)}
            ${document.basics.links.length > 0 ? `<div class="resume-links">${renderLinks(document)}</div>` : ""}
          </div>
          ${
            context.hasPhoto && !context.photoInSidebar && document.basics.photoPosition !== "top-left"
              ? buildPhotoMarkup(document, context.safePhotoSrc)
              : ""
          }
        </div>
      </header>`;
}

function buildShellMarkup(document: ResumeDocument, context: PreviewTemplateContext, options?: PreviewBuildOptions) {
  const summarySection = renderSummarySection(document, options);

  if (context.isModern) {
    return `      <div class="resume-shell">
        <aside class="column sidebar-column">${
          context.photoInSidebar ? buildPhotoMarkup(document, context.safePhotoSrc) : ""
        }${summarySection}${context.asideSections.map((section) => renderSection(section, options)).join("")}</aside>
        <main class="column main-column">${context.mainSections.map((section) => renderSection(section, options)).join("")}</main>
      </div>`;
  }

  return `      <div class="resume-shell">
        <main class="column main-column">${summarySection}${context.mainSections.map((section) => renderSection(section, options)).join("")}</main>
      </div>`;
}

function buildPreviewBridgeScript() {
  return `      <script>
        (() => {
          const previewType = "resume-preview:navigate";
          document.addEventListener(
            "click",
            (event) => {
              const element = event.target instanceof Element ? event.target.closest("[data-preview-target]") : null;
              if (!element) return;
              if (event.target instanceof Element && event.target.closest("a[href]")) return;

              const rawTarget = element.getAttribute("data-preview-target");
              if (!rawTarget || window.parent === window) return;

              try {
                window.parent.postMessage({ type: previewType, payload: JSON.parse(rawTarget) }, "*");
              } catch {
                // Ignore malformed preview targets inside the isolated iframe.
              }
            },
            true,
          );
        })();
      </script>`;
}

export function buildPreviewBodyMarkup(
  document: ResumeDocument,
  context: PreviewTemplateContext,
  options?: PreviewBuildOptions,
) {
  return `    <div class="page resume-document template-${escapeHtml(document.meta.template)} density-${context.density.mode}">
${buildMastheadMarkup(document, context)}
${buildShellMarkup(document, context, options)}
    </div>
${options?.interactive ? buildPreviewBridgeScript() : ""}`;
}
