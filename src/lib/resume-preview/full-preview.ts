import { escapeHtml } from "@/lib/utils";
import { sanitizeCustomCss } from "@/lib/resume-preview/custom-css";
import { buildEmptyPreviewState } from "@/lib/resume-preview/empty-state";
import { buildPreviewBodyMarkup } from "@/lib/resume-preview/full-preview-markup";
import { buildPreviewTemplateContext } from "@/lib/resume-preview/full-preview-shared";
import { buildPreviewStyles } from "@/lib/resume-preview/full-preview-style";
import type { PreviewBuildOptions } from "@/lib/resume-preview/types";
import type { ResumeDocument } from "@/types/resume";

export function buildResumePreviewHtml(document: ResumeDocument, options?: PreviewBuildOptions) {
  const context = buildPreviewTemplateContext(document);

  if (!context.hasRenderableContent) {
    return buildEmptyPreviewState(document, context.accent);
  }

  const customCss = document.layout.customCss.trim();

  return `<!DOCTYPE html>
<html lang="${escapeHtml(document.meta.locale)}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.meta.title)}</title>
    <style>
${buildPreviewStyles(document, context)}
    </style>
    ${customCss ? `<style id="resume-custom-css">${sanitizeCustomCss(customCss)}</style>` : ""}
  </head>
  <body>
${buildPreviewBodyMarkup(document, context, options)}
  </body>
</html>`;
}
