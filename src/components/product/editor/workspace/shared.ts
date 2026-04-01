import { parseResumeFromMarkdown } from "@/lib/resume-markdown";
import type { ResumeDocument, ResumeSectionItem } from "@/types/resume";

export function stripHtmlToText(value: string) {
  return value.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
}

export function textToParagraphHtml(value: string) {
  const trimmed = value.trim();
  return trimmed ? `<p>${trimmed.replace(/\n/g, "<br />")}</p>` : "";
}

export function hasMeaningfulItemContent(item: ResumeSectionItem) {
  return Boolean(
    item.title.trim() ||
      item.subtitle.trim() ||
      item.location.trim() ||
      item.dateRange.trim() ||
      item.meta.trim() ||
      stripHtmlToText(item.summaryHtml) ||
      item.bulletPoints.length > 0 ||
      item.tags.length > 0,
  );
}

export function validateMarkdownDraft(markdownDraft: string, document: ResumeDocument) {
  if (!markdownDraft.trim()) {
    return null;
  }

  try {
    parseResumeFromMarkdown(markdownDraft, {
      existingDocument: document,
      resumeId: document.meta.id,
    });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Markdown 解析失败";
  }
}
