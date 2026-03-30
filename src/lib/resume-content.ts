import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";
import { stripHtml } from "@/lib/utils";

export function hasMeaningfulRichText(value: string) {
  return stripHtml(value).length > 0;
}

export function hasResumeSectionItemContent(item: ResumeSectionItem) {
  return Boolean(
    item.title.trim() ||
      item.subtitle.trim() ||
      item.location.trim() ||
      item.dateRange.trim() ||
      item.meta.trim() ||
      hasMeaningfulRichText(item.summaryHtml) ||
      item.bulletPoints.some((bullet) => bullet.trim()) ||
      item.tags.some((tag) => tag.trim()),
  );
}

export function hasResumeSectionContent(section: ResumeSection) {
  return hasMeaningfulRichText(section.contentHtml) || section.items.some(hasResumeSectionItemContent);
}

export function getResumeRenderableSections(document: ResumeDocument) {
  return document.sections.filter((section) => section.visible && hasResumeSectionContent(section));
}

export function hasResumeBasicsContent(document: ResumeDocument) {
  return Boolean(
    document.basics.name.trim() ||
      document.basics.headline.trim() ||
      document.basics.location.trim() ||
      document.basics.email.trim() ||
      document.basics.phone.trim() ||
      document.basics.website.trim() ||
      hasMeaningfulRichText(document.basics.summaryHtml) ||
      document.basics.links.some((link) => link.label.trim() && link.url.trim()),
  );
}

export function hasResumeRenderableContent(document: ResumeDocument) {
  return hasResumeBasicsContent(document) || getResumeRenderableSections(document).length > 0;
}
