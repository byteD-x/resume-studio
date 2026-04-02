import { getTemplateFamily } from "@/data/template-catalog";
import type { ResumeDocument } from "@/types/resume";

export type ResumeOptimizationGoal = "one-page" | "two-page";

export function buildOptimizedResumeLayout(
  document: ResumeDocument,
  goal: ResumeOptimizationGoal,
): ResumeDocument["layout"] {
  const templateFamily = getTemplateFamily(document.meta.template);

  if (goal === "one-page") {
    return {
      ...document.layout,
      marginsMm: 9.5,
      lineHeight: 1.24,
      paragraphGapMm: 1.6,
      bodyFontSizePt: 8.7,
      sectionTitleSizePt: 9.8,
      itemTitleSizePt: 9.7,
      metaFontSizePt: 8.1,
      nameSizePt: 20,
      headlineSizePt: 9.4,
      sectionGapMm: 3.4,
      itemGapMm: 2.4,
      columnGapMm: templateFamily === "two-column" ? 5.6 : 0,
      listGapMm: 0.25,
      sectionTitleStyle: "minimal",
      sectionTitleAlign: "left",
      pageShadowVisible: true,
      showSectionDividers: false,
    };
  }

  return {
    ...document.layout,
    marginsMm: 11,
    lineHeight: 1.33,
    paragraphGapMm: 2.2,
    bodyFontSizePt: 9.2,
    sectionTitleSizePt: 10.4,
    itemTitleSizePt: 10.2,
    metaFontSizePt: 8.6,
    nameSizePt: 22,
    headlineSizePt: 10.2,
    sectionGapMm: 4.3,
    itemGapMm: 3.2,
    columnGapMm: templateFamily === "two-column" ? 7 : 0,
    listGapMm: 0.45,
    sectionTitleStyle: "minimal",
    sectionTitleAlign: "left",
    pageShadowVisible: true,
    showSectionDividers: false,
  };
}

export function buildCompactResumeLayout(document: ResumeDocument): ResumeDocument["layout"] {
  return buildOptimizedResumeLayout(document, "two-page");
}
