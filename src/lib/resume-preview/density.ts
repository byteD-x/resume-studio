import { getResumeRenderableSections } from "@/lib/resume-content";
import type { ResumeDocument } from "@/types/resume";

export function getPreviewDensity(document: ResumeDocument) {
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
